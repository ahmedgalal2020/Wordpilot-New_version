import { supabase } from './supabase';
import {
  CURRICULUM_LEVELS,
  type CefrBand,
  type CefrSubLevel,
  type CurriculumChunk,
  type CurriculumExercise,
  type CurriculumLanguage,
  type CurriculumLevel,
  type CurriculumLesson,
  type CurriculumSkill,
  type CurriculumVocabularyItem,
  type ExerciseType,
  type ScoringRubric,
} from './curriculumCore';

type JsonRecord = Record<string, unknown>;

export type CurriculumContentVersionRow = {
  id: string;
  checksum: string;
  lesson_count: number;
  exercise_count: number;
  is_active: boolean;
  created_at: string;
};

export type CurriculumLessonRow = {
  id: string;
  content_version: string;
  language: string;
  level_number: number;
  cefr_level: string;
  cefr_sub_level: string;
  lesson_number: number;
  title: string;
  theme: string;
  objective: string;
  can_do: string;
  grammar_focus: string;
  grammar_focus_id: string;
  target_sentence: string;
  reading_text: string;
  listening_script: string;
  new_vocabulary: unknown;
  review_vocabulary: unknown;
  vocabulary: unknown;
  chunks: unknown;
  example_sentences: unknown;
  reading_questions: unknown;
  listening_questions: unknown;
  grammar_items: unknown;
  writing_task: unknown;
  speaking_task: unknown;
  roleplay: unknown;
  mastery: unknown;
};

export type CurriculumExerciseRow = {
  id: string;
  content_version: string;
  lesson_id: string;
  language: string;
  level_number: number;
  skill: string;
  exercise_type: string;
  title: string;
  instruction: string;
  content: unknown;
  grammar_focus_id: string | null;
  correct_answer: unknown | null;
  acceptable_answers: unknown | null;
  scoring_rubric: unknown;
  min_score_to_pass: number;
};

export type CurriculumLevelExamRow = {
  id: string;
  content_version: string;
  language: string;
  level_number: number;
  cefr_level: string;
  cefr_sub_level: string;
  title: string;
  instruction: string;
  content: unknown;
  correct_answer: unknown | null;
  acceptable_answers: unknown | null;
  scoring_rubric: unknown;
  min_score_to_pass: number;
};

export type CurriculumLevelSummary = {
  levelNumber: number;
  cefrLevel: CefrBand;
  cefrSubLevel: CefrSubLevel;
  language: CurriculumLanguage;
  title: string;
  lessons: Array<{ id: string; theme: string }>;
};

type SupabaseQueryResult<T> = PromiseLike<{ data: T | null; error: { message: string } | null }>;

type SupabaseQueryBuilder<T> = {
  select: (columns: string) => SupabaseQueryBuilder<T>;
  eq: (column: string, value: string | number | boolean) => SupabaseQueryBuilder<T>;
  in: (column: string, values: Array<string | number>) => SupabaseQueryBuilder<T>;
  order: (column: string, options?: { ascending?: boolean }) => SupabaseQueryBuilder<T>;
  limit: (count: number) => SupabaseQueryBuilder<T>;
  maybeSingle: () => SupabaseQueryResult<T>;
} & SupabaseQueryResult<T>;

export type CurriculumClient = {
  from: <T = unknown>(table: string) => SupabaseQueryBuilder<T>;
};

export class CurriculumRepositoryError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'missing_active_version'
      | 'query_failed'
      | 'missing_content'
      | 'version_mismatch'
      | 'invalid_content',
  ) {
    super(message);
    this.name = 'CurriculumRepositoryError';
  }
}

const LESSON_COLUMNS = [
  'id',
  'content_version',
  'language',
  'level_number',
  'cefr_level',
  'cefr_sub_level',
  'lesson_number',
  'title',
  'theme',
  'objective',
  'can_do',
  'grammar_focus',
  'grammar_focus_id',
  'target_sentence',
  'reading_text',
  'listening_script',
  'new_vocabulary',
  'review_vocabulary',
  'vocabulary',
  'chunks',
  'example_sentences',
  'reading_questions',
  'listening_questions',
  'grammar_items',
  'writing_task',
  'speaking_task',
  'roleplay',
  'mastery',
].join(',');

const EXERCISE_COLUMNS = [
  'id',
  'content_version',
  'lesson_id',
  'language',
  'level_number',
  'skill',
  'exercise_type',
  'title',
  'instruction',
  'content',
  'grammar_focus_id',
  'correct_answer',
  'acceptable_answers',
  'scoring_rubric',
  'min_score_to_pass',
].join(',');

