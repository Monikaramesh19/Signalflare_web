import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Shield } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get('/admin/audit-logs');
        setLogs(response.data);
      } catch (err) {
        console.warn('Logs load failed');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Security Audit Log</h1>
        <p className="text-xs text-slate-400 font-medium font-mono">Trace admin transactions, configuration pings, and security records.</p>
      </div>

      <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          Security Operations Logs
        </h2>

        {loading ? (
          <p className="text-xs text-slate-500 font-mono">Querying logs...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 font-mono">
                  <th className="py-2.5">User</th>
                  <th className="py-2.5">Action</th>
                  <th className="py-2.5">Details</th>
                  <th className="py-2.5 text-right font-normal">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((item) => (
                  <tr key={item.id} className="border-b border-slate-900/60 hover:bg-slate-950/20 font-mono text-[11px]">
                    <td className="py-3.5 text-cyan-400 font-bold">{item.user?.name || 'SYSTEM'}</td>
                    <td className="py-3.5 text-white font-bold">{item.action}</td>
                    <td className="py-3.5 text-slate-400">{item.details}</td>
                    <td className="py-3.5 text-right text-slate-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
