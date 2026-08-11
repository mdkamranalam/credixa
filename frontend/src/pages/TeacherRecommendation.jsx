import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, BookOpen, Send, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const TeacherRecommendation = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [recommendation, setRecommendation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!recommendation.trim()) return;
        setIsSubmitting(true);
        
        // Simulate API call to save recommendation using the magic token
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSubmitted(true);
            toast.success("Recommendation securely submitted!");
        }, 1200);
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Thank You!</h2>
                    <p className="text-slate-600 mb-8">
                        Your recommendation has been securely attached to the student's profile. This greatly assists our AI in evaluating their application.
                    </p>
                    <button 
                        onClick={() => navigate('/')}
                        className="bg-slate-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-slate-800 transition-colors w-full"
                    >
                        Return to Homepage
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-indigo-900 px-6 py-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none transform translate-x-4 -translate-y-4">
                        <BookOpen className="w-48 h-48" />
                    </div>
                    <img src="/credixa-favicon.png" alt="Credixa" className="w-12 h-12 mx-auto mb-4 bg-white p-1 rounded-xl shadow-lg relative z-10" />
                    <h1 className="text-2xl font-black text-white relative z-10">Student Recommendation</h1>
                    <p className="text-indigo-200 mt-2 text-sm relative z-10">Secure Passwordless Portal</p>
                </div>
                
                <div className="p-6 sm:p-10">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-xl flex items-start">
                        <ShieldCheck className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-blue-900 font-bold mb-1">Authenticated via Magic Link</p>
                            <p className="text-xs text-blue-800">
                                You do not need an account or password to submit this reference. The unique secure token in your URL authenticates this session.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Character & Academic Reference
                            </label>
                            <p className="text-xs text-slate-500 mb-4">
                                Please provide a brief recommendation focusing on the student's academic intent, discipline, and potential. Your input directly influences their AI OmniScore for zero-interest financial aid.
                            </p>
                            <textarea
                                required
                                value={recommendation}
                                onChange={(e) => setRecommendation(e.target.value)}
                                rows="6"
                                className="w-full border border-slate-200 p-4 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 resize-none shadow-inner bg-slate-50"
                                placeholder="E.g., I have known this student for 2 years. They demonstrate exceptional dedication to their studies and have always been reliable..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !recommendation.trim()}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center"
                        >
                            {isSubmitting ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                            ) : (
                                <Send className="w-5 h-5 mr-2" />
                            )}
                            {isSubmitting ? 'Securing Submission...' : 'Submit Recommendation securely'}
                        </button>
                    </form>
                </div>
            </div>
            
            <p className="text-xs text-slate-400 font-medium mt-8 text-center max-w-sm">
                Powered by Credixa AI Risk Engine. Your submission is encrypted and directly influences the student's financial aid eligibility.
            </p>
        </div>
    );
};

export default TeacherRecommendation;
