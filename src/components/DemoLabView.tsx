import React, { useState } from 'react';
import { DEMO_PRESETS } from '../ml/demoCases';
import { ScreenedComponent, LotStatistics, SafetySlopeConfig } from '../types';
import { TrajectoryChart } from './TrajectoryChart';
import { 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert, 
  AlertTriangle, 
  HelpCircle,
  ArrowRight,
  Zap,
  Info
} from 'lucide-react';

interface DemoLabViewProps {
  components: ScreenedComponent[];
  lotStats: Map<string, LotStatistics>;
  safetyConfig: SafetySlopeConfig;
  onInspectComponent: (componentId: string) => void;
}

export const DemoLabView: React.FC<DemoLabViewProps> = ({
  components,
  lotStats,
  safetyConfig,
  onInspectComponent
}) => {
  const [selectedDemoId, setSelectedDemoId] = useState<string>(DEMO_PRESETS[0].id);

  const activeDemo = DEMO_PRESETS.find(d => d.id === selectedDemoId) || DEMO_PRESETS[0];
  const targetComponent = components.find(c => c.componentId === activeDemo.componentId) || components[0];
  const targetLotStats = lotStats.get(targetComponent.lotId) || Array.from(lotStats.values())[0];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm text-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold font-mono text-slate-900">
              Demonstration Lab: Static Limits vs AI Dynamic Screening
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Evaluate how AI catches subtle degradation trajectories that escape traditional static threshold filters
          </p>
        </div>
      </div>

      {/* Preset Selector Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {DEMO_PRESETS.map((demo) => {
          const isSelected = demo.id === selectedDemoId;
          return (
            <button
              key={demo.id}
              onClick={() => setSelectedDemoId(demo.id)}
              className={`p-4 rounded-lg border text-left transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  Unit {demo.componentId}
                </span>
                {demo.category === 'subtle_latent' && (
                  <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                    ESCAPE HAZARD
                  </span>
                )}
              </div>
              <h3 className="font-bold text-xs text-slate-900 mb-1 leading-snug">
                {demo.title}
              </h3>
              <p className="text-[11px] text-slate-500 line-clamp-2">
                {demo.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Side-by-Side Comparison Box */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Traditional Static Limit Box */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm text-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-bold text-sm text-slate-600 uppercase tracking-wide">
              Traditional Static Limit Screening
            </h3>
            <span className="text-xs font-mono text-slate-500 font-semibold">
              Limit: ≤ 50.0 µA
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center text-slate-700">
              <span className="text-slate-500 font-sans">168h Final Measurement:</span>
              <span className="font-bold text-slate-900">{targetComponent.value168hActual.toFixed(2)} µA</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="text-slate-500 font-sans">Datasheet Upper Bound:</span>
              <span className="text-slate-900">50.00 µA</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 pt-2 font-bold">
              <span className="font-sans text-slate-700">Traditional QA Result:</span>
              <span className="text-emerald-600 text-sm flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> PASS (Passed Limit)
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900">
            <div className="font-bold text-red-700 mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Traditional Screening Vulnerability:
            </div>
            <p className="leading-relaxed text-red-800">
              Traditional screening is blind to temporal drift dynamics. A component drifting from 11.0 µA to 44.9 µA is approved for flight assembly despite exhibiting severe internal degradation.
            </p>
          </div>
        </div>

        {/* AI Dynamic Screening Box */}
        <div className="bg-white border border-blue-300 rounded-lg p-5 shadow-sm text-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-bold text-sm text-blue-700 uppercase tracking-wide">
              AI Dynamic & Lot-Relative Screening
            </h3>
            <span className="text-xs font-mono text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Early Intercept @ 24h
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center text-slate-700">
              <span className="text-slate-500 font-sans">Early Drift Rate (0-24h):</span>
              <span className={`font-bold ${targetComponent.isSafetySlopeViolated ? 'text-red-600' : 'text-emerald-600'}`}>
                {targetComponent.earlyDriftRate.toFixed(4)} µA/h
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="text-slate-500 font-sans">Learned Safety Slope Boundary:</span>
              <span className="text-amber-700 font-semibold">{safetyConfig.derivedSafetySlopeRate.toFixed(4)} µA/h</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="text-slate-500 font-sans">Forecasted 168h Value:</span>
              <span className="text-blue-700 font-bold">{targetComponent.predictedValue168h.toFixed(2)} µA</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 pt-2 font-bold">
              <span className="font-sans text-slate-700">AI Dynamic Decision:</span>
              <span className={`text-sm flex items-center gap-1 ${
                targetComponent.screeningStatus === 'HIGH_RISK' ? 'text-red-600' :
                targetComponent.screeningStatus === 'WARNING' ? 'text-amber-600' :
                targetComponent.screeningStatus === 'HOLD_FOR_QA' ? 'text-orange-600' : 'text-emerald-600'
              }`}>
                {targetComponent.screeningStatus === 'HIGH_RISK' && <ShieldAlert className="w-4 h-4" />}
                {targetComponent.screeningStatus} (Risk: {targetComponent.compositeRiskScore}/100)
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900">
            <div className="font-bold text-blue-700 mb-1 flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> AI Early Warning Advantage:
            </div>
            <p className="leading-relaxed text-blue-800">
              {activeDemo.keyInsight}
            </p>
          </div>
        </div>

      </div>

      {/* Trajectory Graph for Demo Case */}
      <TrajectoryChart
        component={targetComponent}
        lotStats={targetLotStats}
        safetyConfig={safetyConfig}
      />

      {/* Action Button to inspect details */}
      <div className="flex justify-end">
        <button
          onClick={() => onInspectComponent(targetComponent.componentId)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
        >
          Inspect Complete Telemetry & SHAP Explanations in Deep Dive <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
