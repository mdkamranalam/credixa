import { hmacData } from "../../utils/encryption.js";

class KYCProvider {
    async verifyAadhaar(aadhaarNumber) {
        throw new Error("Method not implemented.");
    }

    async verifyPAN(panNumber, expectedName) {
        throw new Error("Method not implemented.");
    }

    async verifyBankAccount(accountNumber, ifsc) {
        throw new Error("Method not implemented.");
    }
}

class MockKYCProvider extends KYCProvider {
    async verifyAadhaar(aadhaarNumber) {
        const cleanAadhaar = aadhaarNumber.replace(/[\s-]/g, "");
        if (!/^\d{12}$/.test(cleanAadhaar)) {
            return { verified: false, error: "Invalid Aadhaar format. Must be 12 digits." };
        }
        const hmac = hmacData(cleanAadhaar);
        return {
            verified: true,
            kycId: `kyc_mock_${Date.now()}`,
            aadhaarHmac: hmac,
            provider: "MOCK"
        };
    }

    async verifyPAN(panNumber, expectedName) {
        const cleanPan = panNumber.toUpperCase();
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleanPan)) {
            return { verified: false, error: "Invalid PAN format." };
        }
        return {
            verified: true,
            pan: cleanPan,
            holderName: expectedName || "VERIFIED USER",
            status: "ACTIVE",
            provider: "MOCK"
        };
    }

    async verifyBankAccount(accountNumber, ifsc) {
        if (!accountNumber || accountNumber.length < 8) {
            return { verified: false, error: "Invalid Account Number" };
        }
        return {
            verified: true,
            accountNumber: accountNumber,
            ifsc: ifsc || "SBIN0001234",
            pennyDropStatus: "SUCCESS",
            holderName: "VERIFIED HOLDER",
            provider: "MOCK"
        };
    }
}

class SetuKYCProvider extends KYCProvider {
    constructor() {
        super();
        this.clientId = process.env.SETU_CLIENT_ID;
        this.clientSecret = process.env.SETU_CLIENT_SECRET;
    }

    async verifyAadhaar(aadhaarNumber) {
        console.log("[SetuKYC] Invoking Setu DigiLocker API placeholder");
        return { verified: true, kycId: `setu_${Date.now()}`, aadhaarHmac: hmacData(aadhaarNumber), provider: "SETU" };
    }

    async verifyPAN(panNumber, expectedName) {
        return { verified: true, status: "ACTIVE", provider: "SETU" };
    }

    async verifyBankAccount(accountNumber, ifsc) {
        return { verified: true, pennyDropStatus: "SUCCESS", provider: "SETU" };
    }
}

let _kycInstance = null;

export const getKYCService = () => {
    if (!_kycInstance) {
        const provider = (process.env.KYC_PROVIDER || "mock").toLowerCase();
        if (provider === "setu") {
            _kycInstance = new SetuKYCProvider();
        } else {
            _kycInstance = new MockKYCProvider();
        }
    }
    return _kycInstance;
};
