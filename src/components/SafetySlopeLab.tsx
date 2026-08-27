import React from 'react';
import { Sliders, Activity, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { RiskWeightsConfig, SafetySlopeConfig } from '../types';

interface SafetySlopeLabProps {
  safetyConfig: SafetySlopeConfig;
  weights: RiskWeightsConfig;
  onUpdateWeights: (newWeights: Partial<RiskWeightsConfig>) => void;
  onUpdateSafetyPercentile: (pct: number) => void;
  onResetDefaults: () => void;
}

export const SafetySlopeLab: React.FC<SafetySlopeLabProps> = ({
  safetyConfig,
  weights,
  onUpdateWeights,
  onUpdateSafetyPercentile,
  onResetDefaults
}) => {
  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm text-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold font-mono text-slate-900 mb-1">
            Safety Trajectory & Risk Calibration Laboratory
          </h2>
          <p className="text-xs text-slate-500">
            Derive statistically verified safety slopes from historical normal components and calibrate risk weights
          </p>
        </div>
        <button
          onClick={onResetDefaults}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-300 flex items-center gap-2 transition-colors shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset Engineering Defaults
        </button>
      </div>

      {/* Safety Slope Statistical Derivation Box */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm text-slate-900 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            1. Safety Slope Percentile Derivation
          </h3>
          <span className="text-xs font-mono text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
            Threshold: {safetyConfig.derivedSafetySlopeRate.toFixed(4)} µA / hour
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Configurable Safety Percentile: {safetyConfig.safetyPercentile.toFixed(1)}th Percentile
            </label>
            <input
              type="range"
              min="90"
              max="99.9"
              step="0.5"
              value={safetyConfig.safetyPercentile}
              onChange={(e) => onUpdateSafetyPercentile(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>90.0% (More Strict)</span>
              <span>95.0%</span>
              <span>97.5% (Nominal)</span>
              <span>99.9% (Tolerant)</span>
            </div>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              <strong>Mathematical Derivation:</strong> Early drift rate distribution <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 border border-slate-200">(Value_24h - Value_0h)/24</code> of historical normal components is fitted. Components with early drift or predicted trajectory exceeding this boundary are flagged for safety violation.
            </p>
          </div>

          {/* Distribution Stats */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs font-mono space-y-2">
            <div className="text-slate-700 font-sans font-bold mb-1">
              Normal Population Historical Dispersion:
            </div>
            <div className="flex justify-between text-slate-800">
              <span className="text-slate-500 font-sans">Q1 (25th Percentile):</span>
              <span>{safetyConfig.distributionQ1.toFixed(4)} µA/h</span>
            </div>
            <div className="flex justify-between text-slate-800">
              <span className="text-slate-500 font-sans">Median (50th Percentile):</span>
              <span>{safetyConfig.distributionMedian.toFixed(4)} µA/h</span>
            </div>
            <div className="flex justify-between text-slate-800">
              <span className="text-slate-500 font-sans">Q3 (75th Percentile):</span>
              <span>{safetyConfig.distributionQ3.toFixed(4)} µA/h</span>
            </div>
            <div className="flex justify-between text-amber-700 font-bold border-t border-slate-200 pt-1.5">
              <span className="text-slate-500 font-sans font-normal">Robust Upper Fence (Q3 + 1.5*IQR):</span>
              <span>{safetyConfig.distributionUpperFence.toFixed(4)} µA/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Thresholds & Risk Scoring Weights */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm text-slate-900 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            2. Configurable Engineering Risk Weights
          </h3>
          <span className="text-xs text-slate-500 font-mono font-semibold">
            Sum of Weights: {(
              weights.statisticalWeight +
              weights.isolationForestWeight +
              weights.lotDeviationWeight +
              weights.earlyDriftWeight +
              weights.predictedDriftWeight
            ).toFixed(2)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Statistical Anomaly Weight */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-700 font-medium">Statistical MAD Anomaly Weight</span>
              <span className="text-blue-600 font-mono font-bold">{weights.statisticalWeight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.05"
              value={weights.statisticalWeight}
              onChange={(e) => onUpdateWeights({ statisticalWeight: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Isolation Forest Weight */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-700 font-medium">Isolation Forest Score Weight</span>
              <span className="text-blue-600 font-mono font-bold">{weights.isolationForestWeight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.05"
              value={weights.isolationForestWeight}
              onChange={(e) => onUpdateWeights({ isolationForestWeight: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Lot Deviation Weight */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-700 font-medium">Lot Robust Z-Score Weight</span>
              <span className="text-blue-600 font-mono font-bold">{weights.lotDeviationWeight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.05"
              value={weights.lotDeviationWeight}
              onChange={(e) => onUpdateWeights({ lotDeviationWeight: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Early Drift Weight */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-700 font-medium">Early Drift Rate (0-24h) Weight</span>
              <span className="text-blue-600 font-mono font-bold">{weights.earlyDriftWeight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.05"
              value={weights.earlyDriftWeight}
              onChange={(e) => onUpdateWeights({ earlyDriftWeight: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Predicted 168h Drift Weight */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-700 font-medium">Predicted 168h Drift Weight</span>
              <span className="text-blue-600 font-mono font-bold">{weights.predictedDriftWeight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.05"
              value={weights.predictedDriftWeight}
              onChange={(e) => onUpdateWeights({ predictedDriftWeight: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Decision Cutoff Threshold */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-red-700 font-medium">High Risk Decision Cutoff</span>
              <span className="text-red-700 font-mono font-bold">{weights.decisionThreshold} / 100</span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              step="1"
              value={weights.decisionThreshold}
              onChange={(e) => onUpdateWeights({ decisionThreshold: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
          </div>

        </div>
      </div>
    </div>
  );
};
