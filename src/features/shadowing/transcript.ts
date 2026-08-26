import { PASS_SCORE } from './constants';
import type { ShadowingAttempt, ShadowingSegment, ShadowingWord, YouTubeTranscriptCue } from './types';

export function getFriendlyEvaluationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');

  if (/AI_NOT_CONFIGURED|GEMINI_API_KEY/i.test(message)) {
    return 'AI pronunciation analysis is not configured yet. Add GEMINI_API_KEY on the server, or type/check your spoken response manually for now.';
  }

  if (/NO_SPEECH_DETECTED|No spoken words/i.test(message)) {
    return 'No spoken words were detected in this recording. Try again closer to the microphone.';
  }

  if (/AUDIO_TOO_SMALL|too short/i.test(message)) {
    return 'The recording was too short to evaluate. Hold record while you repeat the full sentence.';
  }

  return 'AI pronunciation analysis could not finish. You can retry recording or use the typed response checker.';
}

export function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result ?? '');
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = () => reject(new Error('Could not read the recording.'));
    reader.readAsDataURL(blob);
  });
}
export function getFriendlyTranscriptError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');

  if (/WordPilot could not connect|Failed to fetch|NetworkError/i.test(message)) {
    return 'WordPilot could not connect to the transcript service. You can still paste or upload subtitles to build the lesson.';
  }

  if (/TRANSCRIPT_BLOCKED|RequestBlocked|IpBlocked/i.test(message)) {
    return 'Automatic captions are temporarily unavailable for this video. Paste the transcript or upload an .srt/.vtt file to continue.';
  }

  if (/No public captions|No captions|TranscriptsDisabled|NoTranscriptFound|not contain readable/i.test(message)) {
    return 'This video does not expose readable captions to WordPilot. Paste the transcript or upload subtitle files to continue.';
  }

  return 'We could not add the transcript automatically. Paste the transcript or upload subtitles to continue.';
}

export function getSegmentShadowWords(segment: ShadowingSegment): ShadowingWord[] {
  if (segment.words?.length) return segment.words;
  return estimateSegmentWords(segment.text, segment.start, segment.end);
}

export function estimateSegmentWords(text: string, start: number, end: number): ShadowingWord[] {
  const parts = cleanCueText(text).split(/\s+/).filter(Boolean);
  if (parts.length === 0) return [];
  const safeStart = Math.max(0, start);
  const safeEnd = Math.max(safeStart + 0.8, end);
  const duration = safeEnd - safeStart;
  const step = duration / parts.length;
  return parts.map((word, index) => ({
    text: word,
    start: safeStart + step * index,
    end: safeStart + step * (index + 1),
  }));
}

export function getYouTubeId(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match?.[1] ?? '';
}

export function buildPracticeSegments(transcript: string, cues: YouTubeTranscriptCue[] | null): ShadowingSegment[] {
  const textSegments = splitTranscript(transcript);
  const timedCues = (cues ?? [])
    .filter((cue) => cue.text.trim() && Number.isFinite(cue.start))
    .slice(0, 240);

  if (timedCues.length > 0) {
    const timedSegments = buildTimedSegmentsFromTranscript(textSegments, timedCues);
    const sourceSegments = timedSegments.length > 0 ? timedSegments : groupTimedCues(timedCues);

    return sourceSegments.slice(0, 80).map((segment, index) => ({
      id: `segment-${index + 1}`,
      text: segment.text,
      start: segment.start,
      end: segment.end,
      words: segment.words,
      status: index === 0 ? 'current' as const : 'locked' as const,
      attempts: [],
    }));
  }

  return textSegments.map((text, index) => {
    const start = index * 8;
    const end = Math.max(start + estimateSegmentDuration(text), start + 5);
    return {
      id: `segment-${index + 1}`,
      text,
      start,
      end,
      words: estimateSegmentWords(text, start, end),
      status: index === 0 ? 'current' as const : 'locked' as const,
      attempts: [],
    };
  });
}

export function buildTimedSegmentsFromTranscript(textSegments: string[], cues: YouTubeTranscriptCue[]) {
  if (textSegments.length === 0) return [];

  const timedWords = cues.flatMap((cue, index) => expandCueWords(cue, cues[index + 1]));
  if (timedWords.length === 0) return [];

  const segments: Array<{ text: string; start: number; end: number; words: ShadowingWord[] }> = [];
  let cursor = 0;

  for (const text of textSegments.slice(0, 80)) {
    const targetWords = cleanCueText(text).split(/\s+/).filter(Boolean);
    if (targetWords.length === 0) continue;

    const start = Math.min(cursor, timedWords.length - 1);
    const endExclusive = Math.min(timedWords.length, start + targetWords.length);
    const words = timedWords.slice(start, endExclusive);
    if (words.length === 0) break;

    segments.push({
      text,
      start: Math.max(0, words[0].start),
      end: Math.max(words[words.length - 1].end + 0.1, words[0].start + 0.8),
      words: fitTimedWordsToText(text, words),
    });
    cursor = endExclusive;
  }

  return segments.filter((segment) => segment.text.length > 0);
}

