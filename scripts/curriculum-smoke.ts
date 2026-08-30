import {
  CURRICULUM,
  CURRICULUM_LEVELS,
  CURRICULUM_SPEECH_LOCALES,
  LESSON_JOURNEY,
  SUPPORTED_CURRICULUM_LANGUAGES,
  getCurriculumLevel,
  type CurriculumExercise,
  type CurriculumLanguage,
} from '../src/lib/curriculum';

const choiceTypes = new Set([
  'vocabulary_match',
  'audio_choice',
  'listen_and_select',
  'listen_for_detail',
  'grammar_choice',
  'reading_main_idea',
  'reading_detail',
  'reading_true_false',
]);

const representativeLevels = new Set([1, 3, 5, 7, 9, 11, 12]);
const exerciseIds = new Set<string>();
const errors: string[] = [];

function fail(message: string) {
  errors.push(message);
}

function expect(condition: unknown, message: string) {
  if (!condition) fail(message);
}

for (const language of SUPPORTED_CURRICULUM_LANGUAGES) {
  const levels = CURRICULUM.filter((level) => level.language === language);
  expect(levels.length === CURRICULUM_LEVELS.length, `${language} should have ${CURRICULUM_LEVELS.length} levels, found ${levels.length}.`);

  for (const levelMeta of CURRICULUM_LEVELS) {
    const level = getCurriculumLevel(language, levelMeta.levelNumber);
    expect(Boolean(level), `${language} ${levelMeta.label} is missing from getCurriculumLevel().`);
    if (!level) continue;

    expect(level.cefrLevel === levelMeta.cefrLevel, `${language} ${levelMeta.label} has wrong CEFR band.`);
    expect(level.cefrSubLevel === levelMeta.cefrSubLevel, `${language} ${levelMeta.label} has wrong CEFR sublevel.`);
    expect(level.lessons.length >= 12, `${language} ${levelMeta.label} should contain at least 12 lessons.`);
    expect(level.levelExam.type === 'lesson_test', `${language} ${levelMeta.label} should expose a lesson_test level exam.`);

    for (const lesson of level.lessons) {
      expect(lesson.language === language, `${lesson.id} has wrong language metadata.`);
      expect(lesson.levelNumber === levelMeta.levelNumber, `${lesson.id} has wrong level number.`);
      expect(lesson.vocabulary.length >= 8, `${lesson.id} needs at least 8 vocabulary items.`);
      expect(lesson.chunks.length >= 4, `${lesson.id} needs at least 4 chunks.`);
      expect(Boolean(lesson.readingText), `${lesson.id} needs reading text.`);
      expect(lesson.exercises.length === LESSON_JOURNEY.length, `${lesson.id} should contain the full lesson journey.`);

      LESSON_JOURNEY.forEach((step, index) => {
        const exercise = lesson.exercises[index];
        expect(exercise?.skill === step.skill, `${lesson.id} exercise ${index + 1} should be ${step.skill}.`);
        expect(exercise?.type === step.defaultType, `${lesson.id} exercise ${index + 1} should use ${step.defaultType}.`);
      });

      for (const exercise of lesson.exercises) {
        validateExercise(language, levelMeta.levelNumber, exercise);
      }
    }
  }
}

for (const language of SUPPORTED_CURRICULUM_LANGUAGES) {
  for (const levelNumber of representativeLevels) {
    const level = getCurriculumLevel(language, levelNumber);
    expect(Boolean(level?.lessons[0]?.exercises.length), `Representative ${language} level ${levelNumber} should have exercises.`);
  }
}

expect(getCurriculumLevel('Spanish', 1)?.title !== getCurriculumLevel('Spanish', 2)?.title, 'Spanish levels should not silently reuse the same level object.');
expect(getCurriculumLevel('French', 11)?.cefrLevel === 'C2', 'French C2.1 should resolve correctly.');
expect(getCurriculumLevel('Italian', 12)?.cefrSubLevel === '2', 'Italian C2.2 should resolve correctly.');
expect(CURRICULUM.some((level) => level.language === 'Spanish' && JSON.stringify(level).includes('mañana')), 'Spanish curriculum should preserve ñ.');
expect(CURRICULUM.some((level) => level.language === 'French' && JSON.stringify(level).includes('français')), 'French curriculum should preserve accents.');
expect(CURRICULUM.some((level) => level.language === 'Italian' && JSON.stringify(level).includes('perché')), 'Italian curriculum should preserve accents.');

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(
  `Curriculum smoke passed: ${SUPPORTED_CURRICULUM_LANGUAGES.length} languages, ${CURRICULUM.length} levels, ${CURRICULUM.reduce(
    (sum, level) => sum + level.lessons.length,
    0,
  )} lessons, ${exerciseIds.size} unique exercises.`,
);

function validateExercise(language: CurriculumLanguage, levelNumber: number, exercise: CurriculumExercise) {
  expect(!exerciseIds.has(exercise.id), `Duplicate exercise id: ${exercise.id}`);
  exerciseIds.add(exercise.id);

  expect(exercise.content.language === language, `${exercise.id} has wrong content language.`);
  expect(exercise.content.levelNumber === levelNumber, `${exercise.id} has wrong content level.`);
  expect(exercise.content.locale === CURRICULUM_SPEECH_LOCALES[language], `${exercise.id} has wrong speech locale.`);

  if (language !== 'English') {
    expect(exercise.content.locale !== 'en-US', `${exercise.id} should not fall back to English speech locale.`);
  }

  if (choiceTypes.has(exercise.type)) {
    const choices = Array.isArray(exercise.content.choices) ? exercise.content.choices.map(String) : [];
    const correctAnswer = typeof exercise.correctAnswer === 'string' ? exercise.correctAnswer : '';
    expect(Boolean(correctAnswer), `${exercise.id} choice exercise needs an explicit correct answer.`);
    expect(choices.length >= 3, `${exercise.id} choice exercise needs at least three choices.`);
    expect(choices.some((choice) => normalize(choice) === normalize(correctAnswer)), `${exercise.id} correct answer must exist inside choices.`);
  }

  if (exercise.skill === 'reading') {
    expect(Boolean(exercise.content.readingText), `${exercise.id} reading exercise needs reading content.`);
    expect(Boolean(exercise.content.question), `${exercise.id} reading exercise needs a question.`);
  }

  if (exercise.skill === 'listening') {
    expect(Boolean(exercise.content.targetSentence), `${exercise.id} listening exercise needs target audio text.`);
    expect(Boolean(exercise.content.question), `${exercise.id} listening exercise needs a question.`);
  }

  if (exercise.skill === 'grammar') {
    const question = String(exercise.content.question ?? '');
    expect(Boolean(question), `${exercise.id} grammar exercise needs a real question.`);
    expect(normalize(question) !== normalize(String(exercise.content.grammarFocus ?? '')), `${exercise.id} grammar question should not be just the grammar focus label.`);
  }

  if (exercise.skill === 'dictation') {
    expect(Boolean(exercise.content.targetSentence), `${exercise.id} dictation exercise needs target text.`);
  }
}

function normalize(value: string) {
  return value.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}\s]/gu, '').trim();
}
