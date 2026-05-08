import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib

print("Booting up Data Generator...")

# 1. Generate Synthetic Training Data
np.random.seed(42)
num_samples = 1000

# Features
avg_mongthly_balance = np.random.normal(5000, 2000, num_samples) # Average monthly balance
overdraft_count = np.random.poisson(1, num_samples)
gambling_transactions = np.random.poisson(0.5, num_samples)
academic_score = np.random.uniform(4.0, 10.0, num_samples) # CGPA out of 10

# Target Logic: High balance, low overdrafts, no gambling, good marks = APPROVED (1)
# Otherwise: REJECTED (0)
target = []
for i in range(num_samples):
    if avg_mongthly_balance[i] > 3000 and overdraft_count[i] <= 2 and gambling_transactions[i] == 0 and academic_score[i] >= 6.0:
        target.append(1) # APPROVED
    else:
        target.append(0) # REJECTED

# Create DataFrame
df = pd.DataFrame({
    "avg_balance": avg_mongthly_balance,
    "overdrafts": overdraft_count,
    "gambling_flags": gambling_transactions,
    "academic_score": academic_score,
    "status": target
})

X = df[["avg_balance", "overdrafts", "gambling_flags", "academic_score"]]
y = df["status"]

print(f"Generatd {num_samples} synthetic records.")
print("Training Random Forest Model...")

# 2. Train the Model
# We use a shallow tree to prevent overfitting on simple mock data
rf_model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
rf_model.fit(X, y)

accuracy = rf_model.score(X, y)
print(f"Model trained with {accuracy} accuracy.")

# 3. Export the Model
model_filename = "risk_model.pkl"
joblib.dump(rf_model, model_filename)

print(f"Success! Model serialized and saved to '{model_filename}'")