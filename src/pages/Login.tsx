import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { KeyRound, Mail, Loader2 } from 'lucide-react';
import { api, apiError } from '../api';
import { setUser } from '../store/authSlice';
import OtpField, { useCountdown } from '../components/OtpField';

type Flow = 'login' | 'reset';

const Login: React.FC = () => {
  const [flow, setFlow] = useState<Flow>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const timer = useCountdown(30);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const changeFlow = (nextFlow: Flow) => {
    setFlow(nextFlow);
    setOtp('');
    setOtpSent(false);
    setPassword('');
    setConfirmation('');
    setError('');
    setInfo('');
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { identifier, password });
      dispatch(setUser(data.user));
      navigate(data.user.role === 'ADMIN' ? '/admin' : '/');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const sendResetOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login/send-reset-otp', { identifier });
      setOtpSent(true);
      setOtp('');
      timer.start();
      setInfo(data.devOtp ? `${data.message} (dev mode code: ${data.devOtp})` : data.message);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmation) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login/reset-password', {
        identifier,
        otp,
        password,
      });
      dispatch(setUser(data.user));
      navigate(data.user.role === 'ADMIN' ? '/admin' : '/');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const submit = flow === 'login' ? login : otpSent ? resetPassword : sendResetOtp;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl border border-gray-100 shadow-sm">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tighter text-gray-900">
            {flow === 'login' ? 'Welcome Back' : 'Reset Password'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {flow === 'login' ? 'Login with your email or phone and password' : 'Verify your email or phone to set a new password'}
          </p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              required
              disabled={flow === 'reset' && otpSent}
              autoComplete="username"
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all disabled:bg-gray-50"
              placeholder="Email address or mobile number"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          {flow === 'login' && (
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="current-password"
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          {flow === 'reset' && otpSent && (
            <>
              <OtpField value={otp} onChange={setOtp} />
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                  placeholder="New password (at least 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                  placeholder="Confirm new password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                />
              </div>
            </>
          )}

          {info && <p className="text-sm text-emerald-600">{info}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || (flow === 'reset' && otpSent && otp.length !== 6)}
            className="w-full flex justify-center py-3 px-4 text-sm font-bold rounded-xl text-white bg-black hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : flow === 'login' ? 'Login' : otpSent ? 'Reset password' : 'Send reset code'}
          </button>

          {flow === 'login' ? (
            <button type="button" onClick={() => changeFlow('reset')} className="w-full text-sm text-gray-500 hover:text-black">
              Forgot password?
            </button>
          ) : otpSent ? (
            <>
              <div className="flex justify-between text-sm">
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtp(''); setInfo(''); setPassword(''); setConfirmation(''); }}
                  className="text-gray-500 hover:text-black"
                >
                  Change email or phone
                </button>
                <button type="button" disabled={timer.left > 0 || loading} onClick={() => sendResetOtp()} className="font-bold text-black disabled:text-gray-400">
                  {timer.left > 0 ? `Resend in ${timer.left}s` : 'Resend code'}
                </button>
              </div>
              <button type="button" onClick={() => changeFlow('login')} className="w-full text-sm text-gray-500 hover:text-black">
                Back to login
              </button>
            </>
          ) : (
            <button type="button" onClick={() => changeFlow('login')} className="w-full text-sm text-gray-500 hover:text-black">
              Back to login
            </button>
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
