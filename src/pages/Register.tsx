import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { User, Mail, Phone, KeyRound, Loader2 } from 'lucide-react';
import { api, apiError } from '../api';
import { setUser } from '../store/authSlice';

const input = 'block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all disabled:bg-gray-50';
const icon = 'absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400';

const Register: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/register', form);
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
          <p className="mt-2 text-sm text-gray-500">Create your account</p>
        </div>

        <form className="space-y-4" onSubmit={register}>
          <div className="relative">
            <User className={icon} />
            <input type="text" required minLength={2} maxLength={100} autoComplete="name" className={input} placeholder="Full Name"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="relative">
            <Mail className={icon} />
            <input type="email" required autoComplete="email" className={input} placeholder="Email address"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="relative">
            <Phone className={icon} />
            <input type="tel" required autoComplete="tel" className={input} placeholder="Mobile number"
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="relative">
            <KeyRound className={icon} />
            <input type="password" required minLength={8} maxLength={128} autoComplete="new-password" className={input}
              placeholder="Password (at least 8 characters)"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 text-sm font-bold rounded-xl text-white bg-black hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register'}
          </button>
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
