import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNetwork } from '../../contexts/NetworkContext';
import { addToQueue } from '../../offline/db';
import api from '../../services/api';
import { ClipboardList, MapPin, Loader2, Navigation } from 'lucide-react';

export const ResourceRequestForm: React.FC = () => {
  const { isOnline } = useNetwork();
  const navigate = useNavigate();

  const [resourceName, setResourceName] = useState('Drinking Water');
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    handleGetLocation();
  }, []);

  const handleGetLocation = () => {
    setLocLoading(true);
    if (!navigator.geolocation) {
      setCoords({ lat: 13.0827, lng: 80.2707 });
      setLocLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocLoading(false);
      },
      () => {
        setCoords({ lat: 13.0827, lng: 80.2707 });
        setLocLoading(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const lat = coords?.lat || 13.0827;
    const lng = coords?.lng || 80.2707;
    const reqId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);

    const payload = {
      id: reqId,
      resourceName,
      quantity,
      locationLat: lat,
      locationLng: lng,
      address: address || `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      contactPhone: phone,
      createdAt: Date.now(),
    };

    if (isOnline) {
      try {
        await api.post('/requests', payload);
        alert('Supply request submitted successfully!');
        navigate('/victim/dashboard');
      } catch (err: any) {
        console.error('Online order failed, caching offline:', err);
        saveOffline(payload);
      }
    } else {
      saveOffline(payload);
    }
  };

  const saveOffline = async (payload: any) => {
    try {
      await addToQueue('resource_queue', payload);
      alert('⚠️ OFFLINE: Supply request saved locally. It will auto-sync immediately when network returns.');
      navigate('/sync');
    } catch (err) {
      alert('Failed to cache request locally.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-2">
          <ClipboardList className="w-8 h-8 text-cyan-400" />
          Request Relief Supplies
        </h1>
        <p className="text-xs text-slate-400">Submit requests for immediate medical, dietary, or dry goods replenishment.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-xl glass-panel border border-slate-800 space-y-5">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Item Needed</label>
          <select
            value={resourceName}
            onChange={(e) => setResourceName(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            <option value="Drinking Water">🚰 Drinking Water Packets</option>
            <option value="Dry Rations">🥫 Dry Food / Rations</option>
            <option value="First-Aid Kit">💊 First-Aid & Med Kits</option>
            <option value="Blankets">🛏️ Blankets / Sleeping Mats</option>
            <option value="Sanitation Pack">🧼 Hygiene & Soap Packs</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Quantity</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Contact Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">GPS Coordinates</label>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300">
              {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'Resolving GPS coordinates...'}
            </span>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={locLoading}
              className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              {locLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Delivery Address / Notes</label>
          <textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Room number, building name, or land references"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white font-bold text-sm rounded-lg transition-colors cursor-pointer"
        >
          {submitting ? 'Submitting Order...' : 'SUBMIT SUPPLIES REQUEST'}
        </button>
      </form>
    </div>
  );
};
