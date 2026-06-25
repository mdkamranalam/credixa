import crypto from "crypto";

class PaymentProvider {
    async disburseLoan(loanId, amount, borrowerAccount) {
        throw new Error("Method not implemented.");
    }

    async createRepaymentOrder(loanId, scheduleId, amount) {
        throw new Error("Method not implemented.");
    }

    verifyWebhookSignature(payload, signature, secret) {
        throw new Error("Method not implemented.");
    }
}

class MockPaymentProvider extends PaymentProvider {
    async disburseLoan(loanId, amount, borrowerAccount) {
        console.log(`[MockPayment] Disbursing INR ${amount} for loan ${loanId} to account ${borrowerAccount || 'DEFAULT'}`);
        return {
            success: true,
            transactionId: `mock_disb_${Date.now()}`,
            disbursedAt: new Date().toISOString(),
            provider: "MOCK"
        };
    }

    async createRepaymentOrder(loanId, scheduleId, amount) {
        const orderId = `order_mock_${scheduleId}_${Date.now()}`;
        return {
            success: true,
            orderId: orderId,
            amount: amount,
            currency: "INR",
            paymentUrl: `http://localhost:5173/payment-simulation?orderId=${orderId}&amount=${amount}`,
            provider: "MOCK"
        };
    }

    verifyWebhookSignature(payload, signature, secret) {
        // For mock testing, accept any signature starting with 'mock_sig_' or verify test secret
        if (signature && signature.startsWith("mock_sig_")) return true;
        const expectedSig = crypto.createHmac("sha256", secret || "default_mock_secret").update(payload).digest("hex");
        return signature === expectedSig;
    }
}

class StripePaymentProvider extends PaymentProvider {
    constructor() {
        super();
        this.apiKey = process.env.STRIPE_API_KEY;
    }

    async disburseLoan(loanId, amount, borrowerAccount) {
        console.log(`[StripePayment] Stripe payouts API call placeholder for INR ${amount}`);
        return { success: true, transactionId: `po_stripe_${Date.now()}`, provider: "STRIPE" };
    }

    async createRepaymentOrder(loanId, scheduleId, amount) {
        return { success: true, orderId: `pi_stripe_${Date.now()}`, provider: "STRIPE" };
    }

    verifyWebhookSignature(payload, signature, secret) {
        return true;
    }
}

let _paymentInstance = null;

export const getPaymentService = () => {
    if (!_paymentInstance) {
        const provider = (process.env.PAYMENT_PROVIDER || "mock").toLowerCase();
        if (provider === "stripe") {
            _paymentInstance = new StripePaymentProvider();
        } else {
            _paymentInstance = new MockPaymentProvider();
        }
    }
    return _paymentInstance;
};
