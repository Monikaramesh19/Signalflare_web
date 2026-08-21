import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Compass, Users, MapPin, Radio } from 'lucide-react';

export const RescueOperations: React.FC = () => {
  const [ops, setOps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOps = async () => {
    try {
      const response = await api.get('/rescue/operations');
      setOps(response.data);
    } catch (err) {
      console.warn('Operations fetch failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOps();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Active Rescue Runs</h1>
        <p className="text-xs text-slate-400 font-medium">Monitor active search and rescue boats, tracking telemetry nodes.</p>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500 font-mono">Querying coordinates tracker...</div>
      ) : ops.length === 0 ? (
        <div className="p-12 rounded-xl bg-slate-950/40 border border-slate-900 text-center text-xs text-slate-500 font-mono">
          No ongoing search-and-rescue runs.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ops.map((op) => (
            <div key={op.id} className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
              <div className="flex justify-between items-start border-b border-slate-900 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">{op.responderTeam?.name || 'Rescue Crew'}</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Target: {op.victim?.name}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono tracking-wider animate-pulse">
                  {op.status}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono">{op.locationLat.toFixed(5)}, {op.locationLng.toFixed(5)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>People to Evacuate: {op.peopleCount} persons</span>
                </div>
              </div>

              <div className="p-3 bg-cyan-950/10 border border-cyan-500/10 rounded-lg text-[10px] text-cyan-300 flex items-center gap-2">
                <Radio className="w-4 h-4 animate-bounce text-cyan-400" />
                <span>Responder transponder active: updating coordinate lines.</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
