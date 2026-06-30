import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, CheckCircle, Clock, AlertCircle } from "lucide-react";
import api from "../../services/api";

const SupportTab = () => {
    const [tickets, setTickets] = useState([]);
    const [activeTicket, setActiveTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    
    const messagesEndRef = useRef(null);

    const fetchTickets = async () => {
        try {
            const res = await api.get("/support/admin/tickets");
            setTickets(res.data);
        } catch (error) {
            console.error("Failed to fetch admin tickets:", error);
        }
    };

    const fetchMessages = async (ticketId) => {
        try {
            const res = await api.get(`/support/tickets/${ticketId}`);
            setMessages(res.data.messages);
            setActiveTicket(res.data.ticket);
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Handle SSE events via custom event
    useEffect(() => {
        const handleNewMessage = (e) => {
            const { ticket_id, message } = e.detail;
            
            if (activeTicket && activeTicket.ticket_id === ticket_id) {
                setMessages(prev => [...prev, message]);
            }
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

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeTicket) return;
        
        try {
            const res = await api.post(`/support/tickets/${activeTicket.ticket_id}/messages`, { message: newMessage });
            setMessages(prev => [...prev, res.data]);
            setNewMessage("");
            
            // Optionally auto-change status to IN_PROGRESS if it was OPEN
            if (activeTicket.status === 'OPEN') {
                handleUpdateStatus('IN_PROGRESS');
            }
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const handleUpdateStatus = async (status) => {
        if (!activeTicket) return;
        try {
            const res = await api.put(`/support/tickets/${activeTicket.ticket_id}/status`, { status });
            setActiveTicket(res.data);
            fetchTickets();
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    const filteredTickets = tickets.filter(t => statusFilter === "ALL" || t.status === statusFilter);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex h-[700px]">
            {/* Left Column: Ticket List */}
            <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50">
                <div className="p-4 border-b border-slate-200 bg-white">
                    <h3 className="font-bold text-slate-800 flex items-center mb-3">
                        <MessageCircle className="w-5 h-5 mr-2 text-indigo-500" />
                        Support Tickets
                    </h3>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                    >
                        <option value="ALL">All Tickets</option>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                    </select>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {filteredTickets.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">No tickets found.</div>
                    ) : (
                        filteredTickets.map(ticket => (
                            <div 
                                key={ticket.ticket_id}
                                onClick={() => fetchMessages(ticket.ticket_id)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                    activeTicket?.ticket_id === ticket.ticket_id 
                                    ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                                    : 'bg-white border-slate-200 hover:border-indigo-300'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-slate-800 text-sm truncate pr-2" title={ticket.subject}>
                                        {ticket.subject}
                                    </h4>
                                    {ticket.unread_count > 0 && (
                                        <span className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold text-[9px] flex-shrink-0">
                                            {ticket.unread_count}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-slate-500 flex justify-between items-center">
                                    <span className="truncate pr-2">{ticket.student_name}</span>
                                    <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                                        ticket.status === 'OPEN' ? 'bg-indigo-100 text-indigo-700' :
                                        ticket.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                                        ticket.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
                                        'bg-slate-200 text-slate-600'
                                    }`}>
                                        {ticket.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Column: Chat Thread */}
            <div className="w-2/3 flex flex-col bg-white">
                {activeTicket ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm z-10">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">{activeTicket.subject}</h3>
                                <div className="text-sm text-slate-500 flex items-center mt-1">
                                    <span className="font-medium mr-3 border-r border-slate-300 pr-3">{activeTicket.student_name}</span>
                                    <span className="text-xs uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded mr-3">{activeTicket.category}</span>
                                    <span className="text-xs">Created: {new Date(activeTicket.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
                                <select 
                                    value={activeTicket.status}
                                    onChange={(e) => handleUpdateStatus(e.target.value)}
                                    className="text-sm font-bold border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 bg-slate-50"
                                >
                                    <option value="OPEN">OPEN</option>
                                    <option value="IN_PROGRESS">IN PROGRESS</option>
                                    <option value="RESOLVED">RESOLVED</option>
                                    <option value="CLOSED">CLOSED</option>
                                </select>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
                            {messages.map(msg => {
                                const isMe = msg.sender_role === 'INSTITUTION_ADMIN';
                                return (
                                    <div key={msg.message_id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        {!isMe && <span className="text-xs text-slate-400 mb-1 ml-1 font-bold">{activeTicket.student_name}</span>}
                                        <div className={`max-w-[75%] rounded-2xl p-4 text-sm shadow-sm ${
                                            isMe 
                                            ? 'bg-indigo-600 text-white rounded-tr-sm' 
                                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                                        }`}>
                                            {msg.body}
                                        </div>
                                        <span className="text-[10px] text-slate-400 mt-1 mx-1">
                                            {new Date(msg.created_at).toLocaleString([], {month:'short', day:'numeric', hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-slate-200 bg-white">
                            <form onSubmit={handleSendMessage} className="flex items-end">
                                <textarea 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                    placeholder={activeTicket.status === 'CLOSED' ? "Ticket is closed" : "Type your reply to the student..."}
                                    disabled={activeTicket.status === 'CLOSED'}
                                    className="flex-1 border border-slate-200 rounded-xl p-3 max-h-32 min-h-[50px] resize-none text-sm focus:outline-none focus:border-indigo-500 mr-3 bg-slate-50"
                                    rows={2}
                                />
                                <button 
                                    type="submit" 
                                    disabled={activeTicket.status === 'CLOSED' || !newMessage.trim()}
                                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:bg-slate-300 font-bold flex items-center h-[50px]"
                                >
                                    <Send className="w-5 h-5 mr-2" /> Send
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                        <MessageCircle className="w-16 h-16 mb-4 opacity-20 text-indigo-500" />
                        <h3 className="text-lg font-bold text-slate-500">Select a Ticket</h3>
                        <p className="text-sm">Choose a support ticket from the left to view the conversation.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportTab;
