import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Flame, ShieldAlert, User as UserIcon, Mail, Phone, Lock, Briefcase } from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'VICTIM' | 'VOLUNTEER'>('VICTIM');
  const [skills, setSkills] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await register({
        name,
        email,
        phone,
        password,
        role,
        volunteerSkills: role === 'VOLUNTEER' ? skills : undefined,
      });

      if (user.role === 'VICTIM') navigate('/victim/dashboard');
      else navigate('/volunteer/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-30%] left-[-20%] w-[600px] h-[600px] rounded-full bg-red-600/5 blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full bg-cyan-600/5 blur-[150px]" />

      <div className="w-full max-w-md p-8 rounded-2xl glass-panel relative z-10 border border-slate-800">
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/25 mx-auto mb-3">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white">Create Account</h2>
          <p className="text-xs text-slate-400 mt-1.5 font-mono uppercase tracking-wider text-cyan-400">Join SignalFlare Emergency Network</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Account Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('VICTIM')}
                className={`py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  role === 'VICTIM'
                    ? 'bg-red-600 text-white border-red-500'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Victim (Request Aid)
              </button>
              <button
                type="button"
                onClick={() => setRole('VOLUNTEER')}
                className={`py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  role === 'VOLUNTEER'
                    ? 'bg-cyan-600 text-white border-cyan-500'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Volunteer (Deliver Help)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rohan Sharma"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Security Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500"
                required
              />
            </div>
          </div>

          {role === 'VOLUNTEER' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Skills / Certification</label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="First-aid, Rescue swimming, driving"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
              role === 'VOLUNTEER'
                ? 'bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 shadow-cyan-500/10'
                : 'bg-red-600 hover:bg-red-500 disabled:bg-red-800 shadow-red-500/10'
            }`}
          >
            {loading ? 'Creating Profile...' : 'Complete Register'}
          </button>
        </form>

        <div className="mt-5 text-center text-xs">
          <span className="text-slate-500">Already registered? </span>
          <Link to="/login" className="text-red-400 hover:text-red-300 font-semibold underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
};
