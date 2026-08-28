import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Map, MapPin } from 'lucide-react';

export const VolunteerMap: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await api.get('/sos');
        setTasks(response.data.slice(0, 5));
      } catch (err) {
        console.warn('Map data retrieval warning');
      }
    };
    fetchTasks();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Responder Coordination Map</h1>
        <p className="text-xs text-slate-400 font-medium">Coordinate logistics routes to disaster hotspots.</p>
      </div>

      <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
        <div className="h-96 rounded-lg bg-slate-950/60 border border-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          <Map className="w-12 h-12 text-cyan-500/30 animate-pulse mb-3" />
          <p className="text-xs text-slate-400 font-mono">Radar Locks: {tasks.length} distress indicators mapped</p>
          
          <div className="absolute w-40 h-40 border border-cyan-500/20 rounded-full flex items-center justify-center mt-8">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping z-10" />
          </div>
        </div>
      </div>
    </div>
  );
};
