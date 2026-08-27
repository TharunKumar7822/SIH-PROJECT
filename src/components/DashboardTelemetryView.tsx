import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  HelpCircle,
  Eye,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';
import { ScreenedComponent, LotStatistics, SafetySlopeConfig } from '../types';
import { TrajectoryChart } from './TrajectoryChart';

interface DashboardTelemetryViewProps {
  components: ScreenedComponent[];
  lotStats: Map<string, LotStatistics>;
  safetyConfig: SafetySlopeConfig;
  selectedComponent: ScreenedComponent;
  onSelectComponent: (component: ScreenedComponent) => void;
  onDeepDive: (componentId: string) => void;
  statusFilter: string | null;
  onClearStatusFilter: () => void;
}

export const DashboardTelemetryView: React.FC<DashboardTelemetryViewProps> = ({
  components,
  lotStats,
  safetyConfig,
  selectedComponent,
  onSelectComponent,
  onDeepDive,
  statusFilter,
  onClearStatusFilter
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLot, setSelectedLot] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'risk' | 'id' | 'pred168' | 'earlyDrift'>('risk');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 12;

  const lotList = ['ALL', ...Array.from(lotStats.keys()).sort()];

  // Filtering
  const filtered = components.filter((c) => {
    const matchesSearch = c.componentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.lotId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLot = selectedLot === 'ALL' || c.lotId === selectedLot;
    const matchesStatus = !statusFilter || c.screeningStatus === statusFilter;
    return matchesSearch && matchesLot && matchesStatus;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    if (sortBy === 'risk') diff = a.compositeRiskScore - b.compositeRiskScore;
    else if (sortBy === 'id') diff = a.componentId.localeCompare(b.componentId);
    else if (sortBy === 'pred168') diff = a.predictedValue168h - b.predictedValue168h;
    else if (sortBy === 'earlyDrift') diff = a.earlyDriftRate - b.earlyDriftRate;
    return sortOrder === 'desc' ? -diff : diff;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            NORMAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            WARNING
          </span>
        );
      case 'HIGH_RISK':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 font-mono">
            HIGH RISK
          </span>
        );
      case 'HOLD_FOR_QA':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
            HOLD QA
          </span>
        );
      default:
        return null;
    }
  };

  const selectedLotData = lotStats.get(selectedComponent.lotId) || Array.from(lotStats.values())[0];

  return (
    <div className="space-y-6">
      
      {/* Live Selected Component Trajectory Visualizer */}
      <TrajectoryChart
        component={selectedComponent}
        lotStats={selectedLotData}
        safetyConfig={safetyConfig}
      />

      {/* Filter and Control Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Component ID / Lot..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-300 pl-9 pr-3 py-1.5 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* Lot and Sorting Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {/* Lot Selector */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 px-2.5 py-1 rounded-md text-xs text-slate-700">
              <span className="text-slate-500 text-[10px] font-mono font-bold">LOT:</span>
              <select
                value={selectedLot}
                onChange={(e) => { setSelectedLot(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-xs text-slate-800 focus:outline-none font-mono cursor-pointer"
              >
                {lotList.map(l => (
                  <option key={l} value={l} className="bg-white text-slate-900">{l}</option>
                ))}
              </select>
            </div>

            {/* Sort Field */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 px-2.5 py-1 rounded-md text-xs text-slate-700">
              <span className="text-slate-500 text-[10px] font-mono font-bold">SORT:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-slate-800 focus:outline-none font-mono cursor-pointer"
              >
                <option value="risk" className="bg-white text-slate-900">Risk Score</option>
                <option value="earlyDrift" className="bg-white text-slate-900">Early Drift</option>
                <option value="pred168" className="bg-white text-slate-900">Pred 168h</option>
                <option value="id" className="bg-white text-slate-900">Unit ID</option>
              </select>
            </div>

            {/* Sort Direction Toggle */}
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="p-1.5 bg-slate-50 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md text-xs cursor-pointer transition-colors"
              title="Toggle Sort Order"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Active Filters Tag Bar */}
        {statusFilter && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200 text-xs">
            <span className="text-slate-500">Active Filter:</span>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[11px] font-semibold">
              Status: {statusFilter}
            </span>
            <button
              onClick={onClearStatusFilter}
              className="text-blue-600 hover:text-blue-800 underline text-[11px] cursor-pointer"
            >
              Clear Filter
            </button>
          </div>
        )}
      </div>

      {/* Component Telemetry Master Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden text-slate-900">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
              Component Burn-In Screening Master Records
            </h3>
            <span className="text-xs font-mono text-slate-500 font-semibold">
              ({sorted.length} Units Matching)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono hidden md:inline">
            Click row to preview trajectory • Click 'Inspect' for full SHAP deep dive
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-3.5 py-3">UNIT ID</th>
                <th className="px-3.5 py-3">LOT</th>
                <th className="px-3.5 py-3">STATUS</th>
                <th className="px-3.5 py-3">0h (µA)</th>
                <th className="px-3.5 py-3">24h (µA)</th>
                <th className="px-3.5 py-3">EARLY DRIFT</th>
                <th className="px-3.5 py-3">PRED 168h</th>
                <th className="px-3.5 py-3">168h ACTUAL</th>
                <th className="px-3.5 py-3">PRED ERR</th>
                <th className="px-3.5 py-3">RISK SCORE</th>
                <th className="px-3.5 py-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {paginated.map((c) => {
                const isSelected = c.componentId === selectedComponent.componentId;
                return (
                  <tr
                    key={c.componentId}
                    onClick={() => onSelectComponent(c)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 border-l-4 border-l-blue-600 font-semibold text-slate-900'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-3.5 py-3 font-bold text-blue-600">
                      {c.componentId}
                    </td>
                    <td className="px-3.5 py-3 text-slate-600">
                      {c.lotId}
                    </td>
                    <td className="px-3.5 py-3">
                      {getStatusPill(c.screeningStatus)}
                    </td>
                    <td className="px-3.5 py-3">{c.value0h.toFixed(2)}</td>
                    <td className="px-3.5 py-3 text-slate-900 font-semibold">{c.value24h.toFixed(2)}</td>
                    <td className={`px-3.5 py-3 ${c.isSafetySlopeViolated ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
                      {c.earlyDriftRate.toFixed(4)}
                    </td>
                    <td className="px-3.5 py-3 text-blue-700 font-bold">
                      {c.predictedValue168h.toFixed(2)}
                    </td>
                    <td className="px-3.5 py-3 text-slate-700">
                      {c.value168hActual.toFixed(2)}
                    </td>
                    <td className="px-3.5 py-3 text-slate-500">
                      {c.predictionError.toFixed(2)}
                    </td>
                    <td className="px-3.5 py-3">
                      <span className={`font-bold ${
                        c.compositeRiskScore >= 45 ? 'text-red-600' :
                        c.compositeRiskScore >= 25 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {c.compositeRiskScore}/100
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeepDive(c.componentId);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 transition-colors text-[11px] font-sans flex items-center gap-1 ml-auto cursor-pointer border border-slate-200"
                      >
                        <Eye className="w-3 h-3" /> Deep Dive
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/60">
          <div>
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sorted.length)} of {sorted.length} records
          </div>
          <div className="flex items-center gap-2 font-mono">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 disabled:opacity-40 rounded text-slate-700 transition-colors cursor-pointer"
            >
              Prev
            </button>
            <span className="px-2 text-slate-700 font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 disabled:opacity-40 rounded text-slate-700 transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
