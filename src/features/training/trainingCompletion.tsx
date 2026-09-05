import React, { useEffect } from 'react';
import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { getDictationCelebrationBursts } from '../dictation/celebration';
import { cn } from '../../lib/utils';
import type { TrainingExperience } from './registry';

export type TrainingCompletionResult = {
  score: number | null;
  message: string;
  passed: boolean;
};

export function getTrainingEncouragement(
  result: TrainingCompletionResult,
  experience: TrainingExperience,
  objective: boolean,
) {
  if (!result.passed) {
    return {
      title: 'Not quite',
      body: 'Try again before moving on.',
    };
  }

  if (!objective) {
    if (experience === 'speaking') return { title: 'Speaking practice complete', body: 'Nice work making time to speak.' };
    if (experience === 'writing') return { title: 'Practice completed', body: 'You finished your writing practice.' };
    return { title: 'Practice completed', body: result.message || 'This activity is complete.' };
  }

  if (experience === 'listening') return { title: 'Excellent listening', body: 'You caught the key detail.' };
  if (experience === 'reading') return { title: 'Nice reading', body: 'You found the right detail.' };
  if (experience === 'progress-check') return { title: 'Progress secured', body: 'That check item is complete.' };
  if (experience === 'review') return { title: 'Nice work', body: 'This review item is complete.' };

  return { title: 'Great job', body: 'You got it.' };
}

export function TrainingCompletionPanel({
  result,
  experience,
  objective,
  onContinue,
  continueLabel = 'Continue',
  meta,
}: {
  result: TrainingCompletionResult;
  experience: TrainingExperience;
  objective: boolean;
  onContinue: () => void;
  continueLabel?: string;
  meta?: string;
}) {
  const shouldCelebrate = result.passed && objective && (result.score ?? 100) >= 60;
  const encouragement = getTrainingEncouragement(result, experience, objective);

  useEffect(() => {
    if (!shouldCelebrate) return;

    let cancelled = false;
    async function celebrate() {
      const { default: confetti } = await import('canvas-confetti');
      if (cancelled) return;
      getDictationCelebrationBursts(result.score ?? 100).forEach((burst) => confetti({ ...burst, disableForReducedMotion: true }));
    }

    void celebrate().catch(() => { /* Completion remains usable if animation loading fails. */ });
    return () => {
      cancelled = true;
    };
  }, [result.score, shouldCelebrate]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'relative mt-6 overflow-hidden rounded-3xl border p-5',
        result.passed ? 'border-primary/15 bg-primary-container/60' : 'border-outline-variant/20 bg-surface-container-low',
      )}
    >
      {shouldCelebrate && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
          <span className="dictation-firework dictation-firework-left" />
          <span className="dictation-firework dictation-firework-right" />
          <span className="dictation-spark dictation-spark-1" />
          <span className="dictation-spark dictation-spark-2" />
          <span className="dictation-spark dictation-spark-3" />
          <span className="dictation-spark dictation-spark-4" />
          <span className="dictation-spark dictation-spark-5" />
          <span className="dictation-spark dictation-spark-6" />
        </div>
      )}
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary">
            {result.passed ? <Sparkles className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          </div>
          <div>
            <p className="font-headline text-xl font-black text-on-surface">{encouragement.title}</p>
            <p className="mt-1 text-sm leading-6 text-on-surface-variant">{encouragement.body}</p>
            {result.score !== null && <p className="mt-2 text-sm font-black text-primary">{result.score}%</p>}
            {meta && <p className="mt-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">{meta}</p>}
          </div>
        </div>
        {result.passed && (
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-on-primary transition hover:bg-primary-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.99]"
          >
            {continueLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
