import React, { useState } from 'react';
import { X, Save, Edit3, CheckCircle } from 'lucide-react';
import api from '../services/api';

const OCRCorrectionModal = ({ document, onClose, onSave }) => {
    // Determine the details to edit
    const initialDetails = typeof document.structured_details === 'string' 
        ? JSON.parse(document.structured_details) 
        : (document.structured_details || {});
        
    const [details, setDetails] = useState(initialDetails);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (key, value) => {
        setDetails(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        try {
            const response = await api.put(`/users/documents/${document.doc_id}`, {
                structured_details: details
            });
            onSave(response.data.document);
        } catch (err) {
            console.error("Failed to update document details", err);
            setError(err.response?.data?.error || "Failed to update extracted details.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center text-slate-800">
                        <Edit3 className="w-5 h-5 mr-2 text-indigo-500" />
                        <h3 className="font-bold text-lg">Verify Extracted Data</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="bg-indigo-50 text-indigo-800 text-sm p-3 rounded-lg border border-indigo-100 mb-6 flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-indigo-500" />
                        <p>Our AI extracted the following details from your document. Please verify and correct any inaccuracies before saving.</p>
                    </div>

                    {error && (
                        <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    {Object.keys(details).length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-4">No structured data extracted.</p>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(details).map(([key, value]) => (
                                <div key={key}>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                                        {key}
                                    </label>
                                    <input
                                        type="text"
                                        value={value || ''}
                                        onChange={(e) => handleChange(key, e.target.value)}
                                        className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-900 transition-all shadow-sm"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
                    <button 
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving || Object.keys(details).length === 0}
                        className="flex items-center px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isSaving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Confirm & Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OCRCorrectionModal;
