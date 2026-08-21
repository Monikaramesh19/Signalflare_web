import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Flame, ClipboardList, MapPin, CheckCircle2, ChevronRight } from 'lucide-react';

export const NearbyTasks: React.FC = () => {
  const navigate = useNavigate();
  const [sosTasks, setSosTasks] = useState<any[]>([]);
  const [resourceTasks, setResourceTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNearbyData = async () => {
    try {
      const resSOS = await api.get('/sos');
      // SOS unassigned
      const unassignedSOS = resSOS.data.filter((r: any) => r.status === 'CREATED' || r.status === 'RECEIVED');
      setSosTasks(unassignedSOS);

      const resRes = await api.get('/requests');
      // Resource requests unassigned
      const unassignedRes = resRes.data.filter((r: any) => r.status === 'PENDING');
      setResourceTasks(unassignedRes);
    } catch (err) {
      console.warn('Could not query nearby tasks (offline mode)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNearbyData();
  }, []);

  const handleAcceptTask = async (id: string, type: 'SOS' | 'RESOURCE') => {
    try {
      await api.post(`/volunteers/tasks/${id}/accept`, { type });
      alert('Task accepted successfully! Track details in your Active dashboard.');
      if (type === 'SOS') {
        navigate('/volunteer/tasks/active');
      } else {
        navigate('/volunteer/delivery');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to accept task.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Nearby Emergency Callouts</h1>
        <p className="text-xs text-slate-400">Accept nearby rescue assignments and supplies logistics requests.</p>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500 font-mono">Loading nearby tasks database...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SOS List */}
          <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-900 pb-2">
              <Flame className="w-5 h-5 text-red-500" />
              Unassigned Distress Beacons ({sosTasks.length})
            </h2>
            {sosTasks.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center font-mono">No active distress beacons found.</p>
            ) : (
              <div className="space-y-3">
                {sosTasks.map((sos) => (
                  <div key={sos.id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-500/10 text-red-400 border border-red-500/25">
                          {sos.severity}
                        </span>
                        <p className="text-xs font-bold text-white">{sos.emergencyType} Evacuation</p>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">{sos.address}</p>
                      <p className="text-xs text-slate-400 italic">"{sos.message || 'No description provided.'}"</p>
                    </div>
                    <button
                      onClick={() => handleAcceptTask(sos.id, 'SOS')}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                    >
                      Accept SOS
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Supply Orders list */}
          <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-900 pb-2">
              <ClipboardList className="w-5 h-5 text-cyan-400" />
              Supply Requests ({resourceTasks.length})
            </h2>
            {resourceTasks.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center font-mono">No pending supply requests found.</p>
            ) : (
              <div className="space-y-3">
                {resourceTasks.map((res) => (
                  <div key={res.id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white">
                        {res.resourceName} (x{res.quantity})
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">{res.address}</p>
                      <p className="text-[10px] text-slate-400">Requestor: {res.victim?.name}</p>
                    </div>
                    <button
                      onClick={() => handleAcceptTask(res.id, 'RESOURCE')}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                    >
                      Deliver
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
