import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  HelpCircle, 
  TrendingUp, 
  Target, 
  Activity 
} from 'lucide-react';
import { ClassificationMetrics, ScreenedComponent } from '../types';

interface KpiSummaryCardsProps {
  components: ScreenedComponent[];
  metrics: ClassificationMetrics;
  overallMAE: number;
  onFilterStatus: (status: string | null) => void;
  selectedStatus: string | null;
}

export const KpiSummaryCards: React.FC<KpiSummaryCardsProps> = ({
  components,
  metrics,
  overallMAE,
  onFilterStatus,
  selectedStatus
}) => {
  const total = components.length;
  const normalCount = components.filter(c => c.screeningStatus === 'NORMAL').length;
  const warningCount = components.filter(c => c.screeningStatus === 'WARNING').length;
  const highRiskCount = components.filter(c => c.screeningStatus === 'HIGH_RISK').length;
  const holdCount = components.filter(c => c.screeningStatus === 'HOLD_FOR_QA').length;

  const cards = [
    {
      id: 'TOTAL',
      label: 'TOTAL SCREENED',
      value: total,
      subtext: 'Flight Lot Population',
      icon: Activity,
      borderAccent: 'border-l-slate-400',
      activeRing: 'ring-2 ring-slate-400',
      textColor: 'text-slate-900',
      iconColor: 'text-slate-500',
      clickable: true,
      statusFilter: null
    },
    {
      id: 'NORMAL',
      label: 'NORMAL (PASS)',
      value: normalCount,
      subtext: `${((normalCount / (total || 1)) * 100).toFixed(1)}% Nominal`,
      icon: CheckCircle2,
      borderAccent: 'border-l-emerald-500',
      activeRing: 'ring-2 ring-emerald-500 bg-emerald-50/50',
      textColor: 'text-emerald-700',
      iconColor: 'text-emerald-600',
      clickable: true,
      statusFilter: 'NORMAL'
    },
    {
      id: 'WARNING',
      label: 'WARNING',
      value: warningCount,
      subtext: 'Elevated Drift Trend',
      icon: AlertTriangle,
      borderAccent: 'border-l-amber-500',
      activeRing: 'ring-2 ring-amber-500 bg-amber-50/50',
      textColor: 'text-amber-700',
      iconColor: 'text-amber-600',
      clickable: true,
      statusFilter: 'WARNING'
    },
    {
      id: 'HIGH_RISK',
      label: 'HIGH RISK',
      value: highRiskCount,
      subtext: 'Immediate Quarantine',
      icon: ShieldAlert,
      borderAccent: 'border-l-red-500',
      activeRing: 'ring-2 ring-red-500 bg-red-50/50',
      textColor: 'text-red-700',
      iconColor: 'text-red-600',
      clickable: true,
      statusFilter: 'HIGH_RISK'
    },
    {
      id: 'HOLD_FOR_QA',
      label: 'HOLD FOR QA',
      value: holdCount,
      subtext: 'Re-test / Confirmatory',
      icon: HelpCircle,
      borderAccent: 'border-l-orange-500',
      activeRing: 'ring-2 ring-orange-500 bg-orange-50/50',
      textColor: 'text-orange-700',
      iconColor: 'text-orange-600',
      clickable: true,
      statusFilter: 'HOLD_FOR_QA'
    },
    {
      id: 'RECALL',
      label: 'DEFECT RECALL',
      value: `${(metrics.recall * 100).toFixed(1)}%`,
      subtext: `FN: ${metrics.falseNegatives} (FNR: ${(metrics.falseNegativeRate * 100).toFixed(1)}%)`,
      icon: Target,
      borderAccent: 'border-l-blue-600',
      activeRing: '',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-600',
      clickable: false,
      statusFilter: undefined
    },
    {
      id: 'MAE',
      label: '168h DRIFT MAE',
      value: `${overallMAE.toFixed(3)} µA`,
      subtext: 'Anti-Leakage Validated',
      icon: TrendingUp,
      borderAccent: 'border-l-indigo-600',
      activeRing: '',
      textColor: 'text-indigo-700',
      iconColor: 'text-indigo-600',
      clickable: false,
      statusFilter: undefined
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
      {cards.map((c) => {
        const IconComponent = c.icon;
        const isSelected = selectedStatus === c.statusFilter && c.statusFilter !== undefined;
        return (
          <div
            key={c.id}
            onClick={() => {
              if (c.clickable) {
                onFilterStatus(selectedStatus === c.statusFilter ? null : c.statusFilter);
              }
            }}
            className={`bg-white rounded-lg border border-slate-200 border-l-4 ${c.borderAccent} p-3.5 shadow-sm transition-all duration-200 text-slate-900 ${
              isSelected ? c.activeRing : ''
            } ${c.clickable ? 'cursor-pointer hover:shadow hover:-translate-y-0.5' : ''}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase truncate">
                {c.label}
              </span>
              <IconComponent className={`w-3.5 h-3.5 ${c.iconColor}`} />
            </div>
            <div className={`text-xl font-bold font-mono ${c.textColor}`}>
              {c.value}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
              {c.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
};
