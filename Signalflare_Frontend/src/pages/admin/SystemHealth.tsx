import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Database, Cpu, Activity, Server } from 'lucide-react';

export const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadTelemetry = async () => {
    try {
      const response = await api.get('/admin/system-health');
      setHealth(response.data);
    } catch (err) {
      console.warn('Telemetry load failed (offline or permissions check warning)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTelemetry();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">System Telemetry & Health</h1>
        <p className="text-xs text-slate-400 font-medium">Verify hardware CPU indices, process queues, and PostgreSQL database connections.</p>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500 font-mono">Querying servers...</div>
      ) : !health ? (
        <div className="p-8 rounded-xl bg-slate-950/40 border border-slate-900 text-center text-xs text-red-500">
          Telemetry dashboard unreachable offline.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* DB Status */}
          <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              Database Engine
            </h2>
            <div className="py-4 text-center">
              <span className="inline-block px-4 py-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black tracking-widest font-mono">
                PostgreSQL: {health.database}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono text-center">Active Connection pool size: 5</p>
          </div>

          {/* CPU details */}
          <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              CPU Node Matrix
            </h2>
            <div className="space-y-2 text-xs font-mono text-slate-300">
              <p>Platform: {health.os?.platform}</p>
              <p>CPUs: {health.os?.cpus} cores</p>
              <p>Load Average: {health.os?.loadAverage?.map((l: number) => l.toFixed(2)).join(', ')}</p>
            </div>
          </div>

          {/* RAM status */}
          <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              Memory Usage
            </h2>
            <div className="py-4 text-center">
              <p className="text-3xl font-black text-white font-mono">{health.os?.memoryUsage}</p>
              <p className="text-[10px] text-slate-500 font-mono mt-1">Free capacity allocation</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
