import { CURRICULUM, SUPPORTED_CURRICULUM_LANGUAGES, type CefrBand, type CurriculumLanguage, type CurriculumLesson } from '../src/lib/curriculum';

type BandDepthStats = {
  language: CurriculumLanguage;
  band: CefrBand;
  lessons: number;
  uniqueVocabulary: number;
  uniqueChunks: number;
  uniqueReadings: number;
  uniqueListening: number;
  meanVocabularyOverlap: number;
  maxVocabularyOverlap: number;
  averageReadingWords: number;
  averageListeningWords: number;
  advancedMarkerHits: number;
  beginnerChunkHits: number;
  status: 'PASS' | 'FAIL';
};

const bands: CefrBand[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const errors: string[] = [];
const rows: BandDepthStats[] = [];

for (const language of SUPPORTED_CURRICULUM_LANGUAGES) {
  for (const band of bands) {
    const lessons = CURRICULUM.filter((level) => level.language === language && level.cefrLevel === band).flatMap((level) => level.lessons);
    rows.push(measureBand(language, band, lessons));
  }
}

for (const language of SUPPORTED_CURRICULUM_LANGUAGES) {
  const languageRows = rows.filter((row) => row.language === language);
  const totalVocabulary = new Set(
    CURRICULUM.filter((level) => level.language === language)
      .flatMap((level) => level.lessons)
      .flatMap((lesson) => lesson.newVocabulary.map((item) => normalizeLexeme(item.word))),
  ).size;
  const a1Length = languageRows.find((row) => row.band === 'A1')?.averageReadingWords ?? 0;
  const c2Length = languageRows.find((row) => row.band === 'C2')?.averageReadingWords ?? 0;
  expect(totalVocabulary >= 220, `${language} exposes only ${totalVocabulary} unique lexical items; expected at least 220 after the depth pass.`);
  expect(c2Length >= a1Length * 2, `${language} reading length does not show enough A1→C2 growth (${a1Length} -> ${c2Length}).`);
}

if (process.argv.includes('--write-report')) {
  writeReport(rows);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.table(
  rows.map(({ language, band, lessons, uniqueVocabulary, uniqueChunks, meanVocabularyOverlap, maxVocabularyOverlap, averageReadingWords, averageListeningWords, advancedMarkerHits, beginnerChunkHits, status }) => ({
    language,
    band,
    lessons,
    uniqueVocabulary,
    uniqueChunks,
    meanVocabularyOverlap: `${meanVocabularyOverlap}%`,
    maxVocabularyOverlap: `${maxVocabularyOverlap}%`,
    avgReading: averageReadingWords,
    avgListening: averageListeningWords,
    advancedMarkerHits,
    beginnerChunkHits,
    status,
  })),
);
console.log('Curriculum diversity/depth audit passed.');

function measureBand(language: CurriculumLanguage, band: CefrBand, lessons: CurriculumLesson[]): BandDepthStats {
  const vocabularySets = lessons.map((lesson) => new Set(lesson.newVocabulary.map((item) => normalizeLexeme(item.word))));
  const pairwise = pairwiseJaccard(vocabularySets);
  const uniqueVocabulary = new Set(vocabularySets.flatMap((set) => [...set])).size;
  const uniqueChunks = new Set(lessons.flatMap((lesson) => lesson.chunks.map((chunk) => normalizeText(chunk.phrase)))).size;
  const uniqueReadings = new Set(lessons.map((lesson) => normalizeFrame(lesson.readingText))).size;
  const uniqueListening = new Set(lessons.map((lesson) => normalizeFrame(lesson.listeningScript))).size;
  const averageReadingWords = average(lessons.map((lesson) => wordCount(lesson.readingText)));
  const averageListeningWords = average(lessons.map((lesson) => wordCount(lesson.listeningScript)));
  const advancedMarkerHits = lessons.reduce((sum, lesson) => sum + countAdvancedMarkers(lesson), 0);
  const beginnerChunkHits = lessons.reduce((sum, lesson) => sum + countBeginnerChunks(lesson), 0);

  expect(lessons.length === 24, `${language} ${band} expected 24 lessons, found ${lessons.length}.`);
  expect(uniqueVocabulary >= 35, `${language} ${band} has weak vocabulary coverage (${uniqueVocabulary}).`);
  expect(uniqueChunks >= (band === 'A1' ? 4 : 6), `${language} ${band} has weak chunk coverage (${uniqueChunks}).`);
  expect(uniqueReadings === lessons.length, `${language} ${band} has repeated reading frames (${uniqueReadings}/${lessons.length}).`);
  expect(uniqueListening === lessons.length, `${language} ${band} has repeated listening frames (${uniqueListening}/${lessons.length}).`);
  expect(pairwise.max <= 80, `${language} ${band} has excessive max vocabulary overlap (${pairwise.max}%).`);
  expect(pairwise.mean <= 50, `${language} ${band} has excessive mean vocabulary overlap (${pairwise.mean}%).`);
  if (band === 'C1' || band === 'C2') {
    expect(advancedMarkerHits >= lessons.length * 2, `${language} ${band} has too few advanced discourse markers (${advancedMarkerHits}).`);
    expect(beginnerChunkHits <= 2, `${language} ${band} still depends on beginner chunks (${beginnerChunkHits} hits).`);
  }

  const status =
    lessons.length === 24 &&
    uniqueVocabulary >= 35 &&
    uniqueChunks >= (band === 'A1' ? 4 : 6) &&
    uniqueReadings === lessons.length &&
    uniqueListening === lessons.length &&
    pairwise.max <= 80 &&
    pairwise.mean <= 50 &&
    (!(band === 'C1' || band === 'C2') || (advancedMarkerHits >= lessons.length * 2 && beginnerChunkHits <= 2))
      ? 'PASS'
      : 'FAIL';

  return {
    language,
    band,
    lessons: lessons.length,
    uniqueVocabulary,
    uniqueChunks,
    uniqueReadings,
    uniqueListening,
    meanVocabularyOverlap: pairwise.mean,
    maxVocabularyOverlap: pairwise.max,
    averageReadingWords,
    averageListeningWords,
    advancedMarkerHits,
    beginnerChunkHits,
    status,
  };
}

function pairwiseJaccard(sets: Array<Set<string>>) {
  const scores: number[] = [];
  for (let left = 0; left < sets.length; left += 1) {
    for (let right = left + 1; right < sets.length; right += 1) {
      const intersection = [...sets[left]].filter((item) => sets[right].has(item)).length;
      const union = new Set([...sets[left], ...sets[right]]).size;
      scores.push(union === 0 ? 0 : Math.round((intersection / union) * 100));
    }
  }
  return { mean: average(scores), max: Math.max(...scores, 0) };
}

function normalizeLexeme(value: string) {
  return normalizeText(value)
    .replace(/^(the|a|an|der|die|das|el|la|los|las|il|lo|l|le|les|un|una|une)\s+/, '')
    .replace(/[’']/g, '');
}

function normalizeFrame(value: string) {
  return normalizeText(value)
    .replace(/"[^"]+"/g, '"x"')
    .replace(/\b(a1|a2|b1|b2|c1|c2)\b/g, 'level')
    .replace(/\b\d+\b/g, 'n')
    .replace(/\b(front desk|reception|station|school|cafe|shop|hotel|clinic|meeting|panel)\b/g, 'place');
}

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}"\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordCount(value: string) {
  return value.split(/\s+/).filter(Boolean).length;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function countAdvancedMarkers(lesson: CurriculumLesson) {
  const text = normalizeText([lesson.readingText, lesson.listeningScript, lesson.targetSentence, ...lesson.chunks.map((chunk) => chunk.phrase)].join(' '));
  return [
    'register',
    'rhetor',
    'implicit',
    'implication',
    'subtext',
    'ambigu',
    'irony',
    'understatement',
    'stance',
    'nuance',
    'concession',
    'premise',
    'objection',
    'mediation',
    'synthesis',
    'deutung',
    'implikation',
    'mehrdeutigkeit',
    'rhetorik',
    'ironie',
    'haltung',
    'zugestandnis',
    'einwand',
    'vermittlung',
    'subtexto',
    'retorica',
    'ambiguedad',
    'implicacion',
    'encuadre',
    'postura',
    'concesion',
    'objecion',
    'matiz',
    'sottotesto',
    'ambiguita',
    'ironia',
    'implicazione',
    'postura',
    'concessione',
    'obiezione',
    'sfumatura',
    'mediazione',
    'implicite',
    'sous texte',
    'ambiguite',
    'ironie',
    'cadrage',
    'posture',
    'concession',
    'objection',
    'mediation',
  ].filter((marker) => text.includes(marker)).length;
}

function countBeginnerChunks(lesson: CurriculumLesson) {
  const text = normalizeText(lesson.chunks.map((chunk) => chunk.phrase).join(' '));
  return [
    'could you repeat',
    'i would like',
    'that works for me',
    'konnten sie das bitte wiederholen',
    'ich hatte gern',
    'das passt fur mich',
    'puedes repetirlo',
    'me gustaria',
    'me viene bien',
    'puo ripetere',
    'vorrei',
    'per me va bene',
    'vous pouvez repeter',
    'je voudrais',
    'ca me convient',
  ].filter((phrase) => text.includes(phrase)).length;
}

function expect(condition: boolean, message: string) {
  if (!condition) errors.push(message);
}

function writeReport(stats: BandDepthStats[]) {
  const lines = [
    '# Curriculum Diversity Depth Report',
    '',
    '| Language | Band | Lessons | Unique Vocab | Unique Chunks | Mean Vocab Overlap | Max Vocab Overlap | Avg Reading Words | Avg Listening Words | Advanced Markers | Beginner Chunk Hits | Status |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
    ...stats.map((row) =>
      `| ${row.language} | ${row.band} | ${row.lessons} | ${row.uniqueVocabulary} | ${row.uniqueChunks} | ${row.meanVocabularyOverlap}% | ${row.maxVocabularyOverlap}% | ${row.averageReadingWords} | ${row.averageListeningWords} | ${row.advancedMarkerHits} | ${row.beginnerChunkHits} | ${row.status} |`,
    ),
    '',
  ];
  console.log(lines.join('\n'));
}
