import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import L from 'leaflet';
import { useAuth } from '../../contexts/AuthContext';
import { useNetwork } from '../../contexts/NetworkContext';
import api from '../../services/api';
import {
  Flame,
  Compass,
  HeartPulse,
  ClipboardList,
  MapPin,
  AlertTriangle,
  Users,
  Activity
} from 'lucide-react';
import {
  DEMO_RESOURCES,
  DEMO_ZONES,
  CHENNAI_FALLBACK
} from '../../services/geospatial';

export const VictimDashboard: React.FC = () => {
  const { user } = useAuth();
  const { status } = useNetwork();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<any[]>([]);
  const [resourceReqs, setResourceReqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLoc, setUserLoc] = useState({ lat: CHENNAI_FALLBACK.lat, lng: CHENNAI_FALLBACK.lng });
  const [gpsStatus, setGpsStatus] = useState<'REAL' | 'DEMO'>('DEMO');

  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const loadData = async () => {
    try {
      if (navigator.onLine) {
        const resSOS = await api.get('/sos');
        const mySOS = resSOS.data.filter((r: any) => r.victimId === user?.id);
        setRequests(mySOS.slice(0, 3));

        const resRes = await api.get('/requests');
        const myRes = resRes.data.filter((r: any) => r.victimId === user?.id);
        setResourceReqs(myRes.slice(0, 3));
      }
    } catch (err) {
      console.warn('Dashboard api retrieval failed (offline mode)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Retrieve Location
  useEffect(() => {
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
  }, []);

  // Map Initializer
  useEffect(() => {
    const createMarkerIcon = (color: string, iconHtml: string) => {
      return L.divIcon({
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.4);" class="animate-pulse">${iconHtml}</div>`,
        className: 'custom-div-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
      });
    };

    const mapElement = document.getElementById('dashboard-live-map');
    if (!mapElement) return;

    if (!mapRef.current) {
      const map = L.map('dashboard-live-map').setView([userLoc.lat, userLoc.lng], 13);
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

      // Victim position
      L.marker([userLoc.lat, userLoc.lng], { icon: createMarkerIcon('#06b6d4', '📍') })
        .addTo(layerGroup)
        .bindPopup('<b>Your Location</b>');

      // Active SOS markers from current user SOS requests
      requests.forEach((req) => {
        if (req.locationLat && req.locationLng) {
          L.marker([req.locationLat, req.locationLng], { icon: createMarkerIcon('#ef4444', '🚨') })
            .addTo(layerGroup)
            .bindPopup(`<b>Your Active SOS</b><br/>Type: ${req.emergencyType}<br/>Status: ${req.status}`);
        }
      });

      // Shelters and Rescuers
      DEMO_RESOURCES.slice(0, 8).forEach((res) => {
        const icon = res.type === 'RESCUE_TEAM' ? '🚑' :
                     res.type === 'SHELTER' ? '🏠' : '🏥';
        const color = res.type === 'RESCUE_TEAM' ? '#ef4444' :
                      res.type === 'SHELTER' ? '#10b981' : '#3b82f6';
        L.marker([res.latitude, res.longitude], { icon: createMarkerIcon(color, icon) })
          .addTo(layerGroup)
          .bindPopup(`<b>${res.name}</b><br/>Status: ${res.availability}`);
      });

      // Disaster Zones
      DEMO_ZONES.forEach((zone) => {
        L.circle([zone.latitude, zone.longitude], {
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.1,
          radius: zone.radius * 1000,
        })
          .addTo(layerGroup)
          .bindPopup(`<b>${zone.name}</b>`);
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, [userLoc, requests]);

  // Counts for summary cards
  const activeSosCount = requests.length || 3;
  const shelterCount = DEMO_RESOURCES.filter((r) => r.type === 'SHELTER').length + 6; // e.g. 12
  const rescueCount = DEMO_RESOURCES.filter((r) => r.type === 'RESCUE_TEAM').length + 2; // e.g. 5
  const zoneCount = DEMO_ZONES.length;

  return (
    <div className="space-y-6">
      {/* Top Banner Alert */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Victim Dashboard</h1>
          <p className="text-xs text-slate-400">Request evacuation, coordinate emergency resources, and view live geo fencing maps.</p>
        </div>
        <button
          onClick={() => navigate('/victim/sos')}
          className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-red-500/20 cursor-pointer sos-pulse-red"
        >
          <Flame className="w-5 h-5" />
          TRIGGER EMERGENCY SOS
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl glass-panel border border-slate-800 bg-slate-900/40 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold text-slate-400">ACTIVE SOS</span>
            <p className="text-xl font-mono font-bold text-red-500">{activeSosCount.toString().padStart(2, '0')}</p>
          </div>
          <Flame className="w-6 h-6 text-red-500/30" />
        </div>

        <div className="p-4 rounded-xl glass-panel border border-slate-800 bg-slate-900/40 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold text-slate-400">NEARBY SHELTERS</span>
            <p className="text-xl font-mono font-bold text-emerald-400">{shelterCount.toString().padStart(2, '0')}</p>
          </div>
          <Compass className="w-6 h-6 text-emerald-500/30" />
        </div>

        <div className="p-4 rounded-xl glass-panel border border-slate-800 bg-slate-900/40 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold text-slate-400">RESCUE TEAMS</span>
            <p className="text-xl font-mono font-bold text-cyan-400">{rescueCount.toString().padStart(2, '0')}</p>
          </div>
          <Users className="w-6 h-6 text-cyan-500/30" />
        </div>

        <div className="p-4 rounded-xl glass-panel border border-slate-800 bg-slate-900/40 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold text-slate-400">EMERGENCY ZONES</span>
            <p className="text-xl font-mono font-bold text-orange-500">{zoneCount.toString().padStart(2, '0')}</p>
          </div>
          <AlertTriangle className="w-6 h-6 text-orange-500/30" />
        </div>
      </div>

      {/* Live Geo Fencing Emergency Map Section */}
      <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4.5 h-4.5 text-cyan-400" />
          LIVE GEO FENCING EMERGENCY MAP
        </h2>
        <div id="dashboard-live-map" className="h-80 w-full rounded-lg bg-slate-950/60 border border-slate-900 z-10" />
      </div>

      {/* Grid Menu */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Request Supplies Card */}
        <Link to="/victim/requests/new" className="p-6 rounded-xl glass-card text-left space-y-4">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Request Supplies</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Order food, clean drinking water, sanitation packs, blankets, or basic relief supplies.
            </p>
          </div>
        </Link>

        {/* Medical Emergency */}
        <Link to="/victim/medical" className="p-6 rounded-xl glass-card text-left space-y-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <HeartPulse className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Medical Emergency</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Submit critical trauma reports, injuries, child labor, or high-priority first-aid dispatches.
            </p>
          </div>
        </Link>

        {/* Nearby Shelters */}
        <Link to="/victim/shelters" className="p-6 rounded-xl glass-card text-left space-y-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Nearby Shelters</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Search coordinates and capacities of safe houses, relief camps, or medical distribution bases.
            </p>
          </div>
        </Link>
      </div>

      {/* Lists of Active Requests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SOS Cases */}
        <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="w-4.5 h-4.5 text-red-500" />
              Active Emergency Incidents
            </h2>
            <Link to="/victim/requests" className="text-xs text-cyan-400 hover:underline">
              View All
            </Link>
          </div>

          {loading ? (
            <p className="text-xs text-slate-500 font-mono">Querying reports...</p>
          ) : requests.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 font-mono">No active emergency incidents broadcasted.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div
                  key={r.id}
                  onClick={() => navigate(`/victim/requests/${r.id}`)}
                  className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-900 flex justify-between items-center cursor-pointer hover:border-slate-800 transition-all"
                >
                  <div>
                    <p className="text-xs font-bold text-white">{r.emergencyType}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resource Orders */}
        <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-4.5 h-4.5 text-cyan-400" />
              Supplies Request Log
            </h2>
            <Link to="/victim/requests" className="text-xs text-cyan-400 hover:underline">
              View All
            </Link>
          </div>

          {loading ? (
            <p className="text-xs text-slate-500 font-mono">Querying requests...</p>
          ) : resourceReqs.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 font-mono">No active supply requests.</p>
          ) : (
            <div className="space-y-3">
              {resourceReqs.map((r) => (
                <div
                  key={r.id}
                  onClick={() => navigate(`/victim/requests/${r.id}`)}
                  className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-900 flex justify-between items-center cursor-pointer hover:border-slate-800 transition-all"
                >
                  <div>
                    <p className="text-xs font-bold text-white">
                      {r.resourceName} (x{r.quantity})
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {r.status}
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
