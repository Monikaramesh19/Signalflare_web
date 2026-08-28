import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Map, MapPin, Loader2 } from 'lucide-react';

export const LiveMap: React.FC = () => {
  const [markers, setMarkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await api.get('/sos');
        setMarkers(response.data);
      } catch (err) {
        console.warn('Map positions load failed');
      } finally {
        setLoading(false);
      }
    };
    fetchPositions();
  }, []);

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-140px)]">
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-3xl font-black text-white">Live Operations Command Map</h1>
          <p className="text-xs text-slate-400">Tactical mapping displaying color-coded rescue vectors.</p>
        </div>
      </div>

      <div className="flex-1 rounded-xl bg-slate-950 border border-slate-900 relative flex items-center justify-center overflow-hidden">
        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        ) : (
          <>
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
            
            {/* Visualizer Radar */}
            <div className="relative w-80 h-80 border border-cyan-500/20 rounded-full flex items-center justify-center">
              <div className="absolute w-40 h-0.5 bg-cyan-500/20 origin-left animate-spin" />
              <div className="w-4 h-4 rounded-full bg-cyan-400 shadow shadow-cyan-400/80 z-20" />
              
              {markers.slice(0, 8).map((m, idx) => {
                const offsetLat = (m.locationLat - 13.0827) * 400;
                const offsetLng = (m.locationLng - 80.2707) * 400;
                return (
                  <div
                    key={m.id}
                    className="absolute w-3 h-3 rounded-full flex items-center justify-center cursor-pointer shadow-lg animate-pulse"
                    style={{
                      transform: `translate(${offsetLng}px, ${-offsetLat}px)`,
                      backgroundColor: m.severity === 'CRITICAL' ? '#ef4444' : '#f97316',
                    }}
                    title={`${m.emergencyType} - ${m.status}`}
                  >
                    <MapPin className="w-2.5 h-2.5 text-white" />
                  </div>
                );
              })}
            </div>
            
            <div className="absolute bottom-6 left-6 p-4 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px] space-y-1.5 font-mono text-slate-400 z-10 backdrop-blur-md">
              <p className="font-bold text-white uppercase text-[11px] mb-1">Priority Legend</p>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Critical (Evacuation Needs)</div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-500" /> High (Supplies Needs)</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
