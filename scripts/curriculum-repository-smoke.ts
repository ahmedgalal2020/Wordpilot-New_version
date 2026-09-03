import { getCurriculumLevel, type CurriculumExercise, type CurriculumLanguage } from '../src/lib/curriculum';
import {
  CurriculumRepositoryError,
  assembleCurriculumLevel,
  assembleCurriculumLevelSummaries,
  loadActiveCurriculumVersion,
  loadCurriculumLevel,
  type CurriculumClient,
  type CurriculumContentVersionRow,
  type CurriculumExerciseRow,
  type CurriculumLessonRow,
  type CurriculumLevelExamRow,
} from '../src/lib/curriculumRepository';

const activeVersionId = 'test-active-version';
const sourceLevel = getCurriculumLevel('English', 1);

if (!sourceLevel) {
  throw new Error('Missing local fixture level.');
}

const lessonRows = sourceLevel.lessons.map((lesson, index): CurriculumLessonRow => ({
  id: lesson.id,
  content_version: activeVersionId,
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
}));

const exerciseRows = sourceLevel.lessons.flatMap((lesson) =>
  lesson.exercises.map((exercise): CurriculumExerciseRow => ({
    id: exercise.id,
    content_version: activeVersionId,
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
  })),
);

const examRow: CurriculumLevelExamRow = {
  id: sourceLevel.levelExam.id,
  content_version: activeVersionId,
  language: sourceLevel.language,
  level_number: sourceLevel.levelNumber,
  cefr_level: sourceLevel.cefrLevel,
  cefr_sub_level: sourceLevel.cefrSubLevel,
  title: sourceLevel.levelExam.title,
  instruction: sourceLevel.levelExam.instruction,
  content: sourceLevel.levelExam.content,
  correct_answer: sourceLevel.levelExam.correctAnswer ?? null,
  acceptable_answers: sourceLevel.levelExam.acceptableAnswers ?? null,
  scoring_rubric: sourceLevel.levelExam.scoringRubric,
  min_score_to_pass: sourceLevel.levelExam.minScoreToPass,
};

const activeVersion: CurriculumContentVersionRow = {
  id: activeVersionId,
  checksum: 'test-checksum',
  lesson_count: 720,
  exercise_count: 7920,
  is_active: true,
  created_at: '2026-09-03T00:00:00.000Z',
};

const editedVisibleTheme = 'Supabase edited visible lesson title';
const dbEditedLessonRows = lessonRows.map((lesson, index) =>
  index === 0 ? { ...lesson, theme: editedVisibleTheme, target_sentence: 'This sentence came from Supabase.' } : lesson,
);

const level = assembleCurriculumLevel({
  activeVersionId,
  language: 'English',
  levelNumber: 1,
  lessons: dbEditedLessonRows,
  exercises: [...exerciseRows].reverse(),
  exam: examRow,
});

expect(level.lessons.length === 12, 'selected language + level returns exactly 12 lessons.');
expect(level.lessons.every((lesson, index) => lesson.title === `${index + 1}. ${lesson.theme}` || lesson.id === lessonRows[index].id), 'lesson IDs remain stable.');
expect(level.lessons.map((lesson) => lesson.id).join('|') === sourceLevel.lessons.map((lesson) => lesson.id).join('|'), 'progress lesson IDs remain compatible.');
expect(level.lessons.every((lesson) => lesson.exercises.length === 11), 'each lesson has expected exercises.');
expect(
  level.lessons.every((lesson) => lesson.exercises.every((exercise) => exercise.id.startsWith(lesson.id))),
  'exercises map to the correct lesson IDs.',
);
expect(level.levelExam.id === sourceLevel.levelExam.id, 'level exam loads correctly.');
expect(level.lessons[0].theme === editedVisibleTheme, 'database-edited visible lesson content is reflected without editing curriculum.ts.');
expect(level.lessons[0].targetSentence === 'This sentence came from Supabase.', 'database-edited target sentence is reflected.');
expect(sourceLevel.lessons[0].theme !== editedVisibleTheme, 'local curriculum fixture was not edited for the acceptance proof.');

const summaries = assembleCurriculumLevelSummaries(activeVersionId, 'English', dbEditedLessonRows);
expect(summaries.length === 1, 'level summaries are assembled from database lesson rows.');
expect(summaries[0].lessons.length === 12, 'level summary contains 12 lessons for the loaded level.');
expect(summaries[0].lessons[0].theme === editedVisibleTheme, 'practice path summary reflects database-edited metadata.');

expectThrows(
  () =>
    assembleCurriculumLevel({
      activeVersionId,
      language: 'English',
      levelNumber: 1,
      lessons: dbEditedLessonRows.slice(0, 11),
      exercises: exerciseRows,
      exam: examRow,
    }),
  'missing_content',
  'missing content returns a controlled error.',
);

expectThrows(
  () =>
    assembleCurriculumLevel({
      activeVersionId,
      language: 'English',
      levelNumber: 1,
      lessons: dbEditedLessonRows,
      exercises: exerciseRows.map((exercise, index) => (index === 0 ? { ...exercise, content_version: 'old-version' } : exercise)),
      exam: examRow,
    }),
  'version_mismatch',
  'version mismatch is rejected.',
);

