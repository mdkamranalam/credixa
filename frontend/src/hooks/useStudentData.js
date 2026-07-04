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
const useStudentData = (externalStepRef) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [activeLoan, setActiveLoan] = useState(null);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Use external step ref if provided by dashboard so polling knows the actual wizard step
  const internalStepRef = useRef(1);
  const stepRef = externalStepRef || internalStepRef;
  const setStepRef = useCallback((v) => { stepRef.current = v; }, [stepRef]);

  // Track dismissed terminal loans (REJECTED/CLOSED) so background polling doesn't interrupt new loan applications
  const dismissedLoanIdRef = useRef(null);
  const dismissLoan = useCallback(() => {
    if (activeLoan) {
      dismissedLoanIdRef.current = activeLoan.loan_id;
    }
    setActiveLoan(null);
  }, [activeLoan]);

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

        // If this loan was explicitly dismissed by the user to start a new application, do not re-set it
        if (myLoan.loan_id !== dismissedLoanIdRef.current) {
          // If a new loan ID appeared (different from dismissed), clear the dismissed ref
          dismissedLoanIdRef.current = null;
          if (stepRef.current === 1) {
            setActiveLoan(newActiveLoan);
          }
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

  return { profile, activeLoan, setActiveLoan, dismissLoan, payments, isLoading, reload: load, setStepRef };
};

export default useStudentData;
