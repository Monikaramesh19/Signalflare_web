import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Flame, ShieldAlert, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

export const OTP: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email') || 'user@signalflare.demo';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.nextSibling && element.value !== '') {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && otp[index] === '' && e.currentTarget.previousSibling) {
      (e.currentTarget.previousSibling as HTMLInputElement).focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the full 6 digit verification code.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/verify', { email, code });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="w-full max-w-md p-8 rounded-2xl glass-panel relative z-10 border border-slate-800">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/25 mx-auto mb-3">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white">OTP Verification</h2>
          <p className="text-xs text-slate-400 mt-1.5">
            We sent a verification code to <span className="text-cyan-400">{email}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 animate-bounce" />
            <span>Verification successful! Routing to login...</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center gap-2">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-12 h-14 bg-slate-950/60 border border-slate-800 focus:border-red-500 rounded-lg text-center text-xl font-bold text-white focus:outline-none"
                required
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-red-800 font-bold rounded-lg text-sm transition-colors cursor-pointer"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs">
          <span className="text-slate-500">Didn't receive the code? </span>
          <button
            onClick={() => alert('Simulated code re-sent to your device.')}
            className="text-red-400 hover:text-red-300 font-semibold underline bg-transparent border-none cursor-pointer"
          >
            Resend OTP
          </button>
        </div>
      </div>
    </div>
  );
};
