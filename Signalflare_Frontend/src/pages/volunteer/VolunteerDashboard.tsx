import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Grid, CheckCircle, Clock, MapPin, ShieldAlert, Award, ToggleLeft, ToggleRight } from 'lucide-react';

export const VolunteerDashboard: React.FC = () => {
  const { user, updateCachedUser } = useAuth();
  const navigate = useNavigate();

  const [activeSOS, setActiveSOS] = useState<any[]>([]);
  const [activeRes, setActiveRes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(user?.volunteer?.status === 'AVAILABLE');

  const loadTasks = async () => {
    try {
      const response = await api.get('/volunteers/tasks');
      setActiveSOS(response.data.sos || []);
      setActiveRes(response.data.resources || []);
    } catch (err) {
      console.warn('Offline mode or volunteer task loading failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const toggleAvailability = async () => {
    try {
      const nextStatus = isAvailable ? 'BUSY' : 'AVAILABLE';
      const response = await api.put('/volunteers/profile', { status: nextStatus });
      setIsAvailable(!isAvailable);
      
      // Update cached session
      if (user) {
        updateCachedUser({
          ...user,
          volunteer: {
            id: user.volunteer?.id || '',
            skills: user.volunteer?.skills || '',
            status: nextStatus,
          },
        });
      }
    } catch (err) {
      alert('Failed to update status on server.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950/40 p-6 rounded-xl border border-slate-900">
        <div>
          <h1 className="text-3xl font-black text-white">Volunteer Dashboard</h1>
          <p className="text-xs text-slate-400">Manage dispatch calls, coordinate distribution runs, and log availability vectors.</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-300">Operational Mode:</span>
          <button
            onClick={toggleAvailability}
            className="flex items-center text-slate-400 hover:text-white cursor-pointer"
          >
            {isAvailable ? (
              <span className="flex items-center gap-2 text-emerald-400 text-xs font-bold font-mono">
                AVAILABLE FOR DUTY
                <ToggleRight className="w-12 h-8" />
              </span>
            ) : (
              <span className="flex items-center gap-2 text-amber-500 text-xs font-bold font-mono">
                STANDBY / BUSY
                <ToggleLeft className="w-12 h-8" />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Volunteer Achievements / Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl glass-card text-left flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">Assigned SOS Actions</span>
            <p className="text-3xl font-black text-white font-mono">{activeSOS.length}</p>
          </div>
          <ShieldAlert className="w-10 h-10 text-red-500/25" />
        </div>

        <div className="p-5 rounded-xl glass-card text-left flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">Active Deliveries</span>
            <p className="text-3xl font-black text-white font-mono">{activeRes.length}</p>
          </div>
          <Clock className="w-10 h-10 text-cyan-500/25" />
        </div>

        <div className="p-5 rounded-xl glass-card text-left flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">Credibility Points</span>
            <p className="text-3xl font-black text-white font-mono">820</p>
          </div>
          <Award className="w-10 h-10 text-amber-500/25 animate-pulse" />
        </div>
      </div>

      {/* Active Work list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Evacuation details */}
        <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              🚨 Active SOS Evacuations
            </h2>
            <Link to="/volunteer/tasks/nearby" className="text-xs text-cyan-400 hover:underline">
              Accept tasks
            </Link>
          </div>

          {loading ? (
            <p className="text-xs text-slate-500 font-mono">Querying tasks...</p>
          ) : activeSOS.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center font-mono">No active rescue tasks assigned.</p>
          ) : (
            <div className="space-y-3">
              {activeSOS.map((sos) => (
                <div
                  key={sos.id}
                  onClick={() => navigate(`/volunteer/tasks/active`)}
                  className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 hover:border-slate-800 transition-all cursor-pointer flex justify-between items-center"
                >
                  <div>
                    <p className="text-xs font-bold text-white">{sos.emergencyType} rescue</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">Victim: {sos.victim?.name}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                    {sos.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deliveries list */}
        <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              📦 Supply Deliveries
            </h2>
            <Link to="/volunteer/tasks/nearby" className="text-xs text-cyan-400 hover:underline">
              Query board
            </Link>
          </div>

          {loading ? (
            <p className="text-xs text-slate-500 font-mono">Querying deliveries...</p>
          ) : activeRes.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center font-mono">No active deliveries assigned.</p>
          ) : (
            <div className="space-y-3">
              {activeRes.map((res) => (
                <div
                  key={res.id}
                  onClick={() => navigate(`/volunteer/delivery`)}
                  className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 hover:border-slate-800 transition-all cursor-pointer flex justify-between items-center"
                >
                  <div>
                    <p className="text-xs font-bold text-white">{res.resourceName} (x{res.quantity})</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">To: {res.victim?.name}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {res.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
