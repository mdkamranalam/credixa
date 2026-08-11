import React, { useState } from 'react';
import { Mail, CheckCircle, Copy, Link as LinkIcon, BookOpen } from 'lucide-react';

const TeacherRecommendationWidget = ({ studentId }) => {
    const [email, setEmail] = useState('');
    const [inviteSent, setInviteSent] = useState(false);
    const [magicLink, setMagicLink] = useState('');
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(magicLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendInvite = (e) => {
        e.preventDefault();
        if (!email) return;

        // Simulate API call to generate magic link
        setTimeout(() => {
            const token = btoa(`${studentId}-${email}-${Date.now()}`).substring(0, 20);
            const link = `${window.location.origin}/teacher-recommendation/${token}`;
            setMagicLink(link);
            setInviteSent(true);
        }, 600);
    };

    return (
        <div className="bg-white rounded-[20px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <BookOpen className="w-32 h-32" />
            </div>
            
            <div className="flex items-center mb-4">
                <div className="bg-indigo-100 p-2 rounded-xl mr-3">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Teacher Recommendation</h3>
            </div>
            
            <p className="text-sm text-slate-500 mb-6">
                Boost your AI OmniScore by requesting a passwordless character reference from your professor.
            </p>

            {!inviteSent ? (
                <form onSubmit={handleSendInvite}>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Teacher's Email</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="email"
                            required
                            placeholder="professor@college.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none bg-slate-50"
                        />
                        <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-5 rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap flex items-center justify-center"
                        >
                            <Mail className="w-4 h-4 mr-2" /> Send Link
                        </button>
                    </div>
                </form>
            ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-in fade-in">
                    <div className="flex items-center mb-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <p className="text-sm font-bold text-green-800">Magic Link Generated!</p>
                    </div>
                    <p className="text-xs text-green-700 mb-3">
                        Your teacher can submit a recommendation without needing an account.
                    </p>
                    <div className="flex items-center bg-white border border-green-200 rounded-lg px-3 py-2">
                        <LinkIcon className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                        <input type="text" readOnly value={magicLink} className="flex-1 text-xs text-slate-600 bg-transparent outline-none w-full truncate" />
                        <button
                            onClick={handleCopy}
                            className="ml-2 flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded"
                        >
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherRecommendationWidget;
