import {
  EarlyFeatures,
  FeatureImportanceItem,
  SafetySlopeConfig,
  ScreeningStatus
} from '../types';

export function generateFeatureImportance(
  feat: EarlyFeatures,
  val0: number,
  val24: number,
  predicted168h: number,
  safetyConfig: SafetySlopeConfig
): FeatureImportanceItem[] {
  const items: FeatureImportanceItem[] = [];

  // 1. Early Drift Rate
  const earlyDrift = feat.drift_rate_0_24h;
  const driftRatio = earlyDrift / Math.max(safetyConfig.derivedSafetySlopeRate, 0.01);
  const driftContrib = (driftRatio - 1.0) * 35.0;
  items.push({
    feature: 'drift_rate_0_24h',
    label: 'Early Drift Rate (0h → 24h)',
    value: parseFloat(earlyDrift.toFixed(4)),
    contribution: parseFloat(driftContrib.toFixed(1)),
    direction: driftContrib > 5 ? 'increase_risk' : driftContrib < -5 ? 'decrease_risk' : 'neutral'
  });

  // 2. Lot Robust Deviation
  const zscore = feat.lot_robust_zscore_24h;
  const lotContrib = (Math.abs(zscore) - 1.2) * 22.0;
  items.push({
    feature: 'lot_robust_zscore_24h',
    label: 'Lot Deviation (Robust Z-Score @ 24h)',
    value: parseFloat(zscore.toFixed(2)),
    contribution: parseFloat(lotContrib.toFixed(1)),
    direction: lotContrib > 5 ? 'increase_risk' : lotContrib < -5 ? 'decrease_risk' : 'neutral'
  });

  // 3. Predicted 168h Trajectory
  const predDelta = predicted168h - val0;
  const predContrib = (predDelta - 12.0) * 1.8;
  items.push({
    feature: 'predicted_value_168h',
    label: 'Predicted 168h Trajectory',
    value: parseFloat(predicted168h.toFixed(2)),
    contribution: parseFloat(predContrib.toFixed(1)),
    direction: predContrib > 5 ? 'increase_risk' : predContrib < -5 ? 'decrease_risk' : 'neutral'
  });

  // 4. Initial 0h Baseline Offset
  const baseDev = feat.lot_robust_zscore_0h;
  const baseContrib = (Math.abs(baseDev) - 1.5) * 15.0;
  items.push({
    feature: 'lot_robust_zscore_0h',
    label: 'Baseline Offset (0h vs Lot)',
    value: parseFloat(baseDev.toFixed(2)),
    contribution: parseFloat(baseContrib.toFixed(1)),
    direction: baseContrib > 5 ? 'increase_risk' : baseContrib < -5 ? 'decrease_risk' : 'neutral'
  });

  // 5. Percentage Change
  const pctChange = feat.pct_change_0_24h;
  const pctContrib = (Math.abs(pctChange) - 20.0) * 0.8;
  items.push({
    feature: 'pct_change_0_24h',
    label: 'Relative Shift (0h → 24h %)',
    value: parseFloat(pctChange.toFixed(1)),
    contribution: parseFloat(pctContrib.toFixed(1)),
    direction: pctContrib > 5 ? 'increase_risk' : pctContrib < -5 ? 'decrease_risk' : 'neutral'
  });

  return items.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
}

export function generateFlagReasons(
  feat: EarlyFeatures,
  val0: number,
  val24: number,
  predicted168h: number,
  isSafetyViolated: boolean,
  safetyConfig: SafetySlopeConfig,
  status: ScreeningStatus
): string[] {
  const reasons: string[] = [];

  if (status === 'NORMAL') {
    reasons.push('Measurement values conform to nominal lot distribution (within 2σ robust median).');
    reasons.push('Early drift rate is well within the historical safety trajectory envelope.');
    reasons.push('Predicted 168h value indicates stable burn-in plateauing behavior.');
    return reasons;
  }

  // Reason 1: Lot deviation
  if (Math.abs(feat.lot_robust_zscore_24h) >= 2.5) {
    reasons.push(
      `24h measurement (${val24.toFixed(2)} µA) deviates by ${feat.lot_robust_zscore_24h.toFixed(1)} robust Z-scores from its Lot median baseline (${feat.lot_median_24h.toFixed(2)} µA).`
    );
  }

  // Reason 2: Early drift rate
  if (feat.drift_rate_0_24h > safetyConfig.derivedSafetySlopeRate * 0.85) {
    reasons.push(
      `Early drift rate (${feat.drift_rate_0_24h.toFixed(4)} µA/h) is abnormally steep compared to the learned safe drift boundary (${safetyConfig.derivedSafetySlopeRate.toFixed(4)} µA/h).`
    );
  }

  // Reason 3: Predicted 168h trajectory
  if (predicted168h > 30.0 || isSafetyViolated) {
    reasons.push(
      `Regression model forecasts an accelerated end-of-test drift to ~${predicted168h.toFixed(2)} µA at 168h, violating the long-term reliability envelope.`
    );
  }

  // Reason 4: Negative trajectory or tester offset
  if (feat.is_negative_trajectory) {
    reasons.push(
      `Detected negative parameter measurement (${val0 < 0 ? val0.toFixed(2) : val24.toFixed(2)} µA), indicating potential fixture contact resistance, probe offset, or negative drift signature.`
    );
  }

  if (reasons.length === 0) {
    reasons.push('Marginal statistical deviation detected across multi-parameter temporal feature space.');
  }

  return reasons;
}

export function generateQARecommendations(
  status: ScreeningStatus,
  isSafetyViolated: boolean,
  isNegative: boolean
): string[] {
  if (status === 'NORMAL') {
    return [
      'Proceed with standard burn-in profile and nominal lot processing.',
      'No secondary quarantine or re-test required.'
    ];
  }

  const actions: string[] = [];

  if (status === 'HIGH_RISK') {
    actions.push('QUARANTINE COMPONENT IMMEDIATELY: Flagged for high probability of latent infant mortality.');
    actions.push('Perform bench-level electrical characterization (I-V curve trace & temperature sweep).');
    actions.push('Inspect adjacent components on the same burn-in tray / socket board.');
    actions.push('Review fab lot wafer-sort records for possible edge-die or passivation defects.');
  } else if (status === 'HOLD_FOR_QA') {
    actions.push('HOLD LOT FOR QA SUPERVISOR REVIEW: Ambiguous or conflicting anomaly indicators.');
    actions.push('Re-seat in test fixture and execute a verified 24h confirmation re-measurement.');
    if (isNegative) {
      actions.push('Inspect test socket pin contact, ground integrity, and meter calibration offset.');
    }
  } else {
    // WARNING
    actions.push('FLAG FOR MONITORING: Component exhibits elevated parameter drift above lot average.');
    actions.push('Log intermediate 96h telemetry check to verify trajectory stabilization.');
    actions.push('Compare drift rate with historical batch baseline records.');
  }

  return actions;
}