const EXAM_COLUMNS = [
  'id',
  'content_version',
  'language',
  'level_number',
  'cefr_level',
  'cefr_sub_level',
  'title',
  'instruction',
  'content',
  'correct_answer',
  'acceptable_answers',
  'scoring_rubric',
  'min_score_to_pass',
].join(',');

const SKILL_ORDER: CurriculumSkill[] = [
  'vocabulary',
  'listening',
  'pronunciation',
  'sentence_building',
  'grammar',
  'dictation',
  'reading',
  'speaking',
  'writing',
  'conversation',
  'test',
];

const levelCache = new Map<string, CurriculumLevel>();
const summaryCache = new Map<string, CurriculumLevelSummary[]>();

function getDefaultCurriculumClient(): CurriculumClient {
  return supabase as unknown as CurriculumClient;
}

export async function loadActiveCurriculumVersion(client: CurriculumClient = getDefaultCurriculumClient()): Promise<CurriculumContentVersionRow> {
  const { data, error } = await client
    .from<CurriculumContentVersionRow[]>('curriculum_content_versions')
    .select('id,checksum,lesson_count,exercise_count,is_active,created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(2);

  if (error) {
    throw new CurriculumRepositoryError(`Could not load active curriculum version: ${error.message}`, 'query_failed');
  }

  if (!data?.length) {
    throw new CurriculumRepositoryError('No active curriculum content version is available.', 'missing_active_version');
  }

  if (data.length > 1) {
    throw new CurriculumRepositoryError('More than one active curriculum content version was found.', 'version_mismatch');
  }

  return data[0];
}

export async function loadCurriculumLevel(
  language: CurriculumLanguage,
  levelNumber: number,
  options: { client?: CurriculumClient } = {},
): Promise<CurriculumLevel> {
  const client = options.client ?? getDefaultCurriculumClient();
  const activeVersion = await loadActiveCurriculumVersion(client);
  const cacheKey = `${activeVersion.id}:${language}:${levelNumber}`;
  const cached = levelCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const [lessonsResult, exercisesResult, examResult] = await Promise.all([
    client
      .from<CurriculumLessonRow[]>('curriculum_content_lessons')
      .select(LESSON_COLUMNS)
      .eq('content_version', activeVersion.id)
      .eq('language', language)
      .eq('level_number', levelNumber)
      .order('lesson_number', { ascending: true }),
    client
      .from<CurriculumExerciseRow[]>('curriculum_content_exercises')
      .select(EXERCISE_COLUMNS)
      .eq('content_version', activeVersion.id)
      .eq('language', language)
      .eq('level_number', levelNumber),
    client
      .from<CurriculumLevelExamRow>('curriculum_content_level_exams')
      .select(EXAM_COLUMNS)
      .eq('content_version', activeVersion.id)
      .eq('language', language)
      .eq('level_number', levelNumber)
      .limit(1)
      .maybeSingle(),
  ]);

  const queryError = lessonsResult.error ?? exercisesResult.error ?? examResult.error;
  if (queryError) {
    throw new CurriculumRepositoryError(`Could not load curriculum content: ${queryError.message}`, 'query_failed');
  }

  const level = assembleCurriculumLevel({
    activeVersionId: activeVersion.id,
    language,
    levelNumber,
    lessons: lessonsResult.data ?? [],
    exercises: exercisesResult.data ?? [],
    exam: examResult.data,
  });

  levelCache.set(cacheKey, level);
  return level;
}

export async function loadCurriculumLesson(language: CurriculumLanguage, levelNumber: number, lessonId: string) {
  const level = await loadCurriculumLevel(language, levelNumber);
  const lesson = level.lessons.find((item) => item.id === lessonId);

  if (!lesson) {
    throw new CurriculumRepositoryError(`Lesson ${lessonId} was not found in ${language} level ${levelNumber}.`, 'missing_content');
  }

  return lesson;
}

export async function loadCurriculumLevelExam(language: CurriculumLanguage, levelNumber: number) {
  return (await loadCurriculumLevel(language, levelNumber)).levelExam;
}

export async function loadCurriculumLevelSummaries(language: CurriculumLanguage, options: { client?: CurriculumClient } = {}) {
  const client = options.client ?? getDefaultCurriculumClient();
  const activeVersion = await loadActiveCurriculumVersion(client);
  const cacheKey = `${activeVersion.id}:${language}:summaries`;
  const cached = summaryCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const { data, error } = await client
    .from<CurriculumLessonRow[]>('curriculum_content_lessons')
    .select('id,content_version,language,level_number,cefr_level,cefr_sub_level,lesson_number,title,theme')
    .eq('content_version', activeVersion.id)
    .eq('language', language)
    .order('level_number', { ascending: true })
    .order('lesson_number', { ascending: true });

  if (error) {
    throw new CurriculumRepositoryError(`Could not load curriculum level summaries: ${error.message}`, 'query_failed');
  }

  const summaries = assembleCurriculumLevelSummaries(activeVersion.id, language, data ?? []);
  summaryCache.set(cacheKey, summaries);
  return summaries;
}

export async function loadCurriculumLevelsByBand(language: CurriculumLanguage, cefrLevel: CefrBand) {
  const numbers = CURRICULUM_LEVELS.filter((level) => level.cefrLevel === cefrLevel).map((level) => level.levelNumber);
  const levels = await Promise.all(numbers.map((levelNumber) => loadCurriculumLevel(language, levelNumber)));
  return levels;
}

export function assembleCurriculumLevel({
  activeVersionId,
  language,
  levelNumber,
  lessons,
  exercises,
  exam,
}: {
  activeVersionId: string;
  language: CurriculumLanguage;
  levelNumber: number;
  lessons: CurriculumLessonRow[];
  exercises: CurriculumExerciseRow[];
  exam: CurriculumLevelExamRow | null;
}): CurriculumLevel {
  const expectedLevel = CURRICULUM_LEVELS.find((item) => item.levelNumber === levelNumber);
  if (!expectedLevel) {
    throw new CurriculumRepositoryError(`Unsupported curriculum level number: ${levelNumber}.`, 'invalid_content');
  }

  if (lessons.length !== 12) {
    throw new CurriculumRepositoryError(`${language} ${expectedLevel.label} should contain exactly 12 lessons, found ${lessons.length}.`, 'missing_content');
  }

  assertSingleVersion(activeVersionId, [...lessons, ...exercises, ...(exam ? [exam] : [])]);

  const sortedLessons = [...lessons].sort((a, b) => a.lesson_number - b.lesson_number);
  const lessonIds = new Set(sortedLessons.map((lesson) => lesson.id));
  sortedLessons.forEach((lesson, index) => {
    if (lesson.language !== language || lesson.level_number !== levelNumber) {
      throw new CurriculumRepositoryError(`Lesson ${lesson.id} does not match the requested language/level.`, 'invalid_content');
    }
    if (lesson.lesson_number !== index + 1) {
      throw new CurriculumRepositoryError(`${language} ${expectedLevel.label} lesson order must be 1-12.`, 'invalid_content');
    }
  });

  exercises.forEach((exercise) => {
    if (!lessonIds.has(exercise.lesson_id)) {
      throw new CurriculumRepositoryError(`Exercise ${exercise.id} points to lesson ${exercise.lesson_id} outside the loaded level.`, 'invalid_content');
    }
    if (exercise.language !== language || exercise.level_number !== levelNumber) {
      throw new CurriculumRepositoryError(`Exercise ${exercise.id} does not match the requested language/level.`, 'invalid_content');
    }
  });

  if (!exam) {
    throw new CurriculumRepositoryError(`${language} ${expectedLevel.label} level exam is missing.`, 'missing_content');
  }

  if (exam.language !== language || exam.level_number !== levelNumber) {
    throw new CurriculumRepositoryError(`Level exam ${exam.id} does not match the requested language/level.`, 'invalid_content');
  }

  const exercisesByLessonId = groupExercisesByLessonId(exercises);
  const mappedLessons = sortedLessons.map((lesson) => mapLessonRow(lesson, exercisesByLessonId.get(lesson.id) ?? []));

  return {
    levelNumber,
    cefrLevel: expectedLevel.cefrLevel,
    cefrSubLevel: expectedLevel.cefrSubLevel,
    language,
    title: `${expectedLevel.label} ${language}`,
    lessons: mappedLessons,
    levelExam: mapExamRow(exam),
  };
}

export function assembleCurriculumLevelSummaries(
  activeVersionId: string,
  language: CurriculumLanguage,
  rows: Array<Pick<CurriculumLessonRow, 'id' | 'content_version' | 'language' | 'level_number' | 'cefr_level' | 'cefr_sub_level' | 'lesson_number' | 'title' | 'theme'>>,
): CurriculumLevelSummary[] {
  assertSingleVersion(activeVersionId, rows);

  const byLevel = new Map<number, typeof rows>();
  rows.forEach((row) => {
    if (row.language !== language) {
      throw new CurriculumRepositoryError(`Summary row ${row.id} does not match ${language}.`, 'invalid_content');
    }
    byLevel.set(row.level_number, [...(byLevel.get(row.level_number) ?? []), row]);
  });

  return CURRICULUM_LEVELS.map((level) => {
    const lessons = [...(byLevel.get(level.levelNumber) ?? [])].sort((a, b) => a.lesson_number - b.lesson_number);
    return {
      levelNumber: level.levelNumber,
      cefrLevel: level.cefrLevel,
      cefrSubLevel: level.cefrSubLevel,
      language,
      title: `${level.label} ${language}`,
      lessons: lessons.map((lesson) => ({ id: lesson.id, theme: lesson.theme })),
    };
  }).filter((summary) => summary.lessons.length > 0);
}

function mapLessonRow(row: CurriculumLessonRow, exercises: CurriculumExerciseRow[]): CurriculumLesson {
  return {
    id: row.id,
    levelNumber: row.level_number,
    cefrLevel: toCefrBand(row.cefr_level),
    cefrSubLevel: toCefrSubLevel(row.cefr_sub_level),
    language: toCurriculumLanguage(row.language),
    title: row.title,
    theme: row.theme,
    objective: row.objective,
    canDo: row.can_do,
    grammarFocus: row.grammar_focus,
    grammarFocusId: row.grammar_focus_id,
    targetSentence: row.target_sentence,
    readingText: row.reading_text,
    listeningScript: row.listening_script,
    newVocabulary: readArray<CurriculumVocabularyItem>(row.new_vocabulary, 'new_vocabulary'),
    reviewVocabulary: readArray<CurriculumVocabularyItem>(row.review_vocabulary, 'review_vocabulary'),
    vocabulary: readArray<CurriculumVocabularyItem>(row.vocabulary, 'vocabulary'),
    chunks: readArray<CurriculumChunk>(row.chunks, 'chunks'),
    exampleSentences: readArray<string>(row.example_sentences, 'example_sentences'),
    readingQuestions: readArray<CurriculumLesson['readingQuestions'][number]>(row.reading_questions, 'reading_questions'),
    listeningQuestions: readArray<CurriculumLesson['listeningQuestions'][number]>(row.listening_questions, 'listening_questions'),
    grammarItems: readArray<CurriculumLesson['grammarItems'][number]>(row.grammar_items, 'grammar_items'),
    writingTask: readObject<CurriculumLesson['writingTask']>(row.writing_task, 'writing_task'),
    speakingTask: readObject<CurriculumLesson['speakingTask']>(row.speaking_task, 'speaking_task'),
    roleplay: readObject<CurriculumLesson['roleplay']>(row.roleplay, 'roleplay'),
    mastery: readMastery(row.mastery),
    exercises: sortExercises(exercises).map(mapExerciseRow),
  };
}

function mapExerciseRow(row: CurriculumExerciseRow): CurriculumExercise {
  return {
    id: row.id,
    type: toExerciseType(row.exercise_type),
    skill: toCurriculumSkill(row.skill),
    title: row.title,
    instruction: row.instruction,
    content: readObject(row.content, 'content'),
    grammarFocusId: row.grammar_focus_id ?? undefined,
    correctAnswer: readOptionalAnswer(row.correct_answer),
    acceptableAnswers: readOptionalStringArray(row.acceptable_answers),
    scoringRubric: readObject<ScoringRubric>(row.scoring_rubric, 'scoring_rubric'),
    minScoreToPass: row.min_score_to_pass,
  };
}

function mapExamRow(row: CurriculumLevelExamRow): CurriculumExercise {
  return {
    id: row.id,
    type: 'lesson_test',
    skill: 'test',
    title: row.title,
    instruction: row.instruction,
    content: readObject(row.content, 'content'),
    correctAnswer: readOptionalAnswer(row.correct_answer),
    acceptableAnswers: readOptionalStringArray(row.acceptable_answers),
    scoringRubric: readObject<ScoringRubric>(row.scoring_rubric, 'scoring_rubric'),
    minScoreToPass: row.min_score_to_pass,
  };
}

function groupExercisesByLessonId(exercises: CurriculumExerciseRow[]) {
  const map = new Map<string, CurriculumExerciseRow[]>();
  exercises.forEach((exercise) => {
    map.set(exercise.lesson_id, [...(map.get(exercise.lesson_id) ?? []), exercise]);
  });
  return map;
}

function sortExercises(exercises: CurriculumExerciseRow[]) {
  return [...exercises].sort((a, b) => {
    const skillDelta = SKILL_ORDER.indexOf(toCurriculumSkill(a.skill)) - SKILL_ORDER.indexOf(toCurriculumSkill(b.skill));
    return skillDelta || a.id.localeCompare(b.id);
  });
}

function assertSingleVersion(activeVersionId: string, rows: Array<{ id: string; content_version: string }>) {
  const mismatched = rows.find((row) => row.content_version !== activeVersionId);
  if (mismatched) {
    throw new CurriculumRepositoryError(`Content version mismatch at ${mismatched.id}.`, 'version_mismatch');
  }
}

function readArray<T>(value: unknown, field: string): T[] {
  if (!Array.isArray(value)) {
    throw new CurriculumRepositoryError(`Missing or invalid ${field}.`, 'invalid_content');
  }
  return value as T[];
}

function readObject<T extends JsonRecord = JsonRecord>(value: unknown, field: string): T {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    throw new CurriculumRepositoryError(`Missing or invalid ${field}.`, 'invalid_content');
  }
  return value as T;
}

