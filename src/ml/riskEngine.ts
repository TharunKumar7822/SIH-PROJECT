import {
  EarlyFeatures,
  RiskWeightsConfig,
  ScreeningStatus
} from '../types';

export function computeCompositeRiskScore(
  statisticalScore: number,
  iforestScore: number,
  feat: EarlyFeatures,
  predicted168h: number,
  isSafetyViolated: boolean,
  weights: RiskWeightsConfig
): { riskScore: number; status: ScreeningStatus } {
  // Normalize lot deviation score (0 to 1)
  const lotDevNorm = Math.min(1.0, Math.max(0.0, Math.abs(feat.lot_robust_zscore_24h) / 3.5));
  
  // Normalize early drift score (0 to 1)
  const driftNorm = Math.min(1.0, Math.max(0.0, Math.abs(feat.drift_rate_0_24h) / 0.20));

  // Normalize predicted 168h drift score (0 to 1)
  const predDrift = Math.abs(predicted168h - feat.abs_value_0h);
  const predDriftNorm = Math.min(1.0, Math.max(0.0, predDrift / 30.0));

  // Safety slope penalty boost
  const safetyPenalty = isSafetyViolated ? 0.35 : 0.0;

  const weightedSum =
    weights.statisticalWeight * statisticalScore +
    weights.isolationForestWeight * iforestScore +
    weights.lotDeviationWeight * lotDevNorm +
    weights.earlyDriftWeight * driftNorm +
    weights.predictedDriftWeight * predDriftNorm +
    safetyPenalty;

  // Scale to 0 - 100
  const riskScore = Math.min(100, Math.max(0, Math.round(weightedSum * 100)));

  // Conservative aerospace QA decision layer
  let status: ScreeningStatus = 'NORMAL';

  // Conflict / High Uncertainty check -> HOLD_FOR_QA
  const hasConflictingSignals =
    (iforestScore > 0.65 && statisticalScore < 0.2) ||
    (feat.is_negative_trajectory && Math.abs(feat.lot_robust_zscore_24h) > 2.0);

  if (hasConflictingSignals || (riskScore >= weights.warningThreshold && riskScore < weights.decisionThreshold && isSafetyViolated)) {
    status = 'HOLD_FOR_QA';
  } else if (riskScore >= weights.decisionThreshold || isSafetyViolated || Math.abs(feat.lot_robust_zscore_24h) >= 3.5) {
    status = 'HIGH_RISK';
  } else if (riskScore >= weights.warningThreshold || Math.abs(feat.lot_robust_zscore_24h) >= 2.0 || driftNorm > 0.4) {
    status = 'WARNING';
  } else {
    status = 'NORMAL';
  }

  return { riskScore, status };
}
