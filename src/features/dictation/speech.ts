import { normalizeLearningLanguage, type LearningLanguage } from '../../lib/learning';
import type { PracticeLanguage } from './types';

export function cleanWordForSpeech(word: string) {
  return word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '') || word;
}

export function getPracticeLanguageCode(language?: string | null): PracticeLanguage {
  const normalized = normalizeLearningLanguage(language);
  const codes: Record<LearningLanguage, PracticeLanguage> = {
    English: 'en-US',
    German: 'de-DE',
    Spanish: 'es-ES',
    Italian: 'it-IT',
    French: 'fr-FR',
  };

  return codes[normalized];
}

export function getLearningLanguageFromCode(language: PracticeLanguage): LearningLanguage {
  const labels: Record<PracticeLanguage, LearningLanguage> = {
    'en-US': 'English',
    'de-DE': 'German',
    'es-ES': 'Spanish',
    'it-IT': 'Italian',
    'fr-FR': 'French',
  };

  return labels[language];
}

export function getSpokenToken(token: string, language: PracticeLanguage) {
  if (language !== 'de-DE') {
    return cleanWordForSpeech(token);
  }

  const punctuationNames: Record<string, string> = {
    ',': 'Komma',
    '.': 'Punkt',
    '?': 'Fragezeichen',
    '!': 'Ausrufezeichen',
    ';': 'Semikolon',
    ':': 'Doppelpunkt',
  };
  const trimmedToken = token.trim();
  const punctuationOnly = /^[.,!?;:]+$/.test(trimmedToken);
  const punctuationMarks = punctuationOnly
    ? trimmedToken
    : `${trimmedToken.match(/^[.,!?;:]+/)?.[0] ?? ''}${trimmedToken.match(/[.,!?;:]+$/)?.[0] ?? ''}`;
  const word = cleanWordForSpeech(trimmedToken);
  const spokenParts = [
    punctuationOnly ? '' : word,
    ...[...punctuationMarks].map((mark) => punctuationNames[mark]).filter(Boolean),
  ].filter(Boolean);

  return spokenParts.join(' ') || cleanWordForSpeech(token);
}

export function getPreferredVoice(voices: SpeechSynthesisVoice[], language: PracticeLanguage) {
  const languageName = getLearningLanguageFromCode(language);
  const exactGoogleVoice =
    language === 'de-DE'
      ? voices.find((voice) => /google/i.test(voice.name) && /(deutsch|german)/i.test(voice.name) && !voice.localService)
      : language === 'en-US'
        ? voices.find((voice) => /google us english/i.test(voice.name) && !voice.localService)
        : voices.find((voice) => /google/i.test(voice.name) && voice.lang.toLowerCase().startsWith(language.slice(0, 2).toLowerCase()) && !voice.localService);

  return (
    exactGoogleVoice ??
    voices.find((voice) => new RegExp(languageName, 'i').test(voice.name)) ??
    voices.find((voice) => voice.localService && /natural|neural|premium|microsoft|google/i.test(voice.name)) ??
    voices[0]
  );
}

export function calculateWordDelay(word: string, basePause: number, sentencePause: number) {
  const normalizedLength = cleanWordForSpeech(word).length;
  const extraLengthPause = Math.max(0, normalizedLength - 5) * 0.1;
  const commaPause = /[,;:]$/.test(word) ? 0.2 : 0;
  const endingPause = /[.!?]$/.test(word) ? sentencePause : 0;

  return basePause + extraLengthPause + commaPause + endingPause;
}
