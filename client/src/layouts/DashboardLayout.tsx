import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNetwork } from '../contexts/NetworkContext';
import {
  Flame,
  Activity,
  User as UserIcon,
  Shield,
  LifeBuoy,
  Wifi,
  WifiOff,
  RefreshCw,
  LogOut,
  Map,
  ClipboardList,
  Compass,
  MessageSquare,
  HelpCircle,
  Users,
  Settings,
  Database,
  Grid,
  Radio
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { status, triggerSync, lastSyncTime } = useNetwork();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Define sidebar links based on user role
  const getSidebarItems = (): SidebarItem[] => {
    if (!user) return [];

    switch (user.role) {
      case 'VICTIM':
        return [
          { name: 'Dashboard', path: '/victim/dashboard', icon: <Grid className="w-5 h-5" /> },
          { name: 'SOS Panel', path: '/victim/sos', icon: <Flame className="w-5 h-5 text-red-500" /> },
          { name: 'My Requests', path: '/victim/requests', icon: <ClipboardList className="w-5 h-5" /> },
          { name: 'Nearby Shelters', path: '/victim/shelters', icon: <Compass className="w-5 h-5" /> },
          { name: 'Location Tracking', path: '/victim/location', icon: <Map className="w-5 h-5" /> },
          { name: 'Emergency Contacts', path: '/victim/contacts', icon: <HelpCircle className="w-5 h-5" /> },
          { name: 'Geo Fencing Network', path: '/mesh', icon: <Radio className="w-5 h-5 text-cyan-400" /> },
          { name: 'Profile & Settings', path: '/victim/profile', icon: <UserIcon className="w-5 h-5" /> },
        ];
      case 'VOLUNTEER':
        return [
          { name: 'Dashboard', path: '/volunteer/dashboard', icon: <Grid className="w-5 h-5" /> },
          { name: 'Nearby SOS', path: '/volunteer/tasks/nearby', icon: <Flame className="w-5 h-5 text-orange-500" /> },
          { name: 'Active Rescue', path: '/volunteer/tasks/active', icon: <Compass className="w-5 h-5" /> },
          { name: 'Delivery Center', path: '/volunteer/delivery', icon: <ClipboardList className="w-5 h-5" /> },
          { name: 'Responder Map', path: '/volunteer/map', icon: <Map className="w-5 h-5" /> },
          { name: 'Chat Box', path: '/volunteer/chat', icon: <MessageSquare className="w-5 h-5" /> },
          { name: 'Geo Fencing Network', path: '/mesh', icon: <Radio className="w-5 h-5 text-cyan-400 animate-pulse" /> },
          { name: 'Profile & Skills', path: '/volunteer/profile', icon: <UserIcon className="w-5 h-5" /> },
        ];
      case 'RESCUE':
        return [
          { name: 'Control Room', path: '/rescue/dashboard', icon: <Grid className="w-5 h-5" /> },
          { name: 'Live Command Map', path: '/rescue/map', icon: <Map className="w-5 h-5 text-cyan-400" /> },
          { name: 'SOS Monitor', path: '/rescue/sos', icon: <Flame className="w-5 h-5 text-red-500" /> },
          { name: 'Operations', path: '/rescue/operations', icon: <Compass className="w-5 h-5" /> },
          { name: 'Shelters', path: '/rescue/shelters', icon: <Compass className="w-5 h-5" /> },
          { name: 'Resources Inventory', path: '/rescue/resources', icon: <ClipboardList className="w-5 h-5" /> },
          { name: 'Communication', path: '/rescue/chat', icon: <MessageSquare className="w-5 h-5" /> },
          { name: 'Geo Fencing Network', path: '/mesh', icon: <Radio className="w-5 h-5 text-cyan-400" /> },
          { name: 'Analytics Board', path: '/rescue/analytics', icon: <Activity className="w-5 h-5" /> },
        ];
      case 'ADMIN':
        return [
          { name: 'Admin Hub', path: '/admin/dashboard', icon: <Grid className="w-5 h-5" /> },
          { name: 'User Directory', path: '/admin/users', icon: <Users className="w-5 h-5" /> },
          { name: 'Emergency Events', path: '/admin/emergencies', icon: <Flame className="w-5 h-5" /> },
          { name: 'Master Inventory', path: '/admin/resources', icon: <ClipboardList className="w-5 h-5" /> },
          { name: 'System Analytics', path: '/admin/analytics', icon: <Activity className="w-5 h-5" /> },
          { name: 'Server Telemetry', path: '/admin/health', icon: <Database className="w-5 h-5" /> },
          { name: 'Audit Tracker', path: '/admin/audit-logs', icon: <Shield className="w-5 h-5" /> },
          { name: 'Geo Fencing Network', path: '/mesh', icon: <Radio className="w-5 h-5 text-cyan-400" /> },
        ];
      default:
        return [];
    }
  };

  const navItems = getSidebarItems();

  const getNetworkBadge = () => {
    switch (status) {
      case 'ONLINE':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Wifi className="w-3.5 h-3.5 mr-1" />
            🟢 ONLINE
          </span>
        );
      case 'SYNCING':
        return (
          <button
            onClick={() => triggerSync()}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 cursor-pointer animate-pulse"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
            🟠 SYNCING...
          </button>
        );
      case 'OFFLINE':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <WifiOff className="w-3.5 h-3.5 mr-1" />
            🔴 OFFLINE
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] flex flex-col">
      {/* Top Banner for Offline Mode */}
      {status === 'OFFLINE' && (
        <div className="bg-cyan-950/60 border-b border-cyan-500/20 px-4 py-2 text-center text-xs font-medium text-cyan-300 backdrop-blur-md">
          📡 Internet Unavailable. Geo Fencing tracking and nearest resource lookup are active. Sharing location telemetry.
        </div>
      )}

      {/* Header bar */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white"
          >
            <Activity className="w-6 h-6" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Flame className="w-5 h-5 text-white animate-pulse" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white glow-cyan">
              Signal<span className="text-red-500">Flare</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            {getNetworkBadge()}
            <Link
              to="/sync"
              className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync Center
            </Link>
            <span className="text-slate-600">|</span>
            <Link
              to="/help"
              className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Help manual
            </Link>
          </div>

          <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-white">{user?.name}</p>
              <p className="text-[10px] text-cyan-400 font-mono tracking-widest">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <aside
          className={`w-64 glass-panel border-r border-slate-800 flex flex-col justify-between py-6 px-4 md:static fixed inset-y-0 left-0 transform transition-transform duration-300 z-30 md:translate-x-0 ${
            mobileOpen ? 'translate-x-0 pt-20' : '-translate-x-full'
          }`}
        >
          <div className="space-y-6">
            <div className="px-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Navigation</span>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-red-950/40 to-slate-900/50 text-white border-l-4 border-red-500'
                        : 'text-slate-400 hover:bg-slate-900/40 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="space-y-4 px-3 pt-6 border-t border-slate-900">
            <div className="text-[11px] text-slate-500">
              <p>Last synced:</p>
              <p className="font-mono text-cyan-400 mt-0.5">
                {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Never'}
              </p>
            </div>
            <button
              onClick={() => triggerSync()}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Force sync
            </button>
          </div>
        </aside>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#040810]">
          {children}
        </main>
      </div>
    </div>
  );
};
