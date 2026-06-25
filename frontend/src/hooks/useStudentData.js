import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useRealtimeEvents } from "./useRealtimeEvents";

/**
 * useStudentData — owns all remote data for the Student Dashboard.
 * Polls every 15 seconds when the tab is visible.
 *
 * Returns: { profile, activeLoan, payments, isLoading, reload }
 */
const useStudentData = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [activeLoan, setActiveLoan] = useState(null);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // We use a ref so the polling callback always reads the latest step
  // without needing it as a dependency.
  const stepRef = useRef(1);
  const setStepRef = useCallback((v) => { stepRef.current = v; }, []);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const [profileRes, historyRes, myLoanRes] = await Promise.all([
        api.get("/users/profile"),
        api.get("/loans/repayments"),
        api.get("/loans/my-loan").catch(() => ({ data: null })),
      ]);

      setProfile(profileRes.data);
      setPayments(historyRes.data || []);

      // Redirect to onboarding if profile is incomplete
      if (profileRes.data) {
        if (
          profileRes.data.kyc_status === "PENDING" ||
          !profileRes.data.co_applicant
        ) {
          navigate("/onboarding");
          return;
        }
      }

      const myLoan = myLoanRes.data;
      if (myLoan) {
        let nextPaymentData = null;
        if (["APPROVED", "ACTIVE", "CLOSED"].includes(myLoan.status)) {
          const nextRes = await api
            .get("/loans/next-payment")
            .catch(() => ({ data: null }));
          if (nextRes.data && !nextRes.data.message) {
            nextPaymentData = nextRes.data;
          }
        }

        const newActiveLoan = {
          ...myLoan,
          ...(nextPaymentData || {}),
          status: myLoan.status,
          approved_amount:
            parseFloat(myLoan.approved_amount) ||
            parseFloat(myLoan.requested_amount) ||
            0,
          interest_rate: parseFloat(myLoan.interest_rate) || 12.5,
          tenure_months:
            nextPaymentData?.total_months || myLoan.tenure_months || 12,
          loan_id: myLoan.loan_id,
        };

        // Only update loan state when the user is not mid-application (step 1)
        if (stepRef.current === 1) {
          setActiveLoan(newActiveLoan);
        }
      } else {
        if (stepRef.current === 1) {
          setActiveLoan(null);
        }
      }
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useRealtimeEvents(load);

  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 60000); // 60s fallback backstop
    return () => clearInterval(id);
  }, [load]);

  return { profile, activeLoan, setActiveLoan, payments, isLoading, reload: load, setStepRef };
};

export default useStudentData;
