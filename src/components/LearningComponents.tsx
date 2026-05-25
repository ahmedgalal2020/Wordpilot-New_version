import React from 'react';
import { BarChart3, CheckCircle, Crown, LoaderCircle, LockKeyhole, Sparkles, Target } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { WeeklyReport } from '../hooks/useWeeklyReport';
import { cn } from '../lib/utils';
import {
  buildPracticeRecommendation,
  CEFR_LEVELS,
  CefrLevel,
  getLevelProgress,
  getMistakeBreakdown,
  LEARNING_LANGUAGES,
  LearningLanguage,
  PracticeExercise,
  PracticeStatus,
} from '../lib/learning';

export function LevelSelectionPanel({
  selectedLanguage,
  selectedLevel,
  saving,
  hasChanges,
  status,
  onLanguageSelect,
  onSelect,
  onSave,
}: {
  selectedLanguage: LearningLanguage;
  selectedLevel: CefrLevel;
  saving?: boolean;
  hasChanges?: boolean;
  status?: string | null;
  onLanguageSelect: (language: LearningLanguage) => void;
  onSelect: (level: CefrLevel) => void;
  onSave: () => void;
}) {
  return (
    <section className="bg-surface-container-lowest rounded-[2rem] p-6 sm:p-8 whisper-shadow">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary mb-2">Choose language and level</p>
          <h2 className="font-headline font-black text-2xl text-on-surface">Set your learning path</h2>
          <p className="mt-2 text-sm text-on-surface-variant max-w-2xl">
            Your language and CEFR level control the training plan, AI practice defaults, history filters, and progress recommendations.
          </p>
        </div>
        {hasChanges ? (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary transition hover:bg-primary-dim disabled:opacity-70"
          >
            {saving ? 'Saving...' : 'Save path'}
          </button>
        ) : (
          <span className="inline-flex items-center justify-center rounded-full bg-tertiary-container px-4 py-2 text-xs font-bold text-tertiary">
            Path saved
          </span>
        )}
      </div>

      <div className="mb-6">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Language</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          {LEARNING_LANGUAGES.map((item) => {
            const active = item.language === selectedLanguage;
            return (
              <button
                key={item.language}
                type="button"
                onClick={() => onLanguageSelect(item.language)}
                className={cn(
                  'text-left rounded-2xl border p-4 transition-all',
                  active
                    ? 'border-primary bg-primary text-on-primary shadow-sm'
                    : 'border-surface-container bg-surface-container-low hover:border-outline-variant',
                )}
              >
                <h3 className="font-headline font-bold text-base">{item.language}</h3>
                <p className={cn('mt-2 text-xs leading-5', active ? 'text-on-primary/80' : 'text-on-surface-variant')}>
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">CEFR level</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {CEFR_LEVELS.map((item) => {
          const active = item.level === selectedLevel;
          return (
            <button
              key={item.level}
              type="button"
              onClick={() => onSelect(item.level)}
              className={cn(
                'text-left rounded-2xl border p-5 transition-all',
                active
                  ? 'border-primary bg-primary text-on-primary shadow-sm'
                  : 'border-surface-container bg-surface-container-low hover:border-outline-variant',
              )}
            >
              <span
                className={cn(
                  'inline-flex h-10 w-10 items-center justify-center rounded-xl font-headline font-black',
                  active ? 'bg-white/15 text-on-primary' : 'bg-primary-container text-primary',
                )}
              >
                {item.level}
              </span>
              <h3 className="mt-4 font-headline font-bold text-lg">{item.title}</h3>
              <p className={cn('mt-2 text-sm leading-6', active ? 'text-on-primary/80' : 'text-on-surface-variant')}>
                {item.description}
              </p>
            </button>
          );
        })}
      </div>

      {status && <div className="mt-5 rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface">{status}</div>}
    </section>
  );
}

export function CurrentLevelCard({
  language,
  level,
  completedCount,
  recommendation,
  showRecommendation = true,
}: {
  language: LearningLanguage;
  level: CefrLevel;
  completedCount: number;
  recommendation: string;
  showRecommendation?: boolean;
}) {
  const levelInfo = CEFR_LEVELS.find((item) => item.level === level);
  const progress = getLevelProgress(level, completedCount);
  const location = useLocation();
  const navigate = useNavigate();
  const isPracticePathPage = location.pathname === '/practice-path';

  function openPracticePath() {
    if (location.pathname === '/practice-path') {
      document.getElementById('training-plan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    navigate('/practice-path#training-plan');
    window.setTimeout(() => {
      document.getElementById('training-plan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  return (
    <section className="bg-surface-container-low rounded-2xl p-6 sm:p-8 whisper-shadow">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary mb-2">Current Path</p>
          <h2 className="font-headline font-black text-3xl text-on-surface">{language} {level} - {levelInfo?.title}</h2>
          <p className="mt-2 text-sm text-on-surface-variant max-w-2xl">{levelInfo?.description}</p>
        </div>
        {isPracticePathPage ? (
          <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary-container px-4 py-2 text-xs font-bold text-primary">
            Active path
          </span>
        ) : (
          <button
            type="button"
            onClick={openPracticePath}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary hover:bg-primary-dim transition"
          >
            Open Practice Path
          </button>
        )}
      </div>
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          <span>Level progress</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface-container-high">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
      {showRecommendation && (
        <div className="mt-5 rounded-2xl bg-surface-container-lowest p-5">
          <div className="flex items-start gap-3">
            <Target className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-headline font-bold text-on-surface">Next recommended practice</p>
              <p className="mt-1 text-sm text-on-surface-variant">{recommendation}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function PracticeRecommendationCard({
  level,
  report,
  language,
  isPro,
}: {
  level: CefrLevel;
  report: WeeklyReport;
  language: string;
  isPro: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const isPracticePathPage = location.pathname === '/practice-path';

  function openTrainingPlan() {
    if (location.pathname === '/practice-path') {
      document.getElementById('training-plan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    navigate('/practice-path#training-plan');
    window.setTimeout(() => {
      document.getElementById('training-plan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  return (
    <div className="bg-primary text-on-primary rounded-2xl p-6 sm:p-8 whisper-shadow">
      <div className="flex items-center gap-2 text-primary-container text-[0.6875rem] font-bold tracking-widest uppercase">
        <Sparkles className="h-4 w-4" />
        Practice Recommendation
      </div>
      <p className="mt-4 text-xl font-headline font-black leading-snug">
        {buildPracticeRecommendation(level, report, language)}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {!isPracticePathPage && (
          <button
            type="button"
            onClick={openTrainingPlan}
            className="rounded-full bg-white/15 px-5 py-3 text-sm font-bold text-on-primary hover:bg-white/25 transition"
          >
            Open training plan
          </button>
        )}
        <Link
          to={isPro ? '/ai-lab' : '/pricing'}
          state={isPro ? { language, level, skillType: 'Dictation', fromPracticePath: true } : undefined}
          className="rounded-full bg-white px-5 py-3 text-sm font-bold text-primary"
        >
          {isPro ? 'Generate practice' : 'Unlock AI practice'}
        </Link>
      </div>
    </div>
  );
}

export function PracticeExerciseCard({
  exercise,
  onStart,
}: {
  key?: React.Key;
  exercise: PracticeExercise;
  onStart: (exercise: PracticeExercise) => void;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 whisper-shadow border border-outline-variant/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary">{exercise.skill}</p>
          <h3 className="mt-2 font-headline font-bold text-xl text-on-surface">{exercise.title}</h3>
          {exercise.lessonTitle && (
            <p className="mt-1 text-xs font-semibold text-on-surface-variant">{exercise.lessonTitle}</p>
          )}
        </div>
        <StatusPill status={exercise.status} />
      </div>
      <p className="mt-3 text-sm leading-6 text-on-surface-variant">{exercise.description}</p>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <MetaBox label="Focus" value={exercise.focus} />
        <MetaBox label="Time" value={exercise.duration} />
      </div>
      <button
        type="button"
        onClick={() => onStart(exercise)}
        className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary transition hover:bg-primary-dim"
      >
        {exercise.status === 'completed' ? 'Retry practice' : exercise.status === 'in_progress' ? 'Continue' : 'Start'}
      </button>
    </div>
  );
}

export function WeeklyProgressReport({
  report,
  loading,
  isPro,
}: {
  report: WeeklyReport;
  loading: boolean;
  isPro: boolean;
}) {
  const breakdown = getMistakeBreakdown(report.topMistakes);
  const noData = !loading && report.currentWeek.sessionsCount === 0;

  return (
    <section className="mb-12 sm:mb-16 bg-surface-container-low rounded-2xl p-6 sm:p-8 whisper-shadow">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
        <div>
          <span className="text-on-surface-variant font-headline text-[0.6875rem] font-bold tracking-widest uppercase">
            Weekly Progress
          </span>
          <h2 className="mt-2 font-headline font-black text-2xl sm:text-3xl text-on-surface">Your training report</h2>
        </div>
        {!isPro && (
          <Link to="/pricing" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary text-on-primary px-5 py-3 text-sm font-bold">
            <Crown className="w-4 h-4" />
            Unlock insights
          </Link>
        )}
      </div>

      {noData ? (
        <div className="rounded-2xl bg-surface-container-lowest p-8 text-center">
          <BarChart3 className="mx-auto h-9 w-9 text-primary" />
          <h3 className="mt-4 font-headline font-bold text-xl text-on-surface">No weekly report yet</h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            Complete at least one dictation session this week to generate your progress report.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <ReportMetric label="Sessions" value={String(report.currentWeek.sessionsCount)} loading={loading} />
            <ReportMetric label="Average accuracy" value={formatPercent(report.currentWeek.averageAccuracy)} loading={loading} />
            <ReportMetric label="Vs last week" value={formatDelta(report.deltaAccuracy)} loading={loading} />
            <ReportMetric label="Best session" value={formatPercent(report.currentWeek.bestAccuracy)} loading={loading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10">
              <h3 className="font-headline font-bold text-lg text-on-surface">Top mistakes</h3>
              {loading ? (
                <PanelLoader label="Building this week's mistake profile..." />
              ) : !report.mistakeInsightsAvailable ? (
                <p className="mt-4 text-sm text-on-surface-variant">Mistake details need the dictation_mistakes table to be available.</p>
              ) : !isPro ? (
                <PremiumLock message="Free users can see basic weekly stats. Pro unlocks mistake patterns, recommendations, and exportable report placeholders." />
              ) : report.topMistakes.length === 0 ? (
                <p className="mt-4 text-sm text-on-surface-variant">No repeated mistake pattern yet. Keep practising to populate this list.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {report.topMistakes.map((mistake) => (
                    <div key={`${mistake.correctWord}-${mistake.writtenWord ?? 'missing'}-${mistake.status}`} className="flex items-center justify-between gap-4 rounded-xl bg-surface-container px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-on-surface truncate">
                          {mistake.writtenWord ?? 'Missing word'} <span className="text-on-surface-variant font-medium">{'->'}</span> {mistake.correctWord}
                        </p>
                        <p className="text-[11px] uppercase tracking-widest font-bold text-on-surface-variant">{mistake.status}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-secondary-container text-on-secondary-container px-3 py-1 text-xs font-bold">{mistake.count}x</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 space-y-5">
              <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10">
                <h3 className="font-headline font-bold text-lg text-on-surface">Mistake type breakdown</h3>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <MetaBox label="Wrong" value={isPro ? String(breakdown.wrong) : 'Pro'} />
                  <MetaBox label="Missing" value={isPro ? String(breakdown.missing) : 'Pro'} />
                  <MetaBox label="Extra" value={isPro ? String(breakdown.extra) : 'Pro'} />
                </div>
              </div>
              <div className="bg-primary text-on-primary rounded-2xl p-5">
                <div className="flex items-center gap-2 text-primary-container text-[0.6875rem] font-bold tracking-widest uppercase mb-4">
                  <Target className="w-4 h-4" />
                  Next week
                </div>
                <p className="text-lg font-headline font-bold leading-snug">
                  {loading ? 'Analyzing your recent practice...' : isPro ? report.recommendation : 'Upgrade to Pro to unlock personalized next-week training.'}
                </p>
                <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm font-semibold">
                  Downloadable weekly report placeholder
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function StatusPill({ status }: { status: PracticeStatus }) {
  const label = status === 'not_started' ? 'Not started' : status === 'in_progress' ? 'In progress' : 'Completed';
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest',
        status === 'completed' && 'bg-tertiary-container text-tertiary',
        status === 'in_progress' && 'bg-primary-container text-primary',
        status === 'not_started' && 'bg-surface-container text-on-surface-variant',
      )}
    >
      {status === 'completed' && <CheckCircle className="h-3 w-3" />}
      {label}
    </span>
  );
}

function MetaBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="mt-1 text-sm font-headline font-black text-on-surface">{value}</p>
    </div>
  );
}

function ReportMetric({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10">
      <span className="text-on-surface-variant font-headline text-[0.6875rem] font-bold tracking-widest uppercase block mb-3">
        {label}
      </span>
      <div className="font-headline font-black text-3xl text-on-surface">
        {loading ? <LoaderCircle className="w-7 h-7 animate-spin" /> : value}
      </div>
    </div>
  );
}

function PanelLoader({ label }: { label: string }) {
  return (
    <div className="mt-4 bg-surface-container rounded-2xl px-6 py-8 flex items-center justify-center gap-3 text-on-surface-variant">
      <LoaderCircle className="w-5 h-5 animate-spin" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function PremiumLock({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-2xl bg-primary/5 border border-primary/10 p-5">
      <div className="flex items-start gap-3">
        <LockKeyhole className="mt-0.5 h-5 w-5 text-primary" />
        <p className="text-sm text-on-surface-variant">{message}</p>
      </div>
    </div>
  );
}

function formatPercent(value: number | null) {
  return value === null ? '--' : `${value}%`;
}

function formatDelta(value: number | null) {
  if (value === null) return '--';
  return `${value > 0 ? '+' : ''}${value}%`;
}
