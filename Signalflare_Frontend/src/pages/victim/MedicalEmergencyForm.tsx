import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNetwork } from '../../contexts/NetworkContext';
import { addToQueue } from '../../offline/db';
import api from '../../services/api';
import { HeartPulse, Loader2, Navigation } from 'lucide-react';

export const MedicalEmergencyForm: React.FC = () => {
  const { isOnline } = useNetwork();
  const navigate = useNavigate();

  const [severity, setSeverity] = useState('CRITICAL');
  const [description, setDescription] = useState('');
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

    // Call standard emergency endpoints
    const payload = {
      id: reqId,
      type: 'MEDICAL',
      severity,
      locationLat: lat,
      locationLng: lng,
      address: address || `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      description: `[MEDICAL TRAUMA REPORT] ${description}`,
      createdAt: Date.now(),
    };

    if (isOnline) {
      try {
        await api.post('/requests/emergency', payload);
        alert('Medical Emergency Dispatch Request Logged!');
        navigate('/victim/dashboard');
      } catch (err) {
        console.error('Online medical SOS failed, caching offline:', err);
        saveOffline(payload);
      }
    } else {
      saveOffline(payload);
    }
  };

  const saveOffline = async (payload: any) => {
    try {
      // Offline fallback: save as an SOS in standard sos queue to make sure it doesn't get lost
      await addToQueue('sos_queue', {
        id: payload.id,
        emergencyType: 'MEDICAL',
        severity: payload.severity,
        peopleCount: 1,
        locationLat: payload.locationLat,
        locationLng: payload.locationLng,
        address: payload.address,
        message: payload.description,
        contactPhone: 'Emergency',
        createdAt: payload.createdAt,
      });
      alert('⚠️ OFFLINE: Medical distress report saved locally. It will auto-sync immediately when network returns.');
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
          <HeartPulse className="w-8 h-8 text-red-500 animate-pulse" />
          Request Medical Dispatch
        </h1>
        <p className="text-xs text-slate-400 font-medium">Flag urgent trauma or injuries directly to active paramedics and rescue boat teams.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-red-950/20 border border-red-500/20 space-y-5">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Severity Level</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-red-500"
          >
            <option value="CRITICAL">🚨 Critical / Unconscious / Severe Bleeding</option>
            <option value="HIGH">⚠️ High Priority (Fracture / Infection)</option>
            <option value="MEDIUM">🟡 Minor Wounds / Medical Advice</option>
          </select>
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
              {locLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refetch'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Medical Notes / Symptoms</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe injuries, age, number of patients, and existing medication needs..."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-red-500"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Exact Location Notes</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Near specific temple/school/hall"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-red-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:from-red-800 disabled:to-rose-800 text-white font-bold text-sm rounded-lg transition-colors cursor-pointer"
        >
          {submitting ? 'Transmitting Medical SOS...' : 'SUBMIT MEDICAL DISPATCH'}
        </button>
      </form>
    </div>
  );
};
