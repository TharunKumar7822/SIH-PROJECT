import {
  ClassificationMetrics,
  LotStatistics,
  ModelComparisonMetrics,
  RawComponentRecord,
  RiskWeightsConfig,
  SafetySlopeConfig,
  ScreenedComponent
} from '../types';
import {
  earlyFeaturesToVector,
  calculateStatisticalAnomalyScore,
  IsolationForestModel
} from './anomalyDetection';
import {
  LinearDriftModel,
  RandomForestDriftModel,
  GradientBoostedDriftModel,
  evaluateRegressionModel,
  TrainingSample
} from './driftPrediction';
import { computeClassificationMetrics } from './evaluation';
import {
  generateFeatureImportance,
  generateFlagReasons,
  generateQARecommendations
} from './explainability';
import {
  computeLotStatistics,
  extractEarlyFeatures,
  extractRetrospectiveFeatures
} from './features';
import { computeCompositeRiskScore } from './riskEngine';
import { deriveSafetySlope, evaluateSafetyViolation } from './safetySlope';

export interface PipelineResult {
  components: ScreenedComponent[];
  lotStats: Map<string, LotStatistics>;
  safetyConfig: SafetySlopeConfig;
  regressionComparison: ModelComparisonMetrics[];
  classificationMetrics: ClassificationMetrics;
  weightsConfig: RiskWeightsConfig;
  overallMAE: number;
}

export const DEFAULT_WEIGHTS: RiskWeightsConfig = {
  statisticalWeight: 0.25,
  isolationForestWeight: 0.25,
  lotDeviationWeight: 0.20,
  earlyDriftWeight: 0.15,
  predictedDriftWeight: 0.15,
  decisionThreshold: 45,
  warningThreshold: 25,
  staticLimitThreshold: 50.0
};

