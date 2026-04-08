import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, History } from 'lucide-react';
import { apiFetch } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';
import { ApiSession, ApiText } from '@/src/types';

export default function Dashboard() {
  const { user, token } = useAuth();
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [texts, setTexts] = useState<ApiText[]>([]);

  useEffect(() => {
    if (!token) return;
    void apiFetch<ApiSession[]>('/sessions', {}, token).then(setSessions).catch(() => setSessions([]));
    void apiFetch<ApiText[]>('/texts', {}, token).then(setTexts).catch(() => setTexts([]));
  }, [token]);

  const avgScore = useMemo(() => sessions.length ? Math.round(sessions.reduce((a, s) => a + s.score, 0) / sessions.length) : 0, [sessions]);

  return (
    <main className="pt-24 pb-20 px-8 max-w-[1440px] mx-auto min-h-screen space-y-10">
      <header>
        <h1 className="font-headline font-extrabold text-4xl">Welcome back, {user?.name ?? 'Student'}</h1>
        <p className="text-on-surface-variant">Track your dictation performance, saved texts, and account progress.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Average Score" value={`${avgScore}%`} />
        <Card title="Total Sessions" value={`${sessions.length}`} />
        <Card title="Saved Texts" value={`${texts.length}`} />
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest rounded-2xl p-6 whisper-shadow">
          <h2 className="font-bold mb-4 flex items-center gap-2"><History className="w-4 h-4" /> Recent Sessions</h2>
          <div className="space-y-3">
            {sessions.slice(0, 5).map((session) => (
              <div key={session.id} className="flex justify-between border-b border-surface-container pb-2">
                <div>
                  <p className="font-semibold">{session.title}</p>
                  <p className="text-xs text-on-surface-variant">{new Date(session.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="font-bold text-primary">{session.score}%</p>
              </div>
            ))}
            {sessions.length === 0 && <p className="text-sm text-on-surface-variant">No dictation sessions yet.</p>}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-6 whisper-shadow">
          <h2 className="font-bold mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Saved Text Library</h2>
          <div className="space-y-3">
            {texts.slice(0, 5).map((text) => (
              <div key={text.id} className="border-b border-surface-container pb-2">
                <p className="font-semibold">{text.title}</p>
                <p className="text-xs text-on-surface-variant">{text.level} • {text.category}</p>
              </div>
            ))}
            {texts.length === 0 && <p className="text-sm text-on-surface-variant">No saved texts yet. Generate one in AI Lab.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return <div className="bg-surface-container-lowest rounded-2xl p-6 whisper-shadow"><p className="text-sm text-on-surface-variant">{title}</p><p className="text-3xl font-bold text-primary">{value}</p></div>;
}
