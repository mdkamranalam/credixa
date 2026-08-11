import React, { useState } from 'react';
import React, { useState } from 'react';
import { User, AlertCircle, Mail, Link as LinkIcon, CheckCircle, Copy } from 'lucide-react';
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
    
    // Invite State
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteSent, setInviteSent] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [linkCopied, setLinkCopied] = useState(false);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    const handleSendInvite = (e) => {
        e.preventDefault();
        if (!inviteEmail) return;
        setIsSubmitting(true);
        
        // Simulate API call to send invite
        setTimeout(() => {
            const link = `https://credixa.in/guarantor-invite/${loanId || 'user'}-${Math.random().toString(36).substring(2, 10)}`;
            setInviteLink(link);
            setInviteSent(true);
            setIsSubmitting(false);
        }, 800);
    };

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

            {/* Invite Section */}
            <div className="mb-8 p-5 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-indigo-500" /> Send Secure Invite
                </h4>
                <p className="text-sm text-slate-500 mb-4">
                    Don't have their PAN/Aadhaar handy? Invite your parent/guardian to securely fill out their details on their own device.
                </p>
                
                {!inviteSent ? (
                    <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="email"
                            placeholder="parent@email.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="flex-1 border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                            required
                        />
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg active:scale-[0.98] transition-all disabled:opacity-50 whitespace-nowrap"
                        >
                            {isSubmitting ? 'Sending...' : 'Send Invite'}
                        </button>
                    </form>
                ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in fade-in">
                        <div className="flex items-center mb-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                            <p className="text-sm font-bold text-green-800">Invite Sent to {inviteEmail}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 items-center">
                            <button
                                type="button"
                                onClick={handleSendInvite}
                                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors whitespace-nowrap"
                            >
                                Resend Email
                            </button>
                            <span className="hidden sm:inline text-slate-300">|</span>
                            <div className="flex-1 flex items-center bg-white border rounded-lg px-3 py-2 w-full">
                                <LinkIcon className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                                <input type="text" readOnly value={inviteLink} className="flex-1 text-xs text-slate-600 bg-transparent outline-none w-full" />
                                <button
                                    type="button"
                                    onClick={handleCopyLink}
                                    className="ml-2 flex items-center text-xs font-bold text-slate-600 hover:text-indigo-600"
                                >
                                    {linkCopied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    <span className="ml-1">{linkCopied ? 'Copied' : 'Copy'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase">Or enter manually</span>
                <div className="flex-grow border-t border-slate-200"></div>
            </div>

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
                    className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {isSubmitting ? 'Saving...' : 'Save Co-Applicant Details'}
                </button>
            </form>
        </div>
    );
};

export default CoApplicantForm;
