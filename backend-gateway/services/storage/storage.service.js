import fs from "fs";
import path from "path";

class StorageProvider {
    async uploadFile(fileBuffer, filename, mimetype) {
        throw new Error("Method not implemented.");
    }

    async getFileUrl(filename) {
        throw new Error("Method not implemented.");
    }
}

class LocalVaultProvider extends StorageProvider {
    constructor() {
        super();
        this.baseDir = path.join(process.cwd(), "uploads", "loan_docs");
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }
    }

    async uploadFile(fileBuffer, filename, mimetype) {
        const filePath = path.join(this.baseDir, filename);
        await fs.promises.writeFile(filePath, fileBuffer);
        return `/uploads/loan_docs/${filename}`;
    }

    async getFileUrl(filename) {
        return `/uploads/loan_docs/${filename}`;
    }
}

class S3VaultProvider extends StorageProvider {
    constructor() {
        super();
        this.bucketName = process.env.AWS_S3_BUCKET || "credixa-document-vault";
        // Stub for @aws-sdk/client-s3 integration
    }

    async uploadFile(fileBuffer, filename, mimetype) {
        console.log(`[S3VaultProvider] Simulating S3 upload for ${filename} to s3://${this.bucketName}`);
        return `https://${this.bucketName}.s3.amazonaws.com/loan_docs/${filename}`;
    }

    async getFileUrl(filename) {
        // Simulates pre-signed URL generation
        return `https://${this.bucketName}.s3.amazonaws.com/loan_docs/${filename}?X-Amz-Expires=900`;
    }
}

let _storageInstance = null;

export const getStorageService = () => {
    if (!_storageInstance) {
        const provider = (process.env.STORAGE_PROVIDER || "local").toLowerCase();
        if (provider === "s3") {
            _storageInstance = new S3VaultProvider();
        } else {
            _storageInstance = new LocalVaultProvider();
        }
    }
    return _storageInstance;
};
