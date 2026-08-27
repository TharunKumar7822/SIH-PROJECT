import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { LotStatistics, ScreenedComponent } from '../types';

interface LotAnalyticsViewProps {
  lotStats: Map<string, LotStatistics>;
  components: ScreenedComponent[];
  onSelectLot: (lotId: string) => void;
}

export const LotAnalyticsView: React.FC<LotAnalyticsViewProps> = ({
  lotStats,
  components,
  onSelectLot
}) => {
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);

  const lotsArray: LotStatistics[] = (Array.from(lotStats.values()) as LotStatistics[]).sort((a, b) => a.lotId.localeCompare(b.lotId));

  const chartData = lotsArray.map((l) => ({
    lotId: l.lotId,
    'Normal Units': l.normalCount,
    'Warning Units': l.warningCount,
    'High Risk Defects': l.highRiskCount,
    'Hold for QA': l.holdCount,
    'Median 24h (µA)': parseFloat(l.median24h.toFixed(2)),
    'MAD (µA)': parseFloat(l.mad24h.toFixed(2))
  }));

  const filteredComponents = selectedLotId
    ? components.filter(c => c.lotId === selectedLotId)
    : components;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm text-slate-900">
        <h2 className="text-lg font-bold font-mono text-slate-900 mb-1">
          Lot-Level Population Screening Analytics
        </h2>
        <p className="text-xs text-slate-500">
          Cross-lot statistical variance, robust dispersion (MAD), and anomaly clustering across flight batches
        </p>
      </div>

      {/* Lot Risk Distribution Chart */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm text-slate-900">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">
          Lot Defect & Anomaly Distribution
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="lotId" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="Normal Units" stackId="a" fill="#10b981" />
              <Bar dataKey="Warning Units" stackId="a" fill="#f59e0b" />
              <Bar dataKey="Hold for QA" stackId="a" fill="#f97316" />
              <Bar dataKey="High Risk Defects" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lot Summary Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden text-slate-900">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Lot Batch Statistical Summary (Median & MAD)
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {lotsArray.length} Production Lots Monitored
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">LOT ID</th>
                <th className="px-4 py-3">TOTAL UNITS</th>
                <th className="px-4 py-3">0h MEDIAN</th>
                <th className="px-4 py-3">24h MEDIAN</th>
                <th className="px-4 py-3">24h MAD (±)</th>
                <th className="px-4 py-3">168h MEDIAN</th>
                <th className="px-4 py-3">MEAN DRIFT</th>
                <th className="px-4 py-3">ANOMALY COUNT</th>
                <th className="px-4 py-3">RISK BREAKDOWN</th>
                <th className="px-4 py-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {lotsArray.map((lot) => {
                const totalAnomalies = lot.highRiskCount + lot.warningCount + lot.holdCount;
                const anomalyRate = ((totalAnomalies / (lot.count || 1)) * 100).toFixed(1);
                return (
                  <tr 
                    key={lot.lotId} 
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-blue-600">
                      Lot {lot.lotId}
                    </td>
                    <td className="px-4 py-3">{lot.count}</td>
                    <td className="px-4 py-3">{lot.median0h.toFixed(2)} µA</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{lot.median24h.toFixed(2)} µA</td>
                    <td className="px-4 py-3 text-slate-600">±{lot.mad24h.toFixed(2)} µA</td>
                    <td className="px-4 py-3">{lot.median168h.toFixed(2)} µA</td>
                    <td className="px-4 py-3">{lot.meanEarlyDrift.toFixed(4)} µA/h</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        lot.highRiskCount > 0 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {lot.highRiskCount} Defect ({anomalyRate}%)
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="text-emerald-600 font-bold">{lot.normalCount} N</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-amber-600 font-bold">{lot.warningCount} W</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-red-600 font-bold">{lot.highRiskCount} HR</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onSelectLot(lot.lotId)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 transition-colors text-[11px] cursor-pointer border border-slate-200"
                      >
                        View Components
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
