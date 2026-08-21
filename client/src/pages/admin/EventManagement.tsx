import React, { useState } from 'react';
import { Flame, Plus, ShieldAlert } from 'lucide-react';

export const EventManagement: React.FC = () => {
  const [events, setEvents] = useState<any[]>([
    { id: '1', title: 'Tamil Nadu Monsoon Flooding 2026', severity: 'CRITICAL', active: true },
  ]);
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState('CRITICAL');

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setEvents((prev) => [
      ...prev,
      { id: Math.random().toString(), title, severity, active: true },
    ]);
    setTitle('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Emergency Event Coordinator</h1>
        <p className="text-xs text-slate-400">Declare active evacuation alerts and coordinate regional bulletins.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl glass-panel border border-slate-800 h-fit space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-400" />
            Declare Disaster Alert
          </h2>
          <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">Disaster Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Cyclone Delta 2026 Alert"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">Severity Vector</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-300"
              >
                <option value="CRITICAL">🚨 Critical Danger</option>
                <option value="HIGH">⚠️ High Priority warning</option>
                <option value="MEDIUM">🟡 Moderate Threat</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded cursor-pointer"
            >
              DECLARE DISASTER BULLET
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            Declared Active Warning Zones
          </h2>
          <div className="space-y-3">
            {events.map((ev) => (
              <div key={ev.id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-white">{ev.title}</h3>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">Status: Operational evacuation bulletin active</p>
                </div>
                <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/25 rounded font-mono text-xs font-bold animate-pulse">
                  {ev.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
