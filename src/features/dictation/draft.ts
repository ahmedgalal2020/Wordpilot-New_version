import { WORKSPACE_DRAFT_KEY } from './constants';
import type { PracticeLanguage, WorkspaceDraft } from './types';

export function readStoredWorkspaceDraft(): WorkspaceDraft | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawDraft = window.localStorage.getItem(WORKSPACE_DRAFT_KEY) ?? window.sessionStorage.getItem(WORKSPACE_DRAFT_KEY);
  if (!rawDraft) {
    return null;
  }

  try {
    return JSON.parse(rawDraft) as WorkspaceDraft;
  } catch {
    window.localStorage.removeItem(WORKSPACE_DRAFT_KEY);
    window.sessionStorage.removeItem(WORKSPACE_DRAFT_KEY);
    return null;
  }
}

export function writeStoredWorkspaceDraft(draft: WorkspaceDraft) {
  if (typeof window === 'undefined') {
    return;
  }

  const serializedDraft = JSON.stringify(draft);
  window.localStorage.setItem(WORKSPACE_DRAFT_KEY, serializedDraft);
  window.sessionStorage.setItem(WORKSPACE_DRAFT_KEY, serializedDraft);
}

export function detectPracticeLanguage(text: string): PracticeLanguage | null {
  const normalized = text.toLowerCase();

  if (!normalized.trim()) {
    return null;
  }

  const scores: Array<{ language: PracticeLanguage; score: number }> = [
    { language: 'de-DE' as PracticeLanguage, score: scoreLanguage(normalized, [' der ', ' die ', ' das ', ' und ', ' ist ', ' nicht ', ' mit ', ' ein ', ' ich ', ' wir ', ' zu ', ' von ', ' fuer ', ' ueber ']) },
    { language: 'es-ES' as PracticeLanguage, score: scoreLanguage(normalized, [' el ', ' la ', ' los ', ' las ', ' que ', ' con ', ' para ', ' una ', ' este ', ' esta ', ' como ', ' porque '], /[áéíóúñ¿¡]/g) },
    { language: 'it-IT' as PracticeLanguage, score: scoreLanguage(normalized, [' il ', ' la ', ' gli ', ' le ', ' che ', ' con ', ' per ', ' una ', ' questo ', ' questa ', ' come ', ' perche '], /[àèéìòù]/g) },
    { language: 'fr-FR' as PracticeLanguage, score: scoreLanguage(normalized, [' le ', ' la ', ' les ', ' des ', ' que ', ' avec ', ' pour ', ' une ', ' cette ', ' comme ', ' parce ', ' dans '], /[àâçéèêëîïôûùüÿœ]/g) },
    { language: 'en-US' as PracticeLanguage, score: scoreLanguage(normalized, [' the ', ' and ', ' is ', ' are ', ' with ', ' for ', ' this ', ' that ', ' our ', ' you ', ' we ', ' they ', ' have ', ' will ', ' about ']) },
  ].sort((left, right) => right.score - left.score);

  if (scores[0].score === 0 || scores[0].score === scores[1].score) {
    return null;
  }

  return scores[0].language;

  const germanMarkers: string[] = [];
  const englishMarkers: string[] = [];

  const germanDiacritics = (normalized.match(/[äöüß]/g) ?? []).length;
  const germanScore = germanMarkers.reduce((score, marker) => score + (normalized.includes(marker) ? 1 : 0), germanDiacritics * 2);
  const englishScore = englishMarkers.reduce((score, marker) => score + (normalized.includes(marker) ? 1 : 0), 0);

  if (germanScore === englishScore) {
    return null;
  }

  return germanScore > englishScore ? 'de-DE' : 'en-US';
}

export function scoreLanguage(text: string, markers: string[], diacriticPattern?: RegExp) {
  const diacriticScore = diacriticPattern ? (text.match(diacriticPattern) ?? []).length * 2 : 0;
  return markers.reduce((score, marker) => score + (text.includes(marker) ? 1 : 0), diacriticScore);
}
