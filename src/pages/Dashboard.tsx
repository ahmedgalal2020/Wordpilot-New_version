import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, BookOpen, History, Award } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Session, SavedText } from '@/src/types';
import { getDashboard } from '@/src/lib/api';

const FALLBACK_SESSIONS: Session[] = [
  { id: '1', date: 'Oct 24, 2023', title: 'Modern Economics Vol I', language: 'English', score: 96 },
  { id: '2', date: 'Oct 22, 2023', title: 'Philosophical Meditations', language: 'German', score: 89 },
  { id: '3', date: 'Oct 19, 2023', title: 'Advanced Biology Notes', language: 'English', score: 92 },
];

const FALLBACK_SAVED_TEXTS: SavedText[] = [
  { id: '1', title: 'The Great Gatsby - Ch 1', level: 'C1', category: 'Literary Narrative', icon: 'book' },
  { id: '2', title: 'World War II Overview', level: 'B2', category: 'Historical Non-fiction', icon: 'history' },
];

export default function Dashboard() {
  const [sessions, setSessions] = React.useState<Session[]>(FALLBACK_SESSIONS);
  const [savedTexts, setSavedTexts] = React.useState<SavedText[]>(FALLBACK_SAVED_TEXTS);
  const [userName, setUserName] = React.useState('Julian');

  React.useEffect(() => {
    getDashboard('student@wordpilot.app')
      .then((payload) => {
        setSessions(payload.sessions);
        setSavedTexts(payload.savedTexts);
        setUserName(payload.user.fullName.split(' ')[0] || payload.user.fullName);
      })
      .catch(() => {
        // Keep the fallback content if backend/database is not running yet.
      });
  }, []);

  return (
    <main className="pt-24 pb-20 px-8 max-w-[1440px] mx-auto min-h-screen">
      <header className="mb-12">
        <h1 className="font-headline font-extrabold text-4xl tracking-tight text-on-surface mb-2">Welcome back, {userName}</h1>
        <p className="text-on-surface-variant font-medium">Your learning journey is progressing beautifully. Ready for another session?</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <StatCard 
          label="Average Score" 
          value="94" 
          trend="+2% from last week" 
          icon={<TrendingUp className="w-4 h-4 mr-1" />}
          primary
        />
        <StatCard 
          label="Total Sessions" 
          value="42" 
          trend="12 sessions this month" 
          italic
        />
        <div className="bg-primary text-on-primary rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden whisper-shadow">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Award className="w-32 h-32" />
          </div>
          <div>
            <span className="text-primary-container font-headline text-[0.6875rem] font-bold tracking-widest uppercase mb-4 block">Best Performance</span>
            <div className="font-headline font-black text-5xl mb-2">100<span className="text-2xl font-bold">%</span></div>
            <p className="text-sm font-medium opacity-90 leading-snug">B2 English Literary Analysis</p>
          </div>
          <div className="mt-6">
            <button className="bg-white/20 hover:bg-white/30 transition-colors px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-md">
              View Certificate
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline font-bold text-xl text-on-surface">Recent Sessions</h2>
            <button className="text-primary text-sm font-bold hover:underline">View All History</button>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden whisper-shadow">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="py-4 px-6 text-[0.6875rem] font-bold text-on-surface-variant tracking-wider uppercase">Date</th>
                  <th className="py-4 px-6 text-[0.6875rem] font-bold text-on-surface-variant tracking-wider uppercase">Text Title</th>
                  <th className="py-4 px-6 text-[0.6875rem] font-bold text-on-surface-variant tracking-wider uppercase">Language</th>
                  <th className="py-4 px-6 text-[0.6875rem] font-bold text-on-surface-variant tracking-wider uppercase">Score</th>
                  <th className="py-4 px-6 text-[0.6875rem] font-bold text-on-surface-variant tracking-wider uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="py-5 px-6 text-sm text-on-surface">{session.date}</td>
                    <td className="py-5 px-6 font-semibold text-on-surface">{session.title}</td>
                    <td className="py-5 px-6">
                      <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        {session.language}
                      </span>
                    </td>
                    <td className="py-5 px-6 font-headline font-bold text-primary">{session.score}%</td>
                    <td className="py-5 px-6 text-right">
                      <button className="text-primary font-bold text-sm hover:underline">Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline font-bold text-xl text-on-surface">Saved Texts</h2>
            <button className="text-primary text-sm font-bold hover:underline">Library</button>
          </div>
          <div className="space-y-4">
            {savedTexts.map((text) => (
              <div key={text.id} className="bg-surface-container-lowest rounded-2xl p-5 group hover:shadow-sm transition-all flex items-start space-x-4 whisper-shadow">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                  text.icon === 'book' ? "bg-tertiary-container text-tertiary" : "bg-primary-container text-primary"
                )}>
                  {text.icon === 'book' ? <BookOpen className="w-6 h-6" /> : <History className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">{text.title}</h3>
                  <p className="text-xs text-on-surface-variant mt-1">{text.level} Level • {text.category}</p>
                  <button className="mt-3 w-full bg-surface-container hover:bg-primary hover:text-on-primary transition-all py-2 rounded-lg text-[11px] font-bold tracking-wide uppercase">
                    Practice Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-16">
        <div className="bg-surface-container rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 pointer-events-none">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M45.7,-78C58.3,-70.2,67,-55.8,74.5,-40.8C82,-25.9,88.4,-10.4,87.6,4.6C86.7,19.6,78.6,34.1,68.6,46.7C58.6,59.3,46.7,70.1,33.1,75.4C19.5,80.7,4.2,80.6,-11,78.3C-26.2,76,-41.3,71.5,-53.1,62.8C-64.8,54,-73.2,41.1,-78.9,26.9C-84.6,12.8,-87.6,-2.6,-83.8,-16.4C-79.9,-30.3,-69.1,-42.6,-57,-51C-44.8,-59.4,-31.3,-63.9,-17.8,-71C-4.3,-78.1,9.2,-87.8,25.7,-88.7C42.2,-89.6,58.3,-81.7,45.7,-78Z" fill="#0053db" transform="translate(100 100)"></path>
            </svg>
          </div>
          <div className="relative z-10 text-center md:text-left mb-8 md:mb-0">
            <h2 className="font-headline font-black text-3xl text-on-surface mb-2">Ready to level up?</h2>
            <p className="text-on-surface-variant max-w-md">Our AI Lab can generate custom dictation texts based on your specific interests and current difficulty level.</p>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row gap-4">
            <Link to="/workspace" className="bg-primary text-on-primary px-8 py-4 rounded-full font-headline font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center">
              Start New Dictation
            </Link>
            <Link to="/ai-lab" className="bg-surface-container-lowest text-on-surface px-8 py-4 rounded-full font-headline font-bold shadow-sm hover:bg-white transition-colors flex items-center justify-center">
              Create Text
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value, trend, icon, primary, italic }: { label: string; value: string; trend: string; icon?: React.ReactNode; primary?: boolean; italic?: boolean }) {
  return (
    <div className="bg-surface-container-low rounded-2xl p-8 transition-all hover:bg-surface-container flex flex-col justify-between whisper-shadow">
      <div>
        <span className="text-on-surface-variant font-headline text-[0.6875rem] font-bold tracking-widest uppercase mb-4 block">{label}</span>
        <div className={cn("font-headline font-black text-5xl", primary ? "text-primary" : "text-on-surface")}>
          {value}
          {primary && <span className="text-2xl font-bold">%</span>}
        </div>
      </div>
      <div className={cn("mt-6 flex items-center text-xs font-semibold", primary ? "text-primary" : "text-on-surface-variant", italic && "italic font-medium")}>
        {icon}
        {trend}
      </div>
    </div>
  );
}
