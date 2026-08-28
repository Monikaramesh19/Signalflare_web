import React from 'react';
import { HelpCircle, Flame, ShieldAlert, Heart, Activity, PhoneCall } from 'lucide-react';

export const HelpCenter: React.FC = () => {
  const checklists = [
    {
      title: 'Disaster Prep Pack',
      items: [
        '3 days supply of clean drinking water (4 liters per person/day)',
        'Non-perishable food (biscuits, energy bars, dry fruits)',
        'Battery-powered or hand-crank radio',
        'First-aid supplies, band-aids, antiseptics, chronic medicines',
        'Physical copies of emergency contacts and documents',
        'Waterproof flashlight and extra batteries',
      ],
    },
    {
      title: 'During Flood Warning',
      items: [
        'Listen to emergency announcements via radio or SignalFlare updates.',
        'Elevate valuable furniture and appliances above predicted water heights.',
        'Lock and latch windows/doors. Seal openings if water is rising.',
        'Unplug electronics and shut down gas mains.',
        'Prepare emergency coordinates to share with rescue teams.',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Emergency Info & Help Center</h1>
        <p className="text-xs text-slate-400">First-aid manuals, cyclone guides, and disaster survival protocols.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {checklists.map((chk) => (
          <div key={chk.title} className="p-6 rounded-xl glass-panel border border-slate-800">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              {chk.title}
            </h2>
            <ul className="space-y-3">
              {chk.items.map((item, idx) => (
                <li key={idx} className="flex gap-2 text-xs text-slate-300 leading-relaxed">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Heart className="w-5 h-5 text-cyan-400 animate-pulse" />
          Basic CPR Guidelines (Cardiopulmonary Resuscitation)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-900">
            <span className="text-lg font-black text-cyan-400 block mb-1">1. Check Response</span>
            Tap the shoulder, shout "Are you okay?", and look for normal chest breathing movements.
          </div>
          <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-900">
            <span className="text-lg font-black text-cyan-400 block mb-1">2. Call for Help</span>
            Dial 102/108 or push the SignalFlare SOS emergency button to transmit coordinates.
          </div>
          <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-900">
            <span className="text-lg font-black text-cyan-400 block mb-1">3. Chest Compressions</span>
            Push hard and fast in the center of the chest (100–120 compressions per minute).
          </div>
        </div>
      </div>
    </div>
  );
};
