export interface RawComponentRecord {
  Component_ID: string;
  Lot_ID: string;
  Value_0h: number;
  Value_24h: number;
  Value_96h: number;
  Value_168h: number;
  Drift_0_24h?: number;
  Lot_Deviation_24h?: number;
  Label: number; // 0 = Normal, 1 = Anomalous/Defective
}

export type ScreeningStatus = 'NORMAL' | 'WARNING' | 'HIGH_RISK' | 'HOLD_FOR_QA';

export interface LotStatistics {
  lotId: string;
  count: number;
  median0h: number;
  median24h: number;
  median96h: number;
  median168h: number;
  mean24h: number;
  std24h: number;
  mad24h: number;
  mad0h: number;
  normalCount: number;
  anomalyCount: number;
  warningCount: number;
  highRiskCount: number;
  holdCount: number;
  meanEarlyDrift: number;
}

export interface EarlyFeatures {
  delta_0_24h: number;
  pct_change_0_24h: number;
  drift_rate_0_24h: number; // (Value_24h - Value_0h) / 24
  lot_median_24h: number;
  lot_mad_24h: number;
  lot_deviation_24h: number; // Value_24h - lot_median_24h
  lot_robust_zscore_24h: number; // (Value_24h - lot_median_24h) / (1.4826 * mad + eps)
  lot_deviation_0h: number;
  lot_robust_zscore_0h: number;
  abs_value_24h: number;
  abs_value_0h: number;
  is_negative_trajectory: boolean;
}

export interface RetrospectiveFeatures {
  delta_24_96h: number;
  delta_96_168h: number;
  drift_rate_24_96h: number;
  drift_rate_96_168h: number;
  overall_drift: number; // Value_168h - Value_0h
  drift_acceleration: number;
}

export interface FeatureImportanceItem {
  feature: string;
  label: string;
  value: number;
  contribution: number; // SHAP-style attribution (+ pushes toward anomaly, - pushes toward normal)
  direction: 'increase_risk' | 'decrease_risk' | 'neutral';
}

export interface ScreenedComponent {
  componentId: string;
  lotId: string;
  value0h: number;
  value24h: number;
  value96h: number;
  value168hActual: number;
  trueLabel: number;

  // Early & Retrospective features
  earlyFeatures: EarlyFeatures;
  retrospectiveFeatures?: RetrospectiveFeatures;

  // Module B Drift Prediction
  predictedValue168h: number;
  predictionError: number; // |Predicted - Actual|
  predictedDrift168h: number; // Predicted_168h - Value_0h

  // Safety Slope
  earlyDriftRate: number;
  safetyThresholdDriftRate: number;
  isSafetySlopeViolated: boolean;
  safetyMarginPct: number; // how far from / over safety threshold

  // Module A Anomaly Detection
  statisticalAnomalyScore: number; // 0 to 1
  isolationForestScore: number; // 0 to 1
  combinedAnomalyScore: number; // 0 to 1

  // Final Risk & Decision
  compositeRiskScore: number; // 0 to 100
  screeningStatus: ScreeningStatus;
  staticScreeningPass: boolean; // Static test (e.g. Value_168h <= 50 µA)
  aiScreeningPass: boolean; // True if status is NORMAL
  isFalseNegativeRisk: boolean; // Passed static test but flagged by AI

  // Explainability & Diagnostics
  featureImportance: FeatureImportanceItem[];
  flagReasons: string[];
  numericalEvidence: {
    baselineLotMedian: number;
    earlyDriftRate: number;
    safetyDriftThreshold: number;
    predicted168h: number;
    lotRobustZScore: number;
    staticLimit: number;
  };
  recommendedActions: string[];
  diagnosticConfidence: number; // 0 to 100%
}

export interface ModelComparisonMetrics {
  modelName: string;
  mae: number;
  rmse: number;
  r2: number;
  featuresUsed: string[];
  isBest: boolean;
}

export interface ClassificationMetrics {
  totalSamples: number;
  normalCount: number;
  defectiveCount: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  recall: number; // TP / (TP + FN) - Critical metric
  precision: number; // TP / (TP + FP)
  f1Score: number;
  specificity: number; // TN / (TN + FP)
  falseNegativeRate: number; // FN / (TP + FN)
  falsePositiveRate: number; // FP / (FP + TN)
  accuracy: number;
  rocAuc: number;
  prCurve: { recall: number; precision: number; threshold: number }[];
  rocCurve: { fpr: number; tpr: number; threshold: number }[];
}

export interface SafetySlopeConfig {
  safetyPercentile: number; // e.g. 95, 97.5, 99
  derivedSafetySlopeRate: number; // µA / hour
  distributionQ1: number;
  distributionMedian: number;
  distributionQ3: number;
  distributionUpperFence: number;
  maxHistoricalNormalDrift: number;
}

export interface RiskWeightsConfig {
  statisticalWeight: number; // default: 0.25
  isolationForestWeight: number; // default: 0.25
  lotDeviationWeight: number; // default: 0.20
  earlyDriftWeight: number; // default: 0.15
  predictedDriftWeight: number; // default: 0.15
  decisionThreshold: number; // default: 45 (risk score >= 45 is HIGH_RISK or WARNING)
  warningThreshold: number; // default: 25
  staticLimitThreshold: number; // default: 50.0 µA
}

export interface DemonstrationCase {
  id: string;
  title: string;
  category: 'normal' | 'subtle_latent' | 'strong_anomaly' | 'negative_sensor';
  componentId: string;
  description: string;
  narrative: string;
  staticResult: 'PASS' | 'FAIL';
  aiResult: ScreeningStatus;
  keyInsight: string;
}
