import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report, precision_score, recall_score, f1_score
import joblib
import shap
import os

print("Booting up True AI/ML Training Pipeline...")

# 1. Ingest Real Historical Data
csv_path = "historical_loans.csv"
if not os.path.exists(csv_path):
    raise FileNotFoundError(f"Missing '{csv_path}'. Please ensure historical data is available.")

df = pd.read_csv(csv_path)
print(f"Successfully loaded {len(df)} historical records.")

# Ensure there are no missing values (Imputation logic can be added here)
df.fillna(df.mean(), inplace=True)

X = df[["avg_balance", "overdrafts", "gambling_flags", "academic_score", "dti_ratio", "savings_rate"]]
y = df["status"]

print("Preprocessing and splitting data...")

# 2. Preprocessing
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print("Training XGBoost Classifier...")

# 3. Train the Model
xgb_model = xgb.XGBClassifier(
    n_estimators=300, 
    max_depth=5, 
    learning_rate=0.05, 
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42, 
    eval_metric='logloss'
)
xgb_model.fit(X_train_scaled, y_train)

# 4. Evaluation
y_pred = xgb_model.predict(X_test_scaled)
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print("\n--- Model Evaluation ---")
print(f"Accuracy:  {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall:    {recall:.4f}")
print(f"F1-Score:  {f1:.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# 5. Generate SHAP Explainer
print("Generating SHAP Explainer for Explainable AI...")
explainer = shap.TreeExplainer(xgb_model)

# 6. Export the Model, Scaler, and Explainer
model_filename = "risk_model.pkl"
scaler_filename = "scaler.pkl"
explainer_filename = "explainer.pkl"

joblib.dump(xgb_model, model_filename)
joblib.dump(scaler, scaler_filename)
joblib.dump(explainer, explainer_filename)

print(f"Success! Model saved to '{model_filename}'")
print(f"Scaler saved to '{scaler_filename}'")
print(f"SHAP Explainer saved to '{explainer_filename}'")