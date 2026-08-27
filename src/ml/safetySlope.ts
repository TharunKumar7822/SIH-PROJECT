import { RawComponentRecord, SafetySlopeConfig } from '../types';
import { calculateMedian } from './features';

export function deriveSafetySlope(
  records: RawComponentRecord[],
  percentileTarget: number = 97.5
): SafetySlopeConfig {
  // Extract normal components (Label == 0)
  const normalRecords = records.filter(r => r.Label === 0);
  const driftRates = normalRecords.map(r => (r.Value_24h - r.Value_0h) / 24.0);

  if (driftRates.length === 0) {
    return {
      safetyPercentile: percentileTarget,
      derivedSafetySlopeRate: 0.10,
      distributionQ1: 0.02,
      distributionMedian: 0.038,
      distributionQ3: 0.055,
      distributionUpperFence: 0.105,
      maxHistoricalNormalDrift: 0.119
    };
  }

  const sortedDrifts = [...driftRates].sort((a, b) => a - b);
  const n = sortedDrifts.length;

  const median = calculateMedian(sortedDrifts);
  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  const q1 = sortedDrifts[q1Index];
  const q3 = sortedDrifts[q3Index];
  const iqr = q3 - q1;
  const upperFence = q3 + 1.5 * iqr;
  const maxVal = sortedDrifts[n - 1];

  // Calculate target percentile value
  const targetIndex = Math.min(n - 1, Math.max(0, Math.floor((percentileTarget / 100.0) * n)));
  const percentileDrift = sortedDrifts[targetIndex];

  // We use the greater of percentile target and robust upper fence to ensure statistical rigor
  const derivedSafetySlopeRate = Math.max(percentileDrift, upperFence * 0.95);

  return {
    safetyPercentile: percentileTarget,
    derivedSafetySlopeRate,
    distributionQ1: q1,
    distributionMedian: median,
    distributionQ3: q3,
    distributionUpperFence: upperFence,
    maxHistoricalNormalDrift: maxVal
  };
}

export function evaluateSafetyViolation(
  earlyDriftRate: number,
  predicted168hDriftRate: number,
  safetyConfig: SafetySlopeConfig
): { isViolated: boolean; marginPct: number } {
  const threshold = safetyConfig.derivedSafetySlopeRate;
  
  // Either early drift is dangerous, or predicted trajectory to 168h implies unsafe degradation rate
  const maxObservedDrift = Math.max(earlyDriftRate, predicted168hDriftRate);
  const isViolated = maxObservedDrift > threshold;
  const marginPct = ((maxObservedDrift - threshold) / Math.max(threshold, 0.001)) * 100;

  return { isViolated, marginPct };
}
