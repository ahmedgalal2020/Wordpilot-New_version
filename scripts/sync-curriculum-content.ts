import { createHash } from 'node:crypto';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { CURRICULUM } from '../src/lib/curriculum';

config({ path: '.env.local' });
config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const contentVersion = process.env.CURRICULUM_CONTENT_VERSION || 'wordpilot-curriculum-v2';

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const lessons = CURRICULUM.flatMap((level) =>
  level.lessons.map((lesson, index) => ({
    id: lesson.id,
    content_version: contentVersion,
    language: lesson.language,
    level_number: lesson.levelNumber,
    cefr_level: lesson.cefrLevel,
    cefr_sub_level: lesson.cefrSubLevel,
    lesson_number: index + 1,
    title: lesson.title,
    theme: lesson.theme,
    objective: lesson.objective,
    can_do: lesson.canDo,
    grammar_focus: lesson.grammarFocus,
    grammar_focus_id: lesson.grammarFocusId,
    target_sentence: lesson.targetSentence,
    reading_text: lesson.readingText,
    listening_script: lesson.listeningScript,
    new_vocabulary: lesson.newVocabulary,
    review_vocabulary: lesson.reviewVocabulary,
    vocabulary: lesson.vocabulary,
    chunks: lesson.chunks,
    example_sentences: lesson.exampleSentences,
    reading_questions: lesson.readingQuestions,
    listening_questions: lesson.listeningQuestions,
    grammar_items: lesson.grammarItems,
    writing_task: lesson.writingTask,
    speaking_task: lesson.speakingTask,
    roleplay: lesson.roleplay,
    mastery: lesson.mastery,
    updated_at: new Date().toISOString(),
  })),
);

const exercises = CURRICULUM.flatMap((level) =>
  level.lessons.flatMap((lesson) =>
    lesson.exercises.map((exercise) => ({
      id: exercise.id,
      content_version: contentVersion,
      lesson_id: lesson.id,
      language: lesson.language,
      level_number: lesson.levelNumber,
      skill: exercise.skill,
      exercise_type: exercise.type,
      title: exercise.title,
      instruction: exercise.instruction,
      content: exercise.content,
      grammar_focus_id: exercise.grammarFocusId ?? null,
      correct_answer: exercise.correctAnswer ?? null,
      acceptable_answers: exercise.acceptableAnswers ?? null,
      scoring_rubric: exercise.scoringRubric,
      min_score_to_pass: exercise.minScoreToPass,
      updated_at: new Date().toISOString(),
    })),
  ),
);

const exams = CURRICULUM.map((level) => ({
  id: level.levelExam.id,
  content_version: contentVersion,
  language: level.language,
  level_number: level.levelNumber,
  cefr_level: level.cefrLevel,
  cefr_sub_level: level.cefrSubLevel,
  title: level.levelExam.title,
  instruction: level.levelExam.instruction,
  content: level.levelExam.content,
  correct_answer: level.levelExam.correctAnswer ?? null,
  acceptable_answers: level.levelExam.acceptableAnswers ?? null,
  scoring_rubric: level.levelExam.scoringRubric,
  min_score_to_pass: level.levelExam.minScoreToPass,
  updated_at: new Date().toISOString(),
}));

const checksum = createHash('sha256')
  .update(JSON.stringify({ lessons, exercises, exams }))
  .digest('hex');

await upsert('curriculum_content_versions', [
  {
    id: contentVersion,
    description: 'Structured WordPilot curriculum with explicit lesson content, quality metadata, and multi-skill level exams.',
    checksum,
    lesson_count: lessons.length,
    exercise_count: exercises.length,
    quality_report: buildQualitySummary(),
    is_active: true,
  },
]);

await upsert('curriculum_content_lessons', lessons);
await upsert('curriculum_content_exercises', exercises);
await upsert('curriculum_content_level_exams', exams);

const [lessonCount, exerciseCount, examCount] = await Promise.all([
  countRows('curriculum_content_lessons'),
  countRows('curriculum_content_exercises'),
  countRows('curriculum_content_level_exams'),
]);

console.log(`Synced curriculum content version ${contentVersion}.`);
console.log(`Checksum: ${checksum}`);
console.log(`Lessons: ${lessonCount}; exercises: ${exerciseCount}; level exams: ${examCount}.`);

async function upsert(table: string, rows: Array<Record<string, unknown>>) {
  const batchSize = 250;
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const { error } = await supabase.from(table).upsert(batch);
    if (error) {
      throw new Error(`${table} sync failed: ${error.message}`);
    }
  }
}

async function countRows(table: string) {
  const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true }).eq('content_version', contentVersion);
  if (error) throw new Error(`${table} count failed: ${error.message}`);
  return count ?? 0;
}

function buildQualitySummary() {
  return {
    languages: 5,
    levels: CURRICULUM.length,
    lessons: lessons.length,
    exercises: exercises.length,
    levelExams: exams.length,
    contentChecks: [
      'lesson-specific vocabulary',
      'explicit review vocabulary',
      'lesson-specific reading passages',
      'lesson-specific listening scripts',
      'grammarFocusId alignment',
      'multi-section level exams',
    ],
  };
}
