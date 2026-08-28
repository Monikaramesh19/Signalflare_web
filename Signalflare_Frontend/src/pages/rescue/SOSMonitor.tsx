import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Flame, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import { VoiceSOSCard } from '../../components/VoiceSOSCard';

export const SOSMonitor: React.FC = () => {
  const navigate = useNavigate();
  const [sosList, setSosList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');

  const loadSOS = async () => {
    try {
      const response = await api.get('/sos');
      setSosList(response.data);
    } catch (err) {
      console.warn('Distress logs query failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSOS();
  }, []);

  const filteredList = sosList.filter((s) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'PENDING') return s.status === 'CREATED' || s.status === 'RECEIVED';
    if (filterType === 'ACTIVE') return s.status === 'ASSIGNED' || s.status === 'RESPONDER_ON_WAY' || s.status === 'RESCUE_IN_PROGRESS';
    if (filterType === 'RESOLVED') return s.status === 'RESOLVED';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white">Distress SOS Monitor</h1>
          <p className="text-xs text-slate-400">Review incoming signals, evaluate severities, and assign responders.</p>
        </div>
        <button
          onClick={loadSOS}
          className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['ALL', 'PENDING', 'ACTIVE', 'RESOLVED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterType(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
              filterType === tab
                ? 'bg-red-600 text-white border-red-500 shadow-md'
                : 'bg-slate-950/60 text-slate-400 border-slate-900 hover:text-white'
            }`}
          >
            {tab} SOS
          </button>
        ))}
      </div>

      {/* Grid view */}
      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500 font-mono">Querying logs...</div>
      ) : filteredList.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-950/40 border border-slate-900 text-center text-xs text-slate-500 font-mono">
          No matching distress signals on command radar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredList.map((sos) => (
            <div key={sos.id} className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-500/10 text-red-400 border border-red-500/20">
                      {sos.severity}
                    </span>
                    <h3 className="text-sm font-bold text-white">{sos.emergencyType} Distress</h3>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">ID: {sos.id}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-300 border border-slate-800 uppercase tracking-widest font-mono">
                  {sos.status}
                </span>
              </div>

              {sos.message && sos.message.startsWith('data:audio') ? (
                <VoiceSOSCard
                  severity={sos.severity}
                  peopleCount={sos.peopleCount}
                  locationLat={sos.locationLat}
                  locationLng={sos.locationLng}
                  audioBase64={sos.message}
                  status={sos.status}
                  createdAt={sos.createdAt}
                />
              ) : (
                <div className="space-y-1.5 text-xs text-slate-300">
                  <p><strong>Victim:</strong> {sos.victim?.name} ({sos.contactPhone})</p>
                  <p><strong>People Count:</strong> {sos.peopleCount}</p>
                  <p className="text-[10px] text-slate-500 font-mono">📍 {sos.address}</p>
                  <p className="text-slate-400 italic">"{sos.message}"</p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-900 flex justify-between items-center text-xs">
                <div className="text-[10px] text-slate-500">
                  Responders: {sos.responderTeam?.name || sos.volunteer?.user?.name || 'Unassigned'}
                </div>
                <button
                  onClick={() => navigate(`/rescue/sos/${sos.id}`)}
                  className="px-3.5 py-1.5 bg-slate-900 border border-slate-850 hover:bg-slate-850 hover:border-slate-700 text-cyan-400 hover:text-cyan-300 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Manage Call
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
