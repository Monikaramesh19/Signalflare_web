import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Flame, MapPin, User, Phone, CheckCircle, Navigation, Radio } from 'lucide-react';

export const ActiveTask: React.FC = () => {
  const navigate = useNavigate();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadActiveTask = async () => {
    try {
      const response = await api.get('/volunteers/tasks');
      // Take first active SOS
      if (response.data.sos && response.data.sos.length > 0) {
        setTask(response.data.sos[0]);
      }
    } catch (err) {
      console.warn('Active task query failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveTask();
  }, []);

  const handleUpdateStatus = async (status: string) => {
    if (!task) return;
    setUpdating(true);
    try {
      await api.put(`/sos/${task.id}`, { status });
      alert(`Status updated to: ${status}`);
      if (status === 'RESOLVED' || status === 'CANCELLED') {
        setTask(null);
        navigate('/volunteer/dashboard');
      } else {
        loadActiveTask();
      }
    } catch (err) {
      alert('Failed to update task status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-xs text-slate-500 font-mono">Querying active task details...</div>;
  }

  if (!task) {
    return (
      <div className="max-w-xl mx-auto p-12 rounded-xl bg-slate-950/40 border border-slate-900 text-center space-y-4">
        <h2 className="text-lg font-bold text-white">No Active Rescue Task</h2>
        <p className="text-xs text-slate-400">Accept an active evacuation distress beacon to begin route tracking.</p>
        <button
          onClick={() => navigate('/volunteer/tasks/nearby')}
          className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
        >
          View Nearby distress signals
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-2">
          <Flame className="w-8 h-8 text-red-500 animate-pulse" />
          Active Evacuation
        </h1>
        <p className="text-xs text-slate-400">Search and rescue routing dashboard.</p>
      </div>

      <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-6">
        <div className="flex justify-between items-start bg-slate-950/40 p-4 rounded-xl border border-slate-900">
          <div>
            <h2 className="text-base font-bold text-white">{task.emergencyType} Evacuation</h2>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {task.id}</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-widest font-mono">
            {task.status}
          </span>
        </div>

        {/* Victim contact details */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Victim Profile</h3>
          <div className="p-4 rounded-xl bg-slate-950/20 border border-slate-900 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <User className="w-4 h-4 text-cyan-400" />
              <span>{task.victim?.name || 'Injured Victim'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Phone className="w-4 h-4 text-cyan-400" />
              <span>{task.contactPhone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span className="font-mono">{task.locationLat.toFixed(5)}, {task.locationLng.toFixed(5)}</span>
            </div>
            <p className="text-slate-400 italic mt-2 border-t border-slate-900 pt-2">"{task.message}"</p>
          </div>
        </div>

        {/* Operations Dispatch Controls */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Update Status Timeline</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleUpdateStatus('RESPONDER_ON_WAY')}
              disabled={updating}
              className="py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 cursor-pointer"
            >
              On Way
            </button>
            <button
              onClick={() => handleUpdateStatus('RESCUE_IN_PROGRESS')}
              disabled={updating}
              className="py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 cursor-pointer"
            >
              In Progress
            </button>
            <button
              onClick={() => handleUpdateStatus('RESOLVED')}
              disabled={updating}
              className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold cursor-pointer"
            >
              Evacuated / Done
            </button>
            <button
              onClick={() => handleUpdateStatus('CANCELLED')}
              disabled={updating}
              className="py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-bold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
