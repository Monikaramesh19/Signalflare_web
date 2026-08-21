import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Flame, Compass, Users, Activity, Loader2, ClipboardList, Shield } from 'lucide-react';

export const CommandDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [sosList, setSosList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const response = await api.get('/admin/analytics');
      setStats(response.data.summary);

      const resSOS = await api.get('/sos');
      setSosList(resSOS.data.slice(0, 5));
    } catch (err) {
      console.warn('Rescue Command Dashboard failed: offline or permission error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const chartData = [
    { name: 'Mon', Flood: 12, Medical: 5, Fire: 2 },
    { name: 'Tue', Flood: 19, Medical: 8, Fire: 4 },
    { name: 'Wed', Flood: 15, Medical: 10, Fire: 1 },
    { name: 'Thu', Flood: 22, Medical: 15, Fire: 7 },
    { name: 'Fri', Flood: 30, Medical: 12, Fire: 3 },
    { name: 'Sat', Flood: 25, Medical: 18, Fire: 5 },
    { name: 'Sun', Flood: 34, Medical: 20, Fire: 8 },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-white">Rescue Command Dashboard</h1>
        <p className="text-xs text-slate-400">Emergency Dispatch Operations Control Center.</p>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          Loading central command ledger...
        </div>
      ) : (
        <>
          {/* Counters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl glass-card text-left">
              <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider block mb-1">Evacuations Active</span>
              <p className="text-2xl font-black text-red-500 font-mono">{stats?.activeSOS || 0}</p>
            </div>

            <div className="p-5 rounded-xl glass-card text-left">
              <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider block mb-1">Volunteers Registered</span>
              <p className="text-2xl font-black text-cyan-400 font-mono">{stats?.volunteers || 0}</p>
            </div>

            <div className="p-5 rounded-xl glass-card text-left">
              <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider block mb-1">Supply Orders</span>
              <p className="text-2xl font-black text-orange-400 font-mono">{stats?.resourceRequests || 0}</p>
            </div>

            <div className="p-5 rounded-xl glass-card text-left">
              <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider block mb-1">Total Signals Logged</span>
              <p className="text-2xl font-black text-white font-mono">{stats?.totalSOS || 0}</p>
            </div>
          </div>

          {/* Charts area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recharts chart */}
            <div className="lg:col-span-2 p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Weekly Distress Frequency Vector</h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFlood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                    <Area type="monotone" dataKey="Flood" stroke="#ef4444" fillOpacity={1} fill="url(#colorFlood)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Alert ticker */}
            <div className="p-6 rounded-xl glass-panel border border-slate-800 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Evacuation Ticker</h2>
                <div className="space-y-3">
                  {sosList.slice(0, 3).map((sos) => (
                    <div
                      key={sos.id}
                      onClick={() => navigate(`/rescue/sos/${sos.id}`)}
                      className="p-3 bg-slate-950/40 rounded-lg border border-slate-900 cursor-pointer hover:border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{sos.emergencyType} Alert</p>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">{sos.address}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/25">
                        {sos.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                to="/rescue/sos"
                className="w-full text-center py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-cyan-400 mt-4 block"
              >
                Launch Distress Monitor
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
