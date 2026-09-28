import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/AuthShell';
import { Field, Button } from '../components/ui';
import { preloadProps, preloadRoute } from '../lib/routes';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    preloadRoute('/dashboard');
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell eyebrow="Join" title="Create your account" subtitle="The very first registered user becomes Admin automatically.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-300 ring-1 ring-rose-500/20">{error}</p>}
        <Field label="Full name">
          <input required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
        </Field>
        <Field label="Email">
          <input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
        </Field>
        <Field label="Password">
          <input type="password" required minLength={6} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" placeholder="At least 6 characters" />
        </Field>
        <Button loading={loading} className="btn-primary w-full py-3">{loading ? 'Creating account…' : 'Create account'}</Button>
        <p className="text-center text-sm text-slate-400">
          Already have an account? <Link to="/login" {...preloadProps('/login')} className="font-semibold text-cyan-300 hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
};

export default Register;
