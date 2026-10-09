import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Mail, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { api, apiError } from '../api';
import { setUser } from '../store/authSlice';
import OtpField, { useCountdown } from '../components/OtpField';

type Mode = 'email' | 'phone';

const Login: React.FC = () => {
  const [mode, setMode] = useState<Mode>('email');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const timer = useCountdown(30);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const switchMode = (m: Mode) => {
    setMode(m); setIdentifier(''); setOtp(''); setOtpSent(false); setError(''); setInfo('');
  };

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/login/send-otp', { identifier });
      setOtpSent(true); setOtp(''); timer.start();
      setInfo(data.devOtp ? `${data.message} (dev mode OTP: ${data.devOtp})` : data.message);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/login', { identifier, otp });
      dispatch(setUser(data.user));
      navigate(data.user.role === 'ADMIN' ? '/admin' : '/');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const tab = (m: Mode, label: string, Icon: typeof Mail) => (
    <button
      type="button"
      onClick={() => switchMode(m)}
      className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${
        mode === m ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl border border-gray-100 shadow-sm">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tighter text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-500">Login with a one-time password</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl">
          {tab('email', 'Email', Mail)}
          {tab('phone', 'Phone', Phone)}
        </div>

        <form className="space-y-4" onSubmit={otpSent ? verify : sendOtp}>
          <div className="relative">
            {mode === 'email'
              ? <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              : <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />}
            <input
              type={mode === 'email' ? 'email' : 'tel'}
              required
              disabled={otpSent}
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all disabled:bg-gray-50"
              placeholder={mode === 'email' ? 'Email address' : 'Mobile number (e.g. 9876543210)'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          {otpSent && <OtpField value={otp} onChange={setOtp} />}

          {info && <p className="text-sm text-emerald-600">{info}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || (otpSent && otp.length !== 6)}
            className="group w-full flex justify-center py-3 px-4 text-sm font-bold rounded-xl text-white bg-black hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {otpSent ? 'Verify & Login' : 'Send OTP'}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {otpSent && (
            <div className="flex justify-between text-sm">
              <button type="button" onClick={() => { setOtpSent(false); setOtp(''); setInfo(''); }} className="text-gray-500 hover:text-black">
                Change {mode}
              </button>
              <button type="button" disabled={timer.left > 0 || loading} onClick={() => sendOtp()} className="font-bold text-black disabled:text-gray-400">
                {timer.left > 0 ? `Resend in ${timer.left}s` : 'Resend OTP'}
              </button>
            </div>
          )}
        </form>

        <p className="text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-black hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
