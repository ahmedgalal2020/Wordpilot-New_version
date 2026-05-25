import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Award, BookOpen, History, LoaderCircle, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { Certificate, SavedText, Session } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { hasSupabaseEnv } from '../lib/env';
import { useEntitlements } from '../hooks/useEntitlements';
import { useWeeklyReport } from '../hooks/useWeeklyReport';
import { CurrentLevelCard, PracticeExerciseCard, PracticeRecommendationCard, WeeklyProgressReport } from '../components/LearningComponents';
import { buildPracticeRecommendation, getPracticeExercises, normalizeCefrLevel, normalizeLearningLanguage, PracticeExercise } from '../lib/learning';

type SessionMetricRow = {
  accuracy: number | null;
  created_at: string;
};

type DashboardMetrics = {
  averageScore: number | null;
  totalSessions: number;
  weeklyDelta: number | null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const displayName = profile?.full_name || user?.user_metadata.full_name || user?.email?.split('@')[0] || 'Pilot';
  const targetLanguage = normalizeLearningLanguage(profile?.target_language);
  const cefrLevel = normalizeCefrLevel(profile?.cefr_level);
  const supabaseReady = hasSupabaseEnv();
  const { entitlements } = useEntitlements(user);
  const { report: weeklyReport, loading: weeklyReportLoading } = useWeeklyReport(user, targetLanguage);
  const [savedTexts, setSavedTexts] = useState<SavedText[]>([]);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [sessionMetrics, setSessionMetrics] = useState<DashboardMetrics>({
    averageScore: null,
    totalSessions: 0,
    weeklyDelta: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAllSessions, setShowAllSessions] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    if (!supabaseReady) {
      setIsLoading(false);
      setLoadError('Connect Supabase to load live dashboard data.');
      return;
    }

    let active = true;

    async function loadDashboardData() {
      setIsLoading(true);
      setLoadError(null);

      const [savedTextsResult, sessionsResult, sessionMetricsResult, certificatesResult] = await Promise.all([
        supabase.from('saved_texts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
        supabase.from('dictation_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(12),
        supabase.from('dictation_sessions').select('accuracy, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('certificates').select('*').eq('user_id', user.id).order('issued_at', { ascending: false }).limit(3),
      ]);

      if (!active) {
        return;
      }

      const firstError =
        savedTextsResult.error || sessionsResult.error || sessionMetricsResult.error || certificatesResult.error;

      if (firstError) {
        setLoadError(firstError.message);
      }

      setSavedTexts(
        savedTextsResult.data?.map((text, index) => ({
          id: text.id,
          title: text.title,
          level: text.level ?? 'B1',
          category: text.category ?? 'General',
          icon: index % 2 === 0 ? 'book' : 'history',
          body: text.body ?? '',
          source: text.source ?? '',
          createdAt: text.created_at,
        })) ?? [],
      );

      setRecentSessions(
        sessionsResult.data?.map((session) => ({
          id: session.id,
          date: formatSessionDate(session.created_at),
          title: session.title,
          language: session.language ?? inferLanguageLabel(session.source_text ?? ''),
          score: Math.round(session.accuracy ?? 0),
          sourceText: session.source_text ?? '',
          inputText: session.input_text ?? '',
          cefrLevel: session.cefr_level ?? 'B1',
        })) ?? [],
      );

      setCertificates(
        certificatesResult.data?.map((certificate) => ({
          id: certificate.id,
          title: certificate.title,
          score: Math.round(certificate.score ?? 0),
          language: certificate.language ?? 'English',
          issuedAt: certificate.issued_at,
          level: certificate.cefr_level ?? 'B1',
          sessionTitle: certificate.title,
        })) ?? [],
      );

      setSessionMetrics(buildDashboardMetrics((sessionMetricsResult.data ?? []) as SessionMetricRow[]));
      setIsLoading(false);
    }

    void loadDashboardData();

    return () => {
      active = false;
    };
  }, [supabaseReady, user]);

  const visibleSessions = useMemo(
    () => (showAllSessions ? recentSessions : recentSessions.slice(0, 5)),
    [recentSessions, showAllSessions],
  );

  const featuredCertificate = certificates[0] ?? null;
  const bestSession = useMemo(
    () => recentSessions.reduce<Session | null>((best, session) => (!best || session.score > best.score ? session : best), null),
    [recentSessions],
  );
  const practiceExercises = useMemo(
    () => getPracticeExercises(cefrLevel, weeklyReport.currentWeek.averageAccuracy, targetLanguage),
    [cefrLevel, targetLanguage, weeklyReport.currentWeek.averageAccuracy],
  );
  const completedPathCount = practiceExercises.filter((exercise) => exercise.status === 'completed').length;
  const nextPracticeRecommendation = buildPracticeRecommendation(cefrLevel, weeklyReport, targetLanguage);

  function startPractice(text: SavedText) {
    const sourceText = stripTitleFromPracticeText(text.body || text.source || text.title);
    navigate('/workspace', {
      state: {
        sourceText,
        title: text.title,
        language: inferLanguageLabel(sourceText),
        cefrLevel: text.level || cefrLevel,
      },
    });
  }

  function startPathExercise(exercise: PracticeExercise) {
    navigate('/workspace', {
      state: {
        sourceText: exercise.sourceText,
        title: exercise.title,
        language: exercise.language,
        cefrLevel: exercise.level,
        practiceCategory: exercise.skill,
      },
    });
  }

  function reviewSession(session: Session) {
    navigate('/workspace', {
      state: {
        reviewMode: true,
        sourceText: session.sourceText || session.title,
        inputText: session.inputText || '',
        title: session.title,
        language: session.language,
        cefrLevel: session.cefrLevel || profile?.cefr_level || 'B1',
        score: session.score,
      },
    });
  }

  function openPrimaryAchievement() {
    if (featuredCertificate) {
      navigate(`/certificates?highlight=${featuredCertificate.id}`);
      return;
    }

    if (bestSession) {
      reviewSession(bestSession);
      return;
    }

    navigate('/workspace');
  }

  return (
    <main className="pt-24 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto min-h-screen">
      <header className="mb-10 sm:mb-12">
        <h1 className="font-headline font-extrabold text-3xl sm:text-4xl tracking-tight text-on-surface mb-2">Welcome back, {displayName}</h1>
        <p className="text-on-surface-variant font-medium">
          Your workspace is connected to your account. Current target: {targetLanguage} at {cefrLevel}.
        </p>
      </header>

      {loadError && (
        <div className="mb-8 rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-sm text-on-surface">
          {loadError}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
        <StatCard
          label="Average Score"
          value={sessionMetrics.averageScore === null ? '--' : String(sessionMetrics.averageScore)}
          trend={buildTrendLabel(sessionMetrics.weeklyDelta)}
          icon={<TrendingUp className="w-4 h-4 mr-1" />}
          primary
          loading={isLoading}
        />
        <StatCard
          label="Total Sessions"
          value={String(sessionMetrics.totalSessions)}
          trend={sessionMetrics.totalSessions > 0 ? 'Live progress synced from your account.' : 'Start your first dictation to populate this dashboard.'}
          italic
          loading={isLoading}
        />
        <AchievementCard
          certificate={featuredCertificate}
          bestSession={bestSession}
          loading={isLoading}
          onOpen={openPrimaryAchievement}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-12 sm:mb-16">
        <div className="lg:col-span-8">
          <CurrentLevelCard language={targetLanguage} level={cefrLevel} completedCount={completedPathCount} recommendation={nextPracticeRecommendation} />
        </div>
        <div className="lg:col-span-4">
          <PracticeRecommendationCard level={cefrLevel} report={weeklyReport} language={targetLanguage} isPro={entitlements.isPro} />
        </div>
      </section>

      <section className="mb-12 sm:mb-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="font-headline font-bold text-xl text-on-surface">Practice Path Preview</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Start with the next cards for your current {cefrLevel} plan.</p>
          </div>
          <Link to="/practice-path" className="text-primary text-sm font-bold hover:underline">
            Open full path
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {practiceExercises.map((exercise) => (
            <PracticeExerciseCard key={exercise.id} exercise={exercise} onStart={startPathExercise} />
          ))}
        </div>
      </section>

      <WeeklyProgressReport report={weeklyReport} loading={weeklyReportLoading} isPro={entitlements.isPro} />

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-12 sm:mb-16">
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-6 gap-3">
            <h2 className="font-headline font-bold text-xl text-on-surface">Recent Sessions</h2>
            <div className="flex items-center gap-4">
              {recentSessions.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllSessions((current) => !current)}
                  className="text-primary text-sm font-bold hover:underline"
                >
                  {showAllSessions ? 'Show less' : 'View all history'}
                </button>
              )}
              <Link to="/history" className="text-primary text-sm font-bold hover:underline">
                Filters
              </Link>
            </div>
          </div>

          {isLoading ? (
            <PanelLoader label="Loading your latest sessions..." />
          ) : visibleSessions.length === 0 ? (
            <EmptyPanel
              title="No sessions yet"
              body="Your completed dictation sessions will appear here with review links and scores."
              ctaLabel="Start New Dictation"
              ctaTo="/workspace"
            />
          ) : (
            <>
              <div className="hidden md:block bg-surface-container-lowest rounded-2xl overflow-hidden whisper-shadow">
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
                    {visibleSessions.map((session) => (
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
                          <button type="button" onClick={() => reviewSession(session)} className="text-primary font-bold text-sm hover:underline">
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {visibleSessions.map((session) => (
                  <div key={session.id} className="bg-surface-container-lowest rounded-2xl p-4 whisper-shadow space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{session.date}</p>
                        <h3 className="mt-1 font-headline font-bold text-on-surface">{session.title}</h3>
                      </div>
                      <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        {session.language}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-headline font-bold text-primary text-lg">{session.score}%</span>
                      <button type="button" onClick={() => reviewSession(session)} className="text-primary font-bold text-sm hover:underline">
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline font-bold text-xl text-on-surface">Saved Texts</h2>
            <Link to="/library" className="text-primary text-sm font-bold hover:underline">
              Library
            </Link>
          </div>

          {isLoading ? (
            <PanelLoader label="Loading your saved texts..." />
          ) : savedTexts.length === 0 ? (
            <EmptyPanel
              title="No saved texts yet"
              body="Save drafts from AI Lab or your practice flow and they will show up here."
              ctaLabel="Open AI Lab"
              ctaTo="/ai-lab"
            />
          ) : (
            <div className="space-y-4">
              {savedTexts.map((text) => (
                <div key={text.id} className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 group hover:shadow-sm transition-all flex items-start space-x-4 whisper-shadow">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                      text.icon === 'book' ? 'bg-tertiary-container text-tertiary' : 'bg-primary-container text-primary',
                    )}
                  >
                    {text.icon === 'book' ? <BookOpen className="w-6 h-6" /> : <History className="w-6 h-6" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">{text.title}</h3>
                    <p className="text-xs text-on-surface-variant mt-1">{text.level} Level - {text.category}</p>
                    <button
                      type="button"
                      onClick={() => startPractice(text)}
                      className="mt-3 w-full bg-surface-container hover:bg-primary hover:text-on-primary transition-all py-2 rounded-lg text-[11px] font-bold tracking-wide uppercase"
                    >
                      Practice Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mb-12 sm:mb-16">
        <div className="bg-surface-container rounded-3xl p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h2 className="font-headline font-black text-3xl text-on-surface mb-2">Keep the momentum</h2>
            <p className="text-on-surface-variant max-w-xl">
              {sessionMetrics.totalSessions > 0
                ? `You have ${sessionMetrics.totalSessions} recorded session${sessionMetrics.totalSessions === 1 ? '' : 's'} and ${savedTexts.length} saved text${savedTexts.length === 1 ? '' : 's'} ready for more practice.`
                : 'Start a new dictation or generate a fresh AI text to begin building your dashboard history.'}
            </p>
          </div>
          <div className="flex w-full md:w-auto flex-col sm:flex-row gap-3 sm:gap-4">
            <Link to="/workspace" className="bg-primary text-on-primary px-6 sm:px-8 py-4 rounded-full font-headline font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center">
              Start New Dictation
            </Link>
            <Link to="/ai-lab" className="bg-surface-container-lowest text-on-surface px-6 sm:px-8 py-4 rounded-full font-headline font-bold shadow-sm hover:bg-white transition-colors flex items-center justify-center">
              Open AI Lab
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function AchievementCard({
  certificate,
  bestSession,
  loading,
  onOpen,
}: {
  certificate: Certificate | null;
  bestSession: Session | null;
  loading: boolean;
  onOpen: () => void;
}) {
  if (loading) {
    return (
      <div className="bg-primary text-on-primary rounded-2xl p-8 flex items-center justify-center min-h-[200px] whisper-shadow">
        <LoaderCircle className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const score = certificate?.score ?? bestSession?.score ?? 0;
  const label = certificate ? 'Best Performance' : bestSession ? 'Top Session' : 'Best Performance';
  const detail = certificate
    ? `${certificate.level} ${certificate.language} ${certificate.sessionTitle}`
    : bestSession
      ? `${bestSession.cefrLevel ?? 'B1'} ${bestSession.language} ${bestSession.title}`
      : 'Complete your first dictation to unlock your best score card.';
  const buttonLabel = certificate ? 'View Certificate' : bestSession ? 'Review Session' : 'Start Practising';

  return (
    <div className="bg-primary text-on-primary rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden whisper-shadow min-h-[200px]">
      <div className="absolute -right-4 -bottom-4 opacity-10">
        <Award className="w-32 h-32" />
      </div>
      <div>
        <span className="text-primary-container font-headline text-[0.6875rem] font-bold tracking-widest uppercase mb-4 block">{label}</span>
        <div className="font-headline font-black text-5xl mb-2">
          {score}
          <span className="text-2xl font-bold">%</span>
        </div>
        <p className="text-sm font-medium opacity-90 leading-snug">{detail}</p>
      </div>
      <div className="mt-6">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex bg-white/20 hover:bg-white/30 transition-colors px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-md"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  trend,
  icon,
  primary,
  italic,
  loading,
}: {
  label: string;
  value: string;
  trend: string;
  icon?: React.ReactNode;
  primary?: boolean;
  italic?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="bg-surface-container-low rounded-2xl p-6 sm:p-8 transition-all hover:bg-surface-container flex flex-col justify-between whisper-shadow min-h-[200px]">
      <div>
        <span className="text-on-surface-variant font-headline text-[0.6875rem] font-bold tracking-widest uppercase mb-4 block">{label}</span>
        <div className={cn('font-headline font-black text-4xl sm:text-5xl', primary ? 'text-primary' : 'text-on-surface')}>
          {loading ? <LoaderCircle className="w-8 h-8 animate-spin" /> : value}
          {primary && !loading && value !== '--' && <span className="text-2xl font-bold">%</span>}
        </div>
      </div>
      <div className={cn('mt-6 flex items-center text-xs font-semibold', primary ? 'text-primary' : 'text-on-surface-variant', italic && 'italic font-medium')}>
        {icon}
        {loading ? 'Syncing dashboard data...' : trend}
      </div>
    </div>
  );
}

function PanelLoader({ label }: { label: string }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl px-6 py-10 whisper-shadow flex items-center justify-center gap-3 text-on-surface-variant">
      <LoaderCircle className="w-5 h-5 animate-spin" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function EmptyPanel({
  title,
  body,
  ctaLabel,
  ctaTo,
}: {
  title: string;
  body: string;
  ctaLabel: string;
  ctaTo: string;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl px-6 py-8 whisper-shadow">
      <h3 className="font-headline font-bold text-lg text-on-surface">{title}</h3>
      <p className="mt-2 text-sm text-on-surface-variant max-w-lg">{body}</p>
      <Link to={ctaTo} className="mt-5 inline-flex rounded-full bg-primary text-on-primary px-5 py-3 text-sm font-bold">
        {ctaLabel}
      </Link>
    </div>
  );
}

function buildDashboardMetrics(rows: SessionMetricRow[]): DashboardMetrics {
  if (rows.length === 0) {
    return {
      averageScore: null,
      totalSessions: 0,
      weeklyDelta: null,
    };
  }

  const accuracyValues = rows
    .map((row) => (typeof row.accuracy === 'number' ? row.accuracy : Number(row.accuracy ?? 0)))
    .filter((value) => Number.isFinite(value));
  const averageScore = accuracyValues.length > 0 ? Math.round(accuracyValues.reduce((sum, value) => sum + value, 0) / accuracyValues.length) : null;

  const now = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const currentWeek = rows.filter((row) => now - new Date(row.created_at).getTime() <= oneWeekMs);
  const previousWeek = rows.filter((row) => {
    const age = now - new Date(row.created_at).getTime();
    return age > oneWeekMs && age <= oneWeekMs * 2;
  });

  const currentWeekAverage = getAverageAccuracy(currentWeek);
  const previousWeekAverage = getAverageAccuracy(previousWeek);

  return {
    averageScore,
    totalSessions: rows.length,
    weeklyDelta:
      currentWeekAverage !== null && previousWeekAverage !== null ? Math.round(currentWeekAverage - previousWeekAverage) : null,
  };
}

function getAverageAccuracy(rows: SessionMetricRow[]) {
  if (rows.length === 0) {
    return null;
  }

  const values = rows
    .map((row) => (typeof row.accuracy === 'number' ? row.accuracy : Number(row.accuracy ?? 0)))
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildTrendLabel(weeklyDelta: number | null) {
  if (weeklyDelta === null) {
    return 'Weekly trend will appear after two active weeks.';
  }

  if (weeklyDelta === 0) {
    return 'Steady compared with the previous week.';
  }

  return `${weeklyDelta > 0 ? '+' : ''}${weeklyDelta}% from last week`;
}

function formatSessionDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function stripTitleFromPracticeText(content: string) {
  return content.replace(/^title:\s*.+\n*/i, '').trim();
}

function inferLanguageLabel(text: string) {
  const lower = text.toLowerCase();
  const germanMarkers = [' der ', ' die ', ' das ', ' und ', ' nicht ', ' ist ', ' mit ', ' fuer ', ' ueber ', ' sch '];
  const germanHits = germanMarkers.reduce((count, marker) => count + (lower.includes(marker) ? 1 : 0), 0);
  const hasGermanChars = /[äöüß]/i.test(text);
  return germanHits > 1 || hasGermanChars ? 'German' : 'English';
}

