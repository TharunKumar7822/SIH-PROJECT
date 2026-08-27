import { DemonstrationCase } from '../types';

export const DEMO_PRESETS: DemonstrationCase[] = [
  {
    id: 'subtle_latent',
    title: 'Subtle Latent Defect (The Screening Escape Hazard)',
    category: 'subtle_latent',
    componentId: 'C0962',
    description: 'Component stays under the 50 µA datasheet static limit, but exhibits abnormal early drift and dangerous end-of-test degradation.',
    narrative: 'Under traditional screening, C0962 measures 44.94 µA at 168h. Because 44.94 µA < 50.0 µA, traditional QA issues a PASS. However, its lot median is ~11.1 µA, and its early drift rate of 0.242 µA/h is 3x higher than safe lot peers. AI screening flags it as HIGH RISK early at 24h, preventing flight failure.',
    staticResult: 'PASS',
    aiResult: 'HIGH_RISK',
    keyInsight: 'Latent defect escape prevented at 24h burn-in stage. Saved 144 hours of test chamber run-time and flight failure.'
  },
  {
    id: 'normal_component',
    title: 'Nominal Standard Component',
    category: 'normal',
    componentId: 'C0001',
    description: 'Conforms to tight lot median and exhibits nominal, asymptotic burn-in stabilization.',
    narrative: 'Initial value of 9.43 µA rises steadily to 10.99 µA at 24h (drift rate 0.065 µA/h) and stabilizes at 12.59 µA at 168h. Both static test and AI dynamic screening confirm standard behavior.',
    staticResult: 'PASS',
    aiResult: 'NORMAL',
    keyInsight: 'Confirmed nominal burn-in trajectory within 0.8σ of Lot L01 median baseline.'
  },
  {
    id: 'strong_anomaly',
    title: 'Strong Thermal Runaway Anomaly',
    category: 'strong_anomaly',
    componentId: 'C0995',
    description: 'Rapid accelerated drift exceeding all statistical bounds and safety slope limits.',
    narrative: 'Component C0995 exhibits drastic early jump from 10.04 µA to 16.18 µA at 24h (drift rate 0.256 µA/h). Machine learning drift predictor forecasts 41.5 µA at 168h with severe safety slope violation.',
    staticResult: 'PASS',
    aiResult: 'HIGH_RISK',
    keyInsight: 'Severe parametric shift flagged with 98% AI diagnostic confidence for immediate quarantine.'
  },
  {
    id: 'negative_sensor',
    title: 'Negative Sensor / Probe Offset Signature',
    category: 'negative_sensor',
    componentId: 'C0063',
    description: 'Negative measurement (-6.98 µA) indicating test fixture offset or probe contact degradation.',
    narrative: 'Negative measurements are preserved per aerospace domain rules rather than discarded. The system identifies -6.98 µA as a significant lot baseline deviation and triggers HOLD FOR QA investigation.',
    staticResult: 'PASS',
    aiResult: 'HOLD_FOR_QA',
    keyInsight: 'Prevents tester fixture or contact resistance errors from contaminating screening records.'
  }
];
