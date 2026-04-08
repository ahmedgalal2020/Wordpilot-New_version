import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Github, Eye } from 'lucide-react';
import { api } from '@/src/lib/api';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === '/login';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = { fullName, email, password };
      const result = isLogin ? await api.login(payload) : await api.signup(payload);
      localStorage.setItem('wordpilot_token', result.token);
      localStorage.setItem('wordpilot_user', JSON.stringify(result.user));
      navigate('/dashboard');
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unexpected authentication error.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-grow flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-container rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-48 w-80 h-80 bg-tertiary-container rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-surface-container-lowest rounded-[2.5rem] whisper-shadow overflow-hidden p-10 flex flex-col gap-8">
          <div className="text-left space-y-2">
            <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-on-surface-variant">
              {isLogin ? 'Return to your digital atelier of excellence.' : 'Join the digital atelier for academic excellence.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SocialButton icon="https://lh3.googleusercontent.com/aida-public/AB6AXuAvBrBKSz12K2lwfFghaT6PP7LQw3uWMHIKtf3hfBPTCgDSMo-RtrnhYRmqnJuXJQ2KYNo6pyxqoY3hxGbxuySOQqApifAWoNVxH0FRNXrf6pEo2hm1jK9p8RShg82x_7rjSXvwVzpqOK_TLHifEYfzLZ4qFZ-0fc2eYTvKxqNdQzDKUOn8Du8I0zBrQgitVLfzNTVRKMIxmqRvuTYsnAmPm4H5RlSoxdmG-b4QL2oikVvSkVxeRRCXA__k_geaNXmko7I4GAn0kIk" label="Google" />
            <button className="flex items-center justify-center gap-2 py-3 border border-outline-variant/20 rounded-xl hover:bg-surface-container transition-colors">
              <Github className="w-5 h-5" />
              <span className="text-sm font-medium text-on-surface">Github</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-outline-variant">
            <div className="h-px flex-grow bg-surface-container-high"></div>
            <span className="text-[0.6875rem] font-bold uppercase tracking-widest">Or with email</span>
            <div className="h-px flex-grow bg-surface-container-high"></div>
          </div>

          <form className="space-y-6" onSubmit={submit}>
            <div className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">Full Name</label>
                  <input className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/10 transition-all text-on-surface placeholder:text-outline text-sm" placeholder="Alex Sterling" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required={!isLogin} />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">Email Address</label>
                <input className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/10 transition-all text-on-surface placeholder:text-outline text-sm" placeholder="student@university.edu" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">Password</label>
                  {isLogin && <a href="#" className="text-xs text-primary font-medium hover:underline">Forgot password?</a>}
                </div>
                <div className="relative">
                  <input className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/10 transition-all text-on-surface placeholder:text-outline text-sm" placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  {!isLogin && <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60"><Eye className="w-5 h-5" /></button>}
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-error bg-error-container/20 px-3 py-2 rounded-lg">{error}</p>}

            <div className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 rounded border-outline-variant/40 text-primary focus:ring-primary/20 bg-surface-container-low" required={!isLogin} />
              <span className="text-xs text-on-surface-variant font-medium">
                {isLogin ? 'Keep me signed in' : 'I agree to the Terms and Privacy Policy'}
              </span>
            </div>

            <button disabled={loading} className="w-full py-4 px-6 primary-gradient text-on-primary rounded-full font-headline font-bold tracking-tight shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
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
        </div>
      </div>
    </main>
  );
}

function SocialButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="flex items-center justify-center gap-2 py-3 border border-outline-variant/20 rounded-xl hover:bg-surface-container transition-colors">
      <img src={icon} alt={label} className="w-5 h-5" referrerPolicy="no-referrer" />
      <span className="text-sm font-medium text-on-surface">{label}</span>
    </button>
  );
}
