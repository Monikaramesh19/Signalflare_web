import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Shield, Users, Activity, ShieldAlert, Cpu } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      const resStats = await api.get('/admin/analytics');
      setAnalytics(resStats.data.summary);

      const resLogs = await api.get('/admin/audit-logs');
      setLogs(resLogs.data.slice(0, 5));
    } catch (err) {
      console.warn('Admin dashboard fetch failed (offline or permissions warning)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-white">System Admin Console</h1>
        <p className="text-xs text-slate-400">Configure global parameters, audit logs, and monitor server environments.</p>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500 font-mono">Querying system indexes...</div>
      ) : (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl glass-card text-left flex justify-between items-center">
              <div>
                <span className="text-slate-500 uppercase font-bold text-[9px] block">Users</span>
                <p className="text-2xl font-black text-white font-mono">{analytics?.users || 0}</p>
              </div>
              <Users className="w-8 h-8 text-cyan-500/25" />
            </div>

            <div className="p-5 rounded-xl glass-card text-left flex justify-between items-center">
              <div>
                <span className="text-slate-500 uppercase font-bold text-[9px] block">Volunteers</span>
                <p className="text-2xl font-black text-cyan-400 font-mono">{analytics?.volunteers || 0}</p>
              </div>
              <Activity className="w-8 h-8 text-cyan-500/25" />
            </div>

            <div className="p-5 rounded-xl glass-card text-left flex justify-between items-center">
              <div>
                <span className="text-slate-500 uppercase font-bold text-[9px] block">Distress Signals</span>
                <p className="text-2xl font-black text-red-500 font-mono">{analytics?.totalSOS || 0}</p>
              </div>
              <ShieldAlert className="w-8 h-8 text-red-500/25 animate-pulse" />
            </div>

            <div className="p-5 rounded-xl glass-card text-left flex justify-between items-center">
              <div>
                <span className="text-slate-500 uppercase font-bold text-[9px] block">Operations Cache</span>
                <p className="text-2xl font-black text-white font-mono">OK</p>
              </div>
              <Cpu className="w-8 h-8 text-slate-500/25" />
            </div>
          </div>

          {/* Audit trail preview */}
          <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Latest System Audit Logs
            </h2>

            <div className="space-y-2">
              {logs.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 font-mono">No audit trail packets reported.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-950/40 rounded-lg border border-slate-900 flex justify-between items-center text-xs font-mono">
                    <div className="flex gap-2">
                      <span className="text-cyan-400">[{log.action}]</span>
                      <span className="text-slate-300">{log.details}</span>
                    </div>
                    <span className="text-slate-500 text-[10px]">{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
