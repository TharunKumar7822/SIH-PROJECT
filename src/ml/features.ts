import { RawComponentRecord, LotStatistics, EarlyFeatures, RetrospectiveFeatures } from '../types';

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function calculateMAD(values: number[], medianVal?: number): number {
  if (values.length === 0) return 0;
  const med = medianVal !== undefined ? medianVal : calculateMedian(values);
  const deviations = values.map(v => Math.abs(v - med));
  return calculateMedian(deviations);
}

export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function calculateStd(values: number[], meanVal?: number): number {
  if (values.length < 2) return 0;
  const mean = meanVal !== undefined ? meanVal : calculateMean(values);
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function computeLotStatistics(records: RawComponentRecord[]): Map<string, LotStatistics> {
  const lotGroups = new Map<string, RawComponentRecord[]>();
  
  for (const r of records) {
    if (!lotGroups.has(r.Lot_ID)) {
      lotGroups.set(r.Lot_ID, []);
    }
    lotGroups.get(r.Lot_ID)!.push(r);
  }

  const lotStatsMap = new Map<string, LotStatistics>();

  for (const [lotId, lotRecords] of lotGroups.entries()) {
    const vals0h = lotRecords.map(r => r.Value_0h);
    const vals24h = lotRecords.map(r => r.Value_24h);
    const vals96h = lotRecords.map(r => r.Value_96h);
    const vals168h = lotRecords.map(r => r.Value_168h);
    const earlyDrifts = lotRecords.map(r => (r.Value_24h - r.Value_0h) / 24);

    const median0h = calculateMedian(vals0h);
    const median24h = calculateMedian(vals24h);
    const median96h = calculateMedian(vals96h);
    const median168h = calculateMedian(vals168h);

    const mean24h = calculateMean(vals24h);
    const std24h = calculateStd(vals24h, mean24h);
    const mad24h = calculateMAD(vals24h, median24h);
    const mad0h = calculateMAD(vals0h, median0h);

    const normalCount = lotRecords.filter(r => r.Label === 0).length;
    const anomalyCount = lotRecords.filter(r => r.Label === 1).length;

    lotStatsMap.set(lotId, {
      lotId,
      count: lotRecords.length,
      median0h,
      median24h,
      median96h,
      median168h,
      mean24h,
      std24h,
      mad24h,
      mad0h,
      normalCount,
      anomalyCount,
      warningCount: 0,
      highRiskCount: 0,
      holdCount: 0,
      meanEarlyDrift: calculateMean(earlyDrifts)
    });
  }

  return lotStatsMap;
}

/**
 * Extracts early features strictly available at/before 24h.
 * GUARANTEES zero data leakage from 96h and 168h measurements.
 */
export function extractEarlyFeatures(
  record: RawComponentRecord,
  lotStats: LotStatistics
): EarlyFeatures {
  const eps = 1e-6;
  const delta_0_24h = record.Value_24h - record.Value_0h;
  const drift_rate_0_24h = delta_0_24h / 24.0;
  const baseAbs = Math.abs(record.Value_0h) + eps;
  const pct_change_0_24h = (delta_0_24h / baseAbs) * 100.0;

  const lot_median_24h = lotStats.median24h;
  const lot_mad_24h = Math.max(lotStats.mad24h, 0.05); // prevent divide by zero
  const lot_deviation_24h = record.Value_24h - lot_median_24h;
  // Robust modified Z-score using 1.4826 scale factor for normal consistency
  const lot_robust_zscore_24h = lot_deviation_24h / (1.4826 * lot_mad_24h);

  const lot_median_0h = lotStats.median0h;
  const lot_mad_0h = Math.max(lotStats.mad0h, 0.05);
  const lot_deviation_0h = record.Value_0h - lot_median_0h;
  const lot_robust_zscore_0h = lot_deviation_0h / (1.4826 * lot_mad_0h);

  return {
    delta_0_24h,
    pct_change_0_24h,
    drift_rate_0_24h,
    lot_median_24h,
    lot_mad_24h,
    lot_deviation_24h,
    lot_robust_zscore_24h,
    lot_deviation_0h,
    lot_robust_zscore_0h,
    abs_value_24h: Math.abs(record.Value_24h),
    abs_value_0h: Math.abs(record.Value_0h),
    is_negative_trajectory: record.Value_0h < 0 || record.Value_24h < 0
  };
}

/**
 * Extracts retrospective features for historical and post-burn-in QA audit only.
 * NEVER passed into predictive regression models.
 */
export function extractRetrospectiveFeatures(record: RawComponentRecord): RetrospectiveFeatures {
  const delta_24_96h = record.Value_96h - record.Value_24h;
  const delta_96_168h = record.Value_168h - record.Value_96h;
  const drift_rate_24_96h = delta_24_96h / (96 - 24);
  const drift_rate_96_168h = delta_96_168h / (168 - 96);
  const overall_drift = record.Value_168h - record.Value_0h;
  const earlyDriftRate = (record.Value_24h - record.Value_0h) / 24;
  const drift_acceleration = drift_rate_96_168h - earlyDriftRate;

  return {
    delta_24_96h,
    delta_96_168h,
    drift_rate_24_96h,
    drift_rate_96_168h,
    overall_drift,
    drift_acceleration
  };
}
