import { LoaderCircle } from 'lucide-react';
import { PracticeExerciseCard } from '../../../components/LearningComponents';
import type { PathCopy, PracticePathExercise, PracticePathLesson } from '../types';

export function TrainingPlanSection({
  copy,
  lessons,
  selectedLesson,
  exercises,
  reportLoading,
  progressLoading,
  progressError,
  onSelectLesson,
  onStartExercise,
}: {
  copy: PathCopy;
  lessons: PracticePathLesson[];
  selectedLesson: PracticePathLesson;
  exercises: PracticePathExercise[];
  reportLoading: boolean;
  progressLoading: boolean;
  progressError: string | null;
  onSelectLesson: (lessonId: string) => void;
  onStartExercise: (exercise: PracticePathExercise) => void;
}) {
  return (
    <section id="training-plan" className="scroll-mt-24">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-headline text-2xl font-black text-on-surface">{copy.lessonsTitle}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{copy.lessonsSummary}</p>
        </div>
        {reportLoading && <LoadingPill label={copy.syncingProgress} />}
        {!reportLoading && progressLoading && <LoadingPill label={copy.syncingPath} />}
      </div>

      {progressError && (
        <div className="mb-5 rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-sm text-on-surface">
          {copy.syncError} {progressError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-start">
        <LessonList copy={copy} lessons={lessons} selectedLesson={selectedLesson} onSelectLesson={onSelectLesson} />
        <LessonDetail copy={copy} selectedLesson={selectedLesson} exercises={exercises} onStartExercise={onStartExercise} />
      </div>
    </section>
  );
}

function LoadingPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant">
      <LoaderCircle className="h-4 w-4 animate-spin" />
      {label}
    </span>
  );
}

function LessonList({
  copy,
  lessons,
  selectedLesson,
  onSelectLesson,
}: {
  copy: PathCopy;
  lessons: PracticePathLesson[];
  selectedLesson: PracticePathLesson;
  onSelectLesson: (lessonId: string) => void;
}) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest p-5 whisper-shadow sm:p-6 xl:col-span-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-primary">{copy.curriculum}</p>
          <h3 className="mt-1 font-headline text-xl font-black text-on-surface">{copy.pathCount}</h3>
        </div>
        <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-bold text-primary">
          {lessons.length} {copy.lessonCount}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {lessons.map((lesson) => (
          <div key={lesson.id}>
            <LessonButton copy={copy} lesson={lesson} active={lesson.id === selectedLesson.id} onSelectLesson={onSelectLesson} />
          </div>
        ))}
      </div>
    </div>
  );
}

function LessonButton({
  copy,
  lesson,
  active,
  onSelectLesson,
}: {
  copy: PathCopy;
  lesson: PracticePathLesson;
  active: boolean;
  onSelectLesson: (lessonId: string) => void;
}) {
  const done = lesson.exercises.filter((exercise) => exercise.status === 'completed').length;

  return (
    <button
      type="button"
      onClick={() => onSelectLesson(lesson.id)}
      aria-pressed={active}
      aria-current={active ? 'true' : undefined}
      className={`h-full w-full rounded-2xl border p-3.5 text-left transition ${
        active ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant/20 bg-surface-container-low hover:border-primary/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-on-primary/75' : 'text-primary'}`}>
            {copy.lessonLabel} {lesson.number}
          </p>
          <h4 className="mt-1 font-headline text-sm font-bold leading-5">{lesson.theme}</h4>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${active ? 'bg-white/15' : 'bg-surface-container'}`}>
          {done}/4
        </span>
      </div>
      <p className={`mt-2 line-clamp-2 text-xs leading-5 ${active ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>
        {lesson.canDo}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {lesson.vocabulary.slice(0, 3).map((word) => (
          <span key={word} className={`rounded-full px-2 py-1 text-[10px] font-bold ${active ? 'bg-white/15' : 'bg-primary-container text-primary'}`}>
            {word}
          </span>
        ))}
      </div>
    </button>
  );
}

function LessonDetail({
  copy,
  selectedLesson,
  exercises,
  onStartExercise,
}: {
  copy: PathCopy;
  selectedLesson: PracticePathLesson;
  exercises: PracticePathExercise[];
  onStartExercise: (exercise: PracticePathExercise) => void;
}) {
  return (
    <div className="space-y-5 xl:col-span-7">
      <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-5 whisper-shadow sm:p-6">
        <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-primary">{copy.selectedLesson}</p>
        <h3 className="mt-2 font-headline text-2xl font-black text-on-surface">{selectedLesson.title}</h3>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <LessonMetaCard label={copy.goal} value={selectedLesson.objective} />
          <LessonMetaCard label={copy.canDo} value={selectedLesson.canDo} />
          <LessonMetaCard label={copy.grammar} value={selectedLesson.grammarFocus} />
        </div>
        <div className="mt-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{copy.lessonWords}</p>
          <div className="flex flex-wrap gap-2">
            {selectedLesson.vocabulary.map((word) => (
              <span key={word} className="rounded-full bg-primary-container px-3 py-1.5 text-xs font-bold text-primary">
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {exercises.map((exercise) => (
          <PracticeExerciseCard key={exercise.id} exercise={exercise} onStart={onStartExercise} />
        ))}
      </div>
    </div>
  );
}

function LessonMetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="mt-2 text-sm leading-6 text-on-surface">{value}</p>
    </div>
  );
}
