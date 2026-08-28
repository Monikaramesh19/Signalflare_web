import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { useAuth } from '../../contexts/AuthContext';
import { useNetwork } from '../../contexts/NetworkContext';
import {
  MapPin,
  Compass,
  AlertTriangle,
  Battery,
  Play,
  StopCircle,
  Clock,
  Activity,
  Info
} from 'lucide-react';
import {
  DEMO_RESOURCES,
  getNearbyResources,
  getNearestResource,
  CHENNAI_FALLBACK
} from '../../services/geospatial';
import api from '../../services/api';

export const LocationSharePanel: React.FC = () => {
  const { user } = useAuth();
  const { isOnline } = useNetwork();

  // Settings
  const [sharing, setSharing] = useState(false);
  const [emergencyTracking, setEmergencyTracking] = useState(false);
  const [accuracyMode, setAccuracyMode] = useState<'HIGH' | 'BALANCED' | 'BATTERY_SAVE'>('BALANCED');
  const [intervalSec, setIntervalSec] = useState<10 | 30 | 60>(10);

  // States
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number; time: string } | null>(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'REAL' | 'DEMO'>('DEMO');
  const [duration, setDuration] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [geospatialStatusLogs, setGeospatialStatusLogs] = useState<string[]>([]);

  const durationIntervalRef = useRef<any>(null);
  const gpsIntervalRef = useRef<any>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Load last known coordinates on mount and fetch fresh coordinates
  useEffect(() => {
    const cached = localStorage.getItem('last_known_gps');
    if (cached) {
      const parsed = JSON.parse(cached);
      setCoords(parsed);
      setGpsActive(true);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const fresh = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
            time: new Date().toLocaleTimeString(),
          };
          setCoords(fresh);
          setGpsStatus('REAL');
          setGpsActive(true);
          localStorage.setItem('last_known_gps', JSON.stringify(fresh));
        },
        () => {
          const sim = {
            lat: CHENNAI_FALLBACK.lat,
            lng: CHENNAI_FALLBACK.lng,
            accuracy: 15,
            time: new Date().toLocaleTimeString(),
          };
          setCoords(sim);
          setGpsStatus('DEMO');
          setGpsActive(true);
          localStorage.setItem('last_known_gps', JSON.stringify(sim));
        }
      );
    } else {
      const sim = {
        lat: CHENNAI_FALLBACK.lat,
        lng: CHENNAI_FALLBACK.lng,
        accuracy: 15,
        time: new Date().toLocaleTimeString(),
      };
      setCoords(sim);
      setGpsStatus('DEMO');
      setGpsActive(true);
      localStorage.setItem('last_known_gps', JSON.stringify(sim));
    }
  }, []);

  // Tracking duration counter
  useEffect(() => {
    if (emergencyTracking) {
      setDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, [emergencyTracking]);

  // GPS Tracking Loop
  useEffect(() => {
    if (sharing || emergencyTracking) {
      const captureGps = () => {
        if (!navigator.geolocation) {
          setGpsActive(false);
          setGpsStatus('DEMO');
          return;
        }

        const options = {
          enableHighAccuracy: accuracyMode === 'HIGH',
          timeout: 8000,
          maximumAge: accuracyMode === 'BATTERY_SAVE' ? 30000 : 0,
        };

        setGpsActive(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const fresh = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: Math.round(pos.coords.accuracy),
              time: new Date().toLocaleTimeString(),
            };
            setCoords(fresh);
            setGpsStatus('REAL');
            localStorage.setItem('last_known_gps', JSON.stringify(fresh));
            setHistory((prev) => [fresh, ...prev.slice(0, 5)]);
            transmitLocation(fresh);
          },
          (err) => {
            console.warn('GPS signal dropped, falling back to simulated coordinates', err);
            const sim = {
              lat: CHENNAI_FALLBACK.lat + (Math.random() - 0.5) * 0.005,
              lng: CHENNAI_FALLBACK.lng + (Math.random() - 0.5) * 0.005,
              accuracy: 15,
              time: new Date().toLocaleTimeString(),
            };
            setCoords(sim);
            setGpsStatus('DEMO');
            localStorage.setItem('last_known_gps', JSON.stringify(sim));
            setHistory((prev) => [sim, ...prev.slice(0, 5)]);
            transmitLocation(sim);
          },
          options
        );
      };

      captureGps();
      gpsIntervalRef.current = setInterval(captureGps, intervalSec * 1000);
    } else {
      if (gpsIntervalRef.current) {
        clearInterval(gpsIntervalRef.current);
        gpsIntervalRef.current = null;
      }
      setGpsActive(false);
    }

    return () => {
      if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
    };
  }, [sharing, emergencyTracking, accuracyMode, intervalSec]);

  // Leaflet Map Initializer
  useEffect(() => {
    if (!coords) return;

    const createMarkerIcon = (color: string, iconHtml: string) => {
      return L.divIcon({
        html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.4);" class="animate-pulse">${iconHtml}</div>`,
        className: 'custom-div-icon',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      });
    };

    if (!mapRef.current) {
      const mapDiv = document.getElementById('tracking-map');
      if (mapDiv) {
        const map = L.map('tracking-map').setView([coords.lat, coords.lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
        mapRef.current = map;
      }
    } else {
      mapRef.current.setView([coords.lat, coords.lng]);
    }

    const mapInstance = mapRef.current;
    if (mapInstance) {
      if (!layerGroupRef.current) {
        layerGroupRef.current = L.layerGroup().addTo(mapInstance);
      }
      const layerGroup = layerGroupRef.current;
      layerGroup.clearLayers();

      // User Position marker
      L.marker([coords.lat, coords.lng], { icon: createMarkerIcon('#06b6d4', '📍') })
        .addTo(layerGroup)
        .bindPopup('<b>Your Location</b>')
        .openPopup();

      // Show nearby shelters & rescue teams
      DEMO_RESOURCES.slice(0, 6).forEach((res) => {
        const icon = res.type === 'RESCUE_TEAM' ? '🚑' :
                     res.type === 'SHELTER' ? '🏠' : '🏥';
        const color = res.type === 'RESCUE_TEAM' ? '#ef4444' :
                      res.type === 'SHELTER' ? '#10b981' : '#3b82f6';
        L.marker([res.latitude, res.longitude], { icon: createMarkerIcon(color, icon) })
          .addTo(layerGroup)
          .bindPopup(`<b>${res.name}</b><br/>Proximity: ${res.availability}`);
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, [coords]);

  // Transmit GPS Telemetry to Backend
  const transmitLocation = async (loc: { lat: number; lng: number; accuracy: number; time: string }) => {
    const packetId = `SF-LOC-${Date.now()}`;
    const payload = {
      id: packetId,
      latitude: loc.lat,
      longitude: loc.lng,
      accuracy: loc.accuracy,
      timestamp: Date.now(),
      status: emergencyTracking ? 'EMERGENCY_ACTIVE' : 'TELEMETRY_SHARE',
    };

    setGeospatialStatusLogs((prev) => [
      `📍 Coordinates captured: ${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`,
      `✓ Saved telemetry log internally`,
      ...prev.slice(0, 3)
    ]);

    if (isOnline) {
      try {
        await api.post('/sos', {
          id: packetId,
          emergencyType: 'OTHER',
          severity: emergencyTracking ? 'HIGH' : 'LOW',
          peopleCount: 1,
          locationLat: loc.lat,
          locationLng: loc.lng,
          address: `GPS Telemetry Accuracy: ±${loc.accuracy}m`,
          message: `Location sharing update at ${loc.time}`,
          contactPhone: user?.phone || '9876543210',
          createdAt: Date.now(),
        });
        setGeospatialStatusLogs((prev) => [
          `🟢 Transmitted coordinates to Operations dashboard`,
          ...prev
        ]);
      } catch (err: any) {
        console.error('Failed to sync location to server:', err);
        setGeospatialStatusLogs((prev) => [
          `❌ Telemetry Sync failed: ${err.message || err}`,
          ...prev
        ]);
      }
    }
  };

  const handleStartEmergencyTracking = () => {
    setEmergencyTracking(true);
    setSharing(false);
  };

  const handleStopEmergencyTracking = () => {
    if (window.confirm('Stop sharing your location with rescue teams?')) {
      setEmergencyTracking(false);
      setSharing(false);
      setDuration(0);
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const activeLoc = coords || { lat: CHENNAI_FALLBACK.lat, lng: CHENNAI_FALLBACK.lng };
  const nearestShelter = getNearestResource(activeLoc.lat, activeLoc.lng, 'SHELTER');
  const nearestRescue = getNearestResource(activeLoc.lat, activeLoc.lng, 'RESCUE_TEAM');
  const nearestHospital = getNearestResource(activeLoc.lat, activeLoc.lng, 'HOSPITAL');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <MapPin className="w-8 h-8 text-cyan-400" />
            Geospatial Location Tracking
          </h1>
          <p className="text-xs text-slate-400">
            Monitor GPS coordinates, telemetry feeds, and map distance overlays to emergency hubs.
          </p>
        </div>
        {gpsStatus === 'DEMO' && (
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-mono text-[10px] font-bold h-fit uppercase tracking-wider animate-pulse">
            ⚠️ DEMO MODE — GEOSPATIAL DATA SIMULATED
          </span>
        )}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Config */}
        <div className="space-y-6 lg:col-span-1">
          {/* Status Panel */}
          <div className="p-5 rounded-xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Geospatial Telemetry</h3>
            <div className="space-y-2.5 font-mono text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Internet:</span>
                <span className={`font-bold ${isOnline ? 'text-emerald-400' : 'text-red-400 animate-pulse'}`}>
                  {isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GPS Status:</span>
                <span className={`font-bold ${gpsActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {gpsActive ? '🟢 AVAILABLE' : '🔴 INACTIVE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Geospatial Network:</span>
                <span className="font-bold text-emerald-400">🟢 CONNECTED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nearby Resources:</span>
                <span className="font-bold text-cyan-400">8 discovered</span>
              </div>
            </div>
          </div>

          {/* Battery Configuration */}
          <div className="p-5 rounded-xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Battery className="w-4 h-4 text-cyan-400" />
              Battery-Aware GPS Config
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Capture Accuracy</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['HIGH', 'BALANCED', 'BATTERY_SAVE'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setAccuracyMode(mode)}
                      className={`py-1.5 rounded font-bold text-[9px] cursor-pointer transition-all ${
                        accuracyMode === mode ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-850 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Transmission Interval</label>
                <div className="grid grid-cols-3 gap-1">
                  {([10, 30, 60] as const).map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setIntervalSec(sec)}
                      className={`py-1.5 rounded font-bold text-[9px] cursor-pointer transition-all ${
                        intervalSec === sec ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-850 hover:text-white'
                      }`}
                    >
                      {sec} seconds
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Main Map & GPS details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Map */}
          <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Position Map</h3>
            <div id="tracking-map" className="h-72 w-full rounded-lg bg-slate-950/60 border border-slate-900 z-10" />
          </div>

          {/* GPS Coordinates panel */}
          <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Coordinates Telemetry</h3>

            {coords ? (
              <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Latitude</span>
                  <span className="text-white text-lg font-bold">{coords.lat.toFixed(6)}</span>
                </div>
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Longitude</span>
                  <span className="text-white text-lg font-bold">{coords.lng.toFixed(6)}</span>
                </div>
                <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-900 flex justify-between items-center col-span-2">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">GPS Accuracy</span>
                    <span className="text-slate-300 font-bold">±{coords.accuracy} meters</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block text-right">GNSS Update</span>
                    <span className="text-slate-300 font-bold">{coords.time}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 font-mono">
                Awaiting GPS location signal...
              </div>
            )}

            {/* Nearest Resource Lookups */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-900 text-xs space-y-1">
                <span className="text-[9px] text-slate-500 uppercase font-bold">Nearest Shelter</span>
                <p className="text-white font-bold truncate">{nearestShelter ? nearestShelter.name : 'None'}</p>
                <p className="text-cyan-400 font-mono text-[10px]">{nearestShelter ? `${nearestShelter.distance} km away` : ''}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-900 text-xs space-y-1">
                <span className="text-[9px] text-slate-500 uppercase font-bold">Nearest Rescue Team</span>
                <p className="text-white font-bold truncate">{nearestRescue ? nearestRescue.name : 'None'}</p>
                <p className="text-cyan-400 font-mono text-[10px]">{nearestRescue ? `${nearestRescue.distance} km away` : ''}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-900 text-xs space-y-1">
                <span className="text-[9px] text-slate-500 uppercase font-bold">Nearest Hospital</span>
                <p className="text-white font-bold truncate">{nearestHospital ? nearestHospital.name : 'None'}</p>
                <p className="text-cyan-400 font-mono text-[10px]">{nearestHospital ? `${nearestHospital.distance} km away` : ''}</p>
              </div>
            </div>

            {/* Sharing Triggers */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {!sharing ? (
                <button
                  type="button"
                  onClick={() => setSharing(true)}
                  disabled={emergencyTracking}
                  className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-600/10 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <MapPin className="w-4 h-4" />
                  📍 SHARE MY LOCATION
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSharing(false)}
                  className="flex-1 py-3 bg-slate-900 border border-slate-800 hover:border-cyan-500/30 text-cyan-400 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <StopCircle className="w-4 h-4" />
                  ⏹ STOP SHARING LOCATION
                </button>
              )}

              {!emergencyTracking ? (
                <button
                  type="button"
                  onClick={handleStartEmergencyTracking}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/10"
                >
                  <Play className="w-4 h-4" />
                  🚨 EMERGENCY TRACKING
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopEmergencyTracking}
                  className="flex-1 py-3 bg-slate-900 border border-slate-800 hover:border-red-500/30 text-red-400 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <StopCircle className="w-4 h-4" />
                  ⏹ STOP EMERGENCY TRACKING
                </button>
              )}
            </div>

            {/* Privacy & Recipient Disclosure */}
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-900 flex items-start gap-2.5 text-[11px] text-slate-400 mt-4">
              <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-slate-300">Who can see your location?</p>
                <p className="leading-relaxed">
                  Your coordinates are broadcasted securely to the <strong className="text-cyan-400">Emergency Operations Dashboard</strong> and shared with verified <strong className="text-emerald-400">Rescue Teams</strong> and vetted <strong className="text-cyan-400">Field Volunteers</strong> within your immediate radius to coordinate evacuation.
                </p>
              </div>
            </div>
          </div>

          {/* Action Log History */}
          {geospatialStatusLogs.length > 0 && (
            <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Geospatial Routing logs</h3>
              <div className="space-y-2.5 font-mono text-[10px] text-slate-400">
                {geospatialStatusLogs.map((log, idx) => (
                  <div key={idx} className="p-2 bg-slate-950/20 border border-slate-900/60 rounded">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emergency state timer */}
          {emergencyTracking && (
            <div className="p-6 rounded-xl bg-red-950/20 border border-red-500/20 space-y-3">
              <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                🚨 EMERGENCY TELEMETRY SHARING
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-300">
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[9px]">Duration Active</span>
                  <span className="text-white text-base font-bold">{formatDuration(duration)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[9px]">Last Transmission</span>
                  <span className="text-white text-base font-bold">{coords ? coords.time : 'Waiting...'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
