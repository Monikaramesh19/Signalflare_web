import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Flame, ClipboardList, Clock, AlertTriangle } from 'lucide-react';

export const RequestList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sosList, setSosList] = useState<any[]>([]);
  const [resourceList, setResourceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    try {
      if (navigator.onLine) {
        const resSOS = await api.get('/sos');
        const mySOS = resSOS.data.filter((x: any) => x.victimId === user?.id);
        setSosList(mySOS);

        const resRes = await api.get('/requests');
        const myRes = resRes.data.filter((x: any) => x.victimId === user?.id);
        setResourceList(myRes);
      }
    } catch (err) {
      console.warn('Could not query requests from API (offline mode)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">My Emergency Requests</h1>
        <p className="text-xs text-slate-400">Track evacuation dispatches, supply drops, and chat directly with responders.</p>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500 font-mono">Querying requests...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Evacuations & SOS List */}
          <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-900 pb-2">
              <Flame className="w-5 h-5 text-red-500" />
              Emergency Incidents
            </h2>
            {sosList.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center font-mono">No active distress signals found.</p>
            ) : (
              <div className="space-y-3">
                {sosList.map((sos) => (
                  <div
                    key={sos.id}
                    onClick={() => navigate(`/victim/requests/${sos.id}`)}
                    className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 hover:border-slate-800 transition-all cursor-pointer flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">{sos.emergencyType} Emergency</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(sos.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                      {sos.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Supplies Resource Requests */}
          <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-900 pb-2">
              <ClipboardList className="w-5 h-5 text-cyan-400" />
              Relief Supply Requests
            </h2>
            {resourceList.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center font-mono">No active resource requests found.</p>
            ) : (
              <div className="space-y-3">
                {resourceList.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => navigate(`/victim/requests/${res.id}`)}
                    className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 hover:border-slate-800 transition-all cursor-pointer flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">
                        {res.resourceName} (x{res.quantity})
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(res.createdAt).toLocaleString()}
                      </div>
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
      )}
    </div>
  );
};
