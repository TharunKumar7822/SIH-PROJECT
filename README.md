# AI-Driven Anomaly Detection in Component Burn-In & Screening

An AI/ML-based system designed to detect abnormal behavior in electronic components during **Burn-In and Environmental Stress Screening (ESS)**.

The project focuses on identifying early signs of component degradation instead of relying only on fixed threshold limits.

---

## 🎯 Problem

Traditional component testing often checks whether a measurement crosses a fixed limit.

For example:

```text
Normal:       10 → 11 → 12 → 12
Possible Risk: 10 → 18 → 30 → 45

Both may be below a limit such as 50, but the second component is changing much faster.

This project aims to detect such unusual patterns and early drift before they become critical.

💡 Solution

The system combines:

Statistical analysis
Anomaly detection
Machine Learning
Drift prediction
Risk scoring

It analyzes early measurements and compares them with historical component behavior to identify potentially abnormal components.

🔍 Key Features
Detects unusual component behavior
Performs lot-based data analysis
Calculates early drift
Uses Isolation Forest for anomaly detection
Predicts future component behavior
Generates a risk score
Provides a web-based dashboard
Includes a FastAPI backend
Supports Docker deployment
🧠 Machine Learning

The project experiments with multiple ML techniques:

Isolation Forest – anomaly detection
Ridge Regression – drift prediction
Random Forest – prediction
Gradient Boosting – prediction

The models use early-stage measurements to predict future behavior while avoiding the use of future data during prediction.

🏗️ System Flow
Component Data
      ↓
Data Processing
      ↓
Feature Engineering
      ↓
Anomaly Detection
      ↓
Drift Prediction
      ↓
Risk Score
      ↓
Screening Decision
🛠️ Tech Stack

Frontend

React
TypeScript
Vite

Backend

Python
FastAPI

Machine Learning

Scikit-learn
Statistical Analysis
Anomaly Detection
Regression

Tools

Git
GitHub
Docker
Docker Compose
📁 Project Structure
SIH-PROJECT/
│
├── backend/       # FastAPI backend
├── src/           # Frontend application
├── tests/         # Project tests
├── docker-compose.yml
├── package.json
└── README.md
🚀 Getting Started
Frontend
npm install
npm run dev
Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
Docker
docker compose up --build
📊 Project Results

The project evaluates different Machine Learning models for anomaly detection and drift prediction.

Model performance can be added here as experiments are completed.

Model	MAE
Ridge Regression	TBD
Random Forest	TBD
Gradient Boosting	TBD
🔮 Future Improvements
Real-time monitoring
Better model calibration
Explainable AI
More component parameters
Cloud deployment
Automated model retraining
Improved dashboards
👨‍💻 Author

Tharun Kumar

Computer Science & Engineering Student

Interested in:

Machine Learning • Data Engineering • Artificial Intelligence

GitHub

⭐ If you find this project interesting, feel free to explore the repository.
