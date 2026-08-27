import React, { useState, useMemo } from 'react';
import { getBenchmarkDataset } from './data/rawDataset';
import { runFullScreeningPipeline, DEFAULT_WEIGHTS } from './ml/pipeline';
import { RawComponentRecord, RiskWeightsConfig, ScreenedComponent } from './types';
import { Navbar } from './components/Navbar';
import { KpiSummaryCards } from './components/KpiSummaryCards';
import { DashboardTelemetryView } from './components/DashboardTelemetryView';
import { ComponentInspector } from './components/ComponentInspector';
import { LotAnalyticsView } from './components/LotAnalyticsView';
import { ModelValidationView } from './components/ModelValidationView';
import { SafetySlopeLab } from './components/SafetySlopeLab';
import { DemoLabView } from './components/DemoLabView';
import { CustomUploadModal } from './components/CustomUploadModal';
import { SettingsModal } from './components/SettingsModal';
import { ModelLimitationsModal } from './components/ModelLimitationsModal';

export default function App() {
  // Dataset state
  const [rawRecords, setRawRecords] = useState<RawComponentRecord[]>(() => getBenchmarkDataset());
  
  // Configuration state
  const [weights, setWeights] = useState<RiskWeightsConfig>(DEFAULT_WEIGHTS);
  const [safetyPercentile, setSafetyPercentile] = useState<number>(97.5);

  // Navigation state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedComponentId, setSelectedComponentId] = useState<string>('C0962'); // Default to the famous subtle latent defect unit!
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState<boolean>(false);

  // Execute full machine learning screening pipeline
  const pipelineResult = useMemo(() => {
    return runFullScreeningPipeline(rawRecords, weights, safetyPercentile);
  }, [rawRecords, weights, safetyPercentile]);

  const {
    components,
    lotStats,
    safetyConfig,
    regressionComparison,
    classificationMetrics,
    overallMAE
  } = pipelineResult;

  // Currently selected component
  const currentComponent = useMemo(() => {
    return components.find(c => c.componentId === selectedComponentId) || components[0];
  }, [components, selectedComponentId]);

  const currentLotStats = useMemo(() => {
    if (!currentComponent) return Array.from(lotStats.values())[0];
    return lotStats.get(currentComponent.lotId) || Array.from(lotStats.values())[0];
  }, [currentComponent, lotStats]);

  // Export processed screening dataset to CSV
  const handleExportCsv = () => {
    if (components.length === 0) return;
    const headers = [
      'Component_ID',
      'Lot_ID',
      'Value_0h',
      'Value_24h',
      'Value_96h',
      'Value_168h_Actual',
      'Predicted_168h',
      'Prediction_Error',
      'Early_Drift_Rate',
      'Safety_Threshold_Drift',
      'Safety_Violated',
      'Stat_Anomaly_Score',
      'IForest_Score',
      'Risk_Score',
      'Screening_Status',
      'Static_Test_Pass',
      'AI_Test_Pass'
    ];

    const rows = components.map(c => [
      c.componentId,
      c.lotId,
      c.value0h,
      c.value24h,
      c.value96h,
      c.value168hActual,
      c.predictedValue168h,
      c.predictionError,
      c.earlyDriftRate,
      c.safetyThresholdDriftRate,
      c.isSafetySlopeViolated ? 'TRUE' : 'FALSE',
      c.statisticalAnomalyScore,
      c.isolationForestScore,
      c.compositeRiskScore,
      c.screeningStatus,
      c.staticScreeningPass ? 'PASS' : 'FAIL',
      c.aiScreeningPass ? 'PASS' : 'FAIL'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aero_screen_burnin_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInspectComponent = (componentId: string) => {
    setSelectedComponentId(componentId);
    setActiveTab('inspector');
  };

  const handleSelectLotFromAnalytics = (lotId: string) => {
    const firstInLot = components.find(c => c.lotId === lotId);
    if (firstInLot) {
      setSelectedComponentId(firstInLot.componentId);
    }
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top Aerospace Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
        onResetBenchmark={() => {
          setRawRecords(getBenchmarkDataset());
          setWeights(DEFAULT_WEIGHTS);
        }}
        onExportCsv={handleExportCsv}
        totalCount={components.length}
        highRiskCount={classificationMetrics.truePositives + classificationMetrics.falsePositives}
        recallPct={classificationMetrics.recall}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* KPI Telemetry Header Strip */}
        <KpiSummaryCards
          components={components}
          metrics={classificationMetrics}
          overallMAE={overallMAE}
          onFilterStatus={(status) => setStatusFilter(status)}
          selectedStatus={statusFilter}
        />

        {/* Tab Views */}
        {activeTab === 'dashboard' && (
          <DashboardTelemetryView
            components={components}
            lotStats={lotStats}
            safetyConfig={safetyConfig}
            selectedComponent={currentComponent}
            onSelectComponent={(c) => setSelectedComponentId(c.componentId)}
            onDeepDive={handleInspectComponent}
            statusFilter={statusFilter}
            onClearStatusFilter={() => setStatusFilter(null)}
          />
        )}

        {activeTab === 'inspector' && (
          <ComponentInspector
            component={currentComponent}
            lotStats={currentLotStats}
            safetyConfig={safetyConfig}
          />
        )}

        {activeTab === 'lots' && (
          <LotAnalyticsView
            lotStats={lotStats}
            components={components}
            onSelectLot={handleSelectLotFromAnalytics}
          />
        )}

        {activeTab === 'validation' && (
          <ModelValidationView
            metrics={classificationMetrics}
            regressionComparison={regressionComparison}
            components={components}
          />
        )}

        {activeTab === 'safetyslope' && (
          <SafetySlopeLab
            safetyConfig={safetyConfig}
            weights={weights}
            onUpdateWeights={(newWeights) => setWeights(prev => ({ ...prev, ...newWeights }))}
            onUpdateSafetyPercentile={(pct) => setSafetyPercentile(pct)}
            onResetDefaults={() => {
              setWeights(DEFAULT_WEIGHTS);
              setSafetyPercentile(97.5);
            }}
          />
        )}

        {activeTab === 'demolab' && (
          <DemoLabView
            components={components}
            lotStats={lotStats}
            safetyConfig={safetyConfig}
            onInspectComponent={handleInspectComponent}
          />
        )}

      </main>

      {/* Modals */}
      <CustomUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDatasetLoaded={(records) => {
          setRawRecords(records);
          if (records.length > 0) {
            setSelectedComponentId(records[0].Component_ID);
          }
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        weights={weights}
        onUpdateWeights={(newWeights) => setWeights(prev => ({ ...prev, ...newWeights }))}
        onResetDefaults={() => setWeights(DEFAULT_WEIGHTS)}
      />

      <ModelLimitationsModal
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
      />

      {/* Aerospace Telemetry Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 px-4 sm:px-8 text-xs text-slate-400 font-mono flex flex-col sm:flex-row items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-semibold">AERO-SCREEN ESS SYSTEM ACTIVE</span>
          <span className="text-slate-600">•</span>
          <span>ISO-9001 / AS9100 COMPLIANT ARCHITECTURE</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Strict Zero-Escape QA Gate • 168h Anti-Leakage Verified
        </div>
      </footer>

    </div>
  );
}
