import React, { useState, useEffect } from 'react';
import { assets } from '../assets/assets';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../store/themeStore';
import { useAuth } from '../store/authStore';
import { ApiService } from '../api/api.service';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

function AuthPage() {
  const { theme } = useTheme();
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
      console.log('[AuthPage] Login response:', response);
      console.log('[AuthPage] Response data structure:', {
        hasData: !!response.data,
        userData: response.data?.user,
        accessToken: response.data?.accessToken
      });
      if (response.success) {
        const userData = response.data?.user || response.data;
        console.log('[AuthPage] Setting user from login:', userData);
        setUser(userData);
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
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-12 overflow-y-scroll">
      {/* Background decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-400/10 blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto animate-fade-in-up">
        {/* Auth Card */}
        <div className="rounded-2xl border border-[#D4C5E2] dark:border-[#80609F]/50 bg-white/80 dark:bg-[#242124]/80 p-8 shadow-xl shadow-slate-900/[0.06] backdrop-blur-xl">
          {/* Logo */}
          <div className="flex justify-center mb-2">
            <img src={assets.logo_full} alt="MedGPT Logo" className="h-20 sm:h-24 md:h-28 w-auto object-contain drop-shadow-lg transition-transform hover:scale-105 duration-300" />
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-[#2D2535] dark:text-white">
              {isRegistered ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-purple-200">
              {isRegistered ? 'Sign in to continue' : 'Get started with MedGPT for free'}
            </p>
          </div>

          {/* Form */}
          <div>
            {isRegistered ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="example@gmail.com"
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
                  Login
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <Input
                  label="Name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button type="submit" fullWidth isLoading={loading}>
                  Sign Up
                </Button>
              </form>
            )}
          </div>

          {/* Switch */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-purple-200">
              {isRegistered ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={() => {
                  setIsRegistered(!isRegistered);
                  setEmail('');
                  setPassword('');
                  setName('');
                }}
                className="font-semibold text-[#A456F7] hover:text-[#8B44D9] transition-colors cursor-pointer"
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
