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
  ReferenceLine
} from 'recharts';
import { ScreenedComponent, LotStatistics, SafetySlopeConfig } from '../types';

interface TrajectoryChartProps {
  component: ScreenedComponent;
  lotStats: LotStatistics;
  safetyConfig: SafetySlopeConfig;
}

export const TrajectoryChart: React.FC<TrajectoryChartProps> = ({
  component,
  lotStats,
  safetyConfig
}) => {
  // Construct data points for 0h, 24h, 96h, 168h
  const timePoints = [0, 24, 96, 168];
  
  // Calculate safety slope line starting from component's 0h measurement
  const base0h = component.value0h;
  const safetyRate = safetyConfig.derivedSafetySlopeRate;

  const chartData = timePoints.map((t) => {
    let actual: number | null = null;
    let predicted: number | null = null;
    let lotBaseline: number = 0;

    if (t === 0) {
      actual = component.value0h;
      predicted = component.value0h;
      lotBaseline = lotStats.median0h;
    } else if (t === 24) {
      actual = component.value24h;
      predicted = component.value24h;
      lotBaseline = lotStats.median24h;
    } else if (t === 96) {
      actual = component.value96h;
      // Linear interpolation between 24h and predicted 168h
      predicted = component.value24h + ((component.predictedValue168h - component.value24h) / (168 - 24)) * (96 - 24);
      lotBaseline = lotStats.median96h;
    } else if (t === 168) {
      actual = component.value168hActual;
      predicted = component.predictedValue168h;
      lotBaseline = lotStats.median168h;
    }

    const safetyTrajectory = base0h + safetyRate * t;

    return {
      hour: `${t}h`,
      rawHour: t,
      'Actual Measurement': actual !== null ? parseFloat(actual.toFixed(2)) : undefined,
      'AI Predicted Trajectory': predicted !== null ? parseFloat(predicted.toFixed(2)) : undefined,
      'Safety Slope Boundary': parseFloat(safetyTrajectory.toFixed(2)),
      'Lot Median Baseline': parseFloat(lotBaseline.toFixed(2))
    };
  });

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm">
              Burn-In Parametric Drift Trajectory — Unit {component.componentId}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
              Lot {component.lotId}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Temporal telemetry tracking vs statistical lot baseline & learned safety boundary
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-500">Early Drift (0-24h):</span>
          <span className={`font-semibold ${component.earlyDriftRate > safetyRate ? 'text-red-600' : 'text-emerald-600'}`}>
            {component.earlyDriftRate.toFixed(4)} µA/h
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">Pred 168h:</span>
          <span className="font-semibold text-blue-600">
            {component.predictedValue168h.toFixed(2)} µA
          </span>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="hour" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis 
              stroke="#64748b" 
              tick={{ fill: '#64748b', fontSize: 12 }} 
              domain={['auto', 'auto']}
              unit=" µA"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />
            <ReferenceLine
              y={50.0}
              label={{ value: 'Static Limit (50 µA)', fill: '#ef4444', fontSize: 10, position: 'top' }}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />

            {/* Lot Baseline */}
            <Line
              type="monotone"
              dataKey="Lot Median Baseline"
              stroke="#94a3b8"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={{ r: 3, fill: '#94a3b8' }}
            />

            {/* Safety Boundary */}
            <Line
              type="monotone"
              dataKey="Safety Slope Boundary"
              stroke="#f59e0b"
              strokeDasharray="3 3"
              strokeWidth={2}
              dot={{ r: 3, fill: '#f59e0b' }}
            />

            {/* Predicted Trajectory */}
            <Line
              type="monotone"
              dataKey="AI Predicted Trajectory"
              stroke="#2563eb"
              strokeWidth={2.5}
              strokeDasharray="2 2"
              dot={{ r: 4, fill: '#2563eb' }}
            />

            {/* Actual Measurements */}
            <Line
              type="monotone"
              dataKey="Actual Measurement"
              stroke={component.screeningStatus === 'HIGH_RISK' ? '#ef4444' : '#10b981'}
              strokeWidth={3}
              dot={{ r: 5, fill: component.screeningStatus === 'HIGH_RISK' ? '#ef4444' : '#10b981', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between text-[11px] text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
        <div>
          <span className="font-semibold text-slate-800">Observation:</span>{' '}
          {component.isSafetySlopeViolated 
            ? `Crosses safety corridor by ${component.safetyMarginPct.toFixed(1)}%. Early drift rate indicates abnormal kinetic thermal degradation.`
            : `Within normal safety bounds. Tracking parallel with Lot ${component.lotId} baseline.`}
        </div>
        <div className="font-mono text-slate-700 font-semibold">
          Datasheet Margin: {(50.0 - component.value168hActual).toFixed(2)} µA (Static: PASS)
        </div>
      </div>
    </div>
  );
};
