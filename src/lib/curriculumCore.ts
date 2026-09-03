export type CefrBand = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type CefrSubLevel = '1' | '2';
export type CurriculumLanguage = 'English' | 'German' | 'Spanish' | 'Italian' | 'French';
export type CurriculumSkill =
  | 'vocabulary'
  | 'listening'
  | 'pronunciation'
  | 'sentence_building'
  | 'grammar'
  | 'dictation'
  | 'reading'
  | 'speaking'
  | 'writing'
  | 'conversation'
  | 'test';

export type ExerciseType =
  | 'vocabulary_match'
  | 'audio_choice'
  | 'listen_and_select'
  | 'listen_for_detail'
  | 'dictation_word'
  | 'dictation_sentence'
  | 'dictation_gap'
  | 'gap_fill'
  | 'sentence_order'
  | 'grammar_choice'
  | 'reading_main_idea'
  | 'reading_detail'
  | 'reading_true_false'
  | 'reading_heading_match'
  | 'pronunciation_repeat'
  | 'minimal_pairs'
  | 'shadowing'
  | 'guided_speaking'
  | 'free_speaking'
  | 'guided_writing'
  | 'free_writing'
  | 'roleplay'
  | 'lesson_test';

export type LessonStatus = 'locked' | 'available' | 'in_progress' | 'passed' | 'needs_review';

export type CurriculumVocabularyItem = {
  word: string;
  translation: string;
  example: string;
  audioText: string;
};

export type CurriculumChunk = {
  phrase: string;
  meaning: string;
  example: string;
};

export type ScoringRubric = {
  taskCompletion?: number;
  grammar?: number;
  vocabulary?: number;
  coherence?: number;
  spelling?: number;
  cefrAppropriateness?: number;
  pronunciation?: number;
  fluency?: number;
  accuracy?: number;
  comprehension?: number;
};

export type CurriculumExercise = {
  id: string;
  type: ExerciseType;
  skill: CurriculumSkill;
  title: string;
  instruction: string;
  content: Record<string, unknown>;
  grammarFocusId?: string;
  correctAnswer?: string | string[] | Record<string, unknown>;
  acceptableAnswers?: string[];
  scoringRubric: ScoringRubric;
  minScoreToPass: number;
};

export type ChoiceQuestion = {
  question: string;
  answer: string;
  choices: string[];
};

export type WritingTask = {
  prompt?: string;
  purpose?: string;
  audience?: string;
  situation?: string;
  expectedOutput?: string;
  usefulLanguage?: string[];
  approximateLength?: string;
  assessmentDimensions?: string[];
};

export type SpeakingTask = {
  prompt: string;
  focus: string[];
  expectedDuration: string;
  assessmentDimensions: string[];
};

export type RoleplayTask = {
  scenario: string;
  learnerRole: string;
  partnerRole: string;
  goal: string;
  successCriteria: string[];
};

export type CurriculumLesson = {
  id: string;
  levelNumber: number;
  cefrLevel: CefrBand;
  cefrSubLevel: CefrSubLevel;
  language: CurriculumLanguage;
  title: string;
  theme: string;
  objective: string;
  canDo: string;
  grammarFocus: string;
  grammarFocusId: string;
  targetSentence: string;
  readingText: string;
  newVocabulary: CurriculumVocabularyItem[];
  reviewVocabulary: CurriculumVocabularyItem[];
  vocabulary: CurriculumVocabularyItem[];
  chunks: CurriculumChunk[];
  exampleSentences: string[];
  readingQuestions: ChoiceQuestion[];
  listeningScript: string;
  listeningQuestions: ChoiceQuestion[];
  grammarItems: ChoiceQuestion[];
  writingTask: WritingTask;
  speakingTask: SpeakingTask;
  roleplay: RoleplayTask;
  exercises: CurriculumExercise[];
  mastery: {
    minOverallScore: 75;
    minSkillScore: 60;
    vocabularyRequired: 80;
  };
};

export type CurriculumLevel = {
  levelNumber: number;
  cefrLevel: CefrBand;
  cefrSubLevel: CefrSubLevel;
  language: CurriculumLanguage;
  title: string;
  lessons: CurriculumLesson[];
  levelExam: CurriculumExercise;
};

export type SkillScores = Partial<Record<CurriculumSkill, number>>;

export const SUPPORTED_CURRICULUM_LANGUAGES: CurriculumLanguage[] = ['English', 'German', 'Spanish', 'Italian', 'French'];

export const CURRICULUM_SPEECH_LOCALES: Record<CurriculumLanguage, string> = {
  English: 'en-US',
  German: 'de-DE',
  Spanish: 'es-ES',
  Italian: 'it-IT',
  French: 'fr-FR',
};

export const CURRICULUM_LEVELS: Array<{ levelNumber: number; cefrLevel: CefrBand; cefrSubLevel: CefrSubLevel; label: string }> = [
  { levelNumber: 1, cefrLevel: 'A1', cefrSubLevel: '1', label: 'A1.1' },
  { levelNumber: 2, cefrLevel: 'A1', cefrSubLevel: '2', label: 'A1.2' },
  { levelNumber: 3, cefrLevel: 'A2', cefrSubLevel: '1', label: 'A2.1' },
  { levelNumber: 4, cefrLevel: 'A2', cefrSubLevel: '2', label: 'A2.2' },
  { levelNumber: 5, cefrLevel: 'B1', cefrSubLevel: '1', label: 'B1.1' },
  { levelNumber: 6, cefrLevel: 'B1', cefrSubLevel: '2', label: 'B1.2' },
  { levelNumber: 7, cefrLevel: 'B2', cefrSubLevel: '1', label: 'B2.1' },
  { levelNumber: 8, cefrLevel: 'B2', cefrSubLevel: '2', label: 'B2.2' },
  { levelNumber: 9, cefrLevel: 'C1', cefrSubLevel: '1', label: 'C1.1' },
  { levelNumber: 10, cefrLevel: 'C1', cefrSubLevel: '2', label: 'C1.2' },
  { levelNumber: 11, cefrLevel: 'C2', cefrSubLevel: '1', label: 'C2.1' },
  { levelNumber: 12, cefrLevel: 'C2', cefrSubLevel: '2', label: 'C2.2' },
];

export function buildReviewQueueItems(lesson: CurriculumLesson, skillScores: SkillScores) {
  return Object.entries(skillScores)
    .filter(([, score]) => typeof score === 'number' && score < lesson.mastery.minSkillScore)
    .map(([skill, score]) => ({
      lessonId: lesson.id,
      skill: skill as CurriculumSkill,
      score: score ?? 0,
      reason: `${lesson.theme}: ${skill.replace('_', ' ')} needs review`,
    }));
}
