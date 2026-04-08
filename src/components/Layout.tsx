import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, History } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';

export function Navbar() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const { user, logout } = useAuth();

  if (isAuthPage) {
    return (
      <header className="w-full px-8 py-10 flex justify-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="text-2xl font-black tracking-tighter text-primary font-headline">Scholar Script</div>
        </Link>
      </header>
    );
  }

  return (
    <nav className="bg-surface fixed top-0 w-full z-50 border-b border-surface-container">
      <div className="flex justify-between items-center h-16 px-8 max-w-[1440px] mx-auto">
        <Link to="/" className="text-2xl font-black tracking-tighter text-primary font-headline">Scholar Script</Link>
        <div className="hidden md:flex items-center gap-8 font-headline font-semibold tracking-tight">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/workspace">Exercises</NavLink>
          <NavLink to="/ai-lab">AI Lab</NavLink>
          <NavLink to="/pricing">Pricing</NavLink>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg"><Bell className="w-5 h-5" /></button>
          <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg"><History className="w-5 h-5" /></button>
          {!user ? (
            <Link to="/login" className="text-on-surface-variant font-headline font-semibold px-4 py-2 hover:bg-surface-container rounded-lg">Login</Link>
          ) : (
            <button onClick={logout} className="text-on-surface-variant font-headline font-semibold px-4 py-2 hover:bg-surface-container rounded-lg">Logout</button>
          )}
          <Link to={user ? '/workspace' : '/signup'} className="primary-gradient text-on-primary font-headline font-semibold px-6 py-2 rounded-full">Start New</Link>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return <Link to={to} className={cn('transition-colors', isActive ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-primary')}>{children}</Link>;
}

export function Footer() {
  return (
    <footer className="bg-surface w-full py-12 px-8 border-t border-surface-container">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-[1440px] mx-auto">
        <div className="space-y-4">
          <div className="font-headline font-bold text-on-surface text-xl">Scholar Script</div>
          <p className="text-xs tracking-wide leading-relaxed text-on-surface-variant max-w-xs">© 2026 Scholar Script. The Digital Atelier for Focused Learning.</p>
        </div>
      </div>
    </footer>
  );
}