export function fitTimedWordsToText(text: string, timedWords: ShadowingWord[]) {
  const displayWords = cleanCueText(text).split(/\s+/).filter(Boolean);
  if (displayWords.length === 0) return timedWords;

  const start = timedWords[0]?.start ?? 0;
  const end = timedWords.at(-1)?.end ?? start + estimateSegmentDuration(text);
  if (displayWords.length === timedWords.length) {
    return timedWords.map((word, index) => ({ ...word, text: displayWords[index] ?? word.text }));
  }

  return estimateSegmentWords(displayWords.join(' '), start, end);
}

export function groupTimedCues(cues: YouTubeTranscriptCue[]) {
  const words = cues.flatMap((cue, index) => expandCueWords(cue, cues[index + 1]));
  const segments: Array<{ text: string; start: number; end: number; words: ShadowingWord[] }> = [];
  let current: ShadowingWord[] = [];

  words.forEach((word, index) => {
    current.push(word);
    const joined = current.map((item) => item.text).join(' ').replace(/\s+/g, ' ').trim();
    const cleanWords = joined.split(/\s+/).filter(Boolean);
    const lastWord = cleanWords.at(-1) ?? '';
    const nextWord = words[index + 1];
    const nextGap = nextWord ? nextWord.start - word.end : 0;
    const duration = current.length ? word.end - current[0].start : 0;
    const hasSentenceEnd = /[.!?。！？]$/.test(lastWord);
    const weakEnding = isWeakSegmentEnding(lastWord);
    const canEndOnPause = cleanWords.length >= 8 && nextGap > 0.85 && !weakEnding;
    const canEndLongPhrase = cleanWords.length >= 16 && nextGap > 0.45 && !weakEnding;
    const mustEndLongPhrase = cleanWords.length >= 24 && !weakEnding;
    const mustEndVeryLongPhrase = cleanWords.length >= 30;
    const shouldSplit =
      (hasSentenceEnd && !weakEnding) ||
      canEndOnPause ||
      canEndLongPhrase ||
      mustEndLongPhrase ||
      mustEndVeryLongPhrase ||
      index === words.length - 1;

    if (shouldSplit) {
      segments.push({
        text: joined,
        start: Math.max(0, current[0].start),
        end: Math.max(word.end + 0.1, current[0].start + 0.8),
        words: current,
      });
      current = [];
    }
  });

  return segments.filter((segment) => segment.text.length > 0);
}

export function expandCueWords(cue: YouTubeTranscriptCue, nextCue?: YouTubeTranscriptCue) {
  const parts = cleanCueText(cue.text).split(/\s+/).filter(Boolean);
  if (parts.length === 0) return [];

  const start = Math.max(0, cue.start);
  const estimatedDuration = estimateCueDuration(cue.text);
  const nextCueDuration = nextCue && nextCue.start > start ? nextCue.start - start : null;
  const duration = nextCueDuration
    ? Math.max(0.6, Math.min(nextCueDuration, cue.duration > 0 ? cue.duration : nextCueDuration))
    : cue.duration > 0
      ? Math.min(cue.duration, estimatedDuration)
      : estimatedDuration;
  const step = duration / parts.length;

  return parts.map((text, index) => ({
    text,
    start: start + step * index,
    end: start + step * (index + 1),
  }));
}

export function isWeakSegmentEnding(value: string) {
  const normalized = value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  return new Set([
    'and', 'or', 'of', 'to', 'in', 'on', 'at', 'for', 'with', 'from', 'by', 'about', 'because', 'that', 'which', 'who', 'when', 'where', 'the', 'a', 'an',
    'und', 'oder', 'von', 'zu', 'zur', 'zum', 'im', 'in', 'auf', 'an', 'am', 'mit', 'bei', 'für', 'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'als', 'wie', 'was', 'wer', 'wenn', 'weil', 'dass', 'nicht', 'noch', 'immer',
  ]).has(normalized);
}

export function cleanCueText(value: string) {
  return repairCaptionArtifacts(value
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim());
}