expectThrows(
  () =>
    assembleCurriculumLevel({
      activeVersionId,
      language: 'German',
      levelNumber: 1,
      lessons: dbEditedLessonRows,
      exercises: exerciseRows,
      exam: examRow,
    }),
  'invalid_content',
  'cross-language leakage is rejected.',
);

expectThrows(
  () =>
    assembleCurriculumLevel({
      activeVersionId,
      language: 'English',
      levelNumber: 2,
      lessons: dbEditedLessonRows,
      exercises: exerciseRows,
      exam: examRow,
    }),
  'invalid_content',
  'cross-level leakage is rejected.',
);

async function verifyLoaderQueries() {
  const fakeClient = createFakeClient({
    curriculum_content_versions: [activeVersion],
    curriculum_content_lessons: dbEditedLessonRows,
    curriculum_content_exercises: exerciseRows,
    curriculum_content_level_exams: [examRow],
  });

  const loadedVersion = await loadActiveCurriculumVersion(fakeClient);
  expect(loadedVersion.id === activeVersionId, 'active curriculum version resolves correctly.');

  await expectRejects(
    () =>
      loadActiveCurriculumVersion(
        createFakeClient({
          curriculum_content_versions: [
            activeVersion,
            { ...activeVersion, id: 'second-active-version', created_at: '2026-09-04T00:00:00.000Z' },
          ],
        }),
      ),
    'version_mismatch',
    'multiple active versions are rejected.',
  );

  const loadedLevel = await loadCurriculumLevel('English', 1, { client: fakeClient });
  expect(loadedLevel.lessons[0].theme === editedVisibleTheme, 'loadCurriculumLevel reads selected content from the client source.');
  expect(
    fakeClient.calls.some((call) => call.table === 'curriculum_content_lessons' && call.filters.some((filter) => filter.column === 'language' && filter.value === 'English')),
    'lesson query filters by language.',
  );
  expect(
    fakeClient.calls.some((call) => call.table === 'curriculum_content_lessons' && call.filters.some((filter) => filter.column === 'level_number' && filter.value === 1)),
    'lesson query filters by level_number.',
  );
  expect(
    fakeClient.calls.every((call) => !call.filters.some((filter) => filter.column === 'content_version') || filterValue(call, 'content_version') === activeVersionId),
    'runtime queries use one active content version.',
  );
}

function createFakeClient(tables: Record<string, unknown[]>) {
  const calls: Array<{ table: string; filters: Array<{ column: string; value: string | number | boolean }>; single: boolean }> = [];
  const client = {
    calls,
    from<T = unknown>(table: string) {
      return new FakeQueryBuilder<T>(table, tables[table] ?? [], calls);
    },
  };

  return client satisfies CurriculumClient & { calls: typeof calls };
}

class FakeQueryBuilder<T> implements PromiseLike<{ data: T | null; error: null }> {
  private filters: Array<{ column: string; value: string | number | boolean }> = [];
  private orderColumn: string | null = null;
  private orderAscending = true;
  private limitCount: number | null = null;
  private single = false;

  constructor(
    private readonly table: string,
    private readonly rows: unknown[],
    private readonly calls: Array<{ table: string; filters: Array<{ column: string; value: string | number | boolean }>; single: boolean }>,
  ) {}

  select() {
    return this;
  }

  eq(column: string, value: string | number | boolean) {
    this.filters.push({ column, value });
    return this;
  }

  in(column: string, values: Array<string | number>) {
    this.filters.push({ column, value: values.join('|') });
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    this.orderColumn = column;
    this.orderAscending = options.ascending ?? true;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  maybeSingle() {
    this.single = true;
    return this;
  }

  then<TResult1 = { data: T | null; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: T | null; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.resolve()).then(onfulfilled, onrejected);
  }

  private resolve(): { data: T | null; error: null } {
    this.calls.push({ table: this.table, filters: this.filters, single: this.single });
    let result = this.rows.filter((row) =>
      this.filters.every((filter) => (row as Record<string, unknown>)[filter.column] === filter.value),
    );

    if (this.orderColumn) {
      const column = this.orderColumn;
      result = [...result].sort((a, b) => {
        const aValue = (a as Record<string, unknown>)[column];
        const bValue = (b as Record<string, unknown>)[column];
        const delta = String(aValue).localeCompare(String(bValue), undefined, { numeric: true });
        return this.orderAscending ? delta : -delta;
      });
    }

    if (this.limitCount !== null) {
      result = result.slice(0, this.limitCount);
    }

    return { data: (this.single ? result[0] ?? null : result) as T, error: null };
  }
}

function filterValue(call: { filters: Array<{ column: string; value: string | number | boolean }> }, column: string) {
  return call.filters.find((filter) => filter.column === column)?.value;
}

function expect(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function expectThrows(fn: () => void, code: CurriculumRepositoryError['code'], message: string) {
  try {
    fn();
  } catch (error) {
    if (error instanceof CurriculumRepositoryError && error.code === code) {
      return;
    }
    throw error;
  }

  throw new Error(message);
}

async function expectRejects(fn: () => Promise<unknown>, code: CurriculumRepositoryError['code'], message: string) {
  try {
    await fn();
  } catch (error) {
    if (error instanceof CurriculumRepositoryError && error.code === code) {
      return;
    }
    throw error;
  }

  throw new Error(message);
}

await verifyLoaderQueries();

console.log('Curriculum repository smoke passed: active version, level assembly, exam mapping, version safety, leakage checks, and DB-edit acceptance proof.');
