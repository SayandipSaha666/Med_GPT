import React, { useState, useEffect } from 'react';
import { assets } from '../assets/assets';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { ApiService } from '../api/api.service';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

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

  const from = (location.state as any)?.from?.pathname || '/main/chat';

  useEffect(() => {
    if (!isLoading && user) {
      navigate(from, { replace: true });
    }
  }, [user, isLoading, navigate, from]);

  if (isLoading) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await loginMutation.mutateAsync({ email, password });
      if (response.success) {
        const userData = response.data?.user || response.data;
        setUser(userData);
        toast.success(`Welcome back, ${userData?.name || 'User'}! 👋`);
        navigate(from, { replace: true });
      } else {
        toast.error(response.message || 'Login failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await registerMutation.mutateAsync({ name, email, password });
      if (response.success) {
        setUser(response.data.user);
        toast.success(`Account created successfully! Welcome, ${name || 'User'} 🎉`);
        navigate(from, { replace: true });
      } else {
        toast.error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen px-4 sm:px-6 lg:px-8 py-12 overflow-y-auto flex items-center justify-center bg-gradient-to-b from-[#FAF9FC] to-[#EDE8F2] dark:from-[#0E0D16] dark:to-[#171424] transition-colors duration-300">
      {/* Background decorative glowing blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-purple-500/10 dark:bg-purple-500/15 blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-500/10 dark:bg-blue-500/15 blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Auth Card */}
        <div className="rounded-3xl border border-purple-100 dark:border-purple-900/40 bg-white/80 dark:bg-[#191629]/80 p-8 sm:p-10 shadow-2xl shadow-purple-500/10 backdrop-blur-xl">
          {/* Logo */}
          <div className="flex justify-center mb-3">
            <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800/40">
              <img
                src={assets.logo_full}
                alt="MedGPT Logo"
                className="h-16 w-auto object-contain drop-shadow-md transition-transform hover:scale-105 duration-300"
              />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {isRegistered ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {isRegistered
                ? 'Sign in to access your consultations'
                : 'Get started with MedGPT AI medical guidance'}
            </p>
          </div>

          {/* Form */}
          <div>
            {isRegistered ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button type="submit" fullWidth isLoading={loading}>
                  Sign In
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="Dr. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button type="submit" fullWidth isLoading={loading}>
                  Create Free Account
                </Button>
              </form>
            )}
          </div>

          {/* Switch */}
          <div className="mt-6 text-center">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {isRegistered ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegistered(!isRegistered);
                  setEmail('');
                  setPassword('');
                  setName('');
                }}
                className="font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer"
              >
                {isRegistered ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
