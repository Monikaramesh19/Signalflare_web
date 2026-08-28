import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Flame, ShieldAlert, WifiOff, Users, Compass, ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-red-600/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-600/10 blur-[150px]" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Signal<span className="text-red-500">Flare</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
            Login
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-sm font-semibold rounded-lg transition-colors"
          >
            Register
          </Link>
        </div>
      </header>

      {/* Hero section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-24 text-center max-w-4xl mx-auto z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 mb-6">
          <ShieldAlert className="w-4 h-4" />
          DISASTER RESPONSE NETWORK
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
          When the Signal Fails, <br />
          <span className="bg-gradient-to-r from-red-500 via-orange-500 to-cyan-400 bg-clip-text text-transparent">
            Help Shouldn't.
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mb-10 leading-relaxed">
          SignalFlare is an offline-first disaster response system designed to route emergency distress calls, allocate supplies, and track rescue teams when standard cell service is down.
        </p>

        {/* SOS Pulse Trigger */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16 w-full max-w-md">
          <button
            onClick={() => navigate('/quick-access')}
            className="flex-1 px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 sos-pulse-red transition-all cursor-pointer"
          >
            <Flame className="w-6 h-6 animate-bounce" />
            EMERGENCY QUICK ACCESS
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 rounded-xl glass-card">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center mb-4 border border-red-500/20">
              <WifiOff className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold mb-2">Offline Queue Sync</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Log SOS beacons and requests without a cell connection. Automatically syncs via IndexedDB as soon as network returns.
            </p>
          </div>

          <div className="p-6 rounded-xl glass-card">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold mb-2">Emergency Maps</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Find nearby rescue shelters, medical posts, and supply channels relative to your last recorded coordinates.
            </p>
          </div>

          <div className="p-6 rounded-xl glass-card">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center mb-4 border border-orange-500/20">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold mb-2">Volunteer Dispatch</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empower local volunteers to accept nearby requests, dispatch supplies, and update status logs in real-time.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 border-t border-slate-900 text-xs text-slate-500 mt-12">
        <p>© 2026 SignalFlare Emergency Portal. Built for high-reliability disaster logistics.</p>
      </footer>
    </div>
  );
};
