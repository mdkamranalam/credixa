import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, X, FileText } from 'lucide-react';
import api from '../services/api';

const DocumentUpload = ({ loanId, ownerType, category, docType, title, description, onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle', 'uploading', 'success', 'error'
    const [errorMsg, setErrorMsg] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setUploadStatus('idle');
            setErrorMsg('');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setUploadStatus('uploading');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('owner_type', ownerType);
        formData.append('category', category);
        formData.append('doc_type', docType);

        try {
            const uploadUrl = loanId
                ? `/loans/${loanId}/documents`
                : '/users/documents';

            const response = await api.post(uploadUrl, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setUploadStatus('success');
            if (onUploadSuccess) {
                onUploadSuccess(response.data.document);
            }
        } catch (err) {
            console.error("Upload error", err);
            setUploadStatus('error');
            setErrorMsg(err.response?.data?.error || 'Failed to upload document.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm transition-all hover:border-emerald-300">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="font-bold text-gray-800 text-sm">{title}</h4>
                    {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
                </div>

                {uploadStatus === 'success' && (
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" /> Uploaded
                    </span>
                )}
            </div>

            {uploadStatus !== 'success' && (
                <div className="mt-2">
                    {!file ? (
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-6 h-6 mb-2 text-gray-400" />
                                <p className="text-xs text-gray-500"><span className="font-bold">Click to upload</span> or drag and drop</p>
                                <p className="text-[10px] text-gray-400 mt-1">PDF, JPG or PNG (MAX. 10MB)</p>
                            </div>
                            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
                        </label>
                    ) : (
                        <div className="flex items-center justify-between p-3 bg-[#F0FDF4] border border-[#A7F3D0] rounded-lg">
                            <div className="flex items-center">
                                <FileText className="w-5 h-5 text-emerald-500 mr-2" />
                                <span className="text-sm font-medium text-gray-700 truncate max-w-[150px] sm:max-w-[200px]">
                                    {file.name}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setFile(null)}
                                    className="p-1 hover:bg-[#D1FAE5] rounded-full text-gray-500"
                                    disabled={isUploading}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className="bg-emerald-500 hover:bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded shadow-sm disabled:opacity-50"
                                >
                                    {isUploading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </div>
                    )}

                    {uploadStatus === 'error' && (
                        <div className="flex items-center mt-2 text-red-500 text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" /> {errorMsg}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DocumentUpload;
