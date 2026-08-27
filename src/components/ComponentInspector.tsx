import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Activity,
  Layers,
  FileText,
  AlertOctagon,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { ScreenedComponent, LotStatistics, SafetySlopeConfig } from '../types';
import { TrajectoryChart } from './TrajectoryChart';

interface ComponentInspectorProps {
  component: ScreenedComponent;
  lotStats: LotStatistics;
  safetyConfig: SafetySlopeConfig;
}

export const ComponentInspector: React.FC<ComponentInspectorProps> = ({
  component,
  lotStats,
  safetyConfig
}) => {
  const getStatusBadge = () => {
    switch (component.screeningStatus) {
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> NORMAL (PASS)
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> WARNING (ELEVATED DRIFT)
          </span>
        );
      case 'HIGH_RISK':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" /> HIGH RISK (QUARANTINE)
          </span>
        );
      case 'HOLD_FOR_QA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
            <HelpCircle className="w-3.5 h-3.5 text-orange-600" /> HOLD FOR QA INVESTIGATION
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm text-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold font-mono text-slate-900">
                Component Record: {component.componentId}
              </h2>
              {getStatusBadge()}
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                Lot {component.lotId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              High-Reliability Space-Grade Screening Telemetry & Anomaly Attribution
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                Composite Risk Score
              </span>
              <span className={`text-2xl font-bold font-mono ${
                component.compositeRiskScore >= 45 ? 'text-red-600' :
                component.compositeRiskScore >= 25 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {component.compositeRiskScore}/100
              </span>
            </div>
            <div className="text-right border-l border-slate-200 pl-6">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                AI Confidence
              </span>
              <span className="text-2xl font-bold font-mono text-blue-600">
                {component.diagnosticConfidence}%
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry Timeline Mini-Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 block font-mono font-bold">0h Measurement</span>
            <span className="text-base font-bold font-mono text-slate-800">
              {component.value0h.toFixed(3)} µA
            </span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 block font-mono font-bold">24h Measurement</span>
            <span className="text-base font-bold font-mono text-slate-800">
              {component.value24h.toFixed(3)} µA
            </span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 block font-mono font-bold">96h Measurement</span>
            <span className="text-base font-bold font-mono text-slate-800">
              {component.value96h.toFixed(3)} µA
            </span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 block font-mono font-bold">168h Final Actual</span>
            <span className="text-base font-bold font-mono text-slate-800">
              {component.value168hActual.toFixed(3)} µA
            </span>
          </div>
        </div>
      </div>

      {/* Trajectory Time-Series Chart */}
      <TrajectoryChart
        component={component}
        lotStats={lotStats}
        safetyConfig={safetyConfig}
      />

      {/* Diagnostic Explanation & Numerical Evidence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Why Was This Component Flagged? */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm text-slate-900 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
              Explainability & Anomaly Attribution
            </h3>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
              Why Was This Component Flagged?
            </h4>
            <div className="space-y-2">
              {component.flagReasons.map((reason, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200"
                >
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Numerical Evidence Breakdown */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
              Numerical Screening Evidence
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-sans font-bold">0h Value</span>
                <span className="text-slate-800 font-bold">{component.value0h.toFixed(2)} µA</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-sans font-bold">24h Value</span>
                <span className="text-slate-800 font-bold">{component.value24h.toFixed(2)} µA</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-sans font-bold">Lot Median (24h)</span>
                <span className="text-slate-800 font-bold">{lotStats.median24h.toFixed(2)} µA</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-sans font-bold">Early Drift (0-24h)</span>
                <span className={`font-bold ${component.earlyDriftRate > safetyConfig.derivedSafetySlopeRate ? 'text-red-600' : 'text-emerald-600'}`}>
                  {component.earlyDriftRate.toFixed(4)} µA/h
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-sans font-bold">Safety Slope Limit</span>
                <span className="text-amber-600 font-bold">{safetyConfig.derivedSafetySlopeRate.toFixed(4)} µA/h</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-sans font-bold">Predicted 168h Value</span>
                <span className="text-blue-600 font-bold">{component.predictedValue168h.toFixed(2)} µA</span>
              </div>
            </div>
          </div>

          {/* Recommended QA Actions */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
              Recommended QA Protocol
            </h4>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs text-slate-700">
              {component.recommendedActions.map((action, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: SHAP Feature Importance & Lot Relative Context */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm text-slate-900 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
              SHAP Feature Attributions & Lot Relative Behavior
            </h3>
          </div>

          {/* SHAP Waterfall / Bar Attributions */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
              Feature Contribution to Anomaly Score
            </h4>
            <div className="space-y-2.5">
              {component.featureImportance.map((fi, idx) => {
                const isPositive = fi.contribution > 0;
                const absContrib = Math.min(100, Math.abs(fi.contribution));
                return (
                  <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-800 font-medium">{fi.label}</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-slate-500 font-sans">Val: {fi.value}</span>
                        <span className={`font-bold ${isPositive ? 'text-red-600' : 'text-emerald-600'}`}>
                          {isPositive ? `+${fi.contribution}` : fi.contribution} pts
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
                      {isPositive ? (
                        <div 
                          className="h-full bg-red-500 rounded-full transition-all duration-300"
                          style={{ width: `${absContrib}%` }}
                        />
                      ) : (
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${absContrib}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lot-Level Comparative Context */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
              Lot L{component.lotId} Population Context
            </h4>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-700 font-mono">
                <span className="text-slate-500 font-sans">Lot Population Count:</span>
                <span className="font-semibold text-slate-900">{lotStats.count} components</span>
              </div>
              <div className="flex justify-between items-center text-slate-700 font-mono">
                <span className="text-slate-500 font-sans">Lot Median 24h:</span>
                <span className="font-semibold text-slate-900">{lotStats.median24h.toFixed(3)} µA</span>
              </div>
              <div className="flex justify-between items-center text-slate-700 font-mono">
                <span className="text-slate-500 font-sans">Lot MAD 24h:</span>
                <span className="font-semibold text-slate-900">±{lotStats.mad24h.toFixed(3)} µA</span>
              </div>
              <div className="flex justify-between items-center text-slate-700 font-mono">
                <span className="text-slate-500 font-sans">Component 24h Deviation:</span>
                <span className={component.earlyFeatures.lot_deviation_24h > 2 ? 'text-red-600 font-bold' : 'text-slate-800'}>
                  {component.earlyFeatures.lot_deviation_24h > 0 ? `+${component.earlyFeatures.lot_deviation_24h.toFixed(3)}` : component.earlyFeatures.lot_deviation_24h.toFixed(3)} µA
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-700 font-mono">
                <span className="text-slate-500 font-sans">Robust Modified Z-Score:</span>
                <span className={Math.abs(component.earlyFeatures.lot_robust_zscore_24h) > 2.5 ? 'text-red-600 font-bold' : 'text-slate-800'}>
                  {component.earlyFeatures.lot_robust_zscore_24h.toFixed(2)} σ
                </span>
              </div>
            </div>
          </div>

          {/* Model Disclaimer Notice */}
          <div className="text-[11px] text-slate-600 bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2">
            <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>QA Decision Support Notice:</strong> Observable statistical and temporal deviations assist early detection. Exact physical root causes require physical failure analysis (FA).
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
