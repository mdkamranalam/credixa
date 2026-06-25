import { useEffect } from "react";
import toast from "react-hot-toast";
import api from "../services/api";

export const useRealtimeEvents = (onDataChange) => {
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const url = `${api.defaults.baseURL}/sse/events?token=${token}`;
        const eventSource = new EventSource(url);

        eventSource.addEventListener("CONNECTED", (e) => {
            console.log("Real-time SSE stream connected:", e.data);
        });

        eventSource.addEventListener("NOTIFICATION", (e) => {
            try {
                const payload = JSON.parse(e.data);
                if (payload && payload.data) {
                    toast(payload.data.title + ": " + payload.data.message, {
                        icon: "🔔",
                        duration: 5000
                    });
                    if (onDataChange) onDataChange();
                }
            } catch (err) {
                console.error("SSE Parse Error:", err);
            }
        });

        eventSource.addEventListener("LOAN_STATUS_UPDATE", (e) => {
            console.log("Loan status update received via real-time stream");
            if (onDataChange) onDataChange();
        });

        eventSource.onerror = (err) => {
            // EventSource auto-reconnects natively
        };

        return () => {
            eventSource.close();
        };
    }, [onDataChange]);
};
