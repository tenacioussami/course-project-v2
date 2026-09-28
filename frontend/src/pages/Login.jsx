import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/AuthShell';
import { Field, Button } from '../components/ui';
import { preloadProps, preloadRoute } from '../lib/routes';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    preloadRoute('/dashboard');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell eyebrow="Sign in" title="Welcome back" subtitle="Log in to manage tasks, chat and project docs.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-300 ring-1 ring-rose-500/20">{error}</p>}
        <Field label="Email">
          <input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <input type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" placeholder="••••••••" />
        </Field>
        <Button loading={loading} className="btn-primary w-full py-3">{loading ? 'Signing in…' : 'Sign in'}</Button>
        <p className="text-center text-sm text-slate-400">
          No account? <Link to="/register" {...preloadProps('/register')} className="font-semibold text-cyan-300 hover:underline">Register</Link>
        </p>
      </form>
    </AuthShell>
  );
};

export default Login;