function readMastery(value: unknown): CurriculumLesson['mastery'] {
  const mastery = readObject(value, 'mastery');
  const minOverallScore = typeof mastery.minOverallScore === 'number' ? mastery.minOverallScore : 75;
  const minSkillScore = typeof mastery.minSkillScore === 'number' ? mastery.minSkillScore : 60;
  const vocabularyRequired = typeof mastery.vocabularyRequired === 'number' ? mastery.vocabularyRequired : 80;

  return {
    minOverallScore: minOverallScore as 75,
    minSkillScore: minSkillScore as 60,
    vocabularyRequired: vocabularyRequired as 80,
  };
}

function readOptionalAnswer(value: unknown): CurriculumExercise['correctAnswer'] {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string' || Array.isArray(value) || (typeof value === 'object' && value !== null)) {
    return value as CurriculumExercise['correctAnswer'];
  }
  return undefined;
}

function readOptionalStringArray(value: unknown) {
  if (value === null || value === undefined) return undefined;
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : undefined;
}

function toCurriculumLanguage(value: string): CurriculumLanguage {
  if (['English', 'German', 'Spanish', 'Italian', 'French'].includes(value)) return value as CurriculumLanguage;
  throw new CurriculumRepositoryError(`Unsupported curriculum language: ${value}.`, 'invalid_content');
}

