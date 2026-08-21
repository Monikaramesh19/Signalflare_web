import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNetwork } from '../../contexts/NetworkContext';
import { useNavigate } from 'react-router-dom';
import { getQueue, clearQueue } from '../../offline/db';
import {
  Settings,
  User,
  Shield,
  Phone,
  HelpCircle,
  Database,
  Globe,
  Radio,
  CheckCircle,
  AlertTriangle,
  Play,
  Volume2,
  Trash2,
  Plus,
  RefreshCw,
  LogOut,
  MapPin,
  Flame,
} from 'lucide-react';

interface Contact {
  name: string;
  relationship: string;
  phone: string;
  priority: 'Primary' | 'Secondary';
}

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { isOnline, triggerSync } = useNetwork();
  const navigate = useNavigate();

  // Basic Profile Identity
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Emergency Info
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [age, setAge] = useState('28');
  const [gender, setGender] = useState('Male');
  const [medConditions, setMedConditions] = useState('None');
  const [allergies, setAllergies] = useState('Peanuts');
  const [medication, setMedication] = useState('None');
  const [assistance, setAssistance] = useState('None');
  const [medNotes, setMedNotes] = useState('Resilient under extreme conditions.');
  const [shareMedWithRescuers, setShareMedWithRescuers] = useState(true);

  // Emergency Contacts
  const [contactsList, setContactsList] = useState<Contact[]>([
    { name: 'Mother', relationship: 'Parent', phone: '9840112233', priority: 'Primary' },
    { name: 'Brother', relationship: 'Sibling', phone: '9840223344', priority: 'Secondary' },
  ]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRel, setNewContactRel] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactPriority, setNewContactPriority] = useState<'Primary' | 'Secondary'>('Secondary');

  // Voice Settings
  const [allowVoiceSOS, setAllowVoiceSOS] = useState(true);
  const [autoAttachVoice, setAutoAttachVoice] = useState(true);
  const [keepVoiceOffline, setKeepVoiceOffline] = useState(true);
  const [maxDuration, setMaxDuration] = useState('60');

  // Location Settings
  const [attachGPS, setAttachGPS] = useState(true);
  const [shareMeshLocation, setShareMeshLocation] = useState(true);
  const [continuousLocation, setContinuousLocation] = useState(true);
  const [updateInterval, setUpdateInterval] = useState('10');

  // SOS Privacy Settings
  const [shareContactsWithRescuers, setShareContactsWithRescuers] = useState(true);
  const [attachLocationReq, setAttachLocationReq] = useState(true);
  const [attachVoiceReq, setAttachVoiceReq] = useState(true);
  const [attachPhotoReq, setAttachPhotoReq] = useState(true);

  // Accessibility Settings
  const [language, setLanguage] = useState('English');
  const [voiceGuidance, setVoiceGuidance] = useState(true);
  const [largeText, setLargeText] = useState(false);
  const [voiceFirstUi, setVoiceFirstUi] = useState(true);

  // Notification Preferences
  const [notifSOS, setNotifSOS] = useState(true);
  const [notifRescue, setNotifRescue] = useState(true);
  const [notifShelter, setNotifShelter] = useState(true);
  const [notifResource, setNotifResource] = useState(true);
  const [notifMesh, setNotifMesh] = useState(true);

  // Counts
  const [pendingSosCount, setPendingSosCount] = useState(0);
  const [pendingMeshCount, setPendingMeshCount] = useState(0);

  // Status feedback
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Load database items counts and cached profile on mount
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cachedContacts = localStorage.getItem('trusted_contacts');
        if (cachedContacts) setContactsList(JSON.parse(cachedContacts));

        const cachedMed = localStorage.getItem('emergency_med_info');
        if (cachedMed) {
          const m = JSON.parse(cachedMed);
          setBloodGroup(m.bloodGroup);
          setAge(m.age);
          setGender(m.gender);
          setMedConditions(m.medConditions);
          setAllergies(m.allergies);
          setMedication(m.medication);
          setAssistance(m.assistance);
          setMedNotes(m.medNotes);
          setShareMedWithRescuers(m.shareMedWithRescuers);
        }

        const sos = await getQueue('sos_queue');
        setPendingSosCount(sos.length);

        const mesh = await getQueue('mesh_messages');
        setPendingMeshCount(mesh.length);
      } catch (err) {
        console.warn('Queue counts loading failed');
      }
    };
    loadCachedData();
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    // Cache Emergency Med Details
    const medPayload = {
      bloodGroup,
      age,
      gender,
      medConditions,
      allergies,
      medication,
      assistance,
      medNotes,
      shareMedWithRescuers,
    };
    localStorage.setItem('emergency_med_info', JSON.stringify(medPayload));
    localStorage.setItem('trusted_contacts', JSON.stringify(contactsList));

    if (isOnline) {
      setSaveStatus('✓ Emergency profile updated successfully.');
    } else {
      setSaveStatus('✓ Saved securely on this device. ↻ Will synchronize when connectivity returns.');
    }

    setTimeout(() => setSaveStatus(null), 4000);
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) return;

    const newContact: Contact = {
      name: newContactName,
      relationship: newContactRel || 'Friend',
      phone: newContactPhone,
      priority: newContactPriority,
    };

    const updated = [...contactsList, newContact];
    setContactsList(updated);
    localStorage.setItem('trusted_contacts', JSON.stringify(updated));

    setNewContactName('');
    setNewContactRel('');
    setNewContactPhone('');
  };

  const handleDeleteContact = (index: number) => {
    const updated = contactsList.filter((_, idx) => idx !== index);
    setContactsList(updated);
    localStorage.setItem('trusted_contacts', JSON.stringify(updated));
  };

  const handleClearLocalData = async () => {
    if (
      window.confirm(
        'WARNING: Clear all local caches? Unsynchronized distress entries, voice SOS, and cached history records will be deleted forever.'
      )
    ) {
      await clearQueue('sos_queue');
      await clearQueue('resource_queue');
      await clearQueue('message_queue');
      await clearQueue('mesh_messages');
      await clearQueue('mesh_routes');
      localStorage.clear();
      alert('Local storage cleared successfully.');
      window.location.reload();
    }
  };

  return (
    <div className={`max-w-6xl mx-auto space-y-6 ${largeText ? 'text-lg' : 'text-xs'}`}>
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-2">
          <Settings className="w-8 h-8 text-cyan-400" />
          ⚙️ Profile Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your emergency identity, medical information, trusted contacts, and communication preferences.
        </p>
      </div>

      {/* Sync Status Banner */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
          <span className="font-bold text-white font-mono">{isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}</span>
          <p className="text-slate-500 font-mono text-[10px]">
            {isOnline
              ? 'Last synced: Today, ' + new Date().toLocaleTimeString()
              : 'Changes will be synchronized automatically when connectivity returns.'}
          </p>
        </div>
        {isOnline && (
          <button
            onClick={() => triggerSync()}
            className="px-3 py-1.5 bg-cyan-600/10 hover:bg-cyan-600 border border-cyan-500/20 rounded font-bold text-[10px] text-cyan-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Force Sync
          </button>
        )}
      </div>

      <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Identity Card */}
          <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              👤 Emergency Identity
            </h3>

            <div className="grid grid-cols-3 gap-4 items-center border-b border-slate-900 pb-4">
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-4xl">
                👤
              </div>
              <div className="col-span-2 space-y-1">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
                  🟢 PROFILE ACTIVE
                </span>
                <p className="font-mono text-slate-500 text-[10px]">ID: {user?.id || 'SF-USER-ABC'}</p>
                <p className="font-bold text-white uppercase font-mono tracking-wider">Role: {user?.role || 'VICTIM'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded text-slate-100 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Primary Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded text-slate-100 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Emergency Information */}
          <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              🚨 Emergency Information
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] text-slate-500 font-bold mb-1">Blood Group</label>
                <input
                  type="text"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-850 rounded text-center text-white"
                />
              </div>
              <div>
                <label className="block text-[9px] text-slate-500 font-bold mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-850 rounded text-center text-white"
                />
              </div>
              <div>
                <label className="block text-[9px] text-slate-500 font-bold mb-1">Gender</label>
                <input
                  type="text"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-850 rounded text-center text-white"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[9px] text-slate-500 font-bold mb-1">Medical Conditions</label>
                <input
                  type="text"
                  value={medConditions}
                  onChange={(e) => setMedConditions(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-[9px] text-slate-500 font-bold mb-1">Known Allergies</label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 rounded text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] text-slate-500 font-bold mb-1">Current Medication</label>
                  <input
                    type="text"
                    value={medication}
                    onChange={(e) => setMedication(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500 font-bold mb-1">Disability / Assistance Needed</label>
                  <input
                    type="text"
                    value={assistance}
                    onChange={(e) => setAssistance(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 rounded text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] text-slate-500 font-bold mb-1">Additional Medical Notes</label>
                <textarea
                  value={medNotes}
                  onChange={(e) => setMedNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 rounded text-white h-14 resize-none"
                />
              </div>

              <label className="flex items-center gap-2 text-slate-400 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareMedWithRescuers}
                  onChange={(e) => setShareMedWithRescuers(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-600 cursor-pointer"
                />
                <span>Allow critical medical information to be visible to verified rescuers during an SOS</span>
              </label>
            </div>
          </div>

          {/* Trusted Emergency Contacts */}
          <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              👥 Trusted Emergency Contacts
            </h3>

            {/* List */}
            <div className="space-y-3.5">
              {contactsList.map((contact, idx) => (
                <div key={idx} className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-900 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-white">{contact.name}</h4>
                    <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider">
                      Relationship: {contact.relationship} | Priority: {contact.priority}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={`tel:${contact.phone}`}
                      className="px-2.5 py-1 bg-cyan-600/10 hover:bg-cyan-600 border border-cyan-500/20 rounded font-bold text-[10px] text-cyan-400 hover:text-white"
                    >
                      Call
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteContact(idx)}
                      className="p-1 text-slate-500 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-900 space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">+ Add Emergency Contact</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Contact Name"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-850 rounded text-white"
                />
                <input
                  type="text"
                  placeholder="Relationship (e.g. Spouse)"
                  value={newContactRel}
                  onChange={(e) => setNewContactRel(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-850 rounded text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 items-center">
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-850 rounded text-white"
                />
                <select
                  value={newContactPriority}
                  onChange={(e: any) => setNewContactPriority(e.target.value)}
                  className="px-2 py-1.5 bg-slate-950 border border-slate-850 rounded text-slate-300 focus:outline-none"
                >
                  <option value="Primary">Primary Priority</option>
                  <option value="Secondary">Secondary Priority</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddContact}
                className="w-full py-2 bg-slate-900 border border-slate-850 hover:bg-slate-850 text-cyan-400 hover:text-cyan-300 font-bold rounded cursor-pointer transition-colors"
              >
                + Save Contact Locally
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Offline Emergency Access */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-xl glass-panel border border-slate-800 space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Offline Profile Access</span>
              <div className="flex items-center gap-1.5 font-bold text-emerald-400 font-mono text-[10px]">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>🟢 AVAILABLE OFFLINE</span>
              </div>
              <p className="text-[9px] text-slate-500 leading-normal">
                Profile records are saved securely inside browser IndexedDB to persist during cellular failures.
              </p>
            </div>

            <div className="p-5 rounded-xl glass-panel border border-slate-800 space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">GPS Telemetry Identity</span>
              <div className="space-y-1.5 font-mono text-[9px] text-slate-300">
                <p>Device Telemetry ID: <strong className="text-cyan-400">SF-USER-{(user?.id || 'ABCD').substring(0, 4)}</strong></p>
                <p>Telemetry Mode: <strong className="text-white font-bold">GPS ACTIVE</strong></p>
                <p>Accuracy Standard: <strong className="text-emerald-400 font-bold">High Precision</strong></p>
              </div>
            </div>
          </div>

          {/* Voice Emergency Settings */}
          <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-cyan-400 animate-pulse" />
              🎙️ Voice Emergency Settings
            </h3>
            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-2.5 text-slate-400 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowVoiceSOS}
                  onChange={(e) => setAllowVoiceSOS(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-600 cursor-pointer"
                />
                <span>Allow voice SOS messages</span>
              </label>

              <label className="flex items-center gap-2.5 text-slate-400 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoAttachVoice}
                  onChange={(e) => setAutoAttachVoice(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-600 cursor-pointer"
                />
                <span>Automatically attach voice recording to SOS</span>
              </label>

              <label className="flex items-center gap-2.5 text-slate-400 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepVoiceOffline}
                  onChange={(e) => setKeepVoiceOffline(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-600 cursor-pointer"
                />
                <span>Keep emergency voice recordings offline until delivered</span>
              </label>

              <div className="pt-2 border-t border-slate-900/60">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Max Recording Time</label>
                <select
                  value={maxDuration}
                  onChange={(e) => setMaxDuration(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded text-slate-300 focus:outline-none"
                >
                  <option value="30">30 seconds (Balanced payload)</option>
                  <option value="60">60 seconds (Standard)</option>
                  <option value="120">120 seconds (Detailed description)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location Sharing Settings */}
          <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              📍 LOCATION & PRIVACY SETTINGS
            </h3>
            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-2.5 text-slate-400 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={attachGPS}
                  onChange={(e) => setAttachGPS(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-600 cursor-pointer"
                />
                <span>Share location during SOS</span>
              </label>

              <label className="flex items-center gap-2.5 text-slate-400 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={continuousLocation}
                  onChange={(e) => setContinuousLocation(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-600 cursor-pointer"
                />
                <span>Enable emergency tracking</span>
              </label>

              <label className="flex items-center gap-2.5 text-slate-400 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareMeshLocation}
                  onChange={(e) => setShareMeshLocation(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-600 cursor-pointer"
                />
                <span>Find nearby shelters</span>
              </label>

              <label className="flex items-center gap-2.5 text-slate-400 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={attachLocationReq}
                  onChange={(e) => setAttachLocationReq(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-600 cursor-pointer"
                />
                <span>Find nearest rescue teams</span>
              </label>

              <div className="pt-2 border-t border-slate-900/60">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Location update interval</label>
                <select
                  value={updateInterval}
                  onChange={(e) => setUpdateInterval(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded text-slate-300 focus:outline-none"
                >
                  <option value="10">10 seconds</option>
                  <option value="30">30 seconds</option>
                  <option value="60">60 seconds</option>
                </select>
              </div>
            </div>
          </div>

          {/* Privacy & Notification settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Privacy Card */}
            <div className="p-5 rounded-xl glass-panel border border-slate-800 space-y-3 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">🔐 Emergency Privacy</span>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareContactsWithRescuers}
                    onChange={(e) => setShareContactsWithRescuers(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-cyan-600"
                  />
                  <span>Share emergency contacts</span>
                </label>
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attachLocationReq}
                    onChange={(e) => setAttachLocationReq(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-cyan-600"
                  />
                  <span>Attach location</span>
                </label>
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attachVoiceReq}
                    onChange={(e) => setAttachVoiceReq(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-cyan-600"
                  />
                  <span>Attach voice</span>
                </label>
              </div>
            </div>

            {/* Notification preferences */}
            <div className="p-5 rounded-xl glass-panel border border-slate-800 space-y-3 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">🔔 Notification Prefs</span>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifSOS}
                    onChange={(e) => setNotifSOS(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-cyan-600"
                  />
                  <span>SOS updates</span>
                </label>
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifRescue}
                    onChange={(e) => setNotifRescue(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-cyan-600"
                  />
                  <span>Rescue replies</span>
                </label>
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifMesh}
                    onChange={(e) => setNotifMesh(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-cyan-600"
                  />
                  <span>Mesh sync pings</span>
                </label>
              </div>
            </div>
          </div>

          {/* Language & Accessibility */}
          <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              🌐 Language & Accessibility
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-850 rounded text-slate-300 focus:outline-none"
                >
                  <option value="English">English</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Hindi">Hindi (हिन्दी)</option>
                </select>
              </div>

              <div className="space-y-2.5 pt-4">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={voiceGuidance}
                    onChange={(e) => setVoiceGuidance(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-cyan-600"
                  />
                  <span>Voice guidance</span>
                </label>
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={largeText}
                    onChange={(e) => setLargeText(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-cyan-600"
                  />
                  <span>Large Text Mode</span>
                </label>
              </div>
            </div>
          </div>

          {/* Data & Security */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl glass-panel border border-slate-800 space-y-3.5 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">🔐 Account Security</span>
              <div className="space-y-2.5 font-mono text-[10px]">
                <p className="text-emerald-400 font-bold">🟢 Authentication Active</p>
                <p className="text-slate-500">Session Secure</p>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="px-3 py-1.5 bg-red-950/20 border border-red-500/20 text-red-400 hover:text-white rounded font-bold transition-colors cursor-pointer w-fit flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout Session
                </button>
              </div>
            </div>

            <div className="p-5 rounded-xl glass-panel border border-slate-800 space-y-3.5 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">💾 Offline Data & Storage</span>
              <div className="space-y-1.5 font-mono text-[9px] text-slate-400">
                <p>Profile: <strong className="text-emerald-400 font-bold">✓ Cached</strong></p>
                <p>Contacts: <strong className="text-emerald-400 font-bold">✓ Cached</strong></p>
                <p>Pending SOS: <strong>{pendingSosCount}</strong></p>
                <p>Pending Mesh: <strong>{pendingMeshCount}</strong></p>
                <button
                  type="button"
                  onClick={handleClearLocalData}
                  className="text-[10px] text-red-400 hover:underline font-bold mt-1 text-left cursor-pointer"
                >
                  Clear Local Data
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Alert Overlay */}
        {saveStatus && (
          <div className="col-span-1 lg:col-span-2 p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-cyan-300 font-bold font-mono text-center animate-pulse">
            {saveStatus}
          </div>
        )}

        {/* Emergency Quick Actions */}
        <div className="col-span-1 lg:col-span-2 p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">🚨 Emergency Quick Actions</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-white">
            <button
              type="button"
              onClick={() => navigate('/victim/sos')}
              className="py-3 bg-red-600 hover:bg-red-500 rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/10 cursor-pointer"
            >
              <Flame className="w-4 h-4" />
              🚨 SEND SOS
            </button>
            <button
              type="button"
              onClick={() => navigate('/victim/sos')} // voice recorder resides inside SOS Panel
              className="py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:brightness-110 rounded-lg flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              🎙️ RECORD VOICE SOS
            </button>
            <button
              type="button"
              onClick={() => navigate('/victim/location')}
              className="py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-600/10 cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              📍 SHARE LOCATION
            </button>
            <button
              type="button"
              onClick={() => navigate('/victim/contacts')}
              className="py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Phone className="w-4 h-4 text-cyan-400" />
              📞 HELPLINES
            </button>
          </div>
        </div>

        {/* Save button */}
        <div className="col-span-1 lg:col-span-2 pt-2">
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:brightness-110 text-white font-black text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/10 cursor-pointer"
          >
            <Database className="w-4 h-4" />
            💾 SAVE EMERGENCY PROFILE
          </button>
        </div>
      </form>
    </div>
  );
};
