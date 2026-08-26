import { STORAGE_KEY } from './constants';
import type { ShadowingAttempt, ShadowingSegment, ShadowingSession } from './types';

export function stripTemporaryRecordingUrls(segments: ShadowingSegment[]) {
  return segments.map((segment) => ({
    ...segment,
    lastRecordingUrl: null,
    lastRecordingMimeType: null,
  }));
}

export function mapRemoteSession(row: Record<string, unknown>): ShadowingSession {
  const videoId = String(row.video_id ?? '');
  const segments = Array.isArray(row.segments) ? row.segments as ShadowingSegment[] : [];

  return {
    id: `shadow-${videoId}`,
    remoteId: String(row.id ?? ''),
    title: String(row.title ?? `Shadowing lesson ${videoId}`),
    videoUrl: String(row.video_url ?? ''),
    videoId,
    language: String(row.language ?? 'English'),
    level: String(row.cefr_level ?? 'A1'),
    completed: Number(row.completed_segments ?? 0),
    total: Number(row.total_segments ?? segments.length),
    averageScore: Number(row.average_score ?? 0),
    bestScore: Number(row.best_score ?? 0),
    difficultSentences: Array.isArray(row.difficult_sentences) ? row.difficult_sentences.map(String) : [],
    missedWords: Array.isArray(row.missed_words) ? row.missed_words.map(String) : [],
    transcript: String(row.transcript_text ?? ''),
    segments,
    currentIndex: Number(row.current_segment_index ?? 0),
    transcriptSource: row.transcript_source ? String(row.transcript_source) : 'Saved session',
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
    status: row.status === 'completed' ? 'completed' : 'in_progress',
  };
}

export function mapRemoteAttempt(row: Record<string, unknown>): ShadowingAttempt {
  return {
    score: Number(row.score ?? 0),
    transcript: String(row.transcript ?? ''),
    missingWords: Array.isArray(row.missing_words) ? row.missing_words.map(String) : [],
    incorrectWords: Array.isArray(row.incorrect_words) ? row.incorrect_words.map(String) : [],
    passed: Boolean(row.passed),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    engine: row.engine === 'gemini-audio' ? 'gemini-audio' : 'browser',
    model: row.model ? String(row.model) : undefined,
    audioPath: row.audio_path ? String(row.audio_path) : null,
    audioMimeType: row.audio_mime_type ? String(row.audio_mime_type) : null,
  };
}

export function mergeSessions(primary: ShadowingSession[], secondary: ShadowingSession[]) {
  const seen = new Set<string>();
  return [...primary, ...secondary]
    .filter((session) => {
      if (seen.has(session.id)) return false;
      seen.add(session.id);
      return true;
    })
    .slice(0, 12);
}


export function readSavedSessions(): ShadowingSession[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as ShadowingSession[];
  } catch {
    return [];
  }
}

export function writeSavedSessions(sessions: ShadowingSession[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function clearPlaybackTimers(timers: number[]) {
  timers.forEach((timer) => window.clearTimeout(timer));
  timers.length = 0;
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

