import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, CheckCircle, LoaderCircle, Languages, Route, Target } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CEFR_LEVELS, LEARNING_LANGUAGES, type CefrLevel, type LearningLanguage, normalizeCefrLevel, normalizeLearningLanguage } from '../lib/learning';
import { cn } from '../lib/utils';

const NATIVE_LANGUAGE_OPTIONS = ['Arabic', 'English', 'German', 'Spanish', 'Italian', 'French'] as const;

export function LearningOnboardingPrompt() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading, updateProfile } = useAuth();
  const [nativeLanguage, setNativeLanguage] = useState(profile?.native_language ?? 'Arabic');
  const [targetLanguage, setTargetLanguage] = useState<LearningLanguage>(normalizeLearningLanguage(profile?.target_language));
  const [currentLevel, setCurrentLevel] = useState<CefrLevel>(normalizeCefrLevel(profile?.cefr_level));
  const [goalLevel, setGoalLevel] = useState<CefrLevel>(normalizeCefrLevel(profile?.goal_cefr_level ?? 'B2'));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldShow = Boolean(user && profile && !loading && profile.onboarding_completed !== true);
  const currentLevelIndex = CEFR_LEVELS.findIndex((item) => item.level === currentLevel);
  const goalLevelIndex = CEFR_LEVELS.findIndex((item) => item.level === goalLevel);
  const canSave = useMemo(
    () => Boolean(nativeLanguage && targetLanguage && currentLevel && goalLevel && goalLevelIndex >= currentLevelIndex),
    [currentLevel, currentLevelIndex, goalLevel, goalLevelIndex, nativeLanguage, targetLanguage],
  );

  useEffect(() => {
    if (!profile) return;
    setNativeLanguage(profile.native_language ?? 'Arabic');
    setTargetLanguage(normalizeLearningLanguage(profile.target_language));
    setCurrentLevel(normalizeCefrLevel(profile.cefr_level));
    setGoalLevel(normalizeCefrLevel(profile.goal_cefr_level ?? 'B2'));
  }, [profile?.cefr_level, profile?.goal_cefr_level, profile?.native_language, profile?.target_language]);

  if (!shouldShow) return null;

  async function saveLearningProfile() {
    if (!canSave || saving) return;

    setSaving(true);
    setError(null);
    const result = await updateProfile({
      native_language: nativeLanguage,
      target_language: targetLanguage,
      cefr_level: currentLevel,
      goal_cefr_level: goalLevel,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    });
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (location.pathname !== '/practice-path') {
      navigate('/practice-path', { replace: true });
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6" role="dialog" aria-modal="true" aria-labelledby="learning-onboarding-title">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest whisper-shadow animate-in fade-in zoom-in-95 duration-200">
        <div className="border-b border-surface-container px-5 py-5 sm:px-8 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-primary">First setup</p>
              <h2 id="learning-onboarding-title" className="mt-2 font-headline text-2xl font-black tracking-tight text-on-surface sm:text-3xl">Choose your learning path</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">Four quick choices so your dashboard, practice path, and AI Lab start in the right direction.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs sm:flex">
              <SummaryPill label="Learn" value={targetLanguage} />
              <SummaryPill label="Goal" value={goalLevel} />
            </div>
          </div>
        </div>

        <div className="grid flex-1 gap-5 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6 lg:grid-cols-[0.7fr_1.3fr]">
          <aside className="rounded-[1.5rem] bg-primary p-5 text-on-primary">
            <div className="flex items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-widest text-primary-container">
              <Route className="h-4 w-4" />
              Your route
            </div>
            <div className="mt-5 space-y-4">
              <PathStep number="1" title="Base language" value={nativeLanguage} />
              <PathStep number="2" title="Practice language" value={targetLanguage} />
              <PathStep number="3" title="Current level" value={currentLevel} />
              <PathStep number="4" title="Target level" value={goalLevel} />
            </div>
            <p className="mt-6 rounded-2xl bg-white/10 p-4 text-sm font-semibold leading-6 text-on-primary/85">
              You can change this later from Account. WordPilot uses it to order lessons and keep AI practice relevant.
            </p>
          </aside>

          <div className="grid gap-4">
            <ChoiceGroup label="Main language" icon={<Languages className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-2">
                {NATIVE_LANGUAGE_OPTIONS.map((language) => (
                  <button
                    key={language}
                    type="button"
                    onClick={() => setNativeLanguage(language)}
                    className={cn('rounded-2xl border px-4 py-3 text-left text-sm font-bold transition', nativeLanguage === language ? 'border-primary bg-primary text-on-primary' : 'border-transparent bg-surface-container-lowest text-on-surface hover:border-primary/30')}
                  >
                    {language}
                  </button>
                ))}
              </div>
            </ChoiceGroup>

            <ChoiceGroup label="Practice language" icon={<Target className="h-4 w-4" />}>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {LEARNING_LANGUAGES.map((item) => (
                  <button
                    key={item.language}
                    type="button"
                    onClick={() => setTargetLanguage(item.language)}
                    className={cn('rounded-2xl border px-4 py-3 text-left transition', targetLanguage === item.language ? 'border-primary bg-primary text-on-primary' : 'border-transparent bg-surface-container-lowest text-on-surface hover:border-primary/30')}
                  >
                    <span className="block text-sm font-bold">{item.language}</span>
                    <span className={cn('mt-1 block text-[10px] font-semibold leading-4', targetLanguage === item.language ? 'text-on-primary/75' : 'text-on-surface-variant')}>{item.description}</span>
                  </button>
                ))}
              </div>
            </ChoiceGroup>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChoiceGroup label="Current level">
                <LevelGrid selected={currentLevel} onSelect={setCurrentLevel} />
              </ChoiceGroup>

              <ChoiceGroup label="Goal level">
                <LevelGrid selected={goalLevel} onSelect={setGoalLevel} />
                {goalLevelIndex < currentLevelIndex && (
                  <p className="mt-3 rounded-xl bg-error/5 px-3 py-2 text-xs font-semibold text-error">Choose a goal at or above your current level.</p>
                )}
              </ChoiceGroup>
            </div>
          </div>
        </div>

        <div className="border-t border-surface-container bg-surface-container-low px-5 py-5 sm:px-8">
          {error && <p className="mb-3 rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-semibold text-error">{error}</p>}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold leading-5 text-on-surface-variant">Your first path: {targetLanguage} {currentLevel} toward {goalLevel}.</p>
            <button
              type="button"
              onClick={() => void saveLearningProfile()}
              disabled={!canSave || saving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-headline text-sm font-bold text-on-primary transition hover:bg-primary-dim disabled:opacity-60"
            >
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Start my path
              {!saving && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-container-low px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="mt-1 font-headline text-sm font-black text-on-surface">{value}</p>
    </div>
  );
}

function PathStep({ number, title, value }: { number: string; title: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 font-headline text-sm font-black">{number}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary-container">{title}</p>
        <p className="truncate font-headline text-sm font-black text-on-primary">{value}</p>
      </div>
    </div>
  );
}

function ChoiceGroup({ label, icon, children }: { label: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-[1.5rem] bg-surface-container-low p-4">
      <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {icon}
        {label}
      </div>
      {children}
    </section>
  );
}

function LevelGrid({ selected, onSelect }: { selected: CefrLevel; onSelect: (level: CefrLevel) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {CEFR_LEVELS.map((item) => {
        const active = selected === item.level;

        return (
          <button
            key={item.level}
            type="button"
            onClick={() => onSelect(item.level)}
            aria-pressed={active}
            className={cn(
              'flex h-16 items-center justify-center rounded-2xl border font-headline text-xl font-black transition sm:h-20',
              active
                ? 'border-primary bg-primary text-on-primary shadow-sm'
                : 'border-transparent bg-surface-container-lowest text-on-surface hover:border-primary/30 hover:bg-white',
            )}
          >
            {item.level}
          </button>
        );
      })}
    </div>
  );
}