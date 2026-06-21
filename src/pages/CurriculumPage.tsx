import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, LoaderCircle, LockKeyhole, RotateCcw } from 'lucide-react';
import { ExerciseRenderer, type ExerciseResult } from '../components/ExerciseRenderer';
import { useAuth } from '../contexts/AuthContext';
import { hasSupabaseEnv } from '../lib/env';
import { supabase } from '../lib/supabase';
import {
  buildReviewQueueItems,
  CURRICULUM_LEVELS,
  getCurriculumLevel,
  type CurriculumExercise,
  type CurriculumLanguage,
  type CurriculumLesson,
  type CurriculumSkill,
  type LessonStatus,
  type SkillScores,
} from '../lib/curriculum';

type LessonProgressRow = {
  lesson_id: string;
  status: LessonStatus;
  overall_score: number | null;
  skill_scores: SkillScores;
};

type ExerciseAttemptRow = {
  lesson_id: string;
  exercise_id: string;
  skill: CurriculumSkill;
  score: number;
  rubric_scores: Record<string, number>;
  response: Record<string, unknown>;
  created_at: string;
};

export default function CurriculumPage() {
  const { user, profile } = useAuth();
  const supabaseReady = hasSupabaseEnv();
  const [language, setLanguage] = useState<CurriculumLanguage>(profile?.target_language === 'German' ? 'German' : 'English');
  const [levelNumber, setLevelNumber] = useState(profile?.cefr_level === 'A1' ? 1 : 1);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [progressRows, setProgressRows] = useState<LessonProgressRow[]>([]);
  const [attemptRows, setAttemptRows] = useState<ExerciseAttemptRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const level = getCurriculumLevel(language, levelNumber) ?? getCurriculumLevel(language, 1)!;
  const progressByLessonId = useMemo(
    () => new Map(progressRows.map((row) => [row.lesson_id, row])),
    [progressRows],
  );
  const attemptsByExerciseId = useMemo(() => {
    const map = new Map<string, ExerciseAttemptRow>();
    attemptRows.forEach((attempt) => {
      const current = map.get(attempt.exercise_id);
      if (!current || attempt.score > current.score) {
        map.set(attempt.exercise_id, attempt);
      }
    });
    return map;
  }, [attemptRows]);
  const lessonStatuses = useMemo(() => {
    const statuses = new Map<string, LessonStatus>();
    level.lessons.forEach((lesson, index) => {
      const savedStatus = progressByLessonId.get(lesson.id)?.status;
      const previousLesson = level.lessons[index - 1];
      const previousPassed = !previousLesson || statuses.get(previousLesson.id) === 'passed' || progressByLessonId.get(previousLesson.id)?.status === 'passed';
      statuses.set(lesson.id, savedStatus ?? (previousPassed ? 'available' : 'locked'));
    });
    return statuses;
  }, [level.lessons, progressByLessonId]);
  const selectedLesson = level.lessons.find((lesson) => lesson.id === selectedLessonId) ?? level.lessons[0];
  const selectedExercise = selectedLesson.exercises.find((exercise) => exercise.id === selectedExerciseId) ?? selectedLesson.exercises[0];
  const selectedLessonStatus = lessonStatuses.get(selectedLesson.id) ?? 'available';
  const selectedLessonAttempts = selectedLesson.exercises.map((exercise) => attemptsByExerciseId.get(exercise.id)).filter(Boolean) as ExerciseAttemptRow[];
  const selectedLessonAverage = selectedLessonAttempts.length
    ? Math.round(selectedLessonAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / selectedLessonAttempts.length)
    : 0;

  useEffect(() => {
    setLanguage(profile?.target_language === 'German' ? 'German' : 'English');
  }, [profile?.target_language]);

  useEffect(() => {
    setSelectedLessonId(null);
    setSelectedExerciseId(null);
    setAttemptRows([]);
    setProgressRows([]);
  }, [language, levelNumber]);

  useEffect(() => {
    void loadProgress();
  }, [language, levelNumber, supabaseReady, user?.id]);

  async function loadProgress() {
    if (!user || !supabaseReady) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setStatus(null);
    const [progressResult, attemptsResult] = await Promise.all([
      supabase
        .from('curriculum_lesson_progress')
        .select('lesson_id,status,overall_score,skill_scores')
        .eq('user_id', user.id)
        .eq('language', language)
        .eq('level_number', levelNumber),
      supabase
        .from('curriculum_exercise_attempts')
        .select('lesson_id,exercise_id,skill,score,rubric_scores,response,created_at')
        .eq('user_id', user.id)
        .eq('language', language)
        .eq('level_number', levelNumber)
        .order('created_at', { ascending: false }),
    ]);
    setLoading(false);

    if (progressResult.error || attemptsResult.error) {
      setStatus(progressResult.error?.message ?? attemptsResult.error?.message ?? 'Could not load curriculum progress.');
      return;
    }

    setProgressRows((progressResult.data ?? []) as LessonProgressRow[]);
    setAttemptRows((attemptsResult.data ?? []) as ExerciseAttemptRow[]);
  }

  async function completeExercise(exercise: CurriculumExercise, result: ExerciseResult) {
    const attempt: ExerciseAttemptRow = {
      lesson_id: selectedLesson.id,
      exercise_id: exercise.id,
      skill: exercise.skill,
      score: result.score,
      rubric_scores: result.rubricScores as Record<string, number>,
      response: result.response,
      created_at: new Date().toISOString(),
    };

    const nextAttempts = [attempt, ...attemptRows];
    setAttemptRows(nextAttempts);
    const mastery = calculateLessonMastery(selectedLesson, nextAttempts);
    setProgressRows((current) => upsertLocalProgress(current, selectedLesson.id, mastery.status, mastery.overallScore, mastery.skillScores));

    if (!user || !supabaseReady) {
      setStatus('Exercise scored locally. Sign in with Supabase configured to sync attempts and mastery.');
      return;
    }

    const now = new Date().toISOString();
    const { error: attemptError } = await supabase.from('curriculum_exercise_attempts').insert({
      user_id: user.id,
      language,
      level_number: levelNumber,
      lesson_id: selectedLesson.id,
      exercise_id: exercise.id,
      exercise_type: exercise.type,
      skill: exercise.skill,
      score: result.score,
      rubric_scores: result.rubricScores,
      response: result.response,
    });

    if (attemptError) {
      setStatus(attemptError.message);
      return;
    }

    const { error: progressError } = await supabase.from('curriculum_lesson_progress').upsert(
      {
        user_id: user.id,
        language,
        level_number: levelNumber,
        lesson_id: selectedLesson.id,
        status: mastery.status,
        overall_score: mastery.overallScore,
        skill_scores: mastery.skillScores,
        started_at: now,
        passed_at: mastery.status === 'passed' ? now : null,
        updated_at: now,
      },
      { onConflict: 'user_id,language,lesson_id' },
    );

    if (progressError) {
      setStatus(progressError.message);
      return;
    }

    const reviewItems = buildReviewQueueItems(selectedLesson, mastery.skillScores);
    if (reviewItems.length > 0) {
      const { error: reviewError } = await supabase.from('curriculum_review_queue').upsert(
        reviewItems.map((item) => ({
          user_id: user.id,
          language,
          level_number: levelNumber,
          lesson_id: item.lessonId,
          source_exercise_id: exercise.id,
          item_type: item.skill,
          item_key: `${item.lessonId}:${item.skill}`,
          reason: item.reason,
          status: 'due',
          updated_at: now,
        })),
        { onConflict: 'user_id,language,item_type,item_key' },
      );

      if (reviewError) {
        setStatus(reviewError.message);
        return;
      }
    }

    setStatus(`Saved attempt. Lesson status: ${mastery.status}.`);
    await loadProgress();
  }

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 pt-24 sm:pt-28 min-h-screen">
      <header className="mb-8 sm:mb-10">
        <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary mb-3">Curriculum beta</p>
        <h1 className="font-headline font-extrabold text-3xl sm:text-4xl tracking-tight text-on-surface">CEFR Lesson Journey</h1>
        <p className="mt-3 max-w-3xl text-on-surface-variant">
          This route uses the new curriculum engine directly. Exercises render by `ExerciseType`, score independently, and sync attempts/mastery to Supabase when available.
        </p>
      </header>

      <section className="mb-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 rounded-2xl bg-surface-container-lowest p-4 sm:p-5 whisper-shadow">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Language</p>
          <div className="flex flex-wrap gap-2">
            {(['English', 'German'] as CurriculumLanguage[]).map((item) => (
              <button key={item} type="button" onClick={() => setLanguage(item)} className={`rounded-full px-4 py-2 text-sm font-bold ${item === language ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface'}`}>
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="lg:col-span-5 rounded-2xl bg-surface-container-lowest p-4 sm:p-5 whisper-shadow">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Level</p>
          <div className="flex flex-wrap gap-2">
            {[1, 2].map((number) => {
              const label = CURRICULUM_LEVELS[number - 1].label;
              return (
                <button key={number} type="button" onClick={() => setLevelNumber(number)} className={`rounded-full px-4 py-2 text-sm font-bold ${number === levelNumber ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface'}`}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {status && <div className="mb-6 rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-sm text-on-surface">{status}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:items-start">
        <aside className="xl:col-span-4 rounded-2xl bg-surface-container-lowest p-5 whisper-shadow">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{level.title}</p>
              <h2 className="mt-1 font-headline font-black text-xl text-on-surface">Lessons</h2>
            </div>
            {loading && <LoaderCircle className="h-5 w-5 animate-spin text-primary" />}
          </div>
          <div className="space-y-3">
            {level.lessons.map((lesson) => {
              const status = lessonStatuses.get(lesson.id) ?? 'available';
              const active = lesson.id === selectedLesson.id;
              const score = progressByLessonId.get(lesson.id)?.overall_score;
              return (
                <button
                  key={lesson.id}
                  type="button"
                  disabled={status === 'locked'}
                  onClick={() => {
                    setSelectedLessonId(lesson.id);
                    setSelectedExerciseId(null);
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-55 ${
                    active ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant/20 bg-surface-container-low text-on-surface hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-on-primary/75' : 'text-primary'}`}>Lesson {lesson.title}</p>
                      <h3 className="mt-1 font-headline font-bold">{lesson.theme}</h3>
                    </div>
                    <LessonStatusPill status={status} active={active} />
                  </div>
                  <p className={`mt-2 text-xs leading-5 ${active ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>{lesson.canDo}</p>
                  <p className={`mt-2 text-xs font-bold ${active ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>
                    {score === null || score === undefined ? 'No mastery score yet' : `${score}% mastery`}
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="xl:col-span-8 space-y-5">
          <div className="rounded-2xl bg-surface-container-lowest p-5 sm:p-6 whisper-shadow border border-outline-variant/10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary">{selectedLesson.title}</p>
                <h2 className="mt-2 font-headline font-black text-2xl text-on-surface">{selectedLesson.theme}</h2>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{selectedLesson.objective}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <MiniMetric label="Status" value={selectedLessonStatus.replace('_', ' ')} />
                <MiniMetric label="Average" value={`${selectedLessonAverage}%`} />
              </div>
            </div>
          </div>

          {selectedLessonStatus === 'locked' ? (
            <div className="rounded-2xl bg-surface-container-lowest p-8 text-center whisper-shadow">
              <LockKeyhole className="mx-auto h-8 w-8 text-primary" />
              <h3 className="mt-4 font-headline font-black text-xl text-on-surface">Lesson locked</h3>
              <p className="mt-2 text-sm text-on-surface-variant">Pass the previous lesson before starting this one.</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl bg-surface-container-lowest p-4 whisper-shadow">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Exercises</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selectedLesson.exercises.map((exercise, index) => {
                    const attempted = attemptsByExerciseId.has(exercise.id);
                    const active = exercise.id === selectedExercise.id;
                    return (
                      <button
                        key={exercise.id}
                        type="button"
                        onClick={() => setSelectedExerciseId(exercise.id)}
                        className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${
                          active ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface'
                        }`}
                      >
                        {attempted ? <CheckCircle className="h-3 w-3" /> : <span>{index + 1}</span>}
                        {exercise.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              <ExerciseRenderer exercise={selectedExercise} onComplete={(result) => void completeExercise(selectedExercise, result)} />
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function calculateLessonMastery(lesson: CurriculumLesson, attempts: ExerciseAttemptRow[]) {
  const bestByExercise = new Map<string, ExerciseAttemptRow>();
  lesson.exercises.forEach((exercise) => {
    attempts
      .filter((attempt) => attempt.exercise_id === exercise.id)
      .forEach((attempt) => {
        const current = bestByExercise.get(exercise.id);
        if (!current || attempt.score > current.score) {
          bestByExercise.set(exercise.id, attempt);
        }
      });
  });

  const skillScores = lesson.exercises.reduce<SkillScores>((scores, exercise) => {
    const attempt = bestByExercise.get(exercise.id);
    if (attempt) {
      scores[exercise.skill] = Math.max(scores[exercise.skill] ?? 0, attempt.score);
    }
    return scores;
  }, {});
  const scores = Object.values(skillScores).filter((score): score is number => typeof score === 'number');
  const overallScore = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  const allExercisesAttempted = bestByExercise.size === lesson.exercises.length;
  const weakSkill = scores.some((score) => score < lesson.mastery.minSkillScore);
  const status: LessonStatus = allExercisesAttempted && overallScore >= lesson.mastery.minOverallScore && !weakSkill
    ? 'passed'
    : allExercisesAttempted && (weakSkill || overallScore < lesson.mastery.minOverallScore)
      ? 'needs_review'
      : 'in_progress';

  return { skillScores, overallScore, status };
}

function upsertLocalProgress(rows: LessonProgressRow[], lessonId: string, status: LessonStatus, overallScore: number, skillScores: SkillScores) {
  const nextRow: LessonProgressRow = { lesson_id: lessonId, status, overall_score: overallScore, skill_scores: skillScores };
  const exists = rows.some((row) => row.lesson_id === lessonId);
  return exists ? rows.map((row) => (row.lesson_id === lessonId ? nextRow : row)) : [...rows, nextRow];
}

function LessonStatusPill({ status, active }: { status: LessonStatus; active: boolean }) {
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${active ? 'bg-white/15 text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>
      {status}
    </span>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-container-low px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="mt-1 font-headline font-black text-on-surface">{value}</p>
    </div>
  );
}
