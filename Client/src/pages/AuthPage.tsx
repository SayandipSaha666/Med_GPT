import React, { useState, useEffect } from 'react';
import { assets } from '../assets/assets';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { ApiService } from '../api/api.service';
import toast from 'react-hot-toast';
import '../secondary-pages.css';

function AuthPage() {
  const { user, setUser, isLoading } = useAuth();
  const [isRegistered, setIsRegistered] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = ApiService.auth.useLogin();
  const registerMutation = ApiService.auth.useRegister();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/main/chat';

  useEffect(() => {
    if (!isLoading && user) navigate(from, { replace: true });
  }, [user, isLoading, navigate, from]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await loginMutation.mutateAsync({ email, password });
      if (response.success) {
        const userData = response.data?.user || response.data;
        setUser(userData);
        toast.success(`Welcome back, ${userData?.name || 'User'}!`);
        navigate(from, { replace: true });
      } else toast.error(response.message || 'Login failed');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally { setLoading(false); }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await registerMutation.mutateAsync({ name, email, password });
      if (response.success) {
        setUser(response.data.user);
        toast.success(`Account created. Welcome, ${name || 'User'}!`);
        navigate(from, { replace: true });
      } else toast.error(response.message || 'Registration failed');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally { setLoading(false); }
  };

  if (isLoading) return null;

  return (
    <main className="med-page" style={{ display: 'grid', placeItems: 'center', padding: '48px 18px' }}>
      <div style={{ width: 'min(100%, 440px)' }}>
        <button type="button" onClick={() => navigate('/')} aria-label="Go to MedGPT home" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, padding: 0, border: 0, background: 'transparent', color: 'var(--med-ink)', fontWeight: 700, fontSize: 18 }}>
          <span className="med-logo-mark"><img src={assets.logo_full_dark} alt="" /></span> MedGPT
        </button>
        <div className="med-card" style={{ padding: 'clamp(22px, 5vw, 36px)' }}>
          <h1 className="med-page-title">{isRegistered ? 'Welcome back' : 'Create your account'}</h1>
          <p className="med-muted" style={{ fontSize: 14, lineHeight: 1.6, margin: '8px 0 28px' }}>{isRegistered ? 'Sign in to continue your conversations.' : 'Start asking health questions and keep your conversations together.'}</p>
          <form onSubmit={isRegistered ? handleLogin : handleRegister} style={{ display: 'grid', gap: 18 }}>
            {!isRegistered && <div><label className="med-label" htmlFor="auth-name">Full name</label><input id="auth-name" className="med-input" type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required /></div>}
            <div><label className="med-label" htmlFor="auth-email">Email</label><input id="auth-email" className="med-input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
            <div><label className="med-label" htmlFor="auth-password">Password</label><input id="auth-password" className="med-input" type="password" autoComplete={isRegistered ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
            <button className="med-button" type="submit" disabled={loading} style={{ width: '100%', marginTop: 4 }}>{loading ? 'Please wait…' : isRegistered ? 'Sign in' : 'Create account'}</button>
          </form>
          <p className="med-muted" style={{ fontSize: 13, textAlign: 'center', margin: '24px 0 0' }}>
            {isRegistered ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button type="button" className="med-button-quiet" onClick={() => { setIsRegistered(!isRegistered); setEmail(''); setPassword(''); setName(''); }} style={{ padding: 3, border: 0, borderRadius: 4, fontWeight: 650 }}>{isRegistered ? 'Create one' : 'Sign in'}</button>
          </p>
        </div>
        <p className="med-faint" style={{ margin: '20px 0 0', textAlign: 'center', fontSize: 12 }}>MedGPT provides information and does not replace medical care.</p>
      </div>
    </main>
  );
}

export default AuthPage;
