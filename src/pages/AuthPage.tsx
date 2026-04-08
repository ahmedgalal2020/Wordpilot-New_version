import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Github, Eye } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const isLogin = location.pathname === '/login';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  return (
    <main className="flex-grow flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="max-w-md w-full relative z-10">
        <div className="bg-surface-container-lowest rounded-[2.5rem] whisper-shadow overflow-hidden p-10 flex flex-col gap-8">
          <div className="text-left space-y-2">
            <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
          </div>
          {error && <p className="text-error text-sm">{error}</p>}
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">Full Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3" placeholder="Alex Sterling" type="text" required />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">Email Address</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3" placeholder="student@university.edu" type="email" required />
              </div>
              <div className="space-y-2">
                <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">Password</label>
                <div className="relative">
                  <input value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3" placeholder="••••••••" type="password" required minLength={6} />
                  <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60"><Eye className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
            <button type="submit" className="w-full py-4 px-6 primary-gradient text-on-primary rounded-full font-headline font-bold tracking-tight">
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          <div className="pt-4 text-center">
            <p className="text-sm text-on-surface-variant">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <Link to={isLogin ? '/signup' : '/login'} className="text-primary font-semibold hover:underline ml-1">
                {isLogin ? 'Sign up' : 'Log in'}
              </Link>
            </p>
          </div>
          <button className="flex items-center justify-center gap-2 py-3 border border-outline-variant/20 rounded-xl">
            <Github className="w-5 h-5" />
            <span className="text-sm font-medium text-on-surface">Github (coming soon)</span>
          </button>
        </div>
      </div>
    </main>
  );
}
