import React from 'react';
import { Sliders, X, RefreshCw } from 'lucide-react';
import { RiskWeightsConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  weights: RiskWeightsConfig;
  onUpdateWeights: (newWeights: Partial<RiskWeightsConfig>) => void;
  onResetDefaults: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  weights,
  onUpdateWeights,
  onResetDefaults
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base text-slate-900">
              Screening Weights & Decision Thresholds
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Calibrate engineering weighting factors for composite risk scoring. These weights are explicitly labeled as configurable engineering parameters.
        </p>

        <div className="space-y-3 font-mono text-xs">
          
          {/* Static Limit Threshold */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex justify-between mb-1">
              <span className="text-slate-700 font-sans font-medium">Datasheet Static Threshold Limit</span>
              <span className="text-red-700 font-bold">{weights.staticLimitThreshold.toFixed(1)} µA</span>
            </div>
            <input
              type="number"
              value={weights.staticLimitThreshold}
              onChange={(e) => onUpdateWeights({ staticLimitThreshold: parseFloat(e.target.value) || 50.0 })}
              className="w-full bg-white border border-slate-300 px-3 py-1.5 rounded-md text-slate-900 text-xs focus:outline-blue-500"
            />
          </div>

          {/* Decision Cutoff Threshold */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex justify-between mb-1">
              <span className="text-slate-700 font-sans font-medium">High Risk Quarantine Cutoff</span>
              <span className="text-red-700 font-bold">{weights.decisionThreshold}/100</span>
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

          {/* Warning Cutoff */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex justify-between mb-1">
              <span className="text-slate-700 font-sans font-medium">Warning Alert Cutoff</span>
              <span className="text-amber-700 font-bold">{weights.warningThreshold}/100</span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              step="1"
              value={weights.warningThreshold}
              onChange={(e) => onUpdateWeights({ warningThreshold: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
          </div>

        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <button
            onClick={onResetDefaults}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-300 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Defaults
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors cursor-pointer"
          >
            Save & Apply
          </button>
        </div>
      </div>
    </div>
  );
};
