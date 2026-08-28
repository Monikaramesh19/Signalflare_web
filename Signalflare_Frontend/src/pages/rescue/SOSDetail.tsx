import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Flame, MapPin, User, Phone, CheckCircle, ShieldAlert, ArrowLeft } from 'lucide-react';
import { VoiceSOSCard } from '../../components/VoiceSOSCard';

export const SOSDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [sos, setSos] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedVol, setSelectedVol] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const response = await api.get(`/sos/${id}`);
      setSos(response.data);

      const resTeams = await api.get('/rescue-teams');
      setTeams(resTeams.data);

      const resVols = await api.get('/volunteers');
      // filter only active available volunteers
      const avVols = resVols.data.filter((v: any) => v.status === 'AVAILABLE');
      setVolunteers(avVols);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAssignTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    setSubmitting(true);
    try {
      await api.post('/rescue/assign', {
        sosRequestId: id,
        teamId: selectedTeam,
      });
      alert('Rescue team dispatched and assigned successfully!');
      loadData();
    } catch (err) {
      alert('Failed to assign rescue team.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVol) return;
    setSubmitting(true);
    try {
      await api.put(`/sos/${id}`, {
        volunteerId: selectedVol,
        status: 'ASSIGNED',
      });
      alert('Volunteer assigned successfully!');
      loadData();
    } catch (err) {
      alert('Failed to assign volunteer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    setSubmitting(true);
    try {
      await api.put(`/sos/${id}`, { status });
      alert(`Status updated to ${status}`);
      loadData();
    } catch (err) {
      alert('Failed to update status.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-xs text-slate-500 font-mono">Loading SOS details...</div>;
  }

  if (!sos) {
    return <div className="py-8 text-center text-xs text-red-500">Distress call records not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <button
        onClick={() => navigate('/rescue/sos')}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Distress Monitor
      </button>

      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-2">
          <Flame className="w-8 h-8 text-red-500 animate-pulse" />
          Evacuation Coordinator
        </h1>
        <p className="text-xs text-slate-400">Match operations team vectors, track dispatcher timeline logs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-900 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-red-500/10 text-red-400 border border-red-500/25">
                  {sos.severity} Urgency
                </span>
                <h2 className="text-lg font-bold text-white mt-1.5">{sos.emergencyType} Emergency</h2>
              </div>
              <span className="px-3 py-1 rounded bg-slate-900 text-slate-300 border border-slate-850 text-xs font-bold font-mono">
                {sos.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-900">
                <span className="text-slate-500 block uppercase font-bold text-[9px] mb-1">Victim Name</span>
                <span>{sos.victim?.name}</span>
              </div>
              <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-900">
                <span className="text-slate-500 block uppercase font-bold text-[9px] mb-1">Evacuees Count</span>
                <span>{sos.peopleCount} persons</span>
              </div>
              <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-900">
                <span className="text-slate-500 block uppercase font-bold text-[9px] mb-1">Contact Phone</span>
                <span>{sos.contactPhone}</span>
              </div>
              <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-900">
                <span className="text-slate-500 block uppercase font-bold text-[9px] mb-1">Coordinates Pin</span>
                <span className="font-mono">{sos.locationLat.toFixed(5)}, {sos.locationLng.toFixed(5)}</span>
              </div>
            </div>

            {sos.message && sos.message.startsWith('data:audio') ? (
              <div className="space-y-2">
                <span className="text-slate-500 block uppercase font-bold text-[9px] mb-1">Voice Emergency Message</span>
                <VoiceSOSCard
                  severity={sos.severity}
                  peopleCount={sos.peopleCount}
                  locationLat={sos.locationLat}
                  locationLng={sos.locationLng}
                  audioBase64={sos.message}
                  status={sos.status}
                  createdAt={sos.createdAt}
                />
              </div>
            ) : (
              <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-900 text-xs">
                <span className="text-slate-500 block uppercase font-bold text-[9px] mb-1.5">Beacon Notes</span>
                <p className="text-slate-300 leading-relaxed">"{sos.message}"</p>
              </div>
            )}

            {sos.photos && sos.photos.length > 0 && (
              <div className="space-y-2">
                <span className="text-slate-500 block uppercase font-bold text-[9px]">Photo Verification</span>
                <div className="w-64 h-40 rounded-lg border border-slate-850 overflow-hidden">
                  <img src={sos.photos[0].photoUrl} className="w-full h-full object-cover" alt="SOS Detail" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          {/* Dispatch controls */}
          <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Rescue Team Dispatch</h3>
            
            {sos.responderTeam ? (
              <div className="p-4 rounded bg-cyan-950/15 border border-cyan-500/20 text-xs text-cyan-300">
                Team Assigned: <strong>{sos.responderTeam.name}</strong> <br />
                Status: {sos.status}
              </div>
            ) : (
              <form onSubmit={handleAssignTeam} className="space-y-3">
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-300 focus:outline-none"
                  required
                >
                  <option value="">-- Choose Rescue Team --</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.vehicleType})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white text-xs font-bold rounded cursor-pointer"
                >
                  DISPATCH TEAM
                </button>
              </form>
            )}
          </div>

          {/* Volunteer Matcher */}
          <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Volunteer Assignment</h3>

            {sos.volunteer ? (
              <div className="p-4 rounded bg-cyan-950/15 border border-cyan-500/20 text-xs text-cyan-300">
                Volunteer Match: <strong>{sos.volunteer.user?.name}</strong>
              </div>
            ) : (
              <form onSubmit={handleAssignVolunteer} className="space-y-3">
                <select
                  value={selectedVol}
                  onChange={(e) => setSelectedVol(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-300 focus:outline-none"
                  required
                >
                  <option value="">-- Choose Paramedic / Helper --</option>
                  {volunteers.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.user?.name} (Skills: {v.skills})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white text-xs font-bold rounded cursor-pointer"
                >
                  ASSIGN VOLUNTEER
                </button>
              </form>
            )}
          </div>

          {/* Operation Status override */}
          <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Status Overrides</h3>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
              {['RESPONDER_ON_WAY', 'RESCUE_IN_PROGRESS', 'RESOLVED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => handleUpdateStatus(st)}
                  className="py-2 bg-slate-900 hover:bg-slate-850 border border-slate-850 text-slate-300 rounded cursor-pointer"
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
