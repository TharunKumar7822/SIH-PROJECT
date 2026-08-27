import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter
} from 'recharts';
import { 
  ClassificationMetrics, 
  ModelComparisonMetrics, 
  ScreenedComponent 
} from '../types';
import { ShieldCheck, Target, AlertTriangle, Cpu, TrendingUp } from 'lucide-react';

interface ModelValidationViewProps {
  metrics: ClassificationMetrics;
  regressionComparison: ModelComparisonMetrics[];
  components: ScreenedComponent[];
}

export const ModelValidationView: React.FC<ModelValidationViewProps> = ({
  metrics,
  regressionComparison,
  components
}) => {
  // Prepare Scatter data for Actual vs Predicted 168h values
  const scatterData = components.slice(0, 150).map(c => ({
    actual: c.value168hActual,
    predicted: c.predictedValue168h,
    id: c.componentId,
    status: c.screeningStatus
  }));

  return (
    <div className="space-y-6">
      
      {/* Anti-Data Leakage Aerospace Guarantee Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 shadow-sm flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-sm text-emerald-900">
            Strict Anti-Data Leakage Verification & Lot-Aware Validation
          </h3>
          <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
            Module B forecasts Value_168h using <strong>ONLY early telemetry at 0h and 24h</strong>. Value_96h and Value_168h are strictly isolated from training feature matrices and used exclusively for post-hoc residual verification. Lots are partitioned via Group-aware splits to prevent intra-lot cross-contamination.
          </p>
        </div>
      </div>

      {/* Module A Classification Metrics & Confusion Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Confusion Matrix Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm text-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                Module A Confusion Matrix & Escape Prevention
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              Threshold Optim: High Recall
            </span>
          </div>

          {/* 2x2 Matrix Visualizer */}
          <div className="grid grid-cols-2 gap-3 font-mono text-center">
            
            {/* True Negative */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-sans block mb-1 font-bold">
                TRUE NEGATIVE (TN)
              </span>
              <span className="text-2xl font-bold text-emerald-600">
                {metrics.trueNegatives}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">
                Nominal Units Passed
              </span>
            </div>

            {/* False Positive */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-sans block mb-1 font-bold">
                FALSE POSITIVE (FP)
              </span>
              <span className="text-2xl font-bold text-amber-600">
                {metrics.falsePositives}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">
                Nominal Units Flagged
              </span>
            </div>

            {/* False Negative - THE CATASTROPHIC ESCAPE METRIC */}
            <div className={`p-4 rounded-lg border ${
              metrics.falseNegatives === 0 
                ? 'bg-emerald-50 border-emerald-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <span className="text-[10px] text-slate-500 font-sans block mb-1 font-bold">
                FALSE NEGATIVE (FN)
              </span>
              <span className={`text-2xl font-bold ${
                metrics.falseNegatives === 0 ? 'text-emerald-600' : 'text-red-600 font-mono'
              }`}>
                {metrics.falseNegatives}
              </span>
              <span className="text-[10px] text-slate-700 font-sans font-bold block mt-1">
                {metrics.falseNegatives === 0 ? 'ZERO ESCAPES (0.0% FNR)' : 'FLIGHT ESCAPE HAZARD!'}
              </span>
            </div>

            {/* True Positive */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-sans block mb-1 font-bold">
                TRUE POSITIVE (TP)
              </span>
              <span className="text-2xl font-bold text-blue-600">
                {metrics.truePositives}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">
                Defects Intercepted
              </span>
            </div>
          </div>

          {/* Classification Key Performance Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-xs font-mono">
            <div className="bg-slate-50 p-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-sans block font-bold">Recall / Sens</span>
              <span className="text-emerald-600 font-bold">{(metrics.recall * 100).toFixed(1)}%</span>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-sans block font-bold">Precision</span>
              <span className="text-slate-800 font-bold">{(metrics.precision * 100).toFixed(1)}%</span>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-sans block font-bold">F1-Score</span>
              <span className="text-slate-800 font-bold">{metrics.f1Score.toFixed(3)}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-sans block font-bold">ROC-AUC</span>
              <span className="text-blue-600 font-bold">{metrics.rocAuc.toFixed(3)}</span>
            </div>
          </div>
        </div>

        {/* Precision-Recall & ROC Curve */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm text-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
              Precision-Recall Curve (Imbalanced 95/5 Class Domain)
            </h3>
            <span className="text-xs text-slate-500 font-mono font-semibold">
              Recall Priority: 1.000
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.prCurve} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="recall" 
                  stroke="#64748b" 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  label={{ value: 'Recall (Defect Capture)', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 10 }}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fill: '#64748b', fontSize: 11 }} 
                  domain={[0, 1]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="precision" 
                  stroke="#2563eb" 
                  strokeWidth={2.5} 
                  dot={{ r: 3, fill: '#2563eb' }}
                  name="Precision"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-slate-500">
            <strong>Aerospace QA Policy:</strong> Missing a defective component is catastrophic. The classification threshold is optimized for maximum recall (100%), safely tolerating controlled false alarms in exchange for zero flight escapes.
          </p>
        </div>
      </div>

      {/* Module B Drift Regression Model Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden text-slate-900">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
              Module B 168h Drift Predictor Model Comparison
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono font-semibold">
            Selection Metric: Lowest Validation MAE
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">MODEL ALGORITHM</th>
                <th className="px-4 py-3">INPUT FEATURES (ANTI-LEAKAGE)</th>
                <th className="px-4 py-3">MAE (µA)</th>
                <th className="px-4 py-3">RMSE (µA)</th>
                <th className="px-4 py-3">R² COEFFICIENT</th>
                <th className="px-4 py-3 text-right">SELECTION STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {regressionComparison.map((m, idx) => (
                <tr 
                  key={idx} 
                  className={m.isBest ? 'bg-blue-50/60 font-semibold' : 'hover:bg-slate-50'}
                >
                  <td className="px-4 py-3 text-slate-900 flex items-center gap-2">
                    {m.modelName}
                    {m.isBest && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200 font-bold">
                        PRODUCTION ACTIVE
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-sans">
                    Value_0h, Value_24h, Delta_0_24h, Drift_Rate
                  </td>
                  <td className="px-4 py-3 font-bold text-blue-700">{m.mae.toFixed(4)} µA</td>
                  <td className="px-4 py-3">{m.rmse.toFixed(4)} µA</td>
                  <td className="px-4 py-3">{m.r2.toFixed(4)}</td>
                  <td className="px-4 py-3 text-right font-bold">
                    {m.isBest ? (
                      <span className="text-emerald-600">DEPLOYED TO PIPELINE</span>
                    ) : (
                      <span className="text-slate-400">BENCHMARK ALTERNATIVE</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actual vs Predicted 168h Scatter Plot */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm text-slate-900">
        <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide mb-3">
          Actual vs Predicted 168h Drift Values (Validation Subset)
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                type="number" 
                dataKey="actual" 
                name="Actual 168h" 
                unit=" µA" 
                stroke="#64748b" 
                tick={{ fill: '#64748b', fontSize: 11 }}
                label={{ value: 'Actual 168h Value (µA)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 11 }}
              />
              <YAxis 
                type="number" 
                dataKey="predicted" 
                name="Predicted 168h" 
                unit=" µA" 
                stroke="#64748b" 
                tick={{ fill: '#64748b', fontSize: 11 }}
                label={{ value: 'Predicted 168h (µA)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '12px'
                }}
              />
              <Scatter name="Components" data={scatterData} fill="#2563eb" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
