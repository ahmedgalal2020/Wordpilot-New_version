import { Link } from 'react-router-dom';
import { CURRICULUM_LEVELS } from '../../../lib/curriculumCore';
import type { PathCopy, PracticePathLevelMap } from '../types';

export function PathOverviewSection({ copy, phaseOneLevels }: { copy: PathCopy; phaseOneLevels: PracticePathLevelMap[] }) {
  return (
    <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-5 whisper-shadow sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-primary">{copy.overviewEyebrow}</p>
          <h2 className="mt-2 font-headline text-2xl font-black text-on-surface">{copy.overviewTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">{copy.overviewIntro}</p>
          <Link to="/curriculum" className="mt-4 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary transition hover:bg-primary-dim">
            {copy.viewCurriculum}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6" aria-label={copy.currentLevelMap}>
          {CURRICULUM_LEVELS.map((level) => (
            <span
              key={level.levelNumber}
              className={`rounded-xl px-3 py-2 text-center text-xs font-black ${
                phaseOneLevels.some((item) => item.levelNumber === level.levelNumber)
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-low text-on-surface-variant'
              }`}
            >
              {level.levelNumber}. {level.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="rounded-2xl bg-surface-container-low p-4 lg:col-span-7">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{copy.lessonFlow}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {copy.skillFlowLabels.map((label, index) => (
              <div key={label} className="rounded-xl bg-surface-container-lowest px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{copy.stepLabel} {index + 1}</p>
                <p className="mt-1 font-headline text-sm font-bold text-on-surface">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-surface-container-low p-4 lg:col-span-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{copy.currentLevelMap}</p>
          {phaseOneLevels.length > 0 ? (
            <div className="space-y-3">
              {phaseOneLevels.map((level) => (
                <div key={level.title} className="rounded-xl bg-surface-container-lowest px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-headline font-black text-on-surface">{level.title}</p>
                    <span className="rounded-full bg-primary-container px-3 py-1 text-[10px] font-bold text-primary">
                      {level.lessons.length} {copy.lessonCount}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-on-surface-variant">
                    {copy.fromToLabel} {level.lessons[0].theme} {copy.toLabel} {level.lessons[level.lessons.length - 1].theme}, {copy.withLabel} {copy.skillFlowLabels.length} {copy.practiceStepsLabel}.
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-on-surface-variant">{copy.levelMapFallback}</p>
          )}
        </div>
      </div>
    </section>
  );
}

