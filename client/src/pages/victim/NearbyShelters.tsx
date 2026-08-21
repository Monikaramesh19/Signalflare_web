import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import api from '../../services/api';
import { Compass, MapPin, Phone, Users, Info } from 'lucide-react';
import { getDistance, CHENNAI_FALLBACK } from '../../services/geospatial';

export const NearbyShelters: React.FC = () => {
  const [shelters, setShelters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number }>({ lat: CHENNAI_FALLBACK.lat, lng: CHENNAI_FALLBACK.lng });
  const [gpsStatus, setGpsStatus] = useState<'REAL' | 'DEMO'>('DEMO');

  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const loadShelters = async () => {
    try {
      // Get user current coordinates
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setGpsStatus('REAL');
          },
          () => {
            setUserLoc({ lat: CHENNAI_FALLBACK.lat, lng: CHENNAI_FALLBACK.lng });
            setGpsStatus('DEMO');
          }
        );
      }

      const response = await api.get('/shelters');
      setShelters(response.data);
    } catch (err) {
      console.warn('Offline mode or shelter API failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShelters();
  }, []);

  // Initialize and Update Map
  useEffect(() => {
    if (loading) return;

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
      const map = L.map('shelter-map').setView([userLoc.lat, userLoc.lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      mapRef.current = map;
    } else {
      mapRef.current.setView([userLoc.lat, userLoc.lng]);
    }

    const mapInstance = mapRef.current;
    if (mapInstance) {
      if (!layerGroupRef.current) {
        layerGroupRef.current = L.layerGroup().addTo(mapInstance);
      }
      const layerGroup = layerGroupRef.current;
      layerGroup.clearLayers();

      // User location marker
      L.marker([userLoc.lat, userLoc.lng], { icon: createMarkerIcon('#06b6d4', '📍') })
        .addTo(layerGroup)
        .bindPopup('<b>Your Location</b>');

      // Shelter markers
      shelters.forEach((sh) => {
        L.marker([sh.locationLat, sh.locationLng], { icon: createMarkerIcon('#10b981', '🏠') })
          .addTo(layerGroup)
          .bindPopup(`<b>${sh.name}</b><br/>Occupied: ${sh.occupied}/${sh.capacity} beds<br/>Contact: ${sh.contactPhone || 'N/A'}`);
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, [loading, userLoc, shelters]);

  const centerOnShelter = (lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 15);
    }
  };

  // Sort shelters dynamically by distance from user location
  const sortedShelters = [...shelters]
    .map((sh) => ({
      ...sh,
      distance: getDistance(userLoc.lat, userLoc.lng, sh.locationLat, sh.locationLng),
    }))
    .sort((a, b) => a.distance - b.distance);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <Compass className="w-8 h-8 text-cyan-400" />
            Disaster Relief Shelters
          </h1>
          <p className="text-xs text-slate-400">
            Locate active safe camps and query live occupancy levels sorted by geospatial proximity.
          </p>
        </div>
        {gpsStatus === 'DEMO' && (
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-mono text-[10px] font-bold h-fit uppercase tracking-wider animate-pulse">
            ⚠️ DEMO MODE — GEOSPATIAL DATA SIMULATED
          </span>
        )}
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500 font-mono">Querying shelters database...</div>
      ) : shelters.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-950/40 border border-slate-900 text-center text-xs text-slate-500 font-mono">
          No shelters currently registered in this district.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* List panel */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400">Active Safe Houses Nearby</h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {sortedShelters.map((sh) => {
                const pct = Math.round((sh.occupied / sh.capacity) * 100);

                return (
                  <div key={sh.id} className="p-5 rounded-xl bg-slate-950/40 border border-slate-900 flex justify-between items-start gap-4">
                    <div className="space-y-2">
                      <div>
                        <h3 className="text-white font-bold text-sm">{sh.name}</h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{sh.address}</p>
                      </div>
                      <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          {sh.distance} km away
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-cyan-400" />
                          {sh.contactPhone || 'N/A'}
                        </span>
                      </div>
                      <button
                        onClick={() => centerOnShelter(sh.locationLat, sh.locationLng)}
                        className="mt-1 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-400 text-[9px] font-bold rounded border border-slate-850 transition-colors cursor-pointer"
                      >
                        🔍 VIEW ON MAP
                      </button>
                    </div>

                    <div className="text-right space-y-1.5 flex-shrink-0">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {sh.occupied}/{sh.capacity} beds
                      </span>
                      <div className="w-24 bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${pct > 80 ? 'bg-red-500' : 'bg-cyan-500'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Map Visualizer */}
          <div className="p-6 rounded-xl glass-panel border border-slate-800 flex flex-col justify-between h-[500px]">
            <div>
              <h2 className="text-base font-bold text-white mb-2">Relief Zone Vector Map</h2>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Interactive spatial mapping centering on your current coordinates. Green markers represent active shelters.
              </p>
            </div>
            
            <div className="flex-1 bg-slate-950/50 rounded-lg border border-slate-900 overflow-hidden relative z-10">
              <div id="shelter-map" className="w-full h-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
