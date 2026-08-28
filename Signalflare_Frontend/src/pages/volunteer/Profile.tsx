import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Settings } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [skills, setSkills] = useState(user?.volunteer?.skills || 'First-aid, Driving');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Simulated profile update complete.');
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-2">
          <Settings className="w-8 h-8 text-cyan-400" />
          Volunteer profile
        </h1>
        <p className="text-xs text-slate-400">Update medical skills declarations, driving endorsements, or emergency contact vectors.</p>
      </div>

      <form onSubmit={handleSave} className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Operational Role</label>
          <input
            type="text"
            value="ACTIVE RESCUE VOLUNTEER"
            disabled
            className="w-full px-3 py-2 bg-slate-950/60 border border-slate-900 rounded-lg text-xs font-mono text-cyan-400 font-bold"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Primary Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Skills / Certification Catalog</label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-lg transition-colors cursor-pointer"
        >
          Save profile details
        </button>
      </form>
    </div>
  );
};
