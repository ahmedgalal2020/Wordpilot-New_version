import React from 'react';
import { BarChart3, CheckCircle, Crown, LoaderCircle, LockKeyhole, Sparkles, Target } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { WeeklyReport } from '../hooks/useWeeklyReport';
import { useI18n } from '../i18n';
import { cn } from '../lib/utils';
import {
  buildPracticeRecommendation,
  CEFR_LEVELS,
  CefrLevel,
  getLevelProgress,
  getMistakeBreakdown,
  LearningLanguage,
  PracticeExercise,
  PracticeStatus,
} from '../lib/learning';

type LearningCardExercise = Omit<PracticeExercise, 'skill'> & {
  skill: PracticeExercise['skill'] | 'Speaking' | 'Review' | 'Progress Check';
};

export function CurrentLevelCard({
  language,
  level,
  completedCount,
  totalCount,
  recommendation,
  showRecommendation = true,
}: {
  language: LearningLanguage;
  level: CefrLevel;
  completedCount: number;
  totalCount: number;
  recommendation: string;
  showRecommendation?: boolean;
}) {
  const levelInfo = CEFR_LEVELS.find((item) => item.level === level);
  const progress = getLevelProgress(level, completedCount, totalCount);
  const location = useLocation();
  const navigate = useNavigate();
  const isPracticePathPage = location.pathname === '/practice-path';
  const { language: interfaceLanguage, translateLanguageName } = useI18n();
  const copy = learningComponentsCopy[interfaceLanguage];

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
          <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary mb-2">{copy.currentPath}</p>
          <h2 className="font-headline font-black text-3xl text-on-surface">{translateLanguageName(language)} {level} - {formatLevelTitle(level, levelInfo?.title, interfaceLanguage)}</h2>
          <p className="mt-2 text-sm text-on-surface-variant max-w-2xl">{formatLevelDescription(level, levelInfo?.description, interfaceLanguage)}</p>
        </div>
        {isPracticePathPage ? (
          <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary-container px-4 py-2 text-xs font-bold text-primary">
            {copy.activePath}
          </span>
        ) : (
          <button
            type="button"
            onClick={openPracticePath}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary hover:bg-primary-dim transition"
          >
            {copy.openPracticePath}
          </button>
        )}
      </div>
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          <span>{copy.levelProgress}</span>
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
              <p className="font-headline font-bold text-on-surface">{copy.nextRecommendation}</p>
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
  const { language: interfaceLanguage } = useI18n();
  const copy = learningComponentsCopy[interfaceLanguage];

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
        {copy.practiceRecommendation}
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
            {copy.openTrainingPlan}
          </button>
        )}
        <Link
          to={isPro ? '/ai-lab' : '/pricing'}
          state={isPro ? { language, level, skillType: 'Dictation', fromPracticePath: true } : undefined}
          className="rounded-full bg-white px-5 py-3 text-sm font-bold text-primary"
        >
          {isPro ? copy.generatePractice : copy.unlockAiPractice}
        </Link>
      </div>
    </div>
  );
}

