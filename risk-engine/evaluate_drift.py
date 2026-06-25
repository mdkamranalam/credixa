import os
import json
import logging
import pandas as pd
import numpy as np

HISTORICAL_DATA_PATH = os.path.join(os.path.dirname(__file__), "historical_loans.csv")

def calculate_psi(expected: pd.Series, actual: pd.Series, buckets: int = 10) -> float:
    """
    Calculates Population Stability Index (PSI) to detect distribution drift.
    PSI < 0.1: Insignificant drift
    0.1 <= PSI < 0.25: Moderate drift
    PSI >= 0.25: Significant drift (Model retraining required)
    """
    try:
        # Define quantiles based on baseline (expected)
        quantiles = np.linspace(0, 1, buckets + 1)
        bins = np.quantile(expected.dropna(), quantiles)
        bins[0] = -np.inf
        bins[-1] = np.inf
        bins = np.unique(bins)

        expected_counts, _ = np.histogram(expected.dropna(), bins=bins)
        actual_counts, _ = np.histogram(actual.dropna(), bins=bins)

        expected_percents = np.where(expected_counts == 0, 0.0001, expected_counts / len(expected))
        actual_percents = np.where(actual_counts == 0, 0.0001, actual_counts / len(actual))

        psi = np.sum((actual_percents - expected_percents) * np.log(actual_percents / expected_percents))
        return float(psi)
    except Exception as e:
        logging.warning(f"Error calculating PSI: {e}")
        return 0.0


def evaluate_dataset_drift(current_df: pd.DataFrame) -> dict:
    """
    Compares recent inference batch against historical training baseline.
    """
    if not os.path.exists(HISTORICAL_DATA_PATH):
        return {"status": "ERROR", "message": "Baseline historical_loans.csv not found."}

    baseline_df = pd.read_csv(HISTORICAL_DATA_PATH)
    features_to_check = ["avg_balance", "dti_ratio", "academic_score", "savings_rate"]

    drift_report = {}
    overall_drift_flag = False

    for feat in features_to_check:
        if feat in baseline_df.columns and feat in current_df.columns:
            psi_val = calculate_psi(baseline_df[feat], current_df[feat])
            status = "STABLE"
            if psi_val >= 0.25:
                status = "CRITICAL_DRIFT"
                overall_drift_flag = True
            elif psi_val >= 0.1:
                status = "MODERATE_DRIFT"

            drift_report[feat] = {
                "psi": round(psi_val, 4),
                "status": status,
                "baseline_mean": float(baseline_df[feat].mean()),
                "current_mean": float(current_df[feat].mean())
            }

    return {
        "overall_status": "RETRAINING_RECOMMENDED" if overall_drift_flag else "HEALTHY",
        "feature_drift": drift_report
    }

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    if os.path.exists(HISTORICAL_DATA_PATH):
        # For simulation, sample historical data with some noise
        sample_df = pd.read_csv(HISTORICAL_DATA_PATH).sample(n=min(100, len(pd.read_csv(HISTORICAL_DATA_PATH))))
        print(json.dumps(evaluate_dataset_drift(sample_df), indent=2))
