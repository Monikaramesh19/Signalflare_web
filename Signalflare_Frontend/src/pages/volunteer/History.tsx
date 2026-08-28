import React from 'react';
import { Clock, ShieldAlert } from 'lucide-react';

export const History: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Rescue Action Logs</h1>
        <p className="text-xs text-slate-400">Historical logs of your completed evacuations and delivery tasks.</p>
      </div>

      <div className="p-6 rounded-xl glass-panel border border-slate-800 text-center py-16 space-y-4">
        <Clock className="w-12 h-12 text-slate-700 mx-auto" />
        <p className="text-xs text-slate-500 font-mono">No historical actions logged in your local ledger yet.</p>
      </div>
    </div>
  );
};
