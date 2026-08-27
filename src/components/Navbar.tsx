import React from 'react';
import { 
  ShieldAlert, 
  Cpu, 
  FileSpreadsheet, 
  Sliders, 
  FlaskConical, 
  RefreshCw, 
  AlertTriangle,
  HelpCircle,
  UploadCloud,
  Download
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenUpload: () => void;
  onOpenSettings: () => void;
  onOpenDisclaimer: () => void;
  onResetBenchmark: () => void;
  onExportCsv: () => void;
  totalCount: number;
  highRiskCount: number;
  recallPct: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpload,
  onOpenSettings,
  onOpenDisclaimer,
  onResetBenchmark,
  onExportCsv,
  totalCount,
  highRiskCount,
  recallPct
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Screening Telemetry' },
    { id: 'inspector', label: 'Component Deep Dive' },
    { id: 'lots', label: 'Lot Analytics' },
    { id: 'validation', label: 'Model Evaluation' },
    { id: 'safetyslope', label: 'Safety Slope Tuning' },
    { id: 'demolab', label: 'Demonstration Lab' }
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Aerospace Badge */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white font-mono">AERO-SCREEN AI</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  ESS v1.0 Production
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Burn-In & Environmental Stress Screening Dynamic Early Warning
              </p>
            </div>
          </div>

          {/* Quick Telemetry Status Badges */}
          <div className="hidden lg:flex items-center gap-3 text-xs font-mono">
            <div className="bg-slate-800/80 px-3 py-1.5 rounded border border-slate-700/80 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-semibold">SYSTEM NOMINAL</span>
            </div>
            <div className="bg-slate-800/80 px-3 py-1.5 rounded border border-slate-700/80 flex items-center gap-2">
              <span className="text-slate-400">Dataset:</span>
              <span className="text-white font-semibold">{totalCount} Units</span>
            </div>
            <div className="bg-slate-800/80 px-3 py-1.5 rounded border border-slate-700/80 flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-slate-400">High Risk:</span>
              <span className="text-rose-300 font-bold">{highRiskCount}</span>
            </div>
            <div className="bg-slate-800/80 px-3 py-1.5 rounded border border-slate-700/80 flex items-center gap-2">
              <span className="text-slate-400">Recall:</span>
              <span className="text-emerald-300 font-bold">{(recallPct * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenUpload}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title="Upload Custom CSV Dataset"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload CSV</span>
            </button>
            <button
              onClick={onExportCsv}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export Screened Dataset Report"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors cursor-pointer"
              title="Configure Risk Weights & Thresholds"
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenDisclaimer}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors cursor-pointer"
              title="Model Limitations & QA Disclaimer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1.5 overflow-x-auto py-2 border-t border-slate-800 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
