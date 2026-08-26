import { CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getSegmentShadowWords, tokenize } from './transcript';
import type { ShadowingAttempt, ShadowingSegment } from './types';

export function SetupStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-container-lowest px-3 py-2">
      <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="mt-1 truncate font-headline text-sm font-black text-on-surface">{value}</p>
    </div>
  );
}
export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest p-5 whisper-shadow border border-outline-variant/10">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="mt-2 font-headline font-black text-3xl text-on-surface">{value}</p>
    </div>
  );
}

export function ReportBox({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={cn('rounded-2xl bg-white/10 p-4', wide && 'col-span-2')}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-primary-container">{label}</p>
      <p className="mt-1 font-headline font-black text-xl">{value}</p>
    </div>
  );
}

export function SegmentStatus({ status }: { status: ShadowingSegment['status'] }) {
  const label = status === 'completed' ? 'Done' : status === 'retry' ? 'Retry' : status === 'current' ? 'Current' : 'Queued';
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
      {status === 'completed' && <CheckCircle className="h-3 w-3" />}
      {label}
    </span>
  );
}

export function WordList({ title, words }: { title: string; words: string[] }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {words.length === 0 ? (
          <span className="text-sm text-on-surface-variant">None yet</span>
        ) : (
          words.slice(0, 10).map((word) => (
            <span key={word} className="rounded-full bg-secondary-container px-3 py-1.5 text-xs font-bold text-on-secondary-container">
              {word}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

export function TargetWordAnalysis({ target, attempt }: { target: string; attempt: ShadowingAttempt }) {
  const missingWords = new Set(attempt.missingWords);
  const responseWords = new Set(tokenize(attempt.transcript));
  const targetWords = target.split(/\s+/).filter(Boolean);

  return (
    <div className="mt-4 rounded-2xl bg-surface-container-lowest p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Word accuracy</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {targetWords.map((word, index) => {
          const normalized = tokenize(word)[0] ?? word.toLowerCase();
          const missing = missingWords.has(normalized);
          const matched = responseWords.has(normalized) && !missing;

          return (
            <span
              key={`${word}-${index}`}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-bold transition',
                missing ? 'bg-error/10 text-error ring-1 ring-error/20' : matched ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'bg-surface-container text-on-surface-variant',
              )}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function ShadowedSentence({ segment, activeWordIndex, isPlaying }: { segment: ShadowingSegment; activeWordIndex: number; isPlaying: boolean }) {
  const words = getSegmentShadowWords(segment);

  return (
    <div className="mt-3" aria-live="polite">
      <p className="flex flex-wrap gap-x-2 gap-y-2 text-xl sm:text-2xl font-headline font-black leading-snug text-on-surface">
        {words.map((word, index) => {
          const isActive = isPlaying && index === activeWordIndex;
          const isPast = isPlaying && activeWordIndex > index;
          return (
            <span
              key={`${word.text}-${index}-${word.start}`}
              className={cn(
                'rounded-lg px-1.5 py-0.5 transition-all duration-200 ease-out',
                isActive && 'bg-primary text-on-primary shadow-[0_10px_28px_rgba(0,93,255,0.28)] scale-[1.04]',
                isPast && 'bg-primary/10 text-primary',
                !isActive && !isPast && 'text-on-surface',
              )}
            >
              {word.text}
            </span>
          );
        })}
      </p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-container-high" aria-hidden="true">
        <div
          className="h-full rounded-full bg-primary transition-all duration-200"
          style={{ width: isPlaying && words.length > 0 ? `${Math.max(0, Math.min(100, ((activeWordIndex + 1) / words.length) * 100))}%` : '0%' }}
        />
      </div>
    </div>
  );
}

