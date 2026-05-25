import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { hasSupabaseEnv } from '../lib/env';
import { supabase } from '../lib/supabase';

export type WeeklyMistakeStatus = 'wrong' | 'missing' | 'extra';

export type WeeklyReport = {
  currentWeek: {
    sessionsCount: number;
    averageAccuracy: number | null;
    bestAccuracy: number | null;
    totalMistakes: number;
  };
  previousWeek: {
    sessionsCount: number;
    averageAccuracy: number | null;
  };
  deltaAccuracy: number | null;
  topMistakes: Array<{
    correctWord: string;
    writtenWord: string | null;
    count: number;
    status: WeeklyMistakeStatus;
  }>;
  recommendation: string;
  mistakeInsightsAvailable: boolean;
};

type SessionRow = {
  id: string;
  accuracy: number | null;
  language: string | null;
  cefr_level: string | null;
  created_at: string;
};

type MistakeRow = {
  correct_word: string;
  written_word: string | null;
  status: WeeklyMistakeStatus;
  language: string | null;
  cefr_level: string | null;
  created_at: string;
};

const EMPTY_REPORT: WeeklyReport = {
  currentWeek: {
    sessionsCount: 0,
    averageAccuracy: null,
    bestAccuracy: null,
    totalMistakes: 0,
  },
  previousWeek: {
    sessionsCount: 0,
    averageAccuracy: null,
  },
  deltaAccuracy: null,
  topMistakes: [],
  recommendation: 'Complete a few dictation sessions this week to unlock your first progress recommendation.',
  mistakeInsightsAvailable: true,
};

export function useWeeklyReport(user: User | null, language?: string | null) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [mistakes, setMistakes] = useState<MistakeRow[]>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);
  const [mistakeInsightsAvailable, setMistakeInsightsAvailable] = useState(true);

  useEffect(() => {
    if (!user || !hasSupabaseEnv()) {
      setSessions([]);
      setMistakes([]);
      setLoading(false);
      return;
    }

    let active = true;

    async function loadWeeklyReport() {
      setLoading(true);
      setError(null);

      const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      let sessionsQuery = supabase
          .from('dictation_sessions')
          .select('id, accuracy, language, cefr_level, created_at')
          .eq('user_id', user.id)
          .gte('created_at', since)
          .order('created_at', { ascending: false });
      let mistakesQuery = supabase
          .from('dictation_mistakes')
          .select('correct_word, written_word, status, language, cefr_level, created_at')
          .eq('user_id', user.id)
          .gte('created_at', since);

      if (language) {
        sessionsQuery = sessionsQuery.eq('language', language);
        mistakesQuery = mistakesQuery.eq('language', language);
      }

      const [sessionsResult, mistakesResult] = await Promise.all([sessionsQuery, mistakesQuery]);

      if (!active) {
        return;
      }

      if (sessionsResult.error) {
        setError(sessionsResult.error.message);
      }

      setMistakeInsightsAvailable(!mistakesResult.error);
      setSessions((sessionsResult.data ?? []) as SessionRow[]);
      setMistakes(mistakesResult.error ? [] : ((mistakesResult.data ?? []) as MistakeRow[]));
      setLoading(false);
    }

    void loadWeeklyReport();

    return () => {
      active = false;
    };
  }, [language, user?.id]);

  const report = useMemo(() => buildWeeklyReport(sessions, mistakes, mistakeInsightsAvailable), [
    sessions,
    mistakes,
    mistakeInsightsAvailable,
  ]);

  return { report, loading, error };
}

