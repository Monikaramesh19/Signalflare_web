import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Bell, Clock, CheckCircle } from 'lucide-react';

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (err) {
      console.warn('Notifications fetch warning');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-2">
          <Bell className="w-8 h-8 text-cyan-400" />
          Alert Center
        </h1>
        <p className="text-xs text-slate-400">Broadcasting notification triggers and evacuation assignments.</p>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500 font-mono">Querying alerts...</div>
      ) : notifications.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-950/40 border border-slate-900 text-center text-xs text-slate-500 font-mono">
          No notifications logged.
        </div>
      ) : (
        <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-lg border flex justify-between items-start gap-4 transition-all ${
                n.isRead
                  ? 'bg-slate-950/20 border-slate-900 text-slate-400'
                  : 'bg-cyan-950/10 border-cyan-500/20 text-slate-200'
              }`}
            >
              <div className="space-y-1">
                <p className="text-xs font-bold text-white">{n.title}</p>
                <p className="text-xs">{n.message}</p>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono pt-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(n.createdAt).toLocaleTimeString()}
                </div>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  className="p-1 rounded bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-600 hover:text-white cursor-pointer"
                  title="Mark read"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
