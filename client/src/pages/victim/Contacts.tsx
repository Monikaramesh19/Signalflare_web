import React, { useState, useEffect } from 'react';
import { Phone, Volume2, HelpCircle, ShieldAlert, CheckCircle, MapPin, X } from 'lucide-react';
import { addToQueue } from '../../offline/db';

export const Contacts: React.FC = () => {
  const numbers = [
    { label: 'Disaster Management Helpline', tel: '1078' },
    { label: 'National Emergency Response System', tel: '112' },
    { label: 'Police Service Force', tel: '100' },
    { label: 'NDRF Control Dispatch Room', tel: '011-23438252' },
    { label: 'Medical Ambulance Services', tel: '108' },
    { label: 'Fire Operations Center', tel: '101' },
  ];

  const [selectedContact, setSelectedContact] = useState<{ label: string; tel: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);

  useEffect(() => {
    // Attempt to parse cached GPS coordinate metrics
    const cached = localStorage.getItem('last_known_gps');
    if (cached) {
      const parsed = JSON.parse(cached);
      setCoords({ lat: parsed.lat, lng: parsed.lng, accuracy: parsed.accuracy });
    }

    // Try fetching fresh GPS coordinates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
      });
    }
  }, [showModal]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any active readings
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleReadIntroduction = () => {
    speak('Emergency. Tap the red button to call 112.');
  };

  const handleListenContact = (label: string, tel: string) => {
    speak(`${label}. Dial ${tel}.`);
  };

  const handleInitiateCall = (contact: { label: string; tel: string }) => {
    setSelectedContact(contact);
    setShowModal(true);
  };

  const handleCallWithLocation = async () => {
    if (!selectedContact) return;

    const lat = coords?.lat || 13.0827;
    const lng = coords?.lng || 80.2707;
    const accuracy = coords?.accuracy || 20;

    const packetId = `SF-LOC-${Date.now()}`;
    const payload = {
      locationMessageId: packetId,
      deviceId: 'SF-USER-CURRENT',
      latitude: lat,
      longitude: lng,
      accuracy,
      timestamp: Date.now(),
      batteryLevel: 90,
      hopCount: 0,
      ttl: 12,
      messagePriority: 'HIGH',
    };

    // Store locally
    await addToQueue('resource_queue', {
      id: packetId,
      resourceName: 'LOCATION_UPDATE',
      quantity: 1,
      locationLat: lat,
      locationLng: lng,
      address: `Helpline Intercept Call Location (Accuracy: ±${accuracy}m)`,
      createdAt: Date.now(),
    });

    // Register telemetry log internally
    console.log('Geo Fencing location telemetry logged for emergency call.');

    // Trigger Dialer
    window.location.href = `tel:${selectedContact.tel}`;
    setShowModal(false);
  };

  const handleCallWithoutLocation = () => {
    if (!selectedContact) return;
    window.location.href = `tel:${selectedContact.tel}`;
    setShowModal(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Emergency Contacts</h1>
          <p className="text-xs text-slate-400">Direct dialing helplines and operations rooms.</p>
        </div>

        {/* Read All Button */}
        <button
          onClick={handleReadIntroduction}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/10 transition-colors w-fit"
        >
          <Volume2 className="w-4 h-4 animate-bounce" />
          🔊 Read Emergency Contacts
        </button>
      </div>

      <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
        {numbers.map((num) => (
          <div key={num.label} className="p-4 rounded-lg bg-slate-950/40 border border-slate-900 flex justify-between items-center text-xs">
            <div className="space-y-1">
              <p className="font-bold text-white">{num.label}</p>
              <button
                type="button"
                onClick={() => handleListenContact(num.label, num.tel)}
                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-mono uppercase tracking-wider cursor-pointer"
              >
                <Volume2 className="w-3 h-3" />
                Listen details
              </button>
            </div>
            <button
              onClick={() => handleInitiateCall(num)}
              className="px-4 py-2.5 bg-cyan-600/10 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-cyan-500/20 rounded-lg font-bold font-mono transition-all cursor-pointer"
            >
              Dial {num.tel}
            </button>
          </div>
        ))}
      </div>

      {/* CALLING CONFIRMATION DIALOG MODAL */}
      {showModal && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-[#0c101b] p-6 text-xs text-slate-300 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-500 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/25 text-red-500 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">🚨 CALLING EMERGENCY SERVICE</h3>
              <p className="text-[11px] text-slate-400">Initiating dialer request for {selectedContact.label} ({selectedContact.tel})</p>
            </div>

            {/* GPS coordinates details */}
            <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-900 space-y-2 font-mono text-[11px]">
              <span className="text-[9px] uppercase font-bold text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                Your location coordinates
              </span>
              {coords ? (
                <>
                  <p className="font-bold text-white">{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</p>
                  <p className="text-[9px] text-slate-500">GPS Accuracy: ±{coords.accuracy} m</p>
                </>
              ) : (
                <p className="text-slate-500">Retrieving offline location tags...</p>
              )}
            </div>

            <p className="text-center text-[10px] text-slate-400">
              Would you like SignalFlare to share your location with rescue networks before calling?
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleCallWithLocation}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg cursor-pointer transition-colors"
              >
                SHARE LOCATION & DIAL
              </button>

              <button
                onClick={handleCallWithoutLocation}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-lg cursor-pointer transition-colors"
              >
                CALL WITHOUT LOCATION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
