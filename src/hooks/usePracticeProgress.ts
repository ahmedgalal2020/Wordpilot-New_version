import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { hasSupabaseEnv } from '../lib/env';
import { supabase } from '../lib/supabase';
import type { PracticeExercise, PracticeStatus } from '../lib/learning';

export type PracticeProgressRow = {
  id: string;
  user_id: string;
  language: string;
  cefr_level: string;
  lesson_id: string | null;
  exercise_id: string;
  status: Exclude<PracticeStatus, 'not_started'>;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
};

type ProgressPatch = {
  language: string;
  cefrLevel: string;
  lessonId?: string | null;
  exerciseId: string;
  status: Exclude<PracticeStatus, 'not_started'>;
  startedAt?: string;
  completedAt?: string | null;
};

export function usePracticeProgress(user: User | null, language?: string, cefrLevel?: string) {
  const [rows, setRows] = useState<PracticeProgressRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabaseReady = hasSupabaseEnv();

  const loadProgress = useCallback(async () => {
    if (!user || !supabaseReady || !language || !cefrLevel) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: loadError } = await supabase
      .from('practice_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('language', language)
      .eq('cefr_level', cefrLevel);

    setLoading(false);

    if (loadError) {
      setRows([]);
      setError(loadError.message);
      return;
    }

    setRows((data ?? []) as PracticeProgressRow[]);
  }, [cefrLevel, language, supabaseReady, user]);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  const statusByExerciseId = useMemo(() => {
    return rows.reduce<Record<string, PracticeStatus>>((map, row) => {
      map[row.exercise_id] = getProgressStatus(row);
      return map;
    }, {});
  }, [rows]);

  const applyProgress = useCallback(
    <T extends PracticeExercise>(exercises: T[]) =>
      exercises.map((exercise) => ({
        ...exercise,
        status: statusByExerciseId[exercise.id] ?? 'not_started',
      })),
    [statusByExerciseId],
  );

  const upsertProgress = useCallback(
    async (patch: ProgressPatch) => {
      if (!user || !supabaseReady) {
        return { error: 'You need to be signed in before progress can be synced.' };
      }

      if (patch.status === 'in_progress') {
        const { data: existingRow, error: existingError } = await supabase
          .from('practice_progress')
          .select('status, completed_at')
          .eq('user_id', user.id)
          .eq('exercise_id', patch.exerciseId)
          .maybeSingle();

        if (existingError) {
          return { error: existingError.message };
        }

        if (existingRow?.completed_at || existingRow?.status === 'completed') {
          await loadProgress();
          return { error: null };
        }
      }

      const now = new Date().toISOString();
      const { error: upsertError } = await supabase.from('practice_progress').upsert(
        {
          user_id: user.id,
          language: patch.language,
          cefr_level: patch.cefrLevel,
          lesson_id: patch.lessonId ?? null,
          exercise_id: patch.exerciseId,
          status: patch.status,
          started_at: patch.startedAt ?? now,
          completed_at: patch.completedAt ?? (patch.status === 'completed' ? now : null),
          updated_at: now,
        },
        { onConflict: 'user_id,exercise_id' },
      );

      if (upsertError) {
        return { error: upsertError.message };
      }

      await loadProgress();
      return { error: null };
    },
    [loadProgress, supabaseReady, user],
  );

  return {
    rows,
    loading,
    error,
    applyProgress,
    reload: loadProgress,
    upsertProgress,
  };
}

export function getProgressStatus(row?: Pick<PracticeProgressRow, 'status' | 'started_at' | 'completed_at'> | null): PracticeStatus {
  if (!row) {
    return 'not_started';
  }

  if (row.completed_at || row.status === 'completed') {
    return 'completed';
  }

  if (row.started_at || row.status === 'in_progress') {
    return 'in_progress';
  }

  return 'not_started';
}