function toCefrBand(value: string): CefrBand {
  if (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(value)) return value as CefrBand;
  throw new CurriculumRepositoryError(`Unsupported CEFR band: ${value}.`, 'invalid_content');
}

function toCefrSubLevel(value: string): CefrSubLevel {
  if (value === '1' || value === '2') return value;
  throw new CurriculumRepositoryError(`Unsupported CEFR sublevel: ${value}.`, 'invalid_content');
}

function toCurriculumSkill(value: string): CurriculumSkill {
  if (SKILL_ORDER.includes(value as CurriculumSkill)) return value as CurriculumSkill;
  throw new CurriculumRepositoryError(`Unsupported curriculum skill: ${value}.`, 'invalid_content');
}

function toExerciseType(value: string): ExerciseType {
  const supported: ExerciseType[] = [
    'vocabulary_match',
    'vocabulary_choice',
    'picture_or_context_match',
    'audio_choice',
    'listen_and_select',
    'listen_for_detail',
    'listening_inference',
    'speaker_intention',
    'dictation_word',
    'dictation_sentence',
    'dictation_gap',
    'gap_fill',
    'sentence_order',
    'grammar_choice',
    'grammar_gap',
    'vocabulary_in_context',
    'collocation_choice',
    'paraphrase_choice',
    'sentence_transformation',
    'error_correction',
    'contextual_grammar',
    'reading_main_idea',
    'reading_detail',
    'reading_inference',
    'reference_tracking',
    'reading_true_false',
    'reading_heading_match',
    'paragraph_order',
    'pronunciation_repeat',
    'minimal_pairs',
    'shadowing',
    'mini_dialogue',
    'guided_speaking',
    'free_speaking',
    'extended_speaking',
    'scenario_response',
    'guided_argument',
    'guided_writing',
    'free_writing',
    'functional_writing',
    'roleplay',
    'stance_detection',
    'subtext_inference',
    'irony_interpretation',
    'register_shift',
    'precision_rewrite',
    'ambiguity_analysis',
    'argument_repair',
    'hidden_assumption',
    'rhetorical_effect',
    'source_synthesis',
    'comparative_reading',
    'comparative_critique',
    'discourse_reconstruction',
    'micro_editing',
    'strategic_response',
    'expert_roleplay',
    'advanced_writing',
    'synthesis_speaking',
    'lesson_test',
  ];
  if (supported.includes(value as ExerciseType)) return value as ExerciseType;
  throw new CurriculumRepositoryError(`Unsupported exercise type: ${value}.`, 'invalid_content');
}
