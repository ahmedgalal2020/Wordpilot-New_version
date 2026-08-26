import type { LearningLanguage } from '../../lib/learning';

export type PracticeLanguage = 'en-US' | 'de-DE' | 'es-ES' | 'it-IT' | 'fr-FR';
export type SkillMode = 'Dictation' | 'Reading' | 'Listening' | 'Writing';

export type WordRange = {
  text: string;
  start: number;
  end: number;
};

export type TokenRange = WordRange & {
  normalized: string;
};

export type ComparisonItem = {
  id: string;
  inputWord: string;
  targetWord?: string;
  inputIndex: number | null;
  sourceIndex: number | null;
  status: 'correct' | 'wrong' | 'extra' | 'missing';
};

export type MistakeRow = {
  id: string;
  order: number;
  inputIndex: number | null;
  sourceIndex: number | null;
  writtenWord: string;
  correctWord: string;
  statusLabel: string;
};

export type MistakeStatus = 'wrong' | 'missing' | 'extra';

export type DictationAnalysis = {
  comparisonItems: ComparisonItem[];
  mistakes: MistakeRow[];
  accuracy: number;
};

export type WorkspaceDraft = {
  sourceText?: string;
  inputText?: string;
  selectedLanguage?: PracticeLanguage;
  speechRate?: number;
  wordPause?: number;
  sentencePause?: number;
  advanceOnSpace?: boolean;
};

export type PracticePathContext = {
  exerciseId: string;
  lessonId?: string | null;
  language: LearningLanguage;
  cefrLevel: string;
};