export function PracticeExerciseCard<TExercise extends LearningCardExercise>({
  exercise,
  onStart,
}: {
  key?: React.Key;
  exercise: TExercise;
  onStart: (exercise: TExercise) => void;
}) {
  const { language: interfaceLanguage } = useI18n();
  const copy = learningComponentsCopy[interfaceLanguage];

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 whisper-shadow border border-outline-variant/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary">{formatPracticeSkill(exercise.skill, interfaceLanguage)}</p>
          <h3 className="mt-2 font-headline font-bold text-xl text-on-surface">{exercise.title}</h3>
          {exercise.lessonTitle && (
            <p className="mt-1 text-xs font-semibold text-on-surface-variant">{exercise.lessonTitle}</p>
          )}
        </div>
        <StatusPill status={exercise.status} />
      </div>
      <p className="mt-3 text-sm leading-6 text-on-surface-variant">{exercise.description}</p>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <MetaBox label={copy.focus} value={exercise.focus} />
        <MetaBox label={copy.time} value={exercise.duration} />
      </div>
      <button
        type="button"
        onClick={() => onStart(exercise)}
        className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary transition hover:bg-primary-dim"
      >
        {formatPracticeAction(exercise.status, interfaceLanguage)}
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
  const { language: interfaceLanguage } = useI18n();
  const copy = learningComponentsCopy[interfaceLanguage];

  return (
    <section className="mb-12 sm:mb-16 bg-surface-container-low rounded-2xl p-6 sm:p-8 whisper-shadow">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
        <div>
          <span className="text-on-surface-variant font-headline text-[0.6875rem] font-bold tracking-widest uppercase">
            {copy.weeklyProgress}
          </span>
          <h2 className="mt-2 font-headline font-black text-2xl sm:text-3xl text-on-surface">{copy.trainingReport}</h2>
        </div>
        {!isPro && (
          <Link to="/pricing" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary text-on-primary px-5 py-3 text-sm font-bold">
            <Crown className="w-4 h-4" />
            {copy.unlockInsights}
          </Link>
        )}
      </div>

      {noData ? (
        <div className="rounded-2xl bg-surface-container-lowest p-8 text-center">
          <BarChart3 className="mx-auto h-9 w-9 text-primary" />
          <h3 className="mt-4 font-headline font-bold text-xl text-on-surface">{copy.noWeeklyReport}</h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            {copy.noWeeklyReportBody}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <ReportMetric label={copy.sessions} value={String(report.currentWeek.sessionsCount)} loading={loading} />
            <ReportMetric label={copy.averageAccuracy} value={formatPercent(report.currentWeek.averageAccuracy)} loading={loading} />
            <ReportMetric label={copy.vsLastWeek} value={formatDelta(report.deltaAccuracy)} loading={loading} />
            <ReportMetric label={copy.bestSession} value={formatPercent(report.currentWeek.bestAccuracy)} loading={loading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10">
              <h3 className="font-headline font-bold text-lg text-on-surface">{copy.topMistakes}</h3>
              {loading ? (
                <PanelLoader label={copy.buildingMistakes} />
              ) : !report.mistakeInsightsAvailable ? (
                <p className="mt-4 text-sm text-on-surface-variant">{copy.mistakeTableMissing}</p>
              ) : !isPro ? (
                <PremiumLock message={copy.proMistakes} />
              ) : report.topMistakes.length === 0 ? (
                <p className="mt-4 text-sm text-on-surface-variant">{copy.noMistakes}</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {report.topMistakes.map((mistake) => (
                    <div key={`${mistake.correctWord}-${mistake.writtenWord ?? 'missing'}-${mistake.status}`} className="flex items-center justify-between gap-4 rounded-xl bg-surface-container px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-on-surface truncate">
                          {mistake.writtenWord ?? copy.missingWord} <span className="text-on-surface-variant font-medium">{'->'}</span> {mistake.correctWord}
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
                <h3 className="font-headline font-bold text-lg text-on-surface">{copy.mistakeBreakdown}</h3>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <MetaBox label={copy.wrong} value={isPro ? String(breakdown.wrong) : 'Pro'} />
                  <MetaBox label={copy.missing} value={isPro ? String(breakdown.missing) : 'Pro'} />
                  <MetaBox label={copy.extra} value={isPro ? String(breakdown.extra) : 'Pro'} />
                </div>
              </div>
              <div className="bg-primary text-on-primary rounded-2xl p-5">
                <div className="flex items-center gap-2 text-primary-container text-[0.6875rem] font-bold tracking-widest uppercase mb-4">
                  <Target className="w-4 h-4" />
                  {copy.nextWeek}
                </div>
                <p className="text-lg font-headline font-bold leading-snug">
                  {loading ? copy.analyzing : isPro ? report.recommendation : copy.upgradeForTraining}
                </p>
                <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm font-semibold">
                  {copy.weeklyReportPlaceholder}
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
  const { language: interfaceLanguage } = useI18n();
  const copy = learningComponentsCopy[interfaceLanguage];
  const label = status === 'not_started' ? copy.notStarted : status === 'in_progress' ? copy.inProgress : copy.completed;
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

function formatPracticeSkill(skill: LearningCardExercise['skill'], interfaceLanguage: 'en' | 'de') {
  if (interfaceLanguage === 'en') {
    return skill;
  }

  const labels: Record<LearningCardExercise['skill'], string> = {
    Dictation: 'Diktat',
    Reading: 'Lesen',
    Listening: 'Hören',
    Speaking: 'Sprechen',
    Writing: 'Schreiben',
    Review: 'Wiederholung',
    'Progress Check': 'Fortschrittsprüfung',
  };

  return labels[skill];
}

function formatPracticeAction(status: PracticeStatus, interfaceLanguage: 'en' | 'de') {
  if (interfaceLanguage === 'en') {
    return status === 'completed' ? 'Retry practice' : status === 'in_progress' ? 'Continue' : 'Start';
  }

  return status === 'completed' ? 'Erneut üben' : status === 'in_progress' ? 'Fortsetzen' : 'Beginnen';
}

function formatLevelTitle(level: CefrLevel, fallback: string | undefined, interfaceLanguage: 'en' | 'de') {
  if (interfaceLanguage === 'en') {
    return fallback;
  }

  const titles: Record<CefrLevel, string> = {
    A1: 'Grundlagen',
    A2: 'Alltagssprache',
    B1: 'Selbstständige Kommunikation',
    B2: 'Studium und Beruf',
    C1: 'Fortgeschrittene Präzision',
    C2: 'Nahezu muttersprachliche Beherrschung',
  };

  return titles[level];
}

function formatLevelDescription(level: CefrLevel, fallback: string | undefined, interfaceLanguage: 'en' | 'de') {
  if (interfaceLanguage === 'en') {
    return fallback;
  }

  const descriptions: Record<CefrLevel, string> = {
    A1: 'Kurze Sätze, sehr vertraute Wörter und erste sichere Hör- und Schreibgewohnheiten.',
    A2: 'Alltagsthemen, einfache zusammenhängende Sätze und praktische Verständigung.',
    B1: 'Vertraute Themen, zusammenhängende Absätze und begründete Meinungen.',
    B2: 'Komplexere Sachtexte, präziser Wortschatz und klare Argumentation in Studium und Beruf.',
    C1: 'Dichte Texte, Registerkontrolle, implizite Bedeutung und präzise Umformulierung.',
    C2: 'Feine Bedeutungsnuancen, Stil, Rhythmus und nahezu muttersprachliche Genauigkeit.',
  };

  return descriptions[level];
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

const learningComponentsCopy = {
  en: {
    currentPath: 'Current Path',
    activePath: 'Active path',
    openPracticePath: 'Open Practice Path',
    levelProgress: 'Level progress',
    nextRecommendation: 'Next recommended practice',
    practiceRecommendation: 'Practice Recommendation',
    openTrainingPlan: 'Open training plan',
    generatePractice: 'Generate practice',
    unlockAiPractice: 'Unlock AI practice',
    focus: 'Focus',
    time: 'Time',
    weeklyProgress: 'Weekly Progress',
    trainingReport: 'Your training report',
    unlockInsights: 'Unlock insights',
    noWeeklyReport: 'No weekly report yet',
    noWeeklyReportBody: 'Complete at least one dictation session this week to generate your progress report.',
    sessions: 'Sessions',
    averageAccuracy: 'Average accuracy',
    vsLastWeek: 'Vs last week',
    bestSession: 'Best session',
    topMistakes: 'Top mistakes',
    buildingMistakes: "Building this week's mistake profile...",
    mistakeTableMissing: 'Mistake details need the dictation_mistakes table to be available.',
    proMistakes: 'Free users can see basic weekly stats. Pro unlocks mistake patterns, recommendations, and exportable report placeholders.',
    noMistakes: 'No repeated mistake pattern yet. Keep practising to populate this list.',
    missingWord: 'Missing word',
    mistakeBreakdown: 'Mistake type breakdown',
    wrong: 'Wrong',
    missing: 'Missing',
    extra: 'Extra',
    nextWeek: 'Next week',
    analyzing: 'Analyzing your recent practice...',
    upgradeForTraining: 'Upgrade to Pro to unlock personalized next-week training.',
    weeklyReportPlaceholder: 'Downloadable weekly report placeholder',
    notStarted: 'Not started',
    inProgress: 'In progress',
    completed: 'Completed',
  },
  de: {
    currentPath: 'Aktiver Lernweg',
    activePath: 'Aktiver Weg',
    openPracticePath: 'Übungspfad öffnen',
    levelProgress: 'Niveaufortschritt',
    nextRecommendation: 'Nächste Empfehlung',
    practiceRecommendation: 'Übungsempfehlung',
    openTrainingPlan: 'Trainingsplan öffnen',
    generatePractice: 'Übung erstellen',
    unlockAiPractice: 'KI-Übung freischalten',
    focus: 'Fokus',
    time: 'Zeit',
    weeklyProgress: 'Wochenfortschritt',
    trainingReport: 'Dein Trainingsbericht',
    unlockInsights: 'Einblicke freischalten',
    noWeeklyReport: 'Noch kein Wochenbericht',
    noWeeklyReportBody: 'Schließe diese Woche mindestens eine Diktat-Session ab, um deinen Fortschrittsbericht zu erstellen.',
    sessions: 'Sessions',
    averageAccuracy: 'Durchschnittsgenauigkeit',
    vsLastWeek: 'Zur Vorwoche',
    bestSession: 'Beste Session',
    topMistakes: 'Häufigste Fehler',
    buildingMistakes: 'Fehlerprofil dieser Woche wird erstellt...',
    mistakeTableMissing: 'Fehlerdetails brauchen die Tabelle dictation_mistakes.',
    proMistakes: 'Free-Nutzer sehen Basisstatistiken. Pro schaltet Fehlermuster, Empfehlungen und exportierbare Berichte frei.',
    noMistakes: 'Noch kein wiederholtes Fehlermuster. Übe weiter, damit diese Liste gefüllt wird.',
    missingWord: 'Fehlendes Wort',
    mistakeBreakdown: 'Fehlertypen',
    wrong: 'Falsch',
    missing: 'Fehlt',
    extra: 'Extra',
    nextWeek: 'Nächste Woche',
    analyzing: 'Deine letzten Übungen werden analysiert...',
    upgradeForTraining: 'Wechsle zu Pro, um persönliches Training für nächste Woche freizuschalten.',
    weeklyReportPlaceholder: 'Platzhalter für herunterladbaren Wochenbericht',
    notStarted: 'Nicht begonnen',
    inProgress: 'In Arbeit',
    completed: 'Abgeschlossen',
  },
};
