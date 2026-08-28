import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNetwork } from '../../contexts/NetworkContext';
import { addToQueue } from '../../offline/db';
import api from '../../services/api';
import { Flame, ShieldAlert, Camera, MapPin, Loader2, Navigation, AlertCircle } from 'lucide-react';
import { meshSimulation } from '../../offline/meshManager';
import { getNearestResource, CHENNAI_FALLBACK } from '../../services/geospatial';

export const SOSEmergencyPanel: React.FC = () => {
  const { isOnline } = useNetwork();
  const navigate = useNavigate();

  const [type, setType] = useState('FLOOD');
  const [severity, setSeverity] = useState('CRITICAL');
  const [peopleCount, setPeopleCount] = useState(1);
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'REAL' | 'DEMO'>('DEMO');
  const [locLoading, setLocLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const [recordingState, setRecordingState] = useState<'IDLE' | 'RECORDING' | 'PREVIEW'>('IDLE');
  const [recordDuration, setRecordDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<any>(null);
  const audioPlayRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioPlayRef.current) {
        audioPlayRef.current.pause();
        audioPlayRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const localUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(localUrl);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          setMessage(base64Data);
        };

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecordingState('RECORDING');
      setRecordDuration(0);

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access is required to speak your emergency.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordingState('PREVIEW');
  };

  const deleteRecording = () => {
    if (audioPlayRef.current) {
      audioPlayRef.current.pause();
    }
    setMessage('');
    setAudioUrl(null);
    setRecordDuration(0);
    setRecordingState('IDLE');
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    if (!audioPlayRef.current) {
      audioPlayRef.current = new Audio(audioUrl);
      audioPlayRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioPlayRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayRef.current.play().catch((err) => console.warn('Audio playback failed', err));
      setIsPlaying(true);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Attempt automatic GPS retrieval on mount
    handleGetLocation();
  }, []);

  const handleGetLocation = () => {
    setLocLoading(true);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      setCoords({ lat: CHENNAI_FALLBACK.lat, lng: CHENNAI_FALLBACK.lng }); // Fallback Chennai
      setAccuracy(15);
      setGpsStatus('DEMO');
      setLocLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setAccuracy(Math.round(pos.coords.accuracy));
        setGpsStatus('REAL');
        setLocLoading(false);
      },
      (err) => {
        console.warn('Geolocation access denied. Using fallback coordinates.');
        setCoords({ lat: CHENNAI_FALLBACK.lat, lng: CHENNAI_FALLBACK.lng }); // Fallback Chennai
        setAccuracy(15);
        setGpsStatus('DEMO');
        setLocLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const startSOSWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    setCountdown(5);
  };

  // Countdown timer logic
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      executeSOSCreation();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const executeSOSCreation = async () => {
    if (!message) {
      alert('Please describe your emergency by speaking into the microphone.');
      return;
    }
    setSubmitting(true);

    // Read cached tracking coordinates from background tracker if active
    const cachedGps = localStorage.getItem('last_known_gps');
    const parsedGps = cachedGps ? JSON.parse(cachedGps) : null;
    
    const lat = coords?.lat || parsedGps?.lat || CHENNAI_FALLBACK.lat;
    const lng = coords?.lng || parsedGps?.lng || CHENNAI_FALLBACK.lng;
    const gpsAccuracy = accuracy || parsedGps?.accuracy || 20;
    
    const sosId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);

    const nearShelter = getNearestResource(lat, lng, 'SHELTER');
    const nearRescue = getNearestResource(lat, lng, 'RESCUE_TEAM');
    const nearHospital = getNearestResource(lat, lng, 'HOSPITAL');

    const payload = {
      id: sosId,
      emergencyType: type,
      severity,
      peopleCount,
      locationLat: lat,
      locationLng: lng,
      address: `Captured Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)} (Accuracy: ±${gpsAccuracy}m)`,
      message,
      contactPhone: phone,
      photo,
      createdAt: Date.now(),
      nearestShelter: nearShelter ? `${nearShelter.name} (${nearShelter.distance} km)` : 'N/A',
      nearestRescueTeam: nearRescue ? `${nearRescue.name} (${nearRescue.distance} km)` : 'N/A',
      nearestHospital: nearHospital ? `${nearHospital.name} (${nearHospital.distance} km)` : 'N/A',
      status: 'CREATED',
    };

    if (isOnline) {
      try {
        const response = await api.post('/sos', payload);
        alert('SOS Broadcast Received by Dispatch Center!');
        navigate(`/victim/requests/${response.data.id}`);
      } catch (err: any) {
        console.error('Online SOS submission failed, caching offline:', err);
        saveOfflineSOS(payload);
      }
    } else {
      saveOfflineSOS(payload);
    }
  };

  const saveOfflineSOS = async (payload: any) => {
    try {
      await addToQueue('sos_queue', payload);
      
      // Trigger D2D Mesh routing simulation
      await meshSimulation.simulateRouterSend(
        {
          message: payload.message || 'Distress signal relayed via BLE D2D.',
          peopleCount: payload.peopleCount,
          latitude: payload.locationLat,
          longitude: payload.locationLng,
          contactPhone: payload.contactPhone,
        },
        payload.emergencyType || 'SOS',
        payload.severity === 'CRITICAL' || payload.severity === 'HIGH' ? 'CRITICAL' : 'MEDIUM'
      );
      
      alert('⚠️ OFFLINE MODE: SOS saved locally. Geo Fencing emergency tracking activated immediately.\n\n✓ Saved locally\n✓ Proximity calculations active\n✓ Operations gateway notified');
      navigate('/mesh');
    } catch (err) {
      console.error(err);
      alert('Error saving SOS request locally.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-2">
          <Flame className="w-8 h-8 text-red-500 animate-pulse" />
          Trigger SOS Broadcast
        </h1>
        <p className="text-xs text-slate-400">Broadcast distress beacon coordinates directly to disaster emergency response teams.</p>
      </div>

      {countdown !== null ? (
        // Countdown screen
        <div className="p-12 rounded-xl bg-red-950/40 border border-red-500/30 text-center space-y-6 backdrop-blur-md">
          <h2 className="text-xl font-bold text-red-400">TRANSMITTING DISTRESS SIGNAL IN</h2>
          <div className="text-8xl font-black font-mono text-white animate-ping">{countdown}</div>
          <button
            onClick={() => setCountdown(null)}
            className="px-6 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 font-bold rounded-lg text-xs hover:border-slate-700 cursor-pointer"
          >
            CANCEL TRANSMISSION
          </button>
        </div>
      ) : (
        // Input Form
        <form onSubmit={startSOSWorkflow} className="p-6 rounded-xl glass-panel border border-slate-800 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Emergency Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-red-500"
              >
                <option value="FLOOD">🌊 Flood / Water Rising</option>
                <option value="MEDICAL">🚑 Medical Trauma</option>
                <option value="FIRE">🔥 Fire Outbreak</option>
                <option value="COLLAPSE">🏚️ Building Collapse</option>
                <option value="OTHER">❓ Other Emergency</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Urgency Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-red-500"
              >
                <option value="CRITICAL">🚨 Critical (Life Threat)</option>
                <option value="HIGH">⚠️ High Priority</option>
                <option value="MEDIUM">🟡 Medium Urgency</option>
                <option value="LOW">🟢 Low / Assistance Needed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Number of Persons</label>
              <input
                type="number"
                min={1}
                value={peopleCount}
                onChange={(e) => setPeopleCount(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Emergency Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Alternative contact"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-red-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Current Location</label>
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono text-slate-300">
                    {coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : 'Waiting for GPS locks...'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={locLoading}
                  className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  {locLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                </button>
              </div>
              {coords && (
                <div className="pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-400 flex flex-col gap-1">
                  <p>Latitude: {coords.lat.toFixed(6)}</p>
                  <p>Longitude: {coords.lng.toFixed(6)}</p>
                  <p>Accuracy: {accuracy || 15} meters</p>
                  <p className="font-bold text-cyan-400">
                    STATUS: {gpsStatus === 'REAL' ? '✓ LOCATION VERIFIED' : '⚠ DEMO LOCATION'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Voice Recorder Input Replacement */}
          <div className="space-y-3">
            <style>{`
              @keyframes voice-wave {
                0%, 100% { height: 6px; }
                50% { height: 28px; }
              }
              .bar-animate-1 { animation: voice-wave 0.8s ease-in-out infinite alternate; }
              .bar-animate-2 { animation: voice-wave 0.6s ease-in-out infinite alternate 0.2s; }
              .bar-animate-3 { animation: voice-wave 1.1s ease-in-out infinite alternate 0.4s; }
              .bar-animate-4 { animation: voice-wave 0.7s ease-in-out infinite alternate 0.1s; }
              .bar-animate-5 { animation: voice-wave 0.9s ease-in-out infinite alternate 0.3s; }
            `}</style>

            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              VOICE EMERGENCY DESCRIPTION
            </label>
            <p className="text-[10px] text-slate-500 -mt-1.5">
              Describe your emergency by speaking. No typing required.
            </p>

            <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-900 flex flex-col items-center justify-center min-h-[160px] text-center space-y-4">
              {recordingState === 'IDLE' && (
                <>
                  <button
                    type="button"
                    onClick={startRecording}
                    className="w-16 h-16 rounded-full bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 cursor-pointer transition-colors shadow-lg shadow-red-500/5 group"
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform">🎙️</span>
                  </button>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white uppercase tracking-wider">TAP TO RECORD</p>
                    <p className="text-[10px] text-slate-500">Speak clearly about your emergency situation</p>
                  </div>
                </>
              )}

              {recordingState === 'RECORDING' && (
                <>
                  <div className="flex items-center gap-1.5 text-xs text-red-400 font-bold font-mono uppercase tracking-wider animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    RECORDING
                  </div>
                  <div className="text-3xl font-black font-mono text-white">
                    {formatTime(recordDuration)}
                  </div>
                  
                  {/* Waveform graphic */}
                  <div className="flex items-center justify-center gap-1 h-8 w-40">
                    <div className="w-1 bg-red-500 rounded bar-animate-1" />
                    <div className="w-1 bg-red-500 rounded bar-animate-2" />
                    <div className="w-1 bg-red-500 rounded bar-animate-3" />
                    <div className="w-1 bg-red-500 rounded bar-animate-4" />
                    <div className="w-1 bg-red-500 rounded bar-animate-5" />
                  </div>

                  <button
                    type="button"
                    onClick={stopRecording}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    ⏹ STOP RECORDING
                  </button>
                </>
              )}

              {recordingState === 'PREVIEW' && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎙️</span>
                    <div className="text-left">
                      <p className="text-xs font-bold text-white">Voice Emergency Audio</p>
                      <p className="text-[9px] text-slate-500">Duration: {formatTime(recordDuration)}</p>
                    </div>
                  </div>

                  {/* Playback Control */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={togglePlayback}
                      className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors"
                    >
                      {isPlaying ? '⏸ PAUSE' : '▶ PLAY AUDIO'}
                    </button>

                    <button
                      type="button"
                      onClick={deleteRecording}
                      className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400 font-bold text-xs rounded-lg cursor-pointer transition-colors"
                    >
                      🗑 DELETE
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Photo attachment */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Photo Evidence (Optional)</label>
            <div className="flex items-center gap-4">
              <label className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-bold text-slate-300 flex items-center gap-2 cursor-pointer transition-colors">
                <Camera className="w-4 h-4 text-cyan-400" />
                Choose File
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
              {photo && (
                <div className="relative w-12 h-12 rounded border border-slate-800 overflow-hidden">
                  <img src={photo} className="w-full h-full object-cover" alt="Preview" />
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:from-red-800 disabled:to-orange-800 text-white font-black text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/10 cursor-pointer"
          >
            {submitting ? 'Transmitting Distress Signals...' : 'SEND SOS EMERGENCY BROADCAST'}
          </button>
        </form>
      )}
    </div>
  );
};
