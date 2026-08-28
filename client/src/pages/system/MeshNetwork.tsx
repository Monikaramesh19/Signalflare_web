import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Compass,
  MapPin,
  HeartPulse,
  Activity,
  AlertTriangle,
  Smartphone,
  Phone,
  Radio,
  Info
} from 'lucide-react';
import { useNetwork } from '../../contexts/NetworkContext';
import {
  DEMO_RESOURCES,
  DEMO_ZONES,
  getNearbyResources,
  CHENNAI_FALLBACK
} from '../../services/geospatial';

export const MeshNetwork: React.FC = () => {
  const { isOnline } = useNetwork();
  const [userLoc, setUserLoc] = useState({ lat: CHENNAI_FALLBACK.lat, lng: CHENNAI_FALLBACK.lng });
  const [accuracy, setAccuracy] = useState<number | null>(12);
  const [gpsStatus, setGpsStatus] = useState<'REAL' | 'DEMO'>('DEMO');
  const [loadingGps, setLoadingGps] = useState(true);

  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize GPS Location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setAccuracy(Math.round(pos.coords.accuracy));
          setGpsStatus('REAL');
          setLoadingGps(false);
        },
        (err) => {
          console.warn('Geolocation failed, fallback to Chennai', err);
          setUserLoc({ lat: CHENNAI_FALLBACK.lat, lng: CHENNAI_FALLBACK.lng });
          setAccuracy(15);
          setGpsStatus('DEMO');
          setLoadingGps(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setUserLoc({ lat: CHENNAI_FALLBACK.lat, lng: CHENNAI_FALLBACK.lng });
      setAccuracy(15);
      setGpsStatus('DEMO');
      setLoadingGps(false);
    }
  }, []);

  // Initialize and Update Map
  useEffect(() => {
    if (loadingGps) return;

    // Custom marker creator
    const createMarkerIcon = (color: string, iconHtml: string, size: number = 32) => {
      return L.divIcon({
        html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">${iconHtml}</div>`,
        className: 'custom-div-icon',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
      });
    };

    if (!mapRef.current) {
      // Create map
      const map = L.map('geo fencing-map').setView([userLoc.lat, userLoc.lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      mapRef.current = map;
    } else {
      mapRef.current.setView([userLoc.lat, userLoc.lng], 13);
    }

    const mapInstance = mapRef.current;

    // Clear existing markers/zones
    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(mapInstance);
    }
    layerGroupRef.current.clearLayers();

    const layerGroup = layerGroupRef.current;

    // Add user marker
    L.marker([userLoc.lat, userLoc.lng], { icon: createMarkerIcon('#06b6d4', '📍', 36) })
      .addTo(layerGroup)
      .bindPopup(`<b>Your Location</b><br/>Status: ${gpsStatus === 'REAL' ? 'GPS Signal' : 'Demo Fallback'}`);

    // Add resources markers
    DEMO_RESOURCES.forEach((res) => {
      const icon = res.type === 'RESCUE_TEAM' ? '🚑' :
                   res.type === 'SHELTER' ? '🏠' :
                   res.type === 'HOSPITAL' ? '🏥' :
                   res.type === 'FIRE_STATION' ? '🚒' : '👮';
      const color = res.type === 'RESCUE_TEAM' ? '#ef4444' :
                    res.type === 'SHELTER' ? '#10b981' :
                    res.type === 'HOSPITAL' ? '#3b82f6' :
                    res.type === 'FIRE_STATION' ? '#f97316' : '#a855f7';

      L.marker([res.latitude, res.longitude], { icon: createMarkerIcon(color, icon) })
        .addTo(layerGroup)
        .bindPopup(`<b>${res.name}</b><br/>Type: ${res.type}<br/>Status: ${res.status}<br/>Contact: ${res.contact}`);
    });

    // Add disaster zone circles
    DEMO_ZONES.forEach((zone) => {
      L.circle([zone.latitude, zone.longitude], {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.15,
        radius: zone.radius * 1000, // km to meters
      })
        .addTo(layerGroup)
        .bindPopup(`<b>${zone.name}</b><br/>Severity: ${zone.severity}<br/>Radius: ${zone.radius} km<br/>Status: ${zone.status}`);
    });

    return () => {
      // Clean up map instance on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, [loadingGps, userLoc, gpsStatus]);

  const focusOnResource = (lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 15);
      // Open popup manually if possible
    }
  };

  const nearbyResources = getNearbyResources(userLoc.lat, userLoc.lng);
  const activeZonesCount = DEMO_ZONES.length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header and Demo Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <Compass className="w-8 h-8 text-cyan-400 animate-pulse" />
            📡 SignalFlare Geo Fencing Network
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time geo fencing mapping, GPS tracking, disaster zone telemetry, and proximity calculations.
          </p>
        </div>
        {gpsStatus === 'DEMO' && (
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-mono text-[10px] font-bold h-fit uppercase tracking-wider animate-pulse">
            ⚠️ DEMO MODE — GEO FENCING DATA SIMULATED
          </span>
        )}
      </div>

      {/* Network Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl glass-panel border border-slate-800 bg-slate-900/40 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">GPS STATUS</span>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${gpsStatus === 'REAL' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <span className="text-xs font-bold text-white font-mono">
              {gpsStatus === 'REAL' ? 'LOCATION AVAILABLE' : 'DEMO FALLBACK'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl glass-panel border border-slate-800 bg-slate-900/40 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">LOCATION ACCURACY</span>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-bold text-white font-mono">
              {accuracy ? `± ${accuracy} meters` : 'Unknown'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl glass-panel border border-slate-800 bg-slate-900/40 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">NEARBY RESOURCES</span>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white font-mono">
              {nearbyResources.length} Discovered
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl glass-panel border border-slate-800 bg-slate-900/40 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">ACTIVE EMERGENCY ZONES</span>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-bold text-white font-mono">
              {activeZonesCount} Active
            </span>
          </div>
        </div>
      </div>

      {/* Geo Fencing Map Container */}
      <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Interactive Operations Map</h3>
        
        {loadingGps ? (
          <div className="h-96 rounded-lg bg-slate-950 border border-slate-900 flex items-center justify-center font-mono text-xs text-slate-500">
            Awaiting GNSS Satellite Fix...
          </div>
        ) : (
          <div id="geo fencing-map" className="h-[450px] w-full rounded-lg relative z-10 border border-slate-800" />
        )}

        {/* Legend */}
        <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-900 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-2"><span className="text-base">📍</span> Victim Location</div>
          <div className="flex items-center gap-2"><span className="text-base">🚑</span> Rescue Team</div>
          <div className="flex items-center gap-2"><span className="text-base">🏠</span> Shelter</div>
          <div className="flex items-center gap-2"><span className="text-base">🏥</span> Hospital</div>
          <div className="flex items-center gap-2"><span className="text-base">🚒</span> Fire Station</div>
          <div className="flex items-center gap-2"><span className="text-base">👮</span> Police Station</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500/30 border border-red-500" /> Emergency Zone</div>
        </div>
      </div>

      {/* Nearest Emergency Resources List */}
      <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white">NEAREST EMERGENCY RESOURCES</h2>
        <p className="text-xs text-slate-400">Discovered resources sorted automatically by geo fencing distance from your current coordinate.</p>

        {loadingGps ? (
          <div className="py-4 font-mono text-xs text-slate-500">Calculating proximities...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearbyResources.map((res) => (
              <div key={res.id} className="p-4 rounded-lg bg-slate-950/40 border border-slate-900 flex flex-col justify-between gap-3 text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-white">{res.name}</h4>
                    <span className="font-mono font-bold text-cyan-400 bg-cyan-950/30 border border-cyan-800/20 px-2 py-0.5 rounded text-[10px]">
                      {res.distance} km away
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">Type: {res.type.replace('_', ' ')}</p>
                  <p className="text-[10px] font-mono">
                    Status: <span className="text-emerald-400 font-bold">{res.availability}</span>
                  </p>
                  {res.capacity && <p className="text-[10px] text-slate-400 font-mono">Capacity: {res.capacity}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => focusOnResource(res.latitude, res.longitude)}
                    className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-850 text-cyan-400 font-bold text-[10px] rounded border border-slate-850 transition-colors cursor-pointer"
                  >
                    🔍 VIEW ON MAP
                  </button>
                  <a
                    href={`tel:${res.contact}`}
                    className="flex items-center justify-center px-3 py-1.5 bg-cyan-900/10 hover:bg-cyan-600 border border-cyan-500/20 rounded font-bold text-[10px] text-cyan-400 hover:text-white"
                  >
                    <Phone className="w-3 h-3 mr-1" />
                    CALL
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info/Disclaimer Footer */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 flex gap-3 text-xs text-slate-400 leading-relaxed">
        <Info className="w-5 h-5 flex-shrink-0 text-cyan-400" />
        <p>
          SignalFlare uses GPS coordinates and geo fencing lookup algorithms to verify nearest rescue nodes and shelters. Distance indicators update automatically according to standard coordinate updates.
        </p>
      </div>
    </div>
  );
};
