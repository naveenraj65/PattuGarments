import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { User, Mail, Phone, KeyRound, ArrowRight, Loader2 } from 'lucide-react';
import { api, apiError } from '../api';
import { setUser } from '../store/authSlice';
import OtpField, { useCountdown } from '../components/OtpField';

const input = 'block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all disabled:bg-gray-50';
const icon = 'absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400';

const Register: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const timer = useCountdown(30);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/register/send-otp', { email: form.email, phone: form.phone });
      setOtpSent(true); setEmailOtp(''); setPhoneOtp(''); timer.start();
      setInfo(data.devOtp
        ? `Dev mode OTPs - email: ${data.devOtp.email}, phone: ${data.devOtp.phone}`
        : 'We sent one OTP to your email and one to your phone.');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/register', { ...form, emailOtp, phoneOtp });
      dispatch(setUser(data.user));
      navigate(data.user.role === 'ADMIN' ? '/admin' : '/');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl border border-gray-100 shadow-sm">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tighter text-gray-900">Join Pattu Garments</h2>
          <p className="mt-2 text-sm text-gray-500">We verify both your email and phone</p>
        </div>

        <form className="space-y-4" onSubmit={otpSent ? register : sendOtp}>
          <div className="relative">
            <User className={icon} />
            <input type="text" required disabled={otpSent} className={input} placeholder="Full Name"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="relative">
            <Mail className={icon} />
            <input type="email" required disabled={otpSent} className={input} placeholder="Email address"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="relative">
            <Phone className={icon} />
            <input type="tel" required disabled={otpSent} className={input} placeholder="Mobile number"
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="relative">
            <KeyRound className={icon} />
            <input type="password" required minLength={8} maxLength={128} autoComplete="new-password"
              disabled={otpSent} className={input} placeholder="Password (at least 8 characters)"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>

          {otpSent && (
            <>
              <OtpField value={emailOtp} onChange={setEmailOtp} placeholder="Email OTP" />
              <OtpField value={phoneOtp} onChange={setPhoneOtp} placeholder="Phone OTP" />
            </>
          )}

          {info && <p className="text-sm text-emerald-600">{info}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || (otpSent && (emailOtp.length !== 6 || phoneOtp.length !== 6))}
            className="group w-full flex justify-center py-3 px-4 text-sm font-bold rounded-xl text-white bg-black hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {otpSent ? 'Verify & Create Account' : 'Send OTPs'}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {otpSent && (
            <div className="flex justify-between text-sm">
              <button type="button" onClick={() => { setOtpSent(false); setInfo(''); }} className="text-gray-500 hover:text-black">
                Edit details
              </button>
              <button type="button" disabled={timer.left > 0 || loading} onClick={() => sendOtp()} className="font-bold text-black disabled:text-gray-400">
                {timer.left > 0 ? `Resend in ${timer.left}s` : 'Resend OTPs'}
              </button>
            </div>
          )}
        </form>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-black hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
