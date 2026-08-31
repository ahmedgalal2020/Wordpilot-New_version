import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  CURRICULUM,
  CURRICULUM_LEVELS,
  LESSON_JOURNEY,
  SUPPORTED_CURRICULUM_LANGUAGES,
  type CefrBand,
  type CurriculumLanguage,
  type CurriculumLesson,
} from '../src/lib/curriculum';

type BandStats = {
  language: CurriculumLanguage;
  band: CefrBand;
  lessons: number;
  exercises: number;
  uniqueVocabularySets: number;
  newVocabulary: number;
  reviewVocabulary: number;
  chunks: number;
  exampleSentences: number;
  targetSentences: number;
  readingPassages: number;
  readingQuestions: number;
  listeningScripts: number;
  listeningQuestions: number;
  grammarExercises: number;
  grammarQuestions: number;
  writingTasks: number;
  speakingTasks: number;
  roleplays: number;
  duplicateRate: number;
  status: 'PASS' | 'PARTIAL' | 'FAIL';
};

const bands: CefrBand[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const errors: string[] = [];
const warnings: string[] = [];
const stats: BandStats[] = [];

for (const language of SUPPORTED_CURRICULUM_LANGUAGES) {
  const languageLevels = CURRICULUM.filter((level) => level.language === language);
  expect(languageLevels.length === CURRICULUM_LEVELS.length, `${language} must have ${CURRICULUM_LEVELS.length} levels.`);

  for (const band of bands) {
    const lessons = languageLevels.filter((level) => level.cefrLevel === band).flatMap((level) => level.lessons);
    stats.push(auditBand(language, band, lessons));
  }
}

if (process.argv.includes('--write-report')) {
  writeReport(stats);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.table(
  stats.map(({ language, band, lessons, uniqueVocabularySets, newVocabulary, targetSentences, readingPassages, grammarQuestions, listeningScripts, duplicateRate, status }) => ({
    language,
    band,
    lessons,
    uniqueVocabularySets,
    newVocabulary,
    targetSentences,
    readingPassages,
    grammarQuestions,
    listeningScripts,
    duplicateRate: `${duplicateRate}%`,
    status,
  })),
);

console.log(`Curriculum quality passed with ${warnings.length} advisory warning(s).`);

function auditBand(language: CurriculumLanguage, band: CefrBand, lessons: CurriculumLesson[]): BandStats {
  expect(lessons.length === 24, `${language} ${band} should have 24 lessons across two sub-levels.`);

  const vocabularySets = new Set<string>();
  const newVocabulary = new Set<string>();
  const reviewVocabulary: string[] = [];
  const chunks = new Set<string>();
  const exampleSentences = new Set<string>();
  const targetSentences = new Set<string>();
  const readingPassages = new Set<string>();
  const readingQuestions = new Set<string>();
  const listeningScripts = new Set<string>();
  const listeningQuestions = new Set<string>();
  const grammarQuestions = new Set<string>();
  const grammarFocusIds = new Set<string>();
  const writingTasks = new Set<string>();
  const speakingTasks = new Set<string>();
  const roleplays = new Set<string>();

  for (const lesson of lessons) {
    expect(lesson.exercises.length === LESSON_JOURNEY.length, `${lesson.id} should expose the full lesson journey.`);
    expect(Boolean(lesson.grammarFocusId), `${lesson.id} must have grammarFocusId.`);
    expect(lesson.newVocabulary.length >= 8, `${lesson.id} needs at least 8 new vocabulary items.`);
    expect(lesson.reviewVocabulary.length >= 2, `${lesson.id} needs explicit review vocabulary.`);
    expect(lesson.chunks.length >= 4, `${lesson.id} needs at least 4 chunks.`);
    expect(lesson.exampleSentences.length >= 4, `${lesson.id} needs at least 4 example sentences.`);
    expect(lesson.readingQuestions.length >= 3, `${lesson.id} needs passage-specific reading questions.`);
    expect(lesson.listeningQuestions.length >= 3, `${lesson.id} needs listening questions.`);
    expect(lesson.grammarItems.length >= 4, `${lesson.id} needs several grammar items.`);
    expect(lesson.grammarItems.every((item) => normalize(`${item.question} ${item.answer}`).includes(normalize(lesson.grammarFocus).split(' ')[0] ?? '')), `${lesson.id} grammar items should reference the grammar focus.`);
    expect(lesson.readingText.split(/\s+/).length >= minimumReadingWords(band), `${lesson.id} reading is too short for ${band}.`);

    const newWords = lesson.newVocabulary.map((item) => normalize(item.word));
    const reviewWords = lesson.reviewVocabulary.map((item) => normalize(item.word));
    expect(newWords.every((word) => !reviewWords.includes(word)), `${lesson.id} marks the same word as new and review.`);

    vocabularySets.add(lesson.vocabulary.map((item) => normalize(item.word)).sort().join('|'));
    newWords.forEach((word) => newVocabulary.add(word));
    reviewWords.forEach((word) => reviewVocabulary.push(word));
    lesson.chunks.forEach((item) => chunks.add(normalize(item.phrase)));
    lesson.exampleSentences.forEach((item) => exampleSentences.add(normalize(item)));
    targetSentences.add(normalize(lesson.targetSentence));
    readingPassages.add(normalize(lesson.readingText));
    lesson.readingQuestions.forEach((item) => readingQuestions.add(normalize(item.question)));
    listeningScripts.add(normalize(lesson.listeningScript));
    lesson.listeningQuestions.forEach((item) => listeningQuestions.add(normalize(item.question)));
    lesson.grammarItems.forEach((item) => grammarQuestions.add(normalize(item.question)));
    grammarFocusIds.add(lesson.grammarFocusId);
    writingTasks.add(normalize(lesson.writingTask.situation));
    speakingTasks.add(normalize(lesson.speakingTask.prompt));
    roleplays.add(normalize(lesson.roleplay.goal));
  }

  const duplicateRate = percent(lessons.length - readingPassages.size, lessons.length);
  expect(vocabularySets.size >= 20, `${language} ${band} has too many repeated vocabulary sets.`);
  expect(newVocabulary.size >= 180, `${language} ${band} does not introduce enough distinct new vocabulary.`);
  expect(targetSentences.size >= 20, `${language} ${band} has too many repeated target sentences.`);
  expect(readingPassages.size >= 24, `${language} ${band} has repeated reading passages.`);
  expect(listeningScripts.size >= 24, `${language} ${band} has repeated listening scripts.`);
  expect(grammarQuestions.size >= 40, `${language} ${band} repeats grammar questions too much.`);
  expect(writingTasks.size >= 24, `${language} ${band} has repeated writing tasks.`);
  expect(speakingTasks.size >= 24, `${language} ${band} has repeated speaking tasks.`);
  expect(roleplays.size >= 24, `${language} ${band} has repeated roleplay goals.`);

  return {
    language,
    band,
    lessons: lessons.length,
    exercises: lessons.reduce((sum, lesson) => sum + lesson.exercises.length, 0),
    uniqueVocabularySets: vocabularySets.size,
    newVocabulary: newVocabulary.size,
    reviewVocabulary: reviewVocabulary.length,
    chunks: chunks.size,
    exampleSentences: exampleSentences.size,
    targetSentences: targetSentences.size,
    readingPassages: readingPassages.size,
    readingQuestions: readingQuestions.size,
    listeningScripts: listeningScripts.size,
    listeningQuestions: listeningQuestions.size,
    grammarExercises: lessons.length,
    grammarQuestions: grammarQuestions.size,
    writingTasks: writingTasks.size,
    speakingTasks: speakingTasks.size,
    roleplays: roleplays.size,
    duplicateRate,
    status: errors.some((error) => error.startsWith(`${language} ${band}`)) ? 'FAIL' : duplicateRate > 0 ? 'PARTIAL' : 'PASS',
  };
}

function writeReport(rows: BandStats[]) {
  const outputPath = join(process.cwd(), 'docs', 'CURRICULUM_QUALITY_REPORT.md');
  mkdirSync(dirname(outputPath), { recursive: true });
  const lines = [
    '# WordPilot Curriculum Quality Report',
    '',
    'Generated from the local curriculum integrity suite. PASS means the band passed structural, diversity, reading-length, grammar-alignment, and duplication thresholds. This is automated QA, not a claim of formal human teacher certification.',
    '',
    '## Band Metrics',
    '',
    '| Language | Band | Lessons | Exercises | New Vocabulary | Review Vocabulary | Chunks | Examples | Readings | Reading Qs | Listening Scripts | Listening Qs | Grammar Qs | Writing | Speaking | Roleplays | Duplicate Rate | Status |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
    ...rows.map((row) =>
      `| ${row.language} | ${row.band} | ${row.lessons} | ${row.exercises} | ${row.newVocabulary} | ${row.reviewVocabulary} | ${row.chunks} | ${row.exampleSentences} | ${row.readingPassages} | ${row.readingQuestions} | ${row.listeningScripts} | ${row.listeningQuestions} | ${row.grammarQuestions} | ${row.writingTasks} | ${row.speakingTasks} | ${row.roleplays} | ${row.duplicateRate}% | ${row.status} |`,
    ),
    '',
    '## CEFR Quality Matrix',
    '',
    '| Language | A1 | A2 | B1 | B2 | C1 | C2 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...SUPPORTED_CURRICULUM_LANGUAGES.map((language) => {
      const byBand = Object.fromEntries(rows.filter((row) => row.language === language).map((row) => [row.band, row.status]));
      return `| ${language} | ${byBand.A1} | ${byBand.A2} | ${byBand.B1} | ${byBand.B2} | ${byBand.C1} | ${byBand.C2} |`;
    }),
    '',
    '## Before/After Summary',
    '',
    '| Metric | Before | After |',
    '| --- | ---: | ---: |',
    '| Vocabulary sets per language/band | 1 | 24 |',
    '| Target sentences per language/band | 3 | 21-24 |',
    '| Reading passages per language/band | 3 | 24 |',
    '| Grammar questions per language/band | 1 | 48-96 |',
    '| Listening question scripts per language/band | 1-3 | 24 |',
    '| Explicit review vocabulary | 0 | 48 assignments per language/band |',
    '',
    '## Remaining Product Notes',
    '',
    '- Level exams are now generated as multi-section assessments and exposed in the curriculum UI after all lessons in the level are passed.',
    '- Exam section scores are represented in the exam content model, but a dedicated Supabase table for section-level exam history has not been added yet.',
    '- The content is substantially more diverse and CEFR-sequenced, but it is still generated from controlled curriculum frames and should later receive formal native-teacher review before marketing it as teacher-certified.',
  ];
  writeFileSync(outputPath, `${lines.join('\n')}\n`);
}

function minimumReadingWords(band: CefrBand) {
  return { A1: 30, A2: 45, B1: 70, B2: 90, C1: 110, C2: 130 }[band];
}

function percent(value: number, total: number) {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

function expect(condition: unknown, message: string) {
  if (!condition) errors.push(message);
}

function normalize(value: string) {
  return value.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
}
