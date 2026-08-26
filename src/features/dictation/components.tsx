import React, { useMemo } from 'react';
import { BookOpen, Ear, Keyboard, PenLine } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SKILL_MODES } from './constants';
import { buildMirrorSegments } from './text';
import type { SkillMode } from './types';

export function RangeField({
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className={cn('flex flex-col gap-2', disabled && 'opacity-55')}>
      <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
        <span>{label}</span>
        <span className="text-primary font-mono">{valueLabel}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(parseFloat(event.target.value))}
        disabled={disabled}
        className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary disabled:cursor-not-allowed"
      />
    </div>
  );
}

export function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="mt-2 text-2xl font-black font-headline text-on-surface">{value}</p>
    </div>
  );
}

export function SkillModeIcon({ skill, active }: { skill: SkillMode; active: boolean }) {
  const className = cn('h-4 w-4', active ? 'text-on-primary' : 'text-primary');
  if (skill === 'Reading') return <BookOpen className={className} />;
  if (skill === 'Listening') return <Ear className={className} />;
  if (skill === 'Writing') return <PenLine className={className} />;
  return <Keyboard className={className} />;
}

export function getSkillMode(value?: string | null) {
  return SKILL_MODES.find((mode) => mode.id === value) ?? SKILL_MODES[0];
}

export function PlayerButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer h-12 min-w-12 px-3 rounded-2xl bg-surface-container-lowest text-on-surface font-bold text-xs flex items-center justify-center gap-1.5 transition hover:bg-surface-container border border-outline-variant/10"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function MirroredText({ text, activeRange }: { text: string; activeRange: { start: number; end: number } | null }) {
  const segments = useMemo(() => buildMirrorSegments(text, activeRange), [text, activeRange]);

  return (
    <>
      {segments.map((segment) =>
        segment.highlighted ? (
          <span
            key={`${segment.start}-${segment.end}`}
            className="rounded-sm bg-primary/15 px-0.5 text-on-surface underline decoration-primary decoration-2 underline-offset-4 shadow-[inset_0_-1px_0_rgba(29,78,216,0.22)]"
          >
            {segment.text}
          </span>
        ) : (
          <span key={`${segment.start}-${segment.end}`}>{segment.text}</span>
        ),
      )}
    </>
  );
}


