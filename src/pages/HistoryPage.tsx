import React, { useEffect, useMemo, useState } from 'react';
import { History, LoaderCircle, RotateCcw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasSupabaseEnv } from '../lib/env';
import { supabase } from '../lib/supabase';
import { CEFR_LEVELS, LEARNING_LANGUAGES, PRACTICE_SKILLS } from '../lib/learning';

type HistorySession = {
  id: string;
  title: string;
  date: string;
  language: string;
  level: string;
  score: number;
  mode: 'automatic' | 'manual';
  skill: string;
  sourceText: string;
  inputText: string;
};

const FALLBACK_SESSIONS: HistorySession[] = [
  {
    id: 'sample-b2',
    title: 'B2 Dictation: Academic Paragraphs',
    date: new Date().toISOString(),
    language: 'English',
    level: 'B2',
    score: 82,
    mode: 'automatic',
    skill: 'Dictation',
    sourceText: 'Academic progress depends on consistent practice and careful listening.',
    inputText: '',
  },
];

export default function HistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<HistorySession[]>(FALLBACK_SESSIONS);
  const [loading, setLoading] = useState(Boolean(user && hasSupabaseEnv()));
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    level: 'All',
    language: 'All',
    skill: 'All',
    score: 'All',
    date: 'All',
  });

  useEffect(() => {
    if (!user || !hasSupabaseEnv()) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadHistory() {
      setLoading(true);
      setError(null);
      const { data, error: loadError } = await supabase
        .from('dictation_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(80);

      if (!active) {
        return;
      }

      if (loadError) {
        setError(loadError.message);
        setLoading(false);
        return;
      }

      setSessions(
        (data ?? []).map((session) => ({
          id: session.id,
          title: session.title ?? 'Untitled session',
          date: session.created_at,
          language: session.language ?? 'English',
          level: session.cefr_level ?? 'B1',
          score: Math.round(session.accuracy ?? 0),
          mode: session.source_text ? 'automatic' : 'manual',
          skill: session.practice_category ?? inferSkill(session.title ?? ''),
          sourceText: session.source_text ?? '',
          inputText: session.input_text ?? '',
        })),
      );
      setLoading(false);
    }

    void loadHistory();

    return () => {
      active = false;
    };
  }, [user]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const scoreMatches =
        filters.score === 'All' ||
        (filters.score === '90+' && session.score >= 90) ||
        (filters.score === '70-89' && session.score >= 70 && session.score <= 89) ||
        (filters.score === '<70' && session.score < 70);
      const dateMatches = filters.date === 'All' || isWithinDateFilter(session.date, filters.date);

      return (
        (filters.level === 'All' || session.level === filters.level) &&
        (filters.language === 'All' || session.language === filters.language) &&
        (filters.skill === 'All' || session.skill === filters.skill) &&
        scoreMatches &&
        dateMatches
      );
    });
  }, [filters, sessions]);

  function retrySession(session: HistorySession) {
    navigate('/workspace', {
      state: {
        sourceText: session.sourceText || session.title,
        inputText: session.inputText,
        title: session.title,
        language: session.language,
        cefrLevel: session.level,
        practiceCategory: session.skill,
      },
    });
  }

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 pt-24 sm:pt-28 min-h-screen">
      <header className="mb-10 sm:mb-12">
        <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary mb-3">History</p>
        <h1 className="font-headline font-extrabold text-3xl sm:text-4xl tracking-tight text-on-surface">Practice History</h1>
        <p className="text-on-surface-variant mt-3 max-w-2xl">
          Review past sessions by level, language, skill, score, and date, then retry the sessions that matter most.
        </p>
      </header>

      {error && <div className="mb-6 rounded-2xl border border-error/20 bg-error-container/25 px-5 py-4 text-sm text-error">{error}</div>}

      <section className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 whisper-shadow mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <FilterSelect label="Level" value={filters.level} options={['All', ...CEFR_LEVELS.map((item) => item.level)]} onChange={(value) => setFilters((current) => ({ ...current, level: value }))} />
          <FilterSelect label="Language" value={filters.language} options={['All', ...LEARNING_LANGUAGES.map((item) => item.language)]} onChange={(value) => setFilters((current) => ({ ...current, language: value }))} />
          <FilterSelect label="Skill" value={filters.skill} options={['All', ...PRACTICE_SKILLS]} onChange={(value) => setFilters((current) => ({ ...current, skill: value }))} />
          <FilterSelect label="Score" value={filters.score} options={['All', '90+', '70-89', '<70']} onChange={(value) => setFilters((current) => ({ ...current, score: value }))} />
          <FilterSelect label="Date" value={filters.date} options={['All', '7 days', '30 days']} onChange={(value) => setFilters((current) => ({ ...current, date: value }))} />
        </div>
      </section>

      {loading ? (
        <div className="bg-surface-container-lowest rounded-2xl p-10 whisper-shadow flex items-center justify-center gap-3 text-on-surface-variant">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading practice history...
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-10 whisper-shadow text-center">
          <Search className="mx-auto h-9 w-9 text-primary" />
          <h2 className="mt-4 font-headline font-bold text-xl text-on-surface">No sessions match these filters</h2>
          <p className="mt-2 text-sm text-on-surface-variant">Try a wider date or score range, or complete a new practice session.</p>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredSessions.map((session) => (
            <article key={session.id} className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 whisper-shadow border border-outline-variant/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary">{session.skill}</p>
                  <h2 className="mt-2 font-headline font-bold text-xl text-on-surface">{session.title}</h2>
                </div>
                <span className="rounded-xl bg-primary-container px-3 py-2 text-sm font-black text-primary">{session.score}%</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                <Meta label="Date" value={formatDate(session.date)} />
                <Meta label="Level" value={session.level} />
                <Meta label="Language" value={session.language} />
                <Meta label="Mode" value={session.mode} />
              </div>
              <button
                type="button"
                onClick={() => retrySession(session)}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary"
              >
                <RotateCcw className="h-4 w-4" />
                Retry
              </button>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-surface-container-low border border-surface-container rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="mt-1 font-semibold text-on-surface capitalize">{value}</p>
    </div>
  );
}

function inferSkill(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('reading')) return 'Reading';
  if (lower.includes('listening')) return 'Listening';
  if (lower.includes('writing')) return 'Writing';
  return 'Dictation';
}

function isWithinDateFilter(value: string, filter: string) {
  const age = Date.now() - new Date(value).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  if (filter === '7 days') return age <= 7 * dayMs;
  if (filter === '30 days') return age <= 30 * dayMs;
  return true;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
