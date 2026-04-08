import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Github, Eye } from 'lucide-react';
import { login, signup } from '@/src/lib/api';

export default function AuthPage() {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [isError, setIsError] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      if (isLogin) {
        await login(email, password);
        setMessage('Login successful ✅');
      } else {
        await signup(fullName, email, password);
        setMessage('Account created successfully ✅');
      }

      setIsError(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong');
      setIsError(true);
    }
  }

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

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">Full Name</label>
                  <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/10 transition-all text-on-surface placeholder:text-outline text-sm" placeholder="Alex Sterling" type="text" required />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">Email Address</label>
                <input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/10 transition-all text-on-surface placeholder:text-outline text-sm" placeholder="student@university.edu" type="email" required />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">Password</label>
                  {isLogin && <a href="#" className="text-xs text-primary font-medium hover:underline">Forgot password?</a>}
                </div>
                <div className="relative">
                  <input value={password} onChange={(event) => setPassword(event.target.value)} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/10 transition-all text-on-surface placeholder:text-outline text-sm" placeholder="••••••••" type="password" required />
                  {!isLogin && <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60"><Eye className="w-5 h-5" /></button>}
                </div>
              </div>
            </div>

            {message && (
              <p className={isError ? 'text-red-600 text-sm font-medium' : 'text-green-600 text-sm font-medium'}>{message}</p>
            )}

            <div className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 rounded border-outline-variant/40 text-primary focus:ring-primary/20 bg-surface-container-low" />
              <span className="text-xs text-on-surface-variant font-medium">
                {isLogin ? 'Keep me signed in' : 'I agree to the Terms and Privacy Policy'}
              </span>
            </div>

            <button type="submit" className="w-full py-4 px-6 primary-gradient text-on-primary rounded-full font-headline font-bold tracking-tight shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="pt-4 text-center">
            <p className="text-sm text-on-surface-variant">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <Link to={isLogin ? "/signup" : "/login"} className="text-primary font-semibold hover:underline ml-1">
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