export function runFullScreeningPipeline(
  records: RawComponentRecord[],
  customWeights?: Partial<RiskWeightsConfig>,
  safetyPercentile: number = 97.5
): PipelineResult {
  const weights: RiskWeightsConfig = { ...DEFAULT_WEIGHTS, ...customWeights };

  // 1. Calculate Lot Statistics
  const lotStatsMap = computeLotStatistics(records);

  // 2. Derive Safety Slope boundary from historical normal components
  const safetyConfig = deriveSafetySlope(records, safetyPercentile);

  // 3. Train Module B Drift Regression Models
  // Lot-aware split for rigorous validation without cross-lot leakage
  const trainingSamples: TrainingSample[] = [];
  const validationSamples: TrainingSample[] = [];

  for (const r of records) {
    const delta = r.Value_24h - r.Value_0h;
    const sample: TrainingSample = {
      val0: r.Value_0h,
      val24: r.Value_24h,
      delta0_24: delta,
      driftRate0_24: delta / 24.0,
      target168h: r.Value_168h
    };

    // Lot-aware split: Lots L01-L07 for train, L08-L10 for validation
    if (r.Lot_ID <= 'L07') {
      trainingSamples.push(sample);
    } else {
      validationSamples.push(sample);
    }
  }

  // Fallback if no lot ids or single lot
  if (validationSamples.length === 0) {
    validationSamples.push(...trainingSamples.slice(0, Math.floor(trainingSamples.length * 0.3)));
  }

  // Fit 3 competing regressors
  const linearModel = new LinearDriftModel();
  linearModel.fit(trainingSamples);
  const linMetrics = evaluateRegressionModel(linearModel, validationSamples);

  const rfModel = new RandomForestDriftModel();
  rfModel.fit(trainingSamples);
  const rfMetrics = evaluateRegressionModel(rfModel, validationSamples);

  const gbModel = new GradientBoostedDriftModel();
  gbModel.fit(trainingSamples);
  const gbMetrics = evaluateRegressionModel(gbModel, validationSamples);

  const modelList = [
    { name: 'Gradient Boosted Regressor', model: gbModel, metrics: gbMetrics },
    { name: 'Random Forest Regressor', model: rfModel, metrics: rfMetrics },
    { name: 'Linear Regression (Ridge)', model: linearModel, metrics: linMetrics }
  ];

  modelList.sort((a, b) => a.metrics.mae - b.metrics.mae);
  const bestRegressor = modelList[0].model;

  const regressionComparison: ModelComparisonMetrics[] = modelList.map((m, idx) => ({
    modelName: m.name,
    mae: parseFloat(m.metrics.mae.toFixed(4)),
    rmse: parseFloat(m.metrics.rmse.toFixed(4)),
    r2: parseFloat(m.metrics.r2.toFixed(4)),
    featuresUsed: ['Value_0h', 'Value_24h', 'Delta_0_24h', 'Drift_Rate_0_24h'],
    isBest: idx === 0
  }));

  // 4. Train Module A Isolation Forest Model
  const iforestModel = new IsolationForestModel(40, 200);
  const iforestTrainVectors = records.map(r => {
    const ls = lotStatsMap.get(r.Lot_ID)!;
    const ef = extractEarlyFeatures(r, ls);
    return earlyFeaturesToVector(ef, r.Value_0h, r.Value_24h);
  });
  iforestModel.fit(iforestTrainVectors);

  // 5. Screen every individual component
  const screenedComponents: ScreenedComponent[] = [];
  let totalAbsError = 0;

  for (const r of records) {
    const ls = lotStatsMap.get(r.Lot_ID)!;
    const earlyFeat = extractEarlyFeatures(r, ls);
    const retroFeat = extractRetrospectiveFeatures(r);

    // Module B Prediction (Anti-leakage: val0, val24 only)
    const predicted168h = bestRegressor.predict(r.Value_0h, r.Value_24h);
    const predictionError = Math.abs(predicted168h - r.Value_168h);
    totalAbsError += predictionError;
    const predictedDrift168h = predicted168h - r.Value_0h;

    // Safety slope evaluation
    const earlyDriftRate = earlyFeat.drift_rate_0_24h;
    const pred168hDriftRate = (predicted168h - r.Value_0h) / 168.0;
    const { isViolated: isSafetyViolated, marginPct } = evaluateSafetyViolation(
      earlyDriftRate,
      pred168hDriftRate,
      safetyConfig
    );

    // Module A Scores
    const statisticalAnomalyScore = calculateStatisticalAnomalyScore(earlyFeat);
    const iforestVector = earlyFeaturesToVector(earlyFeat, r.Value_0h, r.Value_24h);
    const isolationForestScore = iforestModel.computeAnomalyScore(iforestVector);
    const combinedAnomalyScore = Math.min(
      1.0,
      0.5 * statisticalAnomalyScore + 0.5 * isolationForestScore
    );

    // Composite Risk Score & QA Decision
    const { riskScore, status } = computeCompositeRiskScore(
      statisticalAnomalyScore,
      isolationForestScore,
      earlyFeat,
      predicted168h,
      isSafetyViolated,
      weights
    );

    // Static limit comparison (e.g. 50 µA)
    const staticScreeningPass = r.Value_168h <= weights.staticLimitThreshold;
    const aiScreeningPass = status === 'NORMAL';
    const isFalseNegativeRisk = staticScreeningPass && !aiScreeningPass;

    // Explainability & Diagnostics
    const featureImportance = generateFeatureImportance(
      earlyFeat,
      r.Value_0h,
      r.Value_24h,
      predicted168h,
      safetyConfig
    );
    const flagReasons = generateFlagReasons(
      earlyFeat,
      r.Value_0h,
      r.Value_24h,
      predicted168h,
      isSafetyViolated,
      safetyConfig,
      status
    );
    const recommendedActions = generateQARecommendations(
      status,
      isSafetyViolated,
      earlyFeat.is_negative_trajectory
    );

    // Update lot stats counters
    if (status === 'NORMAL') ls.normalCount++;
    else if (status === 'WARNING') ls.warningCount++;
    else if (status === 'HIGH_RISK') ls.highRiskCount++;
    else if (status === 'HOLD_FOR_QA') ls.holdCount++;

    screenedComponents.push({
      componentId: r.Component_ID,
      lotId: r.Lot_ID,
      value0h: r.Value_0h,
      value24h: r.Value_24h,
      value96h: r.Value_96h,
      value168hActual: r.Value_168h,
      trueLabel: r.Label,
      earlyFeatures: earlyFeat,
      retrospectiveFeatures: retroFeat,
      predictedValue168h: parseFloat(predicted168h.toFixed(3)),
      predictionError: parseFloat(predictionError.toFixed(3)),
      predictedDrift168h: parseFloat(predictedDrift168h.toFixed(3)),
      earlyDriftRate: parseFloat(earlyDriftRate.toFixed(4)),
      safetyThresholdDriftRate: parseFloat(safetyConfig.derivedSafetySlopeRate.toFixed(4)),
      isSafetySlopeViolated: isSafetyViolated,
      safetyMarginPct: parseFloat(marginPct.toFixed(1)),
      statisticalAnomalyScore: parseFloat(statisticalAnomalyScore.toFixed(3)),
      isolationForestScore: parseFloat(isolationForestScore.toFixed(3)),
      combinedAnomalyScore: parseFloat(combinedAnomalyScore.toFixed(3)),
      compositeRiskScore: riskScore,
      screeningStatus: status,
      staticScreeningPass,
      aiScreeningPass,
      isFalseNegativeRisk,
      featureImportance,
      flagReasons,
      numericalEvidence: {
        baselineLotMedian: parseFloat(earlyFeat.lot_median_24h.toFixed(2)),
        earlyDriftRate: parseFloat(earlyDriftRate.toFixed(4)),
        safetyDriftThreshold: parseFloat(safetyConfig.derivedSafetySlopeRate.toFixed(4)),
        predicted168h: parseFloat(predicted168h.toFixed(2)),
        lotRobustZScore: parseFloat(earlyFeat.lot_robust_zscore_24h.toFixed(2)),
        staticLimit: weights.staticLimitThreshold
      },
      recommendedActions,
      diagnosticConfidence: Math.min(99, Math.max(70, Math.round(75 + Math.abs(earlyFeat.lot_robust_zscore_24h) * 5)))
    });
  }

  const overallMAE = records.length > 0 ? parseFloat((totalAbsError / records.length).toFixed(4)) : 0;
  const classificationMetrics = computeClassificationMetrics(screenedComponents, weights.decisionThreshold);

  return {
    components: screenedComponents,
    lotStats: lotStatsMap,
    safetyConfig,
    regressionComparison,
    classificationMetrics,
    weightsConfig: weights,
    overallMAE
  };
}
