import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCircle } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { useRealtimeEvents } from '../hooks/useRealtimeEvents';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const [expandedId, setExpandedId] = useState(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.fetchNotifications();
      setNotifications(data || []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Hook into real-time events to refetch automatically when a notification is broadcasted
  useRealtimeEvents(() => {
    fetchNotifications();
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    // Refresh notifications when opening
    if (!isOpen) {
      fetchNotifications();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-sm flex items-center">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 bg-emerald-100 text-emerald-700 py-0.5 px-2 rounded-full text-[10px] font-black">
                  {unreadCount} NEW
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[350px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm font-medium">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((notification) => {
                  const isExpanded = expandedId === notification.notification_id;
                  return (
                  <div 
                    key={notification.notification_id} 
                    className={`p-4 transition-colors hover:bg-slate-50 flex items-start ${!notification.is_read ? 'bg-emerald-50/30' : ''}`}
                    onClick={() => {
                      if (!notification.is_read) handleMarkAsRead(notification.notification_id);
                      setExpandedId(isExpanded ? null : notification.notification_id);
                    }}
                  >
                    <div className="flex-1 min-w-0 pr-4 cursor-pointer">
                      <p className={`text-sm ${!notification.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {notification.title}
                      </p>
                      <p className={`text-xs text-slate-500 mt-1 ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                        {notification.message.length > 80 && (
                          <span className="text-[10px] font-bold text-emerald-500 hover:text-emerald-700">
                            {isExpanded ? 'Show less' : 'Read more'}
                          </span>
                        )}
                      </div>
                    </div>
                    {!notification.is_read && (
                      <button 
                        onClick={(e) => handleMarkAsRead(notification.notification_id, e)}
                        className="text-emerald-500 hover:text-emerald-700 p-1 rounded-full hover:bg-emerald-100 transition-colors group relative"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-100 text-center bg-slate-50">
              <span className="text-xs font-bold text-slate-400">
                Showing recent notifications
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