export function repairCaptionArtifacts(value: string) {
  return value
    .replace(/\bkaffee\s+um\b/gi, 'Kaffee machen')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitTranscript(value: string) {
  const cleaned = repairCaptionArtifacts(value)
    .replace(/\d{1,2}:\d{2}(?::\d{2})?(?:[,.]\d{1,3})?/g, ' ')
    .replace(/-->/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();

  if (!cleaned) return [];

  const roughSegments = cleaned
    .split(/(?<=[.!?。！？])\s+|\n+/)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter((part) => part.length > 0);

  return roughSegments
    .flatMap((part) => splitLongTextSegment(part))
    .slice(0, 80);
}

export function splitLongTextSegment(value: string) {
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length <= 24) return [value];

  const chunks: string[] = [];
  let current: string[] = [];

  words.forEach((word, index) => {
    current.push(word);
    const nextWord = words[index + 1];
    const hasSentenceEnd = /[.!?。！？]$/.test(word);
    const hasCommaBreak = /[,;:]$/.test(word) && current.length >= 12 && !isWeakSegmentEnding(word);
    const longEnough = current.length >= 18 && !isWeakSegmentEnding(word) && !isWeakSegmentStart(nextWord ?? '');
    const tooLong = current.length >= 26;
    const isLast = index === words.length - 1;

    if (hasSentenceEnd || hasCommaBreak || longEnough || tooLong || isLast) {
      chunks.push(current.join(' '));
      current = [];
    }
  });

  return chunks.filter(Boolean);
}

export function isWeakSegmentStart(value: string) {
  const normalized = value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  return new Set(['and', 'or', 'but', 'because', 'that', 'which', 'who', 'und', 'oder', 'aber', 'weil', 'dass', 'denn']).has(normalized);
}

export function estimateSegmentDuration(text: string) {
  return Math.max(5, Math.ceil(text.split(/\s+/).length * 0.55) + 2);
}

export function estimateCueDuration(text: string) {
  return Math.max(1, Math.min(5, text.split(/\s+/).length * 0.45));
}
export function compareSpeech(target: string, response: string): ShadowingAttempt {
  const targetWords = tokenize(target);
  const responseWords = tokenize(response);
  const usedResponse = new Set<number>();
  const missingWords: string[] = [];
  const incorrectWords: string[] = [];
  let correct = 0;

  targetWords.forEach((word, index) => {
    if (responseWords[index] === word) {
      usedResponse.add(index);
      correct += 1;
      return;
    }

    const nearbyIndex = responseWords.findIndex((candidate, responseIndex) => !usedResponse.has(responseIndex) && Math.abs(responseIndex - index) <= 2 && candidate === word);
    if (nearbyIndex >= 0) {
      usedResponse.add(nearbyIndex);
      correct += 1;
      return;
    }

    missingWords.push(word);
    if (responseWords[index]) incorrectWords.push(responseWords[index]);
  });

  responseWords.forEach((word, index) => {
    if (!usedResponse.has(index) && !targetWords.includes(word)) incorrectWords.push(word);
  });

  const score = targetWords.length === 0 ? 0 : Math.max(0, Math.min(100, Math.round((correct / targetWords.length) * 100)));
  return {
    score,
    transcript: response,
    missingWords: uniqueWords(missingWords),
    incorrectWords: uniqueWords(incorrectWords),
    passed: score >= PASS_SCORE,
    createdAt: new Date().toISOString(),
  };
}

export function tokenize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}' ]+/gu, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

export function uniqueWords(words: string[]) {
  return Array.from(new Set(words)).slice(0, 12);
}

export function buildReport(segments: ShadowingSegment[]) {
  const attempts = segments.flatMap((segment) => segment.attempts);
  const average = attempts.length === 0 ? 0 : Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length);
  const difficultSentences = segments
    .filter((segment) => segment.attempts.some((attempt) => !attempt.passed))
    .sort((left, right) => left.attempts[0]?.score - right.attempts[0]?.score)
    .map((segment) => segment.text)
    .slice(0, 3);
  const missedCounts = attempts.flatMap((attempt) => attempt.missingWords).reduce<Record<string, number>>((counts, word) => {
    counts[word] = (counts[word] ?? 0) + 1;
    return counts;
  }, {});
  const frequentlyMissedWords = Object.entries(missedCounts)
    .sort((left, right) => right[1] - left[1])
    .map(([word]) => word)
    .slice(0, 10);
  const rating = average >= 90 ? 'Excellent' : average >= 75 ? 'Strong' : average >= 60 ? 'Developing' : attempts.length > 0 ? 'Needs reps' : 'Not started';
  const recommendation =
    attempts.length === 0
      ? 'Start with one short sentence and focus on matching rhythm before speed.'
      : average >= 75
        ? 'Increase difficulty with longer clips or faster native speech next session.'
        : 'Repeat difficult sentences slowly, then record again after listening twice.';

  return { difficultSentences, frequentlyMissedWords, rating, recommendation };
}

export function buildSuggestion(attempt: ShadowingAttempt) {
  if (attempt.passed) return 'Good match. Keep the same rhythm and move forward.';
  if (attempt.missingWords.length > attempt.incorrectWords.length) return 'Focus on sentence endings and small function words.';
  if (attempt.incorrectWords.length > 0) return 'Slow down and copy the vowel sounds before repeating the full sentence.';
  return 'Listen once for meaning, once for rhythm, then repeat.';
}

export function getSpeechLanguage(language: string) {
  const map: Record<string, string> = {
    en: 'en-US',
    de: 'de-DE',
    es: 'es-ES',
    it: 'it-IT',
    fr: 'fr-FR',
    English: 'en-US',
    German: 'de-DE',
    Spanish: 'es-ES',
    Italian: 'it-IT',
    French: 'fr-FR',
  };
  return map[language] ?? 'en-US';
}


