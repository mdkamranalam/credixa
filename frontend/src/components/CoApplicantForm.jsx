import React, { useState } from 'react';
import { User, AlertCircle } from 'lucide-react';
import api from '../services/api';

const CoApplicantForm = ({ loanId, onSuccess }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        relationship: 'FATHER',
        aadhaar_number: '',
        pan_number: '',
        income_type: 'SALARIED',
        monthly_income: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsSubmitting(true);
        setErrorMsg('');

        try {
            const endpoint = loanId
                ? `/loans/${loanId}/co-applicant`
                : '/users/co-applicant';
            const response = await api.post(endpoint, formData);
            if (onSuccess) {
                onSuccess(response.data.co_applicant);
            }
        } catch (error) {
            setErrorMsg(error.response?.data?.error || "Failed to save co-applicant details. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white border rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-6">
                <div className="bg-emerald-100 p-2 rounded-lg mr-3">
                    <User className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Add Co-Applicant Profile</h3>
            </div>

            {errorMsg && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r">
                    <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <p className="ml-3 text-sm text-red-700">{errorMsg}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            required
                            className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            placeholder="As per PAN card"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Relationship</label>
                        <select
                            name="relationship"
                            value={formData.relationship}
                            onChange={handleChange}
                            className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                        >
                            <option value="FATHER">Father</option>
                            <option value="MOTHER">Mother</option>
                            <option value="SPOUSE">Spouse</option>
                            <option value="GUARDIAN">Guardian</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Aadhaar Number</label>
                        <input
                            type="text"
                            name="aadhaar_number"
                            value={formData.aadhaar_number}
                            onChange={handleChange}
                            required
                            pattern="[0-9]{12}"
                            maxLength="12"
                            className="w-full border p-2.5 rounded-lg"
                            placeholder="12 digit Aadhaar"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">PAN Number</label>
                        <input
                            type="text"
                            name="pan_number"
                            value={formData.pan_number}
                            onChange={handleChange}
                            required
                            maxLength="10"
                            className="w-full border p-2.5 rounded-lg uppercase"
                            placeholder="ABCDE1234F"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Income Type</label>
                        <select
                            name="income_type"
                            value={formData.income_type}
                            onChange={handleChange}
                            className="w-full border p-2.5 rounded-lg bg-white"
                        >
                            <option value="SALARIED">Salaried</option>
                            <option value="SELF_EMPLOYED">Self Employed / Business</option>
                            <option value="PENSIONER">Pensioner</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monthly Income (₹)</label>
                        <input
                            type="number"
                            name="monthly_income"
                            value={formData.monthly_income}
                            onChange={handleChange}
                            required
                            min="0"
                            className="w-full border p-2.5 rounded-lg"
                            placeholder="e.g. 50000"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? 'Saving...' : 'Save Co-Applicant Details'}
                </button>
            </form>
        </div>
    );
};

export default CoApplicantForm;
