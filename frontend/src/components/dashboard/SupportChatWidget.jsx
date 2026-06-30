import React, { useState, useEffect, useRef } from "react";
import { X, MessageCircle, Send, Plus, ChevronLeft } from "lucide-react";
import api from "../../services/api";

const SupportChatWidget = ({ open, onClose, studentProfile }) => {
    const [view, setView] = useState("list"); // 'list', 'chat', 'new'
    const [tickets, setTickets] = useState([]);
    const [activeTicket, setActiveTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [subject, setSubject] = useState("");
    const [category, setCategory] = useState("GENERAL");
    const [loading, setLoading] = useState(false);
    
    const messagesEndRef = useRef(null);

    const fetchTickets = async () => {
        try {
            const res = await api.get("/support/tickets");
            setTickets(res.data);
        } catch (error) {
            console.error("Failed to fetch tickets:", error);
        }
    };

    const fetchMessages = async (ticketId) => {
        try {
            const res = await api.get(`/support/tickets/${ticketId}`);
            setMessages(res.data.messages);
            setActiveTicket(res.data.ticket);
            setView("chat");
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        }
    };

    useEffect(() => {
        if (open) {
            fetchTickets();
            setView("list");
        }
    }, [open]);

    useEffect(() => {
        if (view === "chat") {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, view]);

    // Handle SSE events via custom event from useRealtimeEvents
    useEffect(() => {
        const handleNewMessage = (e) => {
            const { ticket_id, message } = e.detail;
            
            // If we are looking at this specific ticket, append the message
            if (activeTicket && activeTicket.ticket_id === ticket_id) {
                setMessages(prev => [...prev, message]);
            }
            
            // Always refresh ticket list to update unread counts or latest messages
            fetchTickets();
        };

        const handleTicketUpdate = () => {
            fetchTickets();
        };

        window.addEventListener("SUPPORT_MESSAGE", handleNewMessage);
        window.addEventListener("SUPPORT_TICKET_UPDATE", handleTicketUpdate);

        return () => {
            window.removeEventListener("SUPPORT_MESSAGE", handleNewMessage);
            window.removeEventListener("SUPPORT_TICKET_UPDATE", handleTicketUpdate);
        };
    }, [activeTicket]);

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post("/support/tickets", { subject, category, message: newMessage });
            setSubject("");
            setNewMessage("");
            setCategory("GENERAL");
            await fetchTickets();
            fetchMessages(res.data.ticket.ticket_id);
        } catch (error) {
            console.error("Failed to create ticket", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeTicket) return;
        
        try {
            const res = await api.post(`/support/tickets/${activeTicket.ticket_id}/messages`, { message: newMessage });
            setMessages(prev => [...prev, res.data]);
            setNewMessage("");
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden font-sans">
            {/* Header */}
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md z-10">
                <div className="flex items-center">
                    {view !== "list" && (
                        <button onClick={() => { setView("list"); fetchTickets(); }} className="mr-2 hover:bg-slate-800 p-1 rounded-full transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                    <MessageCircle className="w-5 h-5 mr-2 text-indigo-400" />
                    <h3 className="font-bold">Support Center</h3>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* List View */}
            {view === "list" && (
                <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
                    <button 
                        onClick={() => setView("new")}
                        className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 border-dashed rounded-xl p-3 flex items-center justify-center font-bold mb-4 hover:bg-emerald-100 transition-colors"
                    >
                        <Plus className="w-5 h-5 mr-1" /> New Conversation
                    </button>
                    
                    <div className="space-y-3">
                        {tickets.length === 0 ? (
                            <div className="text-center text-slate-400 py-8">
                                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p className="text-sm font-medium">No active support tickets.</p>
                            </div>
                        ) : (
                            tickets.map(ticket => (
                                <div 
                                    key={ticket.ticket_id} 
                                    onClick={() => fetchMessages(ticket.ticket_id)}
                                    className="bg-white p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-slate-800 text-sm truncate pr-2">{ticket.subject}</h4>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                            ticket.status === 'OPEN' ? 'bg-indigo-50 text-indigo-600' :
                                            ticket.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600' :
                                            ticket.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600' :
                                            'bg-slate-100 text-slate-500'
                                        }`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500">{new Date(ticket.updated_at).toLocaleDateString()}</span>
                                        {ticket.unread_count > 0 && (
                                            <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px]">
                                                {ticket.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* New Ticket View */}
            {view === "new" && (
                <form onSubmit={handleCreateTicket} className="flex flex-col flex-1 bg-white p-4">
                    <h4 className="font-bold text-slate-800 mb-4">Start a new conversation</h4>
                    
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                    <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 mb-4 text-sm focus:outline-none focus:border-indigo-500"
                    >
                        <option value="GENERAL">General Inquiry</option>
                        <option value="LOAN">Loan Application</option>
                        <option value="PAYMENT">Repayment/EMI</option>
                        <option value="KYC">KYC/Documents</option>
                    </select>

                    <label className="text-xs font-bold text-slate-500 uppercase mb-1">Subject</label>
                    <input 
                        type="text" 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Brief summary of your issue..."
                        className="w-full border border-slate-200 rounded-lg p-2 mb-4 text-sm focus:outline-none focus:border-indigo-500"
                        required
                    />

                    <label className="text-xs font-bold text-slate-500 uppercase mb-1">Message</label>
                    <textarea 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Describe your issue in detail..."
                        className="w-full border border-slate-200 rounded-lg p-2 flex-1 resize-none text-sm focus:outline-none focus:border-indigo-500 mb-4"
                        required
                    />

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white rounded-lg p-3 font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? "Sending..." : "Send Message"}
                    </button>
                </form>
            )}

            {/* Chat Thread View */}
            {view === "chat" && activeTicket && (
                <div className="flex flex-col flex-1 bg-slate-50">
                    <div className="bg-white border-b border-slate-200 p-3 shadow-sm z-10 flex justify-between items-center">
                        <div className="truncate pr-2">
                            <h4 className="font-bold text-slate-800 text-sm truncate">{activeTicket.subject}</h4>
                            <p className="text-xs text-slate-500">{activeTicket.category}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
                            activeTicket.status === 'OPEN' ? 'bg-indigo-50 text-indigo-600' :
                            activeTicket.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600' :
                            activeTicket.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600' :
                            'bg-slate-100 text-slate-500'
                        }`}>
                            {activeTicket.status}
                        </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.map(msg => {
                            const isMe = msg.sender_role === 'STUDENT';
                            return (
                                <div key={msg.message_id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    {!isMe && <span className="text-[10px] text-slate-400 mb-0.5 ml-1 font-bold">Support Agent</span>}
                                    <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                                        isMe 
                                        ? 'bg-emerald-500 text-white rounded-tr-sm' 
                                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                                    }`}>
                                        {msg.body}
                                    </div>
                                    <span className="text-[9px] text-slate-400 mt-0.5 mx-1">
                                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="bg-white p-3 border-t border-slate-200 flex items-end">
                        <textarea 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                            placeholder={activeTicket.status === 'CLOSED' ? "Ticket is closed" : "Type your message..."}
                            disabled={activeTicket.status === 'CLOSED'}
                            className="flex-1 border border-slate-200 rounded-xl p-2 max-h-24 resize-none text-sm focus:outline-none focus:border-indigo-500 mr-2 bg-slate-50"
                            rows={1}
                        />
                        <button 
                            type="submit" 
                            disabled={activeTicket.status === 'CLOSED' || !newMessage.trim()}
                            className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:bg-slate-300"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default SupportChatWidget;
