import React from 'react';
import { HelpCircle, AlertOctagon, ShieldCheck, X } from 'lucide-react';

interface ModelLimitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelLimitationsModal: React.FC<ModelLimitationsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-base text-slate-900">
              Aerospace QA Disclaimer & Model Limitations
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary QA Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 leading-relaxed font-semibold">
          "This system is an AI-assisted screening and decision-support tool. It does not replace qualified QA procedures, burn-in testing, electrical characterization, or physical failure analysis."
        </div>

        <div className="space-y-3 text-xs text-slate-700">
          <h4 className="font-bold text-slate-900 uppercase tracking-wide">
            Documented Engineering Limitations & Operating Assumptions
          </h4>

          <ul className="space-y-2 text-slate-700 list-disc list-inside bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
            <li>
              <strong>Rare Defective Samples & Class Imbalance:</strong> In high-reliability screening, defects typically represent &lt;5% of lot populations. Models use class weighting and high-recall threshold tuning rather than synthetic oversampling.
            </li>
            <li>
              <strong>Limited Time Points:</strong> Only early burn-in measurements (0h, 24h) are available at the dynamic decision gate. Deep sequence models (LSTM/Transformers) are avoided in favor of robust explainable ensembles.
            </li>
            <li>
              <strong>Measurement Noise & Negative Values:</strong> Sensor offsets and fixture contact resistances may yield negative readings. These are preserved rather than filtered out, triggering hold-for-QA investigation.
            </li>
            <li>
              <strong>Lot-to-Lot Variation:</strong> Different wafer batches exhibit distinct baseline parameters. Anomaly detection is performed relative to each lot's robust median and MAD baseline.
            </li>
            <li>
              <strong>Physical Root Cause Boundary:</strong> The AI identifies observable statistical and temporal deviations (e.g. drift acceleration, lot outliers). It does NOT assert exact microscopic physical failure mechanisms (e.g. gate oxide breakdown, electromigration).
            </li>
            <li>
              <strong>Prediction Uncertainty:</strong> Forecasted 168h values are mathematical approximations. Predictions exceeding safety boundaries warrant physical test verification.
            </li>
          </ul>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors cursor-pointer border border-slate-200"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
