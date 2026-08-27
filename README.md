# AI-Driven Anomaly Detection in Component Burn-In & Screening

A production-oriented Environmental Stress Screening (ESS) & Burn-In predictive quality assurance system engineered for high-reliability aerospace, defense, and space applications.

---

## 1. Problem Statement & Philosophy

Traditional electronic component screening relies on static datasheet thresholds (e.g., leakage current limit $\le 50\,\mu\text{A}$). Under this regime:
- A unit with stable measurements of $10 \rightarrow 11 \rightarrow 12 \rightarrow 12\,\mu\text{A}$ **PASSES**.
- A degraded unit drifting from $10 \rightarrow 18 \rightarrow 30 \rightarrow 45\,\mu\text{A}$ **PASSES** because it never crosses $50\,\mu\text{A}$.

In space flight missions, dynamic drift is a symptom of progressive material degradation, package contamination, or dielectric breakdown.

**Core System Principle:**
> *"Traditional ESS asks: 'Did the component exceed the allowed limit?' Our system asks: 'Is this component behaving abnormally compared with its lot, is its parameter drifting unusually over time, and is it likely to cross an unsafe trajectory?'"*

---

## 2. Mathematical Architecture

### A. Lot-Aware Robust Normalization
To prevent lot-to-lot baseline shifts from confounding anomaly detection, each lot $L_k$ is normalized using Median and Median Absolute Deviation (MAD):

$$\text{MAD}_k = \text{median}\left(\left| x_i - \text{median}(X_k) \right|\right)$$

$$\text{Modified } Z\text{-Score} = \frac{0.6745 \cdot (x_i - \text{median}(X_k))}{\text{MAD}_k}$$

### B. Module A: Hybrid Early Anomaly Detection
Combines robust statistical deviation with Isolation Forest scoring on early features ($t = 0\text{h}, 24\text{h}$):
- Early Drift Rate: $\text{Slope}_{0-24} = \frac{x_{24\text{h}} - x_{0\text{h}}}{24}$
- Deviation from Lot Median: $\Delta_{\text{lot}} = x_{24\text{h}} - \text{median}_{L_k}(24\text{h})$

### C. Module B: Anti-Leakage 168h Drift Predictor
- **Strict Anti-Leakage Protocol:** Feature matrices strictly isolate $0\text{h}$ and $24\text{h}$ measurements. $96\text{h}$ and $168\text{h}$ measurements are **NEVER** accessible at inference time.
- Compares Linear Ridge Regression, Random Forest, and Gradient Boosted Decision Trees; automatically deploys the model minimizing Mean Absolute Error (MAE).

### D. Statistically Derived Safety Slope
The maximum permissible drift rate is derived from the empirical upper percentile (e.g. 97.5th percentile or $Q_3 + 1.5 \times \text{IQR}$) of historical normal components:

$$\text{Boundary}(t) = x_{0\text{h}} + \text{Slope}_{\text{safe}} \times t$$

### E. Composite Risk Engine
Calibrates 5 configurable engineering weighting factors into a normalized score $[0, 100]$:

$$\text{Risk Score} = w_1 S_{\text{stat}} + w_2 S_{\text{iforest}} + w_3 S_{\text{lot}} + w_4 S_{\text{early}} + w_5 S_{\text{predicted}}$$

---

## 3. High-Recall Optimization
In aerospace QA, **missing a defective component is catastrophic**. The decision threshold is calibrated for **zero false negatives (100% recall)**, safely accepting low false-positive rates for secondary QA review.

---

## 4. Running the System

### Full-Stack Development
```bash
# Install frontend & server dependencies
npm install

# Start development server on port 3000
npm run dev
```

### Backend FastApi Service
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Docker Deployment
```bash
docker-compose up --build
```
