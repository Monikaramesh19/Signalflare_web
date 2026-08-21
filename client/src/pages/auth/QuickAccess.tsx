import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, HeartHandshake, ShieldAlert, ArrowLeft, Info, Volume2, MapPin, X } from 'lucide-react';
import { meshSimulation } from '../../offline/meshManager';
import { addToQueue } from '../../offline/db';

export const QuickAccess: React.FC = () => {
  const navigate = useNavigate();

  const contacts = [
    { name: 'Disaster Management Helpline', phone: '1078' },
    { name: 'NDRF Control Room', phone: '011-23438084' },
    { name: 'Police Control', phone: '100' },
    { name: 'Ambulance Services', phone: '108' },
    { name: 'Fire Department', phone: '101' },
    { name: 'State Emergency Operation', phone: '1070' },
  ];

  const quickGuides = [
    {
      title: 'Cyclone Safety',
      points: [
        'Stay indoors and keep windows closed.',
        'Unplug all electronic appliances to prevent surges.',
        'Keep emergency lamps and clean drinking water ready.',
      ],
    },
    {
      title: 'Flood Assistance',
      points: [
        'Move to higher floors or higher elevated grounds.',
        'Do not drive or walk through moving water currents.',
        'Turn off main electricity switch boards.',
      ],
    },
    {
      title: 'First-Aid Basic Code',
      points: [
        'Apply direct clean pressure on bleeding wounds.',
        'If a fracture is suspected, immobilize the joint.',
        'Perform CPR only if trained and victim is unresponsive.',
      ],
    },
  ];

  const [selectedContact, setSelectedContact] = useState<{ name: string; phone: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);

  useEffect(() => {
    // Read cached location
    const cached = localStorage.getItem('last_known_gps');
    if (cached) {
      const parsed = JSON.parse(cached);
      setCoords({ lat: parsed.lat, lng: parsed.lng, accuracy: parsed.accuracy });
    }

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
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleReadIntroduction = () => {
    speak('Emergency. Tap the red button to call 112.');
  };

  const handleListenContact = (name: string, phone: string) => {
    speak(`${name}. Dial ${phone}.`);
  };

  const handleInitiateCall = (contact: { name: string; phone: string }) => {
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
      batteryLevel: 88,
      hopCount: 0,
      ttl: 12,
      messagePriority: 'HIGH',
    };

    // Store in IndexedDB
    await addToQueue('resource_queue', {
      id: packetId,
      resourceName: 'LOCATION_UPDATE',
      quantity: 1,
      locationLat: lat,
      locationLng: lng,
      address: `Helpline Intercept Call Location (Accuracy: ±${accuracy}m)`,
      createdAt: Date.now(),
    });

    // Mesh simulation relay
    await meshSimulation.simulateRouterSend(payload, 'LOCATION_UPDATE', 'HIGH');

    window.location.href = `tel:${selectedContact.phone}`;
    setShowModal(false);
  };

  const handleCallWithoutLocation = () => {
    if (!selectedContact) return;
    window.location.href = `tel:${selectedContact.phone}`;
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 p-6 sm:p-12 relative overflow-hidden">
      <div className="max-w-4xl mx-auto z-10 relative">
        {/* Back navigation */}
        <button
          onClick={() => navigate('/')}
          className="mb-8 flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-600/10 border border-red-500/20 text-red-500 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">Emergency Quick Access</h1>
              <p className="text-xs text-slate-400">Offline-available emergency phone lines and guides</p>
            </div>
          </div>

          <button
            onClick={handleReadIntroduction}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/10 transition-colors w-fit"
          >
            <Volume2 className="w-4 h-4 animate-bounce" />
            🔊 Read Emergency Contacts
          </button>
        </div>

        {/* Contacts section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-900 pb-2">
              <Phone className="w-4.5 h-4.5 text-cyan-400" />
              Emergency Helplines
            </h2>
            <div className="space-y-3">
              {contacts.map((contact) => (
                <div key={contact.name} className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-semibold text-white">{contact.name}</p>
                    <button
                      type="button"
                      onClick={() => handleListenContact(contact.name, contact.phone)}
                      className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-mono uppercase tracking-wider cursor-pointer mt-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Listen details
                    </button>
                  </div>
                  <button
                    onClick={() => handleInitiateCall(contact)}
                    className="px-4 py-1.5 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 rounded-lg font-bold transition-all cursor-pointer"
                  >
                    {contact.phone}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Guides section */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-900 pb-2">
              <HeartHandshake className="w-4.5 h-4.5 text-cyan-400" />
              Response Checklists
            </h2>
            <div className="space-y-4">
              {quickGuides.map((guide) => (
                <div key={guide.title} className="p-5 rounded-xl bg-slate-950/40 border border-slate-900">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3">{guide.title}</h3>
                  <ul className="space-y-2 text-xs text-slate-400">
                    {guide.points.map((pt, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-cyan-500">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex gap-3 text-xs text-cyan-300 leading-relaxed mb-8">
          <Info className="w-5 h-5 flex-shrink-0" />
          <p>
            This dashboard operates entirely offline once loaded. You do not need to register an account or log in to inspect emergency support helplines. If you need rescue assistance or want to order food, water, or medicine, please{' '}
            <Link to="/login" className="underline font-bold text-white">
              Log in to register your location
            </Link>
            .
          </p>
        </div>
      </div>

      {/* CONFIRMATION DIALOG MODAL */}
      {showModal && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in text-xs text-slate-300">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-[#0c101b] p-6 space-y-5 shadow-2xl relative">
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
              <p className="text-[11px] text-slate-400">Initiating dialer request for {selectedContact.name} ({selectedContact.phone})</p>
            </div>

            {/* Coordinates */}
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
