import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { ClipboardCheck, MapPin, Phone, CheckCircle, Navigation } from 'lucide-react';

export const ResourceDelivery: React.FC = () => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  const loadDeliveries = async () => {
    try {
      const response = await api.get('/volunteers/tasks');
      setDeliveries(response.data.resources || []);
    } catch (err) {
      console.warn('Deliveries query failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  const handleMarkDelivered = async (id: string) => {
    try {
      await api.put(`/requests/${id}`, { status: 'DELIVERED' });
      alert('Supply package marked as delivered!');
      loadDeliveries();
    } catch (err) {
      alert('Failed to update delivery status.');
    }
  };

  const toggleCheckstep = (id: string, step: string) => {
    const key = `${id}_${step}`;
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return <div className="py-8 text-center text-xs text-slate-500 font-mono">Querying deliveries...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Supply Delivery Coordinator</h1>
        <p className="text-xs text-slate-400">Complete logistics checklists and update drop-off milestones.</p>
      </div>

      {deliveries.length === 0 ? (
        <div className="p-12 rounded-xl bg-slate-950/40 border border-slate-900 text-center space-y-2">
          <h2 className="text-sm font-bold text-white">No Active Deliveries</h2>
          <p className="text-xs text-slate-400">Claim pending supply requests from the Nearby Callouts panel.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {deliveries.map((del) => (
            <div key={del.id} className="p-6 rounded-xl glass-panel border border-slate-800 space-y-5">
              <div className="flex justify-between items-start border-b border-slate-900 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white">
                    {del.resourceName} (x{del.quantity})
                  </h2>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Request: {del.id}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-widest font-mono">
                  {del.status}
                </span>
              </div>

              {/* Delivery Details */}
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Receiver:</span>
                  <span>{del.victim?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-cyan-400" />
                  <span>{del.contactPhone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>{del.address}</span>
                </div>
              </div>

              {/* Logistics Checklist */}
              <div className="space-y-2.5 pt-2 border-t border-slate-900">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Logistics Milestones</h3>
                <div className="space-y-2">
                  {['Collected items from depot', 'Inspected seal integrity', 'Transit initiated', 'Package Handed Over'].map((step, idx) => {
                    const checked = !!checklist[`${del.id}_${step}`];
                    return (
                      <label key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-slate-950/20 border border-slate-900 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCheckstep(del.id, step)}
                          className="w-4 h-4 accent-cyan-500"
                        />
                        <span className={checked ? 'line-through text-slate-500' : ''}>{step}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => handleMarkDelivered(del.id)}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                MARK DELIVERED
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
