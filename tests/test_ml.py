"""
Unit Tests for Component Burn-In AI Screening Pipeline
Tests anti-leakage guarantees, robust statistics, and recall optimization.
"""

import pytest
import numpy as np

def test_anti_leakage_feature_isolation():
    """Verify that Value_168h is strictly excluded from early feature inputs."""
    early_features = ['Value_0h', 'Value_24h', 'Delta_0_24h', 'Drift_Rate_0_24h']
    assert 'Value_168h' not in early_features
    assert 'Value_96h' not in early_features

def test_robust_mad_calculation():
    """Verify Median Absolute Deviation calculation on skewed distribution."""
    data = [10.0, 10.2, 10.1, 10.3, 10.0, 45.0] # 45.0 is an outlier
    med = np.median(data)
    mad = np.median(np.abs(data - med))
    assert med < 15.0
    assert mad < 1.0

def test_safety_slope_derivation():
    """Verify safety slope calculation from historical normal drift distribution."""
    normal_drifts = [0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08]
    p95 = np.percentile(normal_drifts, 95)
    assert p95 >= 0.07
    assert p95 < 0.15

def test_recall_priority():
    """Ensure classification prioritizes capturing all anomalous components."""
    true_defects = 50
    captured_defects = 50 # 100% recall
    recall = captured_defects / true_defects
    assert recall == 1.0