function buildWeeklyReport(sessions: SessionRow[], mistakes: MistakeRow[], mistakeInsightsAvailable: boolean): WeeklyReport {
  if (sessions.length === 0) {
    return { ...EMPTY_REPORT, mistakeInsightsAvailable };
  }

  const now = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const currentWeekSessions = sessions.filter((session) => now - new Date(session.created_at).getTime() <= oneWeekMs);
  const previousWeekSessions = sessions.filter((session) => {
    const age = now - new Date(session.created_at).getTime();
    return age > oneWeekMs && age <= oneWeekMs * 2;
  });
  const currentWeekMistakes = mistakes.filter((mistake) => now - new Date(mistake.created_at).getTime() <= oneWeekMs);
  const currentAverage = getAverageAccuracy(currentWeekSessions);
  const previousAverage = getAverageAccuracy(previousWeekSessions);
  const topMistakes = getTopMistakes(currentWeekMistakes);

  return {
    currentWeek: {
      sessionsCount: currentWeekSessions.length,
      averageAccuracy: currentAverage,
      bestAccuracy: getBestAccuracy(currentWeekSessions),
      totalMistakes: currentWeekMistakes.length,
    },
    previousWeek: {
      sessionsCount: previousWeekSessions.length,
      averageAccuracy: previousAverage,
    },
    deltaAccuracy: currentAverage !== null && previousAverage !== null ? Math.round(currentAverage - previousAverage) : null,
    topMistakes,
    recommendation: buildRecommendation(currentAverage, topMistakes, currentWeekSessions),
    mistakeInsightsAvailable,
  };
}

function getAverageAccuracy(rows: SessionRow[]) {
  const values = rows
    .map((row) => (typeof row.accuracy === 'number' ? row.accuracy : Number(row.accuracy ?? 0)))
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) {
    return null;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getBestAccuracy(rows: SessionRow[]) {
  const values = rows
    .map((row) => (typeof row.accuracy === 'number' ? row.accuracy : Number(row.accuracy ?? 0)))
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) {
    return null;
  }

  return Math.round(Math.max(...values));
}

function getTopMistakes(rows: MistakeRow[]) {
  const grouped = new Map<string, { correctWord: string; writtenWord: string | null; count: number; status: WeeklyMistakeStatus }>();

  rows.forEach((row) => {
    const correctWord = row.correct_word?.trim();
    if (!correctWord) {
      return;
    }

    const writtenWord = row.written_word?.trim() || null;
    const key = `${correctWord.toLowerCase()}|${writtenWord?.toLowerCase() ?? ''}|${row.status}`;
    const current = grouped.get(key);

    if (current) {
      current.count += 1;
      return;
    }

    grouped.set(key, {
      correctWord,
      writtenWord,
      count: 1,
      status: row.status,
    });
  });

  return [...grouped.values()].sort((left, right) => right.count - left.count).slice(0, 5);
}

function buildRecommendation(averageAccuracy: number | null, topMistakes: WeeklyReport['topMistakes'], currentWeekSessions: SessionRow[]) {
  if (currentWeekSessions.length === 0) {
    return 'Complete at least two sessions this week so WordPilot can compare your progress accurately.';
  }

  const dominantLevel = getDominantValue(currentWeekSessions.map((session) => session.cefr_level).filter(Boolean) as string[]) ?? 'B1';
  const dominantLanguage =
    getDominantValue(currentWeekSessions.map((session) => session.language).filter(Boolean) as string[]) ?? 'English';
  const topStatus = topMistakes[0]?.status;

  if (topStatus === 'missing') {
    return `Practice ${dominantLanguage} ${dominantLevel} texts with longer sentence endings and pause after each phrase.`;
  }

  if (topStatus === 'extra') {
    return `Practice slower ${dominantLanguage} ${dominantLevel} dictations and focus on typing only the words you hear.`;
  }

  if (topStatus === 'wrong') {
    return `Review your top missed words, then repeat one ${dominantLanguage} ${dominantLevel} text with similar vocabulary.`;
  }

  if (averageAccuracy !== null && averageAccuracy >= 90) {
    return `Move up to a harder ${dominantLanguage} passage or increase playback speed slightly next week.`;
  }

  return `Repeat short ${dominantLanguage} ${dominantLevel} passages three times before moving to longer texts.`;
}

function getDominantValue(values: string[]) {
  if (values.length === 0) {
    return null;
  }

  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
}
