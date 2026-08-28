import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Compass, Plus, Trash2 } from 'lucide-react';

export const ShelterControl: React.FC = () => {
  const [shelters, setShelters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(100);
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('13.0827');
  const [lng, setLng] = useState('80.2707');

  const loadShelters = async () => {
    try {
      const response = await api.get('/shelters');
      setShelters(response.data);
    } catch (err) {
      console.warn('Camps query failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShelters();
  }, []);

  const handleAddShelter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) return;
    try {
      await api.post('/shelters', {
        name,
        capacity,
        address,
        locationLat: parseFloat(lat),
        locationLng: parseFloat(lng),
      });
      setName('');
      setAddress('');
      loadShelters();
    } catch (err) {
      alert('Failed to register relief camp.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Relief Camp Registry</h1>
        <p className="text-xs text-slate-400">Register new shelters, configure bed indexes and tracking offsets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Register card */}
        <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4 h-fit">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-400" />
            Register Safe Camp
          </h2>
          <form onSubmit={handleAddShelter} className="space-y-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Camp Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Adyar Safe Hall"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Max Capacity (Beds)</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 100)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Exact Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ECR Road, Chennai"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Latitude</label>
                <input
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Longitude</label>
                <input
                  type="text"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded cursor-pointer"
            >
              REGISTER RELIEF CAMP
            </button>
          </form>
        </div>

        {/* Camp List */}
        <div className="lg:col-span-2 p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            Registered Safe Camps
          </h2>

          {loading ? (
            <p className="text-xs text-slate-500 font-mono">Querying camps...</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {shelters.map((sh) => (
                <div key={sh.id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-white">{sh.name}</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{sh.address}</p>
                    <p className="text-[9px] text-slate-400 font-mono mt-1">Coords: {sh.locationLat}, {sh.locationLng}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-mono text-xs font-bold">
                    Capacity: {sh.capacity} beds
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
