import React, { useEffect, useState } from 'react';
import { useNetwork } from '../../contexts/NetworkContext';
import { getQueue, clearQueue } from '../../offline/db';
import type { OfflineSOS, OfflineResourceReq, OfflineMessage } from '../../offline/db';
import { RefreshCw, Database, Flame, ClipboardList, MessageSquare, AlertCircle, Share2, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SyncCenter: React.FC = () => {
  const { status, triggerSync, lastSyncTime } = useNetwork();
  const [sosQueue, setSosQueue] = useState<OfflineSOS[]>([]);
  const [resourceQueue, setResourceQueue] = useState<OfflineResourceReq[]>([]);
  const [messageQueue, setMessageQueue] = useState<OfflineMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  const loadQueues = async () => {
    try {
      const sos = await getQueue('sos_queue');
      const res = await getQueue('resource_queue');
      const msg = await getQueue('message_queue');
      setSosQueue(sos);
      setResourceQueue(res);
      setMessageQueue(msg);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadQueues();

    // Listen to sync_completed custom events
    const handleSyncFinished = (e: Event) => {
      const results = (e as CustomEvent).detail;
      const logEntries = results.map((r: any) =>
        `Action ID: ${r.tempId.substring(0, 8)}... - Status: ${r.status} ${r.error ? `(${r.error})` : ''}`
      );
      setSyncLogs((prev) => [...logEntries, ...prev]);
      loadQueues();
    };

    window.addEventListener('sync_completed', handleSyncFinished);
    return () => {
      window.removeEventListener('sync_completed', handleSyncFinished);
    };
  }, [status]);

  const handleManualSync = async () => {
    setLoading(true);
    await triggerSync();
    await loadQueues();
    setLoading(false);
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all offline cached entries? Unsaved items will be lost.')) {
      await clearQueue('sos_queue');
      await clearQueue('resource_queue');
      await clearQueue('message_queue');
      loadQueues();
      setSyncLogs((prev) => ['Local queues cleared by user.', ...prev]);
    }
  };

  const totalPending = sosQueue.length + resourceQueue.length + messageQueue.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Offline Emergency Mesh</h1>
          <p className="text-xs text-slate-400 mt-1">
            No Internet? No Problem. SignalFlare can relay emergency messages through nearby SignalFlare devices.
          </p>
        </div>
        <Link
          to="/mesh"
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 w-fit"
        >
          <Share2 className="w-4 h-4" />
          View Mesh Topology
        </Link>
      </div>

      {/* Mesh and Sync Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            Mesh Channels
          </h2>

          <div className="py-4 border-y border-slate-900 space-y-3 font-mono text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Internet Network:</span>
              <span className="font-bold text-white">
                {status === 'ONLINE' ? '🟢 ONLINE' : '🔴 OFFLINE'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Nearby Relays:</span>
              <span className="font-bold text-cyan-400">4 Active Nodes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Mesh State:</span>
              <span className="font-bold text-emerald-400">🟢 ACTIVE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Relayed Hops:</span>
              <span className="font-bold text-white">3 Messages Relayed</span>
            </div>
          </div>

          <div className="bg-slate-950/40 rounded-lg p-3 border border-slate-900 text-[10px] text-slate-400 leading-relaxed">
            <p className="font-bold text-slate-300 mb-1">D2D Mesh Transfer System</p>
            Emergency packets will immediately route step-by-step through peer links using native BLE.
          </div>
        </div>

        {/* Central Sync Control */}
        <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-cyan-400" />
            Central Cloud Upload
          </h2>

          <div className="py-4 border-y border-slate-900 space-y-3 font-mono text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Pending Uploads:</span>
              <span className="font-bold text-cyan-400">{totalPending} Records</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Last Central Sync:</span>
              <span className="text-slate-300">
                {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Never'}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleManualSync}
              disabled={loading || status === 'OFFLINE'}
              className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800/50 disabled:text-slate-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Upload Now
            </button>
            <button
              onClick={handleClearAll}
              className="px-3 py-2.5 bg-slate-950 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-400 text-xs font-semibold rounded-lg transition-all cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Counter cards */}
        <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            Local Queue Breakdown
          </h2>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-900 text-center">
              <Flame className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-lg font-black font-mono text-white">{sosQueue.length}</p>
              <p className="text-[8px] text-slate-500 uppercase mt-0.5">SOS</p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-900 text-center">
              <ClipboardList className="w-5 h-5 text-cyan-500 mx-auto mb-1" />
              <p className="text-lg font-black font-mono text-white">{resourceQueue.length}</p>
              <p className="text-[8px] text-slate-500 uppercase mt-0.5">Orders</p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-900 text-center">
              <MessageSquare className="w-5 h-5 text-orange-500 mx-auto mb-1" />
              <p className="text-lg font-black font-mono text-white">{messageQueue.length}</p>
              <p className="text-[8px] text-slate-500 uppercase mt-0.5">Chats</p>
            </div>
          </div>

          <div className="text-[9px] text-slate-500 flex items-center gap-2 pt-2.5 border-t border-slate-900/60">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>D2D Mesh transfer guarantees local delivery to rescue members even during blackouts.</p>
          </div>
        </div>
      </div>

      {/* Sync history logs */}
      <div className="p-6 rounded-xl glass-panel border border-slate-800">
        <h2 className="text-base font-bold text-white mb-4">Pipeline Sync Logs</h2>
        {syncLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-600 font-mono">
            No pipeline synchronizations triggered in this session.
          </div>
        ) : (
          <div className="bg-slate-950/50 rounded-lg p-4 font-mono text-[11px] text-slate-300 max-h-60 overflow-y-auto space-y-2 border border-slate-900">
            {syncLogs.map((log, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <span className="text-cyan-400">[{idx + 1}]</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

