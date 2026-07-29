import pandas as pd
import numpy as np

csv_path = "risk-engine/historical_loans.csv"
df = pd.read_csv(csv_path)

np.random.seed(42)

# Generate synthetic data for new features based on the existing 'status'
# 1 = APPROVED, 0 = REJECTED

# income_stability: 0.0 to 1.0. Approved loans should have high stability, rejected loans have lower/variable stability.
df['income_stability'] = np.where(
    df['status'] == 1,
    np.random.normal(loc=0.85, scale=0.1, size=len(df)),
    np.random.normal(loc=0.4, scale=0.25, size=len(df))
)
df['income_stability'] = df['income_stability'].clip(0, 1)

# fraud_flag: Binary. Mostly 0 for approved, higher chance of 1 for rejected.
df['fraud_flag'] = np.where(
    df['status'] == 1,
    np.random.choice([0, 1], p=[0.99, 0.01], size=len(df)),
    np.random.choice([0, 1], p=[0.80, 0.20], size=len(df))
)

# name_mismatch_flag: Binary. Mostly 0 for approved, higher chance of 1 for rejected.
df['name_mismatch_flag'] = np.where(
    df['status'] == 1,
    np.random.choice([0, 1], p=[0.98, 0.02], size=len(df)),
    np.random.choice([0, 1], p=[0.75, 0.25], size=len(df))
)

df.to_csv(csv_path, index=False)
print("Updated historical_loans.csv with new features.")
