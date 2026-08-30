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
  correctAnswer?: string | string[] | Record<string, unknown>;
  acceptableAnswers?: string[];
  scoringRubric: ScoringRubric;
  minScoreToPass: number;
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
  targetSentence: string;
  readingText: string;
  vocabulary: CurriculumVocabularyItem[];
  chunks: CurriculumChunk[];
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

type LessonSeed = {
  theme: string;
  objective: string;
  canDo: string;
  grammarFocus: string;
  vocabulary: CurriculumVocabularyItem[];
  chunks: CurriculumChunk[];
  pronunciation: string;
  targetSentence: string;
  readingText: string;
  readingQuestion: ChoiceQuestion;
  listeningQuestion: ChoiceQuestion;
  grammarQuestion: ChoiceQuestion;
  writingTask: string;
  speakingPrompt: string;
  roleplayPrompt: string;
};

type ChoiceQuestion = {
  question: string;
  answer: string;
  choices: string[];
};

type LevelProfile = {
  levelNumber: number;
  cefrLevel: CefrBand;
  cefrSubLevel: CefrSubLevel;
  label: string;
  intensity: 'foundation' | 'survival' | 'independent' | 'upper' | 'advanced' | 'mastery';
};

type LanguagePack = {
  nativeName: string;
  speechLocale: string;
  fallbackTranslationLabel: string;
  themes: Record<number, string[]>;
  grammar: Record<number, string[]>;
  pronunciation: Record<CefrBand, string>;
  words: Record<CefrBand, Array<[string, string, string]>>;
  chunks: Record<CefrBand, Array<[string, string, string]>>;
  sentences: Record<CefrBand, string[]>;
  readings: Record<CefrBand, string[]>;
  readingQuestions: Record<CefrBand, ChoiceQuestion[]>;
  listeningQuestions: Record<CefrBand, ChoiceQuestion[]>;
  grammarQuestions: Record<CefrBand, ChoiceQuestion[]>;
  objective: (theme: string, profile: LevelProfile) => string;
  canDo: (theme: string, profile: LevelProfile) => string;
  writingTask: (theme: string, profile: LevelProfile) => string;
  speakingPrompt: (theme: string, profile: LevelProfile) => string;
  roleplayPrompt: (theme: string, profile: LevelProfile) => string;
  instruction: (skill: CurriculumSkill, seed: LessonSeed) => string;
};

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

export const LESSON_JOURNEY: Array<{ order: number; skill: CurriculumSkill; title: string; defaultType: ExerciseType }> = [
  { order: 1, skill: 'vocabulary', title: 'Vocabulary & Chunks', defaultType: 'vocabulary_match' },
  { order: 2, skill: 'listening', title: 'Listening Comprehension', defaultType: 'listen_for_detail' },
  { order: 3, skill: 'pronunciation', title: 'Pronunciation', defaultType: 'pronunciation_repeat' },
  { order: 4, skill: 'sentence_building', title: 'Sentence Building', defaultType: 'sentence_order' },
  { order: 5, skill: 'grammar', title: 'Grammar in Context', defaultType: 'grammar_choice' },
  { order: 6, skill: 'dictation', title: 'Dictation', defaultType: 'dictation_sentence' },
  { order: 7, skill: 'reading', title: 'Reading Comprehension', defaultType: 'reading_detail' },
  { order: 8, skill: 'speaking', title: 'Speaking', defaultType: 'guided_speaking' },
  { order: 9, skill: 'writing', title: 'Writing', defaultType: 'guided_writing' },
  { order: 10, skill: 'conversation', title: 'Roleplay / Conversation', defaultType: 'roleplay' },
  { order: 11, skill: 'test', title: 'Lesson Test', defaultType: 'lesson_test' },
];

const LEVEL_PROFILES: LevelProfile[] = CURRICULUM_LEVELS.map((level) => ({
  ...level,
  intensity:
    level.cefrLevel === 'A1'
      ? level.levelNumber === 1
        ? 'foundation'
        : 'survival'
      : level.cefrLevel === 'A2'
        ? 'survival'
        : level.cefrLevel === 'B1'
          ? 'independent'
          : level.cefrLevel === 'B2'
            ? 'upper'
            : level.cefrLevel === 'C1'
              ? 'advanced'
              : 'mastery',
}));

const COMMON_THEMES = {
  1: ['Introductions', 'Numbers', 'Family', 'Daily routine', 'Food', 'City', 'Home', 'Shopping', 'Weather', 'Transport', 'Health', 'Review'],
  2: ['Plans', 'Appointments', 'Travel', 'Work', 'Digital life', 'Services', 'Comparisons', 'Stories', 'Rules', 'Opinions', 'Emails', 'Checkpoint'],
  3: ['Neighbourhood', 'Schedules', 'Invitations', 'Past weekend', 'At the doctor', 'Directions', 'Requests', 'Preferences', 'Small problems', 'Travel changes', 'Short messages', 'A2 review'],
  4: ['Workday', 'Housing', 'Customer service', 'Public offices', 'Simple complaints', 'Local events', 'Travel stories', 'Advice', 'Learning habits', 'Comparing options', 'Polite calls', 'A2 checkpoint'],
  5: ['Experiences', 'Problem solving', 'Study and work', 'Community', 'Personal goals', 'Culture', 'Health choices', 'Environment', 'Money and planning', 'Technology habits', 'Narratives', 'B1 review'],
  6: ['Work communication', 'Opinions', 'News stories', 'Service issues', 'Project planning', 'Education', 'Travel incidents', 'Social decisions', 'Instructions', 'Feedback', 'Recommendations', 'B1 checkpoint'],
  7: ['Argument structure', 'Academic routines', 'Workplace decisions', 'Data and trends', 'Media literacy', 'Policy and society', 'Research summaries', 'Customer cases', 'Professional emails', 'Presentations', 'Balanced opinions', 'B2 review'],
  8: ['Negotiation', 'Detailed reports', 'Risk and tradeoffs', 'Intercultural work', 'Sustainability', 'Career development', 'Complex services', 'Critical reading', 'Long-form listening', 'Formal proposals', 'Debate', 'B2 checkpoint'],
  9: ['Nuance and register', 'Strategic briefings', 'Academic synthesis', 'Professional disagreement', 'Implicit meaning', 'Editorial style', 'Stakeholder language', 'Precise reformulation', 'Complex interviews', 'Risk framing', 'Advanced correspondence', 'C1 review'],
  10: ['Rhetorical control', 'Policy analysis', 'Specialist vocabulary', 'Literary tone', 'Negotiating ambiguity', 'Executive summaries', 'Academic critique', 'Style shifting', 'Cultural references', 'Dense lectures', 'Persuasive writing', 'C1 checkpoint'],
  11: ['Subtext', 'Idiomatic control', 'Editorial argument', 'Expert debate', 'Stylistic compression', 'Irony and stance', 'Highly formal register', 'Fast natural speech', 'Legal and ethical nuance', 'Discourse strategy', 'Micro-editing', 'C2 review'],
  12: ['Near-native synthesis', 'Specialist discourse', 'Literary argument', 'Diplomatic language', 'Public rhetoric', 'Implicit criticism', 'Precision under pressure', 'Register mastery', 'Long interviews', 'Comparative critique', 'Final portfolio', 'C2 mastery exam'],
} satisfies Record<number, string[]>;

const LANGUAGE_THEMES: Record<Exclude<CurriculumLanguage, 'English'>, Record<number, string[]>> = {
  German: {
    1: ['Vorstellungen', 'Zahlen', 'Familie', 'Tagesroutine', 'Essen', 'Stadt', 'Zuhause', 'Einkaufen', 'Wetter', 'Transport', 'Gesundheit', 'Wiederholung'],
    2: ['Pläne', 'Termine', 'Reisen', 'Arbeit', 'Digitales Leben', 'Ämter', 'Vergleiche', 'Geschichten', 'Regeln', 'Meinungen', 'E-Mails', 'Kontrollpunkt'],
    3: ['Nachbarschaft', 'Tagespläne', 'Einladungen', 'Letztes Wochenende', 'Beim Arzt', 'Wegbeschreibung', 'Bitten', 'Vorlieben', 'Kleine Probleme', 'Reiseänderungen', 'Kurze Nachrichten', 'A2-Wiederholung'],
    4: ['Arbeitstag', 'Wohnen', 'Kundenservice', 'Behördengänge', 'Beschwerden', 'Lokale Veranstaltungen', 'Reiseerlebnisse', 'Ratschläge', 'Lerngewohnheiten', 'Optionen vergleichen', 'Höfliche Telefonate', 'A2-Kontrollpunkt'],
    5: ['Erfahrungen', 'Probleme lösen', 'Studium und Beruf', 'Gemeinschaft', 'Persönliche Ziele', 'Kultur', 'Gesundheitliche Entscheidungen', 'Umwelt', 'Budgetplanung', 'Technikgewohnheiten', 'Erzählungen', 'B1-Wiederholung'],
    6: ['Berufliche Kommunikation', 'Meinungen', 'Nachrichten', 'Serviceprobleme', 'Projektplanung', 'Bildung', 'Reisevorfälle', 'Soziale Entscheidungen', 'Anleitungen', 'Feedback', 'Empfehlungen', 'B1-Kontrollpunkt'],
    7: ['Argumentstruktur', 'Akademische Routinen', 'Entscheidungen im Beruf', 'Daten und Trends', 'Medienkompetenz', 'Politik und Gesellschaft', 'Forschungszusammenfassungen', 'Kundenfälle', 'Formelle E-Mails', 'Präsentationen', 'Ausgewogene Meinungen', 'B2-Wiederholung'],
    8: ['Verhandlung', 'Detaillierte Berichte', 'Risiken und Abwägungen', 'Interkulturelle Arbeit', 'Nachhaltigkeit', 'Karriereentwicklung', 'Komplexe Dienstleistungen', 'Kritisches Lesen', 'Längeres Hörverstehen', 'Formelle Vorschläge', 'Debatte', 'B2-Kontrollpunkt'],
    9: ['Nuance und Register', 'Strategische Briefings', 'Akademische Synthese', 'Professioneller Widerspruch', 'Implizite Bedeutung', 'Redaktioneller Stil', 'Stakeholder-Sprache', 'Präzise Umformulierung', 'Komplexe Interviews', 'Risikodarstellung', 'Anspruchsvolle Korrespondenz', 'C1-Wiederholung'],
    10: ['Rhetorische Kontrolle', 'Politikanalyse', 'Fachwortschatz', 'Literarischer Ton', 'Mehrdeutigkeit verhandeln', 'Executive Summaries', 'Akademische Kritik', 'Stilwechsel', 'Kulturelle Bezüge', 'Dichte Vorträge', 'Überzeugendes Schreiben', 'C1-Kontrollpunkt'],
    11: ['Subtext', 'Idiomatische Kontrolle', 'Redaktionelles Argument', 'Expertendebatte', 'Stilistische Verdichtung', 'Ironie und Haltung', 'Hochformelles Register', 'Schnelle natürliche Sprache', 'Rechtliche und ethische Nuance', 'Diskursstrategie', 'Mikro-Editing', 'C2-Wiederholung'],
    12: ['Nahezu muttersprachliche Synthese', 'Fachdiskurs', 'Literarisches Argument', 'Diplomatische Sprache', 'Öffentliche Rhetorik', 'Implizite Kritik', 'Präzision unter Druck', 'Registerbeherrschung', 'Lange Interviews', 'Vergleichende Kritik', 'Abschlussportfolio', 'C2-Meisterprüfung'],
  },
  Spanish: localizeThemes('Spanish'),
  Italian: localizeThemes('Italian'),
  French: localizeThemes('French'),
};

const BASE_GRAMMAR: Record<number, string[]> = {
  1: ['be and subject pronouns', 'numbers and plural nouns', 'possessive adjectives', 'simple present routines', 'articles with countable nouns', 'where questions', 'prepositions of place', 'this and that', 'weather adjectives', 'time expressions', 'body words with have', 'A1.1 review'],
  2: ['want to and future time', 'days with at and on', 'past simple regular verbs', 'third-person present', 'imperatives', 'polite questions', 'comparatives', 'past simple irregular verbs', 'must and can', 'because clauses', 'email openings and closings', 'A1 review'],
  3: ['past time markers', 'object pronouns', 'requests with could', 'because and so', 'prepositions of movement', 'frequency adverbs', 'basic conditionals', 'preference verbs', 'problem descriptions', 'travel connectors', 'message sequencing', 'A2.1 review'],
  4: ['present perfect introduction', 'relative time phrases', 'polite complaint structures', 'modal verbs for obligation', 'comparative explanations', 'subordinate clauses', 'reported simple information', 'advice forms', 'habit descriptions', 'contrast connectors', 'phone-call formulas', 'A2 review'],
  5: ['narrative tenses', 'linking devices', 'opinion clauses', 'relative clauses', 'cause and effect', 'contrast and concession', 'reported experience', 'problem-solution structure', 'quantifiers', 'technology collocations', 'paragraph cohesion', 'B1.1 review'],
  6: ['passive introduction', 'formal requests', 'indirect questions', 'conditionals', 'purpose clauses', 'reported speech', 'sequence and emphasis', 'recommendation language', 'instructions and warnings', 'feedback hedging', 'summary structure', 'B1 review'],
  7: ['thesis and support', 'nominalisation', 'complex noun phrases', 'trend language', 'stance markers', 'concession clauses', 'source attribution', 'case analysis', 'formal register', 'presentation signposting', 'balanced argument', 'B2.1 review'],
  8: ['negotiation language', 'embedded clauses', 'risk framing', 'contrastive structures', 'impersonal style', 'career register', 'service escalation', 'critical evaluation', 'lecture note structure', 'proposal language', 'debate rebuttal', 'B2 review'],
  9: ['register shifts', 'hedging and precision', 'synthesis clauses', 'professional disagreement', 'implicit meaning', 'editorial cohesion', 'stakeholder framing', 'reformulation', 'interview discourse', 'risk qualification', 'advanced correspondence', 'C1.1 review'],
  10: ['rhetorical emphasis', 'policy cause and effect', 'specialist collocation', 'literary style', 'ambiguity management', 'executive concision', 'critical appraisal', 'style shifting', 'cultural reference', 'lecture synthesis', 'persuasive structure', 'C1 review'],
  11: ['idiomatic nuance', 'subtext control', 'compressed argument', 'expert stance', 'ellipsis and implication', 'irony markers', 'formal precision', 'fast-speech reconstruction', 'ethical qualification', 'discourse strategy', 'micro-editing', 'C2.1 review'],
  12: ['near-native synthesis', 'specialist register', 'stylistic imitation', 'diplomatic ambiguity', 'public rhetoric', 'implicit criticism', 'precision under time pressure', 'register mastery', 'long-form inference', 'comparative critique', 'portfolio editing', 'C2 mastery review'],
};

const LANGUAGE_PACKS: Record<CurriculumLanguage, LanguagePack> = {
  English: buildEnglishPack(),
  German: buildGermanPack(),
  Spanish: buildRomancePack('Spanish'),
  Italian: buildRomancePack('Italian'),
  French: buildRomancePack('French'),
};

export const CURRICULUM: CurriculumLevel[] = SUPPORTED_CURRICULUM_LANGUAGES.flatMap((language) =>
  CURRICULUM_LEVELS.map((level) => buildLevel(level.levelNumber, language)),
);

export function getCurriculumLevel(language: CurriculumLanguage, levelNumber: number) {
  return CURRICULUM.find((level) => level.language === language && level.levelNumber === levelNumber) ?? null;
}

export function getCurriculumLesson(language: CurriculumLanguage, lessonId: string) {
  return CURRICULUM.flatMap((level) => level.lessons).find((lesson) => lesson.language === language && lesson.id === lessonId) ?? null;
}

export function getLessonStatus(lesson: CurriculumLesson, previousLessonPassed: boolean, skillScores: SkillScores): LessonStatus {
  if (!previousLessonPassed && lesson.levelNumber > 1) {
    return 'locked';
  }

  const scores = Object.values(skillScores).filter((score): score is number => typeof score === 'number');
  if (scores.length === 0) {
    return 'available';
  }

  const average = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  const weakSkill = scores.some((score) => score < lesson.mastery.minSkillScore);
  if (average >= lesson.mastery.minOverallScore && !weakSkill) {
    return 'passed';
  }

  return weakSkill ? 'needs_review' : 'in_progress';
}

export function buildReviewQueueItems(lesson: CurriculumLesson, skillScores: SkillScores) {
  return Object.entries(skillScores)
    .filter(([, score]) => typeof score === 'number' && score < lesson.mastery.minSkillScore)
    .map(([skill, score]) => ({
      id: `${lesson.id}-${skill}-review`,
      lessonId: lesson.id,
      language: lesson.language,
      levelNumber: lesson.levelNumber,
      skill: skill as CurriculumSkill,
      score: score ?? 0,
      reason: `${skill.replace(/_/g, ' ')} is below the ${lesson.mastery.minSkillScore}% skill mastery floor.`,
    }));
}

function buildLevel(levelNumber: number, language: CurriculumLanguage): CurriculumLevel {
  const meta = CURRICULUM_LEVELS[levelNumber - 1];
  const profile = LEVEL_PROFILES[levelNumber - 1];
  const pack = LANGUAGE_PACKS[language];
  const lessons = buildSeeds(language, profile).map((seed, index) =>
    buildLesson(language, meta.levelNumber, meta.cefrLevel, meta.cefrSubLevel, seed, index + 1),
  );
  const examTargetSentence = String(lessons[lessons.length - 1]?.exercises[0]?.content.targetSentence ?? '');

  return {
    levelNumber,
    cefrLevel: meta.cefrLevel,
    cefrSubLevel: meta.cefrSubLevel,
    language,
    title: `${language} ${meta.label}`,
    lessons,
    levelExam: {
      id: `${slug(language)}-${meta.label.toLowerCase()}-level-exam`,
      type: 'lesson_test',
      skill: 'test',
      title: `${meta.label} Level Exam`,
      instruction: `Complete a mixed ${meta.label} exam covering comprehension, speaking, writing, and dictation.`,
      content: {
        language,
        locale: pack.speechLocale,
        levelLabel: meta.label,
        lessonIds: lessons.map((lesson) => lesson.id),
        sections: ['listening', 'reading', 'speaking', 'writing', 'dictation'],
        prompt: lessons[lessons.length - 1]?.canDo ?? `${language} ${meta.label} exam`,
        targetSentence: examTargetSentence,
      },
      correctAnswer: examTargetSentence,
      acceptableAnswers: lessons.flatMap((lesson) => lesson.vocabulary.slice(0, 2).map((item) => item.word)).slice(0, 8),
      scoringRubric: { taskCompletion: 25, grammar: 20, vocabulary: 20, comprehension: 20, accuracy: 15 },
      minScoreToPass: 75,
    },
  };
}

function buildSeeds(language: CurriculumLanguage, profile: LevelProfile): LessonSeed[] {
  const pack = LANGUAGE_PACKS[language];
  const themes = pack.themes[profile.levelNumber] ?? COMMON_THEMES[profile.levelNumber];
  const grammar = pack.grammar[profile.levelNumber] ?? BASE_GRAMMAR[profile.levelNumber];
  const words = pack.words[profile.cefrLevel];
  const chunks = pack.chunks[profile.cefrLevel];
  const sentences = pack.sentences[profile.cefrLevel];
  const readings = pack.readings[profile.cefrLevel];
  const readingQuestions = pack.readingQuestions[profile.cefrLevel];
  const listeningQuestions = pack.listeningQuestions[profile.cefrLevel];
  const grammarQuestions = pack.grammarQuestions[profile.cefrLevel];

  return themes.map((theme, index) => ({
    theme,
    objective: pack.objective(theme, profile),
    canDo: pack.canDo(theme, profile),
    grammarFocus: grammar[index % grammar.length],
    vocabulary: rotate(words, index * 4).slice(0, 8).map(([word, translation, example]) => ({
      word,
      translation,
      example,
      audioText: word,
    })),
    chunks: rotate(chunks, index * 2).slice(0, 4).map(([phrase, meaning, example]) => ({ phrase, meaning, example })),
    pronunciation: pack.pronunciation[profile.cefrLevel],
    targetSentence: sentences[index % sentences.length],
    readingText: readings[index % readings.length],
    readingQuestion: readingQuestions[index % readingQuestions.length],
    listeningQuestion: listeningQuestions[index % listeningQuestions.length],
    grammarQuestion: grammarQuestions[index % grammarQuestions.length],
    writingTask: pack.writingTask(theme, profile),
    speakingPrompt: pack.speakingPrompt(theme, profile),
    roleplayPrompt: pack.roleplayPrompt(theme, profile),
  }));
}

function buildLesson(
  language: CurriculumLanguage,
  levelNumber: number,
  cefrLevel: CefrBand,
  cefrSubLevel: CefrSubLevel,
  seed: LessonSeed,
  lessonNumber: number,
): CurriculumLesson {
  const baseId = `${slug(language)}-level-${levelNumber}-lesson-${lessonNumber}`;

  return {
    id: baseId,
    levelNumber,
    cefrLevel,
    cefrSubLevel,
    language,
    title: `${lessonNumber}. ${seed.theme}`,
    theme: seed.theme,
    objective: seed.objective,
    canDo: seed.canDo,
    grammarFocus: seed.grammarFocus,
    targetSentence: seed.targetSentence,
    readingText: seed.readingText,
    vocabulary: seed.vocabulary,
    chunks: seed.chunks,
    exercises: LESSON_JOURNEY.map((step) => buildExercise(baseId, seed, step, language, cefrLevel, levelNumber)),
    mastery: {
      minOverallScore: 75,
      minSkillScore: 60,
      vocabularyRequired: 80,
    },
  };
}

function buildExercise(
  baseId: string,
  seed: LessonSeed,
  step: (typeof LESSON_JOURNEY)[number],
  language: CurriculumLanguage,
  cefrLevel: CefrBand,
  levelNumber: number,
): CurriculumExercise {
  const pack = LANGUAGE_PACKS[language];
  const question = getQuestionForStep(step.skill, seed);
  const content: Record<string, unknown> = {
    language,
    locale: pack.speechLocale,
    cefrLevel,
    levelNumber,
    theme: seed.theme,
    prompt: getPromptForStep(step.skill, seed),
    question: question?.question,
    choices: question?.choices,
    targetSentence: seed.targetSentence,
    readingText: seed.readingText,
    vocabulary: seed.vocabulary.map((item) => item.word),
    vocabularyItems: seed.vocabulary,
    chunks: seed.chunks.map((item) => item.phrase),
    chunkItems: seed.chunks,
    pronunciation: seed.pronunciation,
    grammarFocus: seed.grammarFocus,
    orderTokens: tokenizeSentence(seed.targetSentence),
  };

  return {
    id: `${baseId}-${step.order}-${step.defaultType}`,
    type: step.defaultType,
    skill: step.skill,
    title: step.title,
    instruction: pack.instruction(step.skill, seed),
    content,
    correctAnswer: getCorrectAnswer(step.skill, seed),
    acceptableAnswers: step.skill === 'writing' || step.skill === 'speaking' ? seed.vocabulary.slice(0, 5).map((item) => item.word) : undefined,
    scoringRubric: getRubric(step.skill),
    minScoreToPass: step.skill === 'test' ? 75 : 60,
  };
}

function getQuestionForStep(skill: CurriculumSkill, seed: LessonSeed) {
  if (skill === 'vocabulary') {
    const correct = `${seed.vocabulary[0].word} = ${seed.vocabulary[0].translation}`;
    const choices = [
      correct,
      `${seed.vocabulary[1].word} = ${seed.vocabulary[2].translation}`,
      `${seed.vocabulary[2].word} = ${seed.vocabulary[1].translation}`,
      `${seed.vocabulary[3].word} = ${seed.vocabulary[4].translation}`,
    ];
    return { question: `Choose the correct meaning for "${seed.vocabulary[0].word}".`, answer: correct, choices };
  }

  if (skill === 'listening') return seed.listeningQuestion;
  if (skill === 'grammar') return seed.grammarQuestion;
  if (skill === 'reading') return seed.readingQuestion;
  return null;
}

function getPromptForStep(skill: CurriculumSkill, seed: LessonSeed) {
  if (skill === 'listening') return seed.listeningQuestion.question;
  if (skill === 'grammar') return seed.grammarQuestion.question;
  if (skill === 'reading') return `${seed.readingText}\n\n${seed.readingQuestion.question}`;
  if (skill === 'writing') return seed.writingTask;
  if (skill === 'speaking') return seed.speakingPrompt;
  if (skill === 'conversation') return seed.roleplayPrompt;
  return seed.canDo;
}

function getCorrectAnswer(skill: CurriculumSkill, seed: LessonSeed) {
  if (skill === 'sentence_building') return seed.targetSentence;
  if (skill === 'vocabulary') return getQuestionForStep('vocabulary', seed)?.answer;
  if (skill === 'listening') return seed.listeningQuestion.answer;
  if (skill === 'grammar') return seed.grammarQuestion.answer;
  if (skill === 'dictation') return seed.targetSentence;
  if (skill === 'reading') return seed.readingQuestion.answer;
  if (skill === 'test') return seed.targetSentence;
  return undefined;
}

function getRubric(skill: CurriculumSkill): ScoringRubric {
  if (skill === 'writing') return { taskCompletion: 25, grammar: 20, vocabulary: 20, coherence: 15, spelling: 10, cefrAppropriateness: 10 };
  if (skill === 'speaking' || skill === 'conversation' || skill === 'pronunciation') return { pronunciation: 30, fluency: 20, grammar: 15, vocabulary: 15, taskCompletion: 20 };
  if (skill === 'dictation') return { accuracy: 100 };
  if (skill === 'reading' || skill === 'listening') return { comprehension: 60, vocabulary: 20, taskCompletion: 20 };
  return { taskCompletion: 40, grammar: 20, vocabulary: 20, accuracy: 20 };
}

function buildEnglishPack(): LanguagePack {
  return {
    nativeName: 'English',
    speechLocale: CURRICULUM_SPEECH_LOCALES.English,
    fallbackTranslationLabel: 'English',
    themes: COMMON_THEMES,
    grammar: BASE_GRAMMAR,
    pronunciation: {
      A1: 'word stress and clear final consonants',
      A2: 'sentence stress, contractions, and linking',
      B1: 'connected speech and natural pauses',
      B2: 'intonation in explanations and arguments',
      C1: 'register, emphasis, and nuanced stress',
      C2: 'cadence, implication, and near-native rhythm',
    },
    words: buildWords('English'),
    chunks: buildChunks('English'),
    sentences: buildSentences('English'),
    readings: buildReadings('English'),
    readingQuestions: buildReadingQuestions('English'),
    listeningQuestions: buildListeningQuestions('English'),
    grammarQuestions: buildGrammarQuestions('English'),
    objective: (theme, profile) => `build ${profile.label} control for ${theme.toLowerCase()} with accurate vocabulary and sentence structure.`,
    canDo: (theme, profile) => `I can handle ${theme.toLowerCase()} at ${profile.label} with language appropriate to ${profile.cefrLevel}.`,
    writingTask: (theme, profile) => writingTask('English', theme, profile),
    speakingPrompt: (theme, profile) => speakingPrompt('English', theme, profile),
    roleplayPrompt: (theme, profile) => roleplayPrompt('English', theme, profile),
    instruction: englishInstruction,
  };
}

function buildGermanPack(): LanguagePack {
  return {
    nativeName: 'Deutsch',
    speechLocale: CURRICULUM_SPEECH_LOCALES.German,
    fallbackTranslationLabel: 'Deutsch',
    themes: LANGUAGE_THEMES.German,
    grammar: localizeGrammar('German'),
    pronunciation: {
      A1: 'ich-Laut, sch, z und klare Wortendungen',
      A2: 'trennbare Verben, Satzklammer und höfliche Intonation',
      B1: 'Verbzweitstellung, Nebensätze und natürlicher Satzrhythmus',
      B2: 'Betonung in Argumenten, Konnektoren und formellem Register',
      C1: 'Registerwechsel, Nuance und präzise Endungen',
      C2: 'Subtext, Kadenz und idiomatische Betonung',
    },
    words: buildWords('German'),
    chunks: buildChunks('German'),
    sentences: buildSentences('German'),
    readings: buildReadings('German'),
    readingQuestions: buildReadingQuestions('German'),
    listeningQuestions: buildListeningQuestions('German'),
    grammarQuestions: buildGrammarQuestions('German'),
    objective: (theme, profile) => `${profile.label}-Sprache für ${theme} mit sauberem Wortschatz und stabiler Satzstruktur aufbauen.`,
    canDo: (theme, profile) => `Ich kann ${theme.toLowerCase()} auf ${profile.label} angemessen verstehen und ausdrücken.`,
    writingTask: (theme, profile) => writingTask('German', theme, profile),
    speakingPrompt: (theme, profile) => speakingPrompt('German', theme, profile),
    roleplayPrompt: (theme, profile) => roleplayPrompt('German', theme, profile),
    instruction: germanInstruction,
  };
}

function buildRomancePack(language: 'Spanish' | 'Italian' | 'French'): LanguagePack {
  return {
    nativeName: language,
    speechLocale: CURRICULUM_SPEECH_LOCALES[language],
    fallbackTranslationLabel: language,
    themes: LANGUAGE_THEMES[language],
    grammar: localizeGrammar(language),
    pronunciation: {
      A1: language === 'French' ? 'liaison, nasal vowels, and final silent letters' : language === 'Spanish' ? 'clear vowels, ñ, and sentence rhythm' : 'open vowels, double consonants, and stress',
      A2: language === 'French' ? 'liaison in short phrases and polite intonation' : language === 'Spanish' ? 'stress, question intonation, and r sounds' : 'sentence melody, stress, and polite rhythm',
      B1: 'connected speech, natural pauses, and clear sentence endings',
      B2: 'argument intonation, contrast, and professional register',
      C1: 'nuance, register shifts, and precise reformulation',
      C2: 'idiom, cadence, implication, and stylistic control',
    },
    words: buildWords(language),
    chunks: buildChunks(language),
    sentences: buildSentences(language),
    readings: buildReadings(language),
    readingQuestions: buildReadingQuestions(language),
    listeningQuestions: buildListeningQuestions(language),
    grammarQuestions: buildGrammarQuestions(language),
    objective: (theme, profile) => localizedObjective(language, theme, profile),
    canDo: (theme, profile) => localizedCanDo(language, theme, profile),
    writingTask: (theme, profile) => writingTask(language, theme, profile),
    speakingPrompt: (theme, profile) => speakingPrompt(language, theme, profile),
    roleplayPrompt: (theme, profile) => roleplayPrompt(language, theme, profile),
    instruction: (skill, seed) => localizedInstruction(language, skill, seed),
  };
}

function buildWords(language: CurriculumLanguage): Record<CefrBand, Array<[string, string, string]>> {
  const banks: Record<CurriculumLanguage, Record<CefrBand, Array<[string, string, string]>>> = {
    English: {
      A1: [['hello', 'greeting', 'Hello, my name is Lina.'], ['name', 'what someone is called', 'My name is Omar.'], ['family', 'relatives', 'My family is small.'], ['morning', 'early part of the day', 'I study in the morning.'], ['water', 'drink', 'I would like water.'], ['station', 'transport place', 'The station is near here.'], ['home', 'where you live', 'I am at home.'], ['ticket', 'travel document', 'I need a ticket.']],
      A2: [['appointment', 'planned meeting', 'I have an appointment tomorrow.'], ['because', 'reason connector', 'I am late because the bus is slow.'], ['message', 'written note', 'She sends a message.'], ['cheaper', 'lower price', 'This ticket is cheaper.'], ['advice', 'helpful suggestion', 'Can you give me advice?'], ['problem', 'difficulty', 'We have a small problem.'], ['reply', 'answer', 'Please reply today.'], ['travel', 'go to another place', 'We travel by train.']],
      B1: [['experience', 'something that happened', 'My experience taught me a lesson.'], ['solution', 'answer to a problem', 'The solution was simple.'], ['priority', 'most important thing', 'Safety is the priority.'], ['community', 'local group', 'The community helped quickly.'], ['evidence', 'facts that support an idea', 'Use evidence in your answer.'], ['strategy', 'planned method', 'Her strategy improved.'], ['habit', 'regular action', 'Daily reading is a useful habit.'], ['recommendation', 'suggestion', 'His recommendation was practical.']],
      B2: [['claim', 'main argument', 'The claim needs stronger evidence.'], ['trend', 'pattern of change', 'The trend is visible in the data.'], ['tradeoff', 'balance between choices', 'Every option has a tradeoff.'], ['impact', 'effect', 'The impact was significant.'], ['policy', 'official rule or plan', 'The policy changed last year.'], ['counterargument', 'opposing point', 'Address the counterargument clearly.'], ['cohesion', 'connection between ideas', 'Cohesion makes the paragraph stronger.'], ['outcome', 'result', 'The outcome was mixed.']],
      C1: [['nuance', 'small meaningful difference', 'The nuance changes the tone.'], ['register', 'level of formality', 'Choose the right register.'], ['assumption', 'unstated belief', 'Question the assumption first.'], ['synthesis', 'combining sources', 'The synthesis is concise.'], ['concession', 'qualified agreement', 'The concession sounds professional.'], ['rhetoric', 'persuasive language', 'Her rhetoric is controlled.'], ['stance', 'position', 'The stance is careful.'], ['constraint', 'limitation', 'The constraint shapes the decision.']],
      C2: [['subtext', 'hidden meaning', 'The subtext is critical but polite.'], ['cadence', 'rhythm of speech', 'The cadence feels natural.'], ['irony', 'meaning through contrast', 'The irony is subtle.'], ['compression', 'dense expression', 'Compression makes the style sharper.'], ['implication', 'suggested meaning', 'The implication is not direct.'], ['micro-editing', 'fine editing', 'Micro-editing improved the sentence.'], ['qualification', 'limiting phrase', 'Add a precise qualification.'], ['inference', 'conclusion from clues', 'The inference depends on context.']],
    },
    German: {
      A1: [['hallo', 'hello', 'Hallo, ich heiße Lina.'], ['Name', 'name', 'Mein Name ist Omar.'], ['Familie', 'family', 'Meine Familie ist klein.'], ['Morgen', 'morning', 'Ich lerne am Morgen.'], ['Wasser', 'water', 'Ich möchte Wasser.'], ['Bahnhof', 'station', 'Der Bahnhof ist hier in der Nähe.'], ['Zuhause', 'home', 'Ich bin zu Hause.'], ['Fahrkarte', 'ticket', 'Ich brauche eine Fahrkarte.']],
      A2: [['Termin', 'appointment', 'Ich habe morgen einen Termin.'], ['weil', 'because', 'Ich bin spät, weil der Bus langsam ist.'], ['Nachricht', 'message', 'Sie schickt eine Nachricht.'], ['günstiger', 'cheaper', 'Diese Fahrkarte ist günstiger.'], ['Rat', 'advice', 'Können Sie mir einen Rat geben?'], ['Problem', 'problem', 'Wir haben ein kleines Problem.'], ['Antwort', 'reply', 'Bitte antworten Sie heute.'], ['Reise', 'travel', 'Wir reisen mit dem Zug.']],
      B1: [['Erfahrung', 'experience', 'Meine Erfahrung war hilfreich.'], ['Lösung', 'solution', 'Die Lösung war einfach.'], ['Priorität', 'priority', 'Sicherheit hat Priorität.'], ['Gemeinschaft', 'community', 'Die Gemeinschaft half schnell.'], ['Beleg', 'evidence', 'Nutze einen Beleg in deiner Antwort.'], ['Strategie', 'strategy', 'Ihre Strategie wurde besser.'], ['Gewohnheit', 'habit', 'Tägliches Lesen ist eine gute Gewohnheit.'], ['Empfehlung', 'recommendation', 'Seine Empfehlung war praktisch.']],
      B2: [['These', 'claim', 'Die These braucht stärkere Belege.'], ['Trend', 'trend', 'Der Trend ist in den Daten sichtbar.'], ['Abwägung', 'tradeoff', 'Jede Option verlangt eine Abwägung.'], ['Auswirkung', 'impact', 'Die Auswirkung war erheblich.'], ['Richtlinie', 'policy', 'Die Richtlinie änderte sich letztes Jahr.'], ['Gegenargument', 'counterargument', 'Das Gegenargument muss klar beantwortet werden.'], ['Kohäsion', 'cohesion', 'Kohäsion stärkt den Absatz.'], ['Ergebnis', 'outcome', 'Das Ergebnis war gemischt.']],
      C1: [['Nuance', 'nuance', 'Die Nuance verändert den Ton.'], ['Register', 'register', 'Wähle das passende Register.'], ['Annahme', 'assumption', 'Hinterfrage zuerst die Annahme.'], ['Synthese', 'synthesis', 'Die Synthese ist knapp.'], ['Zugeständnis', 'concession', 'Das Zugeständnis klingt professionell.'], ['Rhetorik', 'rhetoric', 'Ihre Rhetorik ist kontrolliert.'], ['Haltung', 'stance', 'Die Haltung ist vorsichtig.'], ['Einschränkung', 'constraint', 'Die Einschränkung prägt die Entscheidung.']],
      C2: [['Subtext', 'subtext', 'Der Subtext ist kritisch, aber höflich.'], ['Kadenz', 'cadence', 'Die Kadenz wirkt natürlich.'], ['Ironie', 'irony', 'Die Ironie ist subtil.'], ['Verdichtung', 'compression', 'Verdichtung schärft den Stil.'], ['Implikation', 'implication', 'Die Implikation ist nicht direkt.'], ['Feinschliff', 'micro-editing', 'Der Feinschliff verbessert den Satz.'], ['Einschränkung', 'qualification', 'Füge eine präzise Einschränkung hinzu.'], ['Schlussfolgerung', 'inference', 'Die Schlussfolgerung hängt vom Kontext ab.']],
    },
    Spanish: {
      A1: [['hola', 'hello', 'Hola, me llamo Lina.'], ['nombre', 'name', 'Mi nombre es Omar.'], ['familia', 'family', 'Mi familia es pequeña.'], ['mañana', 'morning', 'Estudio por la mañana.'], ['agua', 'water', 'Quiero agua, por favor.'], ['estación', 'station', 'La estación está cerca.'], ['casa', 'home', 'Estoy en casa.'], ['billete', 'ticket', 'Necesito un billete.']],
      A2: [['cita', 'appointment', 'Tengo una cita mañana.'], ['porque', 'because', 'Llego tarde porque el autobús va lento.'], ['mensaje', 'message', 'Ella manda un mensaje.'], ['más barato', 'cheaper', 'Este billete es más barato.'], ['consejo', 'advice', '¿Puedes darme un consejo?'], ['problema', 'problem', 'Tenemos un pequeño problema.'], ['respuesta', 'reply', 'Por favor, responde hoy.'], ['viaje', 'travel', 'Viajamos en tren.']],
      B1: [['experiencia', 'experience', 'Mi experiencia me enseñó mucho.'], ['solución', 'solution', 'La solución fue sencilla.'], ['prioridad', 'priority', 'La seguridad es la prioridad.'], ['comunidad', 'community', 'La comunidad ayudó rápido.'], ['evidencia', 'evidence', 'Usa evidencia en tu respuesta.'], ['estrategia', 'strategy', 'Su estrategia mejoró.'], ['hábito', 'habit', 'Leer cada día es un buen hábito.'], ['recomendación', 'recommendation', 'La recomendación fue práctica.']],
      B2: [['tesis', 'claim', 'La tesis necesita evidencia más sólida.'], ['tendencia', 'trend', 'La tendencia se ve en los datos.'], ['compensación', 'tradeoff', 'Cada opción implica una compensación.'], ['impacto', 'impact', 'El impacto fue significativo.'], ['política', 'policy', 'La política cambió el año pasado.'], ['contraargumento', 'counterargument', 'Responde al contraargumento con claridad.'], ['cohesión', 'cohesion', 'La cohesión fortalece el párrafo.'], ['resultado', 'outcome', 'El resultado fue mixto.']],
      C1: [['matiz', 'nuance', 'El matiz cambia el tono.'], ['registro', 'register', 'Elige el registro adecuado.'], ['suposición', 'assumption', 'Cuestiona primero la suposición.'], ['síntesis', 'synthesis', 'La síntesis es concisa.'], ['concesión', 'concession', 'La concesión suena profesional.'], ['retórica', 'rhetoric', 'Su retórica está controlada.'], ['postura', 'stance', 'La postura es prudente.'], ['restricción', 'constraint', 'La restricción condiciona la decisión.']],
      C2: [['subtexto', 'subtext', 'El subtexto es crítico pero cortés.'], ['cadencia', 'cadence', 'La cadencia suena natural.'], ['ironía', 'irony', 'La ironía es sutil.'], ['condensación', 'compression', 'La condensación afina el estilo.'], ['implicación', 'implication', 'La implicación no es directa.'], ['microedición', 'micro-editing', 'La microedición mejoró la frase.'], ['matización', 'qualification', 'Añade una matización precisa.'], ['inferencia', 'inference', 'La inferencia depende del contexto.']],
    },
    Italian: {
      A1: [['ciao', 'hello', 'Ciao, mi chiamo Lina.'], ['nome', 'name', 'Il mio nome è Omar.'], ['famiglia', 'family', 'La mia famiglia è piccola.'], ['mattina', 'morning', 'Studio la mattina.'], ['acqua', 'water', 'Vorrei dell’acqua.'], ['stazione', 'station', 'La stazione è vicina.'], ['casa', 'home', 'Sono a casa.'], ['biglietto', 'ticket', 'Ho bisogno di un biglietto.']],
      A2: [['appuntamento', 'appointment', 'Ho un appuntamento domani.'], ['perché', 'because', 'Sono in ritardo perché l’autobus è lento.'], ['messaggio', 'message', 'Lei manda un messaggio.'], ['più economico', 'cheaper', 'Questo biglietto è più economico.'], ['consiglio', 'advice', 'Puoi darmi un consiglio?'], ['problema', 'problem', 'Abbiamo un piccolo problema.'], ['risposta', 'reply', 'Rispondi oggi, per favore.'], ['viaggio', 'travel', 'Viaggiamo in treno.']],
      B1: [['esperienza', 'experience', 'La mia esperienza mi ha insegnato molto.'], ['soluzione', 'solution', 'La soluzione era semplice.'], ['priorità', 'priority', 'La sicurezza è la priorità.'], ['comunità', 'community', 'La comunità ha aiutato subito.'], ['prova', 'evidence', 'Usa una prova nella risposta.'], ['strategia', 'strategy', 'La sua strategia è migliorata.'], ['abitudine', 'habit', 'Leggere ogni giorno è una buona abitudine.'], ['raccomandazione', 'recommendation', 'La raccomandazione era pratica.']],
      B2: [['tesi', 'claim', 'La tesi richiede prove più solide.'], ['tendenza', 'trend', 'La tendenza è visibile nei dati.'], ['compromesso', 'tradeoff', 'Ogni opzione comporta un compromesso.'], ['impatto', 'impact', 'L’impatto è stato significativo.'], ['politica', 'policy', 'La politica è cambiata l’anno scorso.'], ['controargomento', 'counterargument', 'Rispondi al controargomento con chiarezza.'], ['coesione', 'cohesion', 'La coesione rafforza il paragrafo.'], ['risultato', 'outcome', 'Il risultato è stato misto.']],
      C1: [['sfumatura', 'nuance', 'La sfumatura cambia il tono.'], ['registro', 'register', 'Scegli il registro giusto.'], ['presupposto', 'assumption', 'Metti prima in discussione il presupposto.'], ['sintesi', 'synthesis', 'La sintesi è concisa.'], ['concessione', 'concession', 'La concessione suona professionale.'], ['retorica', 'rhetoric', 'La sua retorica è controllata.'], ['posizione', 'stance', 'La posizione è prudente.'], ['vincolo', 'constraint', 'Il vincolo orienta la decisione.']],
      C2: [['sottotesto', 'subtext', 'Il sottotesto è critico ma cortese.'], ['cadenza', 'cadence', 'La cadenza è naturale.'], ['ironia', 'irony', 'L’ironia è sottile.'], ['compressione', 'compression', 'La compressione rende lo stile più netto.'], ['implicazione', 'implication', 'L’implicazione non è diretta.'], ['microrevisione', 'micro-editing', 'La microrevisione ha migliorato la frase.'], ['qualificazione', 'qualification', 'Aggiungi una qualificazione precisa.'], ['inferenza', 'inference', 'L’inferenza dipende dal contesto.']],
    },
    French: {
      A1: [['bonjour', 'hello', 'Bonjour, je m’appelle Lina.'], ['nom', 'name', 'Mon nom est Omar.'], ['famille', 'family', 'Ma famille est petite.'], ['matin', 'morning', 'J’étudie le matin.'], ['eau', 'water', 'Je voudrais de l’eau.'], ['gare', 'station', 'La gare est proche.'], ['maison', 'home', 'Je suis à la maison.'], ['billet', 'ticket', 'J’ai besoin d’un billet.']],
      A2: [['rendez-vous', 'appointment', 'J’ai un rendez-vous demain.'], ['parce que', 'because', 'Je suis en retard parce que le bus est lent.'], ['message', 'message', 'Elle envoie un message.'], ['moins cher', 'cheaper', 'Ce billet est moins cher.'], ['conseil', 'advice', 'Peux-tu me donner un conseil ?'], ['problème', 'problem', 'Nous avons un petit problème.'], ['réponse', 'reply', 'Réponds aujourd’hui, s’il te plaît.'], ['voyage', 'travel', 'Nous voyageons en train.']],
      B1: [['expérience', 'experience', 'Mon expérience m’a beaucoup appris.'], ['solution', 'solution', 'La solution était simple.'], ['priorité', 'priority', 'La sécurité est la priorité.'], ['communauté', 'community', 'La communauté a aidé rapidement.'], ['preuve', 'evidence', 'Utilise une preuve dans ta réponse.'], ['stratégie', 'strategy', 'Sa stratégie s’est améliorée.'], ['habitude', 'habit', 'Lire chaque jour est une bonne habitude.'], ['recommandation', 'recommendation', 'La recommandation était pratique.']],
      B2: [['thèse', 'claim', 'La thèse exige des preuves plus solides.'], ['tendance', 'trend', 'La tendance apparaît dans les données.'], ['compromis', 'tradeoff', 'Chaque option suppose un compromis.'], ['impact', 'impact', 'L’impact a été significatif.'], ['politique', 'policy', 'La politique a changé l’année dernière.'], ['contre-argument', 'counterargument', 'Réponds clairement au contre-argument.'], ['cohésion', 'cohesion', 'La cohésion renforce le paragraphe.'], ['résultat', 'outcome', 'Le résultat était mitigé.']],
      C1: [['nuance', 'nuance', 'La nuance change le ton.'], ['registre', 'register', 'Choisis le bon registre.'], ['hypothèse', 'assumption', 'Remets d’abord l’hypothèse en question.'], ['synthèse', 'synthesis', 'La synthèse est concise.'], ['concession', 'concession', 'La concession paraît professionnelle.'], ['rhétorique', 'rhetoric', 'Sa rhétorique est maîtrisée.'], ['position', 'stance', 'La position est prudente.'], ['contrainte', 'constraint', 'La contrainte oriente la décision.']],
      C2: [['sous-texte', 'subtext', 'Le sous-texte est critique mais courtois.'], ['cadence', 'cadence', 'La cadence semble naturelle.'], ['ironie', 'irony', 'L’ironie est subtile.'], ['compression', 'compression', 'La compression affine le style.'], ['implication', 'implication', 'L’implication n’est pas directe.'], ['microédition', 'micro-editing', 'La microédition a amélioré la phrase.'], ['qualification', 'qualification', 'Ajoute une qualification précise.'], ['inférence', 'inference', 'L’inférence dépend du contexte.']],
    },
  };

  return banks[language];
}

function buildChunks(language: CurriculumLanguage): Record<CefrBand, Array<[string, string, string]>> {
  const chunks: Record<CurriculumLanguage, Record<CefrBand, Array<[string, string, string]>>> = {
    English: {
      A1: [['My name is', 'introducing yourself', 'My name is Lina.'], ['I would like', 'polite request', 'I would like water.'], ['Where is', 'asking location', 'Where is the station?'], ['Can you repeat?', 'asking for repetition', 'Can you repeat the word?']],
      A2: [['I have an appointment', 'planned meeting', 'I have an appointment at ten.'], ['because I need', 'giving a reason', 'I am here because I need help.'], ['Could you help me', 'polite help request', 'Could you help me with this form?'], ['It is cheaper than', 'comparison', 'It is cheaper than the other ticket.']],
      B1: [['In my experience', 'introducing an experience', 'In my experience, practice helps.'], ['The main problem is', 'problem framing', 'The main problem is the schedule.'], ['One possible solution is', 'solution framing', 'One possible solution is a shorter meeting.'], ['I would recommend', 'giving advice', 'I would recommend a clear plan.']],
      B2: [['The evidence suggests', 'evidence-based claim', 'The evidence suggests a gradual change.'], ['On the other hand', 'contrast', 'On the other hand, the cost is high.'], ['This raises the question', 'academic framing', 'This raises the question of access.'], ['A more balanced approach', 'proposal', 'A more balanced approach would help.']],
      C1: [['It is worth noting that', 'nuanced emphasis', 'It is worth noting that the risk is uneven.'], ['That said', 'qualified contrast', 'That said, the proposal remains useful.'], ['The underlying assumption is', 'analytical framing', 'The underlying assumption is fragile.'], ['To put it more precisely', 'reformulation', 'To put it more precisely, the issue is timing.']],
      C2: [['Between the lines', 'implicit meaning', 'Between the lines, the speaker is skeptical.'], ['To a certain extent', 'precise qualification', 'To a certain extent, the criticism is justified.'], ['The phrasing subtly implies', 'subtext analysis', 'The phrasing subtly implies reluctance.'], ['Stylistically speaking', 'style analysis', 'Stylistically speaking, the sentence is compressed.']],
    },
    German: {
      A1: [['Ich heiße', 'sich vorstellen', 'Ich heiße Lina.'], ['Ich möchte', 'höflich bestellen', 'Ich möchte Wasser.'], ['Wo ist', 'nach einem Ort fragen', 'Wo ist der Bahnhof?'], ['Bitte wiederholen', 'um Wiederholung bitten', 'Bitte wiederholen Sie das Wort.']],
      A2: [['Ich habe einen Termin', 'Termin nennen', 'Ich habe um zehn einen Termin.'], ['weil ich brauche', 'einen Grund geben', 'Ich bin hier, weil ich Hilfe brauche.'], ['Können Sie mir helfen', 'höflich um Hilfe bitten', 'Können Sie mir mit dem Formular helfen?'], ['Es ist günstiger als', 'vergleichen', 'Es ist günstiger als die andere Fahrkarte.']],
      B1: [['Meiner Erfahrung nach', 'Erfahrung einleiten', 'Meiner Erfahrung nach hilft Übung.'], ['Das Hauptproblem ist', 'Problem benennen', 'Das Hauptproblem ist der Zeitplan.'], ['Eine mögliche Lösung ist', 'Lösung vorschlagen', 'Eine mögliche Lösung ist ein kürzeres Treffen.'], ['Ich würde empfehlen', 'Empfehlung geben', 'Ich würde einen klaren Plan empfehlen.']],
      B2: [['Die Belege zeigen', 'These stützen', 'Die Belege zeigen eine langsame Veränderung.'], ['Andererseits', 'Gegensatz markieren', 'Andererseits sind die Kosten hoch.'], ['Das wirft die Frage auf', 'akademisch einordnen', 'Das wirft die Frage nach Zugang auf.'], ['Ein ausgewogener Ansatz', 'Vorschlag formulieren', 'Ein ausgewogener Ansatz wäre sinnvoll.']],
      C1: [['Bemerkenswert ist', 'Nuance betonen', 'Bemerkenswert ist die ungleiche Risikoverteilung.'], ['Allerdings', 'qualifizierter Gegensatz', 'Allerdings bleibt der Vorschlag nützlich.'], ['Die zugrunde liegende Annahme ist', 'analytisch rahmen', 'Die zugrunde liegende Annahme ist fragil.'], ['Genauer gesagt', 'präzise umformulieren', 'Genauer gesagt liegt das Problem im Timing.']],
      C2: [['Zwischen den Zeilen', 'implizite Bedeutung', 'Zwischen den Zeilen wirkt der Sprecher skeptisch.'], ['Bis zu einem gewissen Grad', 'genaue Einschränkung', 'Bis zu einem gewissen Grad ist die Kritik berechtigt.'], ['Die Formulierung deutet subtil an', 'Subtext analysieren', 'Die Formulierung deutet subtil Zurückhaltung an.'], ['Stilistisch betrachtet', 'Stil analysieren', 'Stilistisch betrachtet ist der Satz verdichtet.']],
    },
    Spanish: {
      A1: [['Me llamo', 'introducing yourself', 'Me llamo Lina.'], ['Quisiera', 'polite request', 'Quisiera agua.'], ['Dónde está', 'asking location', '¿Dónde está la estación?'], ['¿Puedes repetir?', 'asking for repetition', '¿Puedes repetir la palabra?']],
      A2: [['Tengo una cita', 'planned meeting', 'Tengo una cita a las diez.'], ['porque necesito', 'giving a reason', 'Estoy aquí porque necesito ayuda.'], ['¿Podría ayudarme?', 'polite help request', '¿Podría ayudarme con este formulario?'], ['Es más barato que', 'comparison', 'Es más barato que el otro billete.']],
      B1: [['Según mi experiencia', 'introducing experience', 'Según mi experiencia, practicar ayuda.'], ['El problema principal es', 'problem framing', 'El problema principal es el horario.'], ['Una posible solución es', 'solution framing', 'Una posible solución es una reunión más corta.'], ['Recomendaría', 'giving advice', 'Recomendaría un plan claro.']],
      B2: [['La evidencia sugiere', 'evidence-based claim', 'La evidencia sugiere un cambio gradual.'], ['Por otro lado', 'contrast', 'Por otro lado, el coste es alto.'], ['Esto plantea la cuestión', 'academic framing', 'Esto plantea la cuestión del acceso.'], ['Un enfoque más equilibrado', 'proposal', 'Un enfoque más equilibrado ayudaría.']],
      C1: [['Conviene señalar que', 'nuanced emphasis', 'Conviene señalar que el riesgo no es uniforme.'], ['Dicho esto', 'qualified contrast', 'Dicho esto, la propuesta sigue siendo útil.'], ['La suposición subyacente es', 'analytical framing', 'La suposición subyacente es frágil.'], ['Para ser más precisos', 'reformulation', 'Para ser más precisos, el problema es el tiempo.']],
      C2: [['Entre líneas', 'implicit meaning', 'Entre líneas, el hablante se muestra escéptico.'], ['Hasta cierto punto', 'precise qualification', 'Hasta cierto punto, la crítica es justa.'], ['La formulación insinúa sutilmente', 'subtext analysis', 'La formulación insinúa sutilmente reserva.'], ['Desde el punto de vista estilístico', 'style analysis', 'Desde el punto de vista estilístico, la frase es densa.']],
    },
    Italian: {
      A1: [['Mi chiamo', 'introducing yourself', 'Mi chiamo Lina.'], ['Vorrei', 'polite request', 'Vorrei dell’acqua.'], ['Dov’è', 'asking location', 'Dov’è la stazione?'], ['Puoi ripetere?', 'asking for repetition', 'Puoi ripetere la parola?']],
      A2: [['Ho un appuntamento', 'planned meeting', 'Ho un appuntamento alle dieci.'], ['perché ho bisogno di', 'giving a reason', 'Sono qui perché ho bisogno di aiuto.'], ['Potrebbe aiutarmi?', 'polite help request', 'Potrebbe aiutarmi con questo modulo?'], ['È più economico di', 'comparison', 'È più economico dell’altro biglietto.']],
      B1: [['Secondo la mia esperienza', 'introducing experience', 'Secondo la mia esperienza, esercitarsi aiuta.'], ['Il problema principale è', 'problem framing', 'Il problema principale è l’orario.'], ['Una possibile soluzione è', 'solution framing', 'Una possibile soluzione è una riunione più breve.'], ['Consiglierei', 'giving advice', 'Consiglierei un piano chiaro.']],
      B2: [['Le prove suggeriscono', 'evidence-based claim', 'Le prove suggeriscono un cambiamento graduale.'], ['D’altra parte', 'contrast', 'D’altra parte, il costo è alto.'], ['Questo solleva la questione', 'academic framing', 'Questo solleva la questione dell’accesso.'], ['Un approccio più equilibrato', 'proposal', 'Un approccio più equilibrato aiuterebbe.']],
      C1: [['Vale la pena notare che', 'nuanced emphasis', 'Vale la pena notare che il rischio non è uniforme.'], ['Detto questo', 'qualified contrast', 'Detto questo, la proposta resta utile.'], ['Il presupposto sottostante è', 'analytical framing', 'Il presupposto sottostante è fragile.'], ['Per essere più precisi', 'reformulation', 'Per essere più precisi, il problema è il tempo.']],
      C2: [['Tra le righe', 'implicit meaning', 'Tra le righe, il parlante è scettico.'], ['In una certa misura', 'precise qualification', 'In una certa misura, la critica è giustificata.'], ['La formulazione suggerisce sottilmente', 'subtext analysis', 'La formulazione suggerisce sottilmente riluttanza.'], ['Dal punto di vista stilistico', 'style analysis', 'Dal punto di vista stilistico, la frase è compressa.']],
    },
    French: {
      A1: [['Je m’appelle', 'introducing yourself', 'Je m’appelle Lina.'], ['Je voudrais', 'polite request', 'Je voudrais de l’eau.'], ['Où est', 'asking location', 'Où est la gare ?'], ['Tu peux répéter ?', 'asking for repetition', 'Tu peux répéter le mot ?']],
      A2: [['J’ai un rendez-vous', 'planned meeting', 'J’ai un rendez-vous à dix heures.'], ['parce que j’ai besoin de', 'giving a reason', 'Je suis ici parce que j’ai besoin d’aide.'], ['Pourriez-vous m’aider ?', 'polite help request', 'Pourriez-vous m’aider avec ce formulaire ?'], ['C’est moins cher que', 'comparison', 'C’est moins cher que l’autre billet.']],
      B1: [['D’après mon expérience', 'introducing experience', 'D’après mon expérience, pratiquer aide.'], ['Le problème principal est', 'problem framing', 'Le problème principal est l’horaire.'], ['Une solution possible est', 'solution framing', 'Une solution possible est une réunion plus courte.'], ['Je recommanderais', 'giving advice', 'Je recommanderais un plan clair.']],
      B2: [['Les preuves suggèrent', 'evidence-based claim', 'Les preuves suggèrent un changement progressif.'], ['En revanche', 'contrast', 'En revanche, le coût est élevé.'], ['Cela soulève la question', 'academic framing', 'Cela soulève la question de l’accès.'], ['Une approche plus équilibrée', 'proposal', 'Une approche plus équilibrée aiderait.']],
      C1: [['Il convient de noter que', 'nuanced emphasis', 'Il convient de noter que le risque est inégal.'], ['Cela dit', 'qualified contrast', 'Cela dit, la proposition reste utile.'], ['L’hypothèse sous-jacente est', 'analytical framing', 'L’hypothèse sous-jacente est fragile.'], ['Pour être plus précis', 'reformulation', 'Pour être plus précis, le problème est le calendrier.']],
      C2: [['Entre les lignes', 'implicit meaning', 'Entre les lignes, le locuteur paraît sceptique.'], ['Dans une certaine mesure', 'precise qualification', 'Dans une certaine mesure, la critique est justifiée.'], ['La formulation suggère subtilement', 'subtext analysis', 'La formulation suggère subtilement une réserve.'], ['Sur le plan stylistique', 'style analysis', 'Sur le plan stylistique, la phrase est condensée.']],
    },
  };

  return chunks[language];
}

function buildSentences(language: CurriculumLanguage): Record<CefrBand, string[]> {
  const sentences: Record<CurriculumLanguage, Record<CefrBand, string[]>> = {
    English: {
      A1: ['Hello, my name is Sam and I am from Canada.', 'Every morning I wake up early and study English.', 'I would like coffee, bread, and a glass of water.'],
      A2: ['Yesterday I missed the bus, so I walked to the station and bought a new ticket.', 'Could you help me complete this address form before my appointment?', 'This route is faster, but that ticket is cheaper.'],
      B1: ['Many students improve when they practise regularly, review mistakes, and explain their strategy in clear paragraphs.', 'The main problem was the schedule, but the team found a practical solution.', 'In my experience, honest feedback helps people change their habits.'],
      B2: ['Academic progress depends on consistent practice, careful listening, and the ability to notice how sentence endings change meaning.', 'Although the policy looks efficient, the evidence suggests that access remains unequal.', 'A balanced proposal should explain the tradeoff, answer objections, and define the expected outcome.'],
      C1: ['Advanced learners refine their accuracy by identifying nuance, questioning assumptions, and reformulating dense arguments precisely.', 'The briefing balances evidence, uncertainty, and stakeholder concerns without losing a clear professional tone.', 'It is worth noting that the concession changes the register without weakening the central claim.'],
      C2: ['Near-native command requires sensitivity to subtext, cadence, register, and the smallest shifts in emphasis.', 'The editorial compresses irony, implication, and stylistic contrast into a sentence that appears deceptively simple.', 'Between the lines, the speaker qualifies the promise while preserving a polished diplomatic tone.'],
    },
    German: {
      A1: ['Hallo, ich heiße Sam und ich komme aus Kanada.', 'Jeden Morgen stehe ich früh auf und lerne Deutsch.', 'Ich möchte Kaffee, Brot und ein Glas Wasser.'],
      A2: ['Gestern habe ich den Bus verpasst, deshalb bin ich zum Bahnhof gelaufen und habe eine Fahrkarte gekauft.', 'Können Sie mir helfen, dieses Formular vor meinem Termin auszufüllen?', 'Diese Verbindung ist schneller, aber die Fahrkarte ist günstiger.'],
      B1: ['Viele Lernende machen Fortschritte, wenn sie regelmäßig üben, Fehler prüfen und ihre Strategie erklären.', 'Das Hauptproblem war der Zeitplan, aber das Team fand eine praktische Lösung.', 'Meiner Erfahrung nach hilft ehrliches Feedback dabei, Gewohnheiten zu verändern.'],
      B2: ['Akademischer Fortschritt entsteht durch regelmäßige Übung, genaues Zuhören und bewusste Arbeit an Satzenden.', 'Obwohl die Richtlinie effizient wirkt, zeigen die Belege, dass der Zugang ungleich bleibt.', 'Ein ausgewogener Vorschlag sollte die Abwägung erklären, Einwände beantworten und das erwartete Ergebnis definieren.'],
      C1: ['Fortgeschrittene Lernende verbessern ihre Genauigkeit, indem sie Nuancen erkennen, Annahmen hinterfragen und dichte Argumente präzise umformulieren.', 'Das Briefing verbindet Belege, Unsicherheit und Interessen verschiedener Gruppen, ohne den professionellen Ton zu verlieren.', 'Bemerkenswert ist, dass das Zugeständnis das Register verändert, ohne die zentrale These zu schwächen.'],
      C2: ['Nahezu muttersprachliche Sicherheit verlangt Gespür für Subtext, Kadenz, Register und feinste Betonungsunterschiede.', 'Der Kommentar verdichtet Ironie, Implikation und stilistischen Kontrast in einem Satz, der täuschend einfach wirkt.', 'Zwischen den Zeilen schränkt der Sprecher das Versprechen ein und bewahrt dennoch einen diplomatischen Ton.'],
    },
    Spanish: {
      A1: ['Hola, me llamo Sam y soy de Canadá.', 'Cada mañana me levanto temprano y estudio español.', 'Quisiera café, pan y un vaso de agua.'],
      A2: ['Ayer perdí el autobús, así que caminé hasta la estación y compré un billete nuevo.', '¿Podría ayudarme a completar este formulario antes de mi cita?', 'Esta ruta es más rápida, pero aquel billete es más barato.'],
      B1: ['Muchos estudiantes mejoran cuando practican con regularidad, revisan errores y explican su estrategia con claridad.', 'El problema principal era el horario, pero el equipo encontró una solución práctica.', 'Según mi experiencia, la retroalimentación honesta ayuda a cambiar hábitos.'],
      B2: ['El progreso académico depende de la práctica constante, la escucha cuidadosa y la capacidad de notar cómo cambian el sentido los finales de frase.', 'Aunque la política parece eficiente, la evidencia sugiere que el acceso sigue siendo desigual.', 'Una propuesta equilibrada debe explicar la compensación, responder objeciones y definir el resultado esperado.'],
      C1: ['Los estudiantes avanzados afinan su precisión al identificar matices, cuestionar suposiciones y reformular argumentos densos con exactitud.', 'El informe equilibra evidencia, incertidumbre e intereses de varios grupos sin perder un tono profesional claro.', 'Conviene señalar que la concesión cambia el registro sin debilitar la tesis central.'],
      C2: ['El dominio casi nativo exige sensibilidad al subtexto, la cadencia, el registro y los cambios mínimos de énfasis.', 'El editorial condensa ironía, implicación y contraste estilístico en una frase que parece engañosamente sencilla.', 'Entre líneas, el hablante matiza la promesa mientras conserva un tono diplomático pulido.'],
    },
    Italian: {
      A1: ['Ciao, mi chiamo Sam e vengo dal Canada.', 'Ogni mattina mi alzo presto e studio italiano.', 'Vorrei caffè, pane e un bicchiere d’acqua.'],
      A2: ['Ieri ho perso l’autobus, quindi sono andato alla stazione e ho comprato un nuovo biglietto.', 'Potrebbe aiutarmi a compilare questo modulo prima del mio appuntamento?', 'Questo percorso è più veloce, ma quel biglietto è più economico.'],
      B1: ['Molti studenti migliorano quando si esercitano con regolarità, rivedono gli errori e spiegano la loro strategia con chiarezza.', 'Il problema principale era l’orario, ma il team ha trovato una soluzione pratica.', 'Secondo la mia esperienza, un feedback onesto aiuta a cambiare abitudini.'],
      B2: ['Il progresso accademico dipende dalla pratica costante, dall’ascolto attento e dalla capacità di notare come i finali delle frasi cambiano il significato.', 'Anche se la politica sembra efficiente, le prove suggeriscono che l’accesso rimane diseguale.', 'Una proposta equilibrata dovrebbe spiegare il compromesso, rispondere alle obiezioni e definire il risultato atteso.'],
      C1: ['Gli studenti avanzati affinano la precisione identificando sfumature, mettendo in discussione i presupposti e riformulando argomenti densi con esattezza.', 'Il briefing bilancia prove, incertezza e interessi di vari gruppi senza perdere un tono professionale chiaro.', 'Vale la pena notare che la concessione cambia il registro senza indebolire la tesi centrale.'],
      C2: ['Una padronanza quasi nativa richiede sensibilità al sottotesto, alla cadenza, al registro e ai minimi cambiamenti di enfasi.', 'L’editoriale comprime ironia, implicazione e contrasto stilistico in una frase che sembra ingannevolmente semplice.', 'Tra le righe, il parlante qualifica la promessa pur mantenendo un tono diplomatico raffinato.'],
    },
    French: {
      A1: ['Bonjour, je m’appelle Sam et je viens du Canada.', 'Chaque matin, je me lève tôt et j’étudie le français.', 'Je voudrais du café, du pain et un verre d’eau.'],
      A2: ['Hier, j’ai manqué le bus, alors je suis allé à la gare et j’ai acheté un nouveau billet.', 'Pourriez-vous m’aider à remplir ce formulaire avant mon rendez-vous ?', 'Cet itinéraire est plus rapide, mais ce billet est moins cher.'],
      B1: ['Beaucoup d’étudiants progressent quand ils pratiquent régulièrement, relisent leurs erreurs et expliquent clairement leur stratégie.', 'Le problème principal était l’horaire, mais l’équipe a trouvé une solution pratique.', 'D’après mon expérience, un retour honnête aide à changer les habitudes.'],
      B2: ['Le progrès académique dépend d’une pratique régulière, d’une écoute attentive et de la capacité à remarquer comment les fins de phrase changent le sens.', 'Même si la politique paraît efficace, les preuves suggèrent que l’accès reste inégal.', 'Une proposition équilibrée doit expliquer le compromis, répondre aux objections et définir le résultat attendu.'],
      C1: ['Les apprenants avancés affinent leur précision en repérant les nuances, en questionnant les hypothèses et en reformulant des arguments denses avec exactitude.', 'Le briefing équilibre preuves, incertitude et intérêts de plusieurs groupes sans perdre un ton professionnel clair.', 'Il convient de noter que la concession modifie le registre sans affaiblir la thèse centrale.'],
      C2: ['Une maîtrise quasi native exige une sensibilité au sous-texte, à la cadence, au registre et aux plus petites variations d’accent.', 'L’éditorial condense ironie, implication et contraste stylistique dans une phrase qui paraît faussement simple.', 'Entre les lignes, le locuteur nuance la promesse tout en conservant un ton diplomatique soigné.'],
    },
  };
  return sentences[language];
}

function buildReadings(language: CurriculumLanguage): Record<CefrBand, string[]> {
  const sentenceMap = buildSentences(language);
  return Object.fromEntries(
    Object.entries(sentenceMap).map(([band, sentences]) => [
      band,
      sentences.map((sentence, index) => `${sentence} ${readingExtension(language, band as CefrBand, index)}`),
    ]),
  ) as Record<CefrBand, string[]>;
}

function buildReadingQuestions(language: CurriculumLanguage): Record<CefrBand, ChoiceQuestion[]> {
  const sets = {
    English: [
      q('What is the main purpose of the text?', 'To explain a practical learning situation.', ['To explain a practical learning situation.', 'To advertise a holiday.', 'To cancel a meeting.', 'To describe a sports result.']),
      q('What does the learner need to do next?', 'Review the key words and use them in context.', ['Review the key words and use them in context.', 'Ignore the examples.', 'Change the target language.', 'Skip the exercise.']),
      q('Which detail is supported by the text?', 'Practice is connected to a clear goal.', ['Practice is connected to a clear goal.', 'The speaker refuses to practise.', 'The text has no learning task.', 'The lesson is only about billing.']),
    ],
    German: [
      q('Was ist die Hauptabsicht des Textes?', 'Eine praktische Lernsituation erklären.', ['Eine praktische Lernsituation erklären.', 'Eine Reise bewerben.', 'Einen Termin absagen.', 'Ein Sportergebnis beschreiben.']),
      q('Was soll der Lernende als Nächstes tun?', 'Die Schlüsselwörter wiederholen und im Kontext nutzen.', ['Die Schlüsselwörter wiederholen und im Kontext nutzen.', 'Die Beispiele ignorieren.', 'Die Zielsprache ändern.', 'Die Übung überspringen.']),
      q('Welches Detail passt zum Text?', 'Die Übung ist mit einem klaren Ziel verbunden.', ['Die Übung ist mit einem klaren Ziel verbunden.', 'Der Sprecher lehnt Übung ab.', 'Der Text enthält keine Lernaufgabe.', 'Die Lektion handelt nur von Abrechnung.']),
    ],
    Spanish: [
      q('¿Cuál es el propósito principal del texto?', 'Explicar una situación práctica de aprendizaje.', ['Explicar una situación práctica de aprendizaje.', 'Anunciar unas vacaciones.', 'Cancelar una reunión.', 'Describir un resultado deportivo.']),
      q('¿Qué debe hacer después el estudiante?', 'Repasar las palabras clave y usarlas en contexto.', ['Repasar las palabras clave y usarlas en contexto.', 'Ignorar los ejemplos.', 'Cambiar la lengua meta.', 'Saltar el ejercicio.']),
      q('¿Qué detalle está apoyado por el texto?', 'La práctica está conectada con un objetivo claro.', ['La práctica está conectada con un objetivo claro.', 'El hablante rechaza practicar.', 'El texto no tiene tarea de aprendizaje.', 'La lección trata solo de pagos.']),
    ],
    Italian: [
      q('Qual è lo scopo principale del testo?', 'Spiegare una situazione pratica di apprendimento.', ['Spiegare una situazione pratica di apprendimento.', 'Promuovere una vacanza.', 'Annullare una riunione.', 'Descrivere un risultato sportivo.']),
      q('Che cosa deve fare dopo lo studente?', 'Ripassare le parole chiave e usarle nel contesto.', ['Ripassare le parole chiave e usarle nel contesto.', 'Ignorare gli esempi.', 'Cambiare lingua obiettivo.', 'Saltare l’esercizio.']),
      q('Quale dettaglio è sostenuto dal testo?', 'La pratica è collegata a un obiettivo chiaro.', ['La pratica è collegata a un obiettivo chiaro.', 'Il parlante rifiuta di esercitarsi.', 'Il testo non contiene un compito.', 'La lezione parla solo di pagamenti.']),
    ],
    French: [
      q('Quel est le but principal du texte ?', 'Expliquer une situation pratique d’apprentissage.', ['Expliquer une situation pratique d’apprentissage.', 'Promouvoir des vacances.', 'Annuler une réunion.', 'Décrire un résultat sportif.']),
      q('Que doit faire ensuite l’apprenant ?', 'Revoir les mots clés et les utiliser en contexte.', ['Revoir les mots clés et les utiliser en contexte.', 'Ignorer les exemples.', 'Changer de langue cible.', 'Sauter l’exercice.']),
      q('Quel détail est soutenu par le texte ?', 'La pratique est liée à un objectif clair.', ['La pratique est liée à un objectif clair.', 'Le locuteur refuse de pratiquer.', 'Le texte ne contient aucune tâche.', 'La leçon parle seulement de paiement.']),
    ],
  } satisfies Record<CurriculumLanguage, ChoiceQuestion[]>;

  return repeatQuestionsByBand(sets[language]);
}

function buildListeningQuestions(language: CurriculumLanguage): Record<CefrBand, ChoiceQuestion[]> {
  const sentences = buildSentences(language);
  return Object.fromEntries(
    Object.entries(sentences).map(([band, items]) => [
      band,
      items.map((sentence, index) => q(listeningPrompt(language), sentence, rotate(items, index).slice(0, 4))),
    ]),
  ) as Record<CefrBand, ChoiceQuestion[]>;
}

function buildGrammarQuestions(language: CurriculumLanguage): Record<CefrBand, ChoiceQuestion[]> {
  const questions: Record<CurriculumLanguage, Record<CefrBand, ChoiceQuestion[]>> = {
    English: {
      A1: [q('Choose the correct sentence.', 'She works in an office.', ['She works in an office.', 'She work in an office.', 'She working office.', 'She to work office.'])],
      A2: [q('Choose the best connector.', 'I stayed home because I felt tired.', ['I stayed home because I felt tired.', 'I stayed home but I felt tired.', 'I stayed home although because tired.', 'I stayed home so tired because.'])],
      B1: [q('Choose the best relative clause.', 'The course that I joined last month is useful.', ['The course that I joined last month is useful.', 'The course who I joined last month is useful.', 'The course I joined it is useful.', 'The course which joined me is useful.'])],
      B2: [q('Choose the strongest formal sentence.', 'Although the evidence is limited, the trend is worth monitoring.', ['Although the evidence is limited, the trend is worth monitoring.', 'Because evidence limited, trend monitor.', 'The trend worth because limited evidence.', 'Evidence is limited but although trend.'])],
      C1: [q('Choose the best hedged claim.', 'The findings appear to suggest a gradual shift in user behavior.', ['The findings appear to suggest a gradual shift in user behavior.', 'The findings absolutely prove every user changed.', 'The findings maybe sort of something.', 'The findings is suggesting shift gradual.'])],
      C2: [q('Choose the most stylistically controlled sentence.', 'The phrasing is economical, but its implication is deliberately unsettling.', ['The phrasing is economical, but its implication is deliberately unsettling.', 'The words are short and kind of scary maybe.', 'It says little because it means too many.', 'The implication deliberately is phrase economical.'])],
    },
    German: {
      A1: [q('Wähle den korrekten Satz.', 'Sie arbeitet in einem Büro.', ['Sie arbeitet in einem Büro.', 'Sie arbeiten in einem Büro.', 'Sie in einem Büro arbeitet.', 'Sie arbeitet Büro einem.'])],
      A2: [q('Wähle den besten Nebensatz.', 'Ich bleibe zu Hause, weil ich müde bin.', ['Ich bleibe zu Hause, weil ich müde bin.', 'Ich bleibe zu Hause, weil bin ich müde.', 'Ich bleibe zu Hause, aber weil müde.', 'Ich bleibe zu Hause, ich weil müde bin.'])],
      B1: [q('Wähle den passenden Relativsatz.', 'Der Kurs, den ich letzten Monat begonnen habe, ist nützlich.', ['Der Kurs, den ich letzten Monat begonnen habe, ist nützlich.', 'Der Kurs, der ich begonnen habe, ist nützlich.', 'Der Kurs, ich ihn begonnen habe, ist nützlich.', 'Der Kurs, den habe ich begonnen, ist nützlich.'])],
      B2: [q('Wähle den stärksten formellen Satz.', 'Obwohl die Belege begrenzt sind, sollte der Trend beobachtet werden.', ['Obwohl die Belege begrenzt sind, sollte der Trend beobachtet werden.', 'Weil Belege begrenzt, Trend beobachten.', 'Der Trend sollte, obwohl die Belege.', 'Belege begrenzt sind aber obwohl Trend.'])],
      C1: [q('Wähle die beste vorsichtige These.', 'Die Ergebnisse deuten offenbar auf eine allmähliche Veränderung des Nutzerverhaltens hin.', ['Die Ergebnisse deuten offenbar auf eine allmähliche Veränderung des Nutzerverhaltens hin.', 'Die Ergebnisse beweisen absolut, dass alle Nutzer anders handeln.', 'Die Ergebnisse vielleicht irgendwie etwas.', 'Die Ergebnisse deutet Veränderung allmählich.'])],
      C2: [q('Wähle den stilistisch präzisesten Satz.', 'Die Formulierung ist knapp, doch ihre Implikation wirkt bewusst beunruhigend.', ['Die Formulierung ist knapp, doch ihre Implikation wirkt bewusst beunruhigend.', 'Die Wörter sind kurz und irgendwie komisch.', 'Es sagt wenig, weil es zu viel meint.', 'Die Implikation bewusst ist Formulierung knapp.'])],
    },
    Spanish: {
      A1: [q('Elige la frase correcta.', 'Ella trabaja en una oficina.', ['Ella trabaja en una oficina.', 'Ella trabajar en una oficina.', 'Ella trabajando oficina.', 'Ella trabaja oficina una.'])],
      A2: [q('Elige el mejor conector.', 'Me quedé en casa porque estaba cansado.', ['Me quedé en casa porque estaba cansado.', 'Me quedé en casa pero porque cansado.', 'Me quedé casa aunque porque cansado.', 'Me quedé en casa así que porque.'])],
      B1: [q('Elige la mejor oración relativa.', 'El curso que empecé el mes pasado es útil.', ['El curso que empecé el mes pasado es útil.', 'El curso quien empecé el mes pasado es útil.', 'El curso lo empecé es útil que.', 'El curso que me empezó es útil.'])],
      B2: [q('Elige la frase formal más sólida.', 'Aunque la evidencia es limitada, conviene observar la tendencia.', ['Aunque la evidencia es limitada, conviene observar la tendencia.', 'Porque evidencia limitada, mirar tendencia.', 'La tendencia conviene aunque limitada evidencia.', 'Evidencia limitada pero aunque tendencia.'])],
      C1: [q('Elige la afirmación mejor matizada.', 'Los resultados parecen sugerir un cambio gradual en el comportamiento de los usuarios.', ['Los resultados parecen sugerir un cambio gradual en el comportamiento de los usuarios.', 'Los resultados prueban absolutamente que todos cambiaron.', 'Los resultados quizá algo más o menos.', 'Los resultados sugiere cambio gradual.'])],
      C2: [q('Elige la frase con mayor control estilístico.', 'La formulación es económica, pero su implicación resulta deliberadamente inquietante.', ['La formulación es económica, pero su implicación resulta deliberadamente inquietante.', 'Las palabras son cortas y algo raras.', 'Dice poco porque significa demasiado.', 'La implicación deliberadamente es formulación económica.'])],
    },
    Italian: {
      A1: [q('Scegli la frase corretta.', 'Lei lavora in un ufficio.', ['Lei lavora in un ufficio.', 'Lei lavorare in un ufficio.', 'Lei lavorando ufficio.', 'Lei lavora ufficio un.'])],
      A2: [q('Scegli il connettore migliore.', 'Sono rimasto a casa perché ero stanco.', ['Sono rimasto a casa perché ero stanco.', 'Sono rimasto a casa ma perché stanco.', 'Sono rimasto casa anche se perché stanco.', 'Sono rimasto a casa quindi perché.'])],
      B1: [q('Scegli la frase relativa migliore.', 'Il corso che ho iniziato il mese scorso è utile.', ['Il corso che ho iniziato il mese scorso è utile.', 'Il corso chi ho iniziato il mese scorso è utile.', 'Il corso l’ho iniziato è utile che.', 'Il corso che mi ha iniziato è utile.'])],
      B2: [q('Scegli la frase formale più solida.', 'Sebbene le prove siano limitate, la tendenza merita attenzione.', ['Sebbene le prove siano limitate, la tendenza merita attenzione.', 'Perché prove limitate, guardare tendenza.', 'La tendenza merita sebbene prove.', 'Prove limitate ma sebbene tendenza.'])],
      C1: [q('Scegli l’affermazione meglio sfumata.', 'I risultati sembrano suggerire un cambiamento graduale nel comportamento degli utenti.', ['I risultati sembrano suggerire un cambiamento graduale nel comportamento degli utenti.', 'I risultati provano assolutamente che tutti sono cambiati.', 'I risultati forse qualcosa più o meno.', 'I risultati suggerisce cambiamento graduale.'])],
      C2: [q('Scegli la frase con maggiore controllo stilistico.', 'La formulazione è economica, ma la sua implicazione è deliberatamente inquietante.', ['La formulazione è economica, ma la sua implicazione è deliberatamente inquietante.', 'Le parole sono corte e un po’ strane.', 'Dice poco perché significa troppo.', 'L’implicazione deliberatamente è formulazione economica.'])],
    },
    French: {
      A1: [q('Choisis la phrase correcte.', 'Elle travaille dans un bureau.', ['Elle travaille dans un bureau.', 'Elle travailler dans un bureau.', 'Elle travaillant bureau.', 'Elle travaille bureau un.'])],
      A2: [q('Choisis le meilleur connecteur.', 'Je suis resté à la maison parce que j’étais fatigué.', ['Je suis resté à la maison parce que j’étais fatigué.', 'Je suis resté à la maison mais parce que fatigué.', 'Je suis resté maison bien que parce que fatigué.', 'Je suis resté à la maison donc parce que.'])],
      B1: [q('Choisis la meilleure proposition relative.', 'Le cours que j’ai commencé le mois dernier est utile.', ['Le cours que j’ai commencé le mois dernier est utile.', 'Le cours qui j’ai commencé le mois dernier est utile.', 'Le cours je l’ai commencé est utile que.', 'Le cours qui m’a commencé est utile.'])],
      B2: [q('Choisis la phrase formelle la plus solide.', 'Bien que les preuves soient limitées, la tendance mérite d’être suivie.', ['Bien que les preuves soient limitées, la tendance mérite d’être suivie.', 'Parce que preuves limitées, regarder tendance.', 'La tendance mérite bien que preuves.', 'Preuves limitées mais bien que tendance.'])],
      C1: [q('Choisis l’affirmation la mieux nuancée.', 'Les résultats semblent suggérer une évolution graduelle du comportement des utilisateurs.', ['Les résultats semblent suggérer une évolution graduelle du comportement des utilisateurs.', 'Les résultats prouvent absolument que tous ont changé.', 'Les résultats peut-être quelque chose.', 'Les résultats suggère changement graduel.'])],
      C2: [q('Choisis la phrase la plus maîtrisée stylistiquement.', 'La formulation est économique, mais son implication se veut délibérément troublante.', ['La formulation est économique, mais son implication se veut délibérément troublante.', 'Les mots sont courts et un peu bizarres.', 'Cela dit peu parce que cela signifie trop.', 'L’implication délibérément est formulation économique.'])],
    },
  };
  return questions[language];
}

function localizeThemes(language: 'Spanish' | 'Italian' | 'French') {
  const translations: Record<'Spanish' | 'Italian' | 'French', Record<string, string>> = {
    Spanish: {
      Introductions: 'Presentaciones',
      Numbers: 'Números',
      Family: 'Familia',
      'Daily routine': 'Rutina diaria',
      Food: 'Comida',
      City: 'Ciudad',
      Home: 'Casa',
      Shopping: 'Compras',
      Weather: 'Tiempo',
      Transport: 'Transporte',
      Health: 'Salud',
      Review: 'Repaso',
      Plans: 'Planes',
      Appointments: 'Citas',
      Travel: 'Viajes',
      Work: 'Trabajo',
      'Digital life': 'Vida digital',
      Services: 'Servicios',
      Comparisons: 'Comparaciones',
      Stories: 'Historias',
      Rules: 'Reglas',
      Opinions: 'Opiniones',
      Emails: 'Correos electrónicos',
      Checkpoint: 'Control',
      Neighbourhood: 'Barrio',
      Schedules: 'Horarios',
      Invitations: 'Invitaciones',
      'Past weekend': 'El fin de semana pasado',
      'At the doctor': 'En el médico',
      Directions: 'Direcciones',
      Requests: 'Peticiones',
      Preferences: 'Preferencias',
      'Small problems': 'Pequeños problemas',
      'Travel changes': 'Cambios de viaje',
      'Short messages': 'Mensajes breves',
      'A2 review': 'Repaso A2',
      Workday: 'Jornada laboral',
      Housing: 'Vivienda',
      'Customer service': 'Atención al cliente',
      'Public offices': 'Trámites públicos',
      'Simple complaints': 'Quejas sencillas',
      'Local events': 'Eventos locales',
      Advice: 'Consejos',
      'Learning habits': 'Hábitos de aprendizaje',
      'Polite calls': 'Llamadas corteses',
      Experiences: 'Experiencias',
      'Problem solving': 'Resolución de problemas',
      'Study and work': 'Estudio y trabajo',
      Community: 'Comunidad',
      Culture: 'Cultura',
      Environment: 'Medio ambiente',
      Narratives: 'Narraciones',
      'Work communication': 'Comunicación laboral',
      'News stories': 'Noticias',
      Recommendations: 'Recomendaciones',
      'Argument structure': 'Estructura argumentativa',
      'Data and trends': 'Datos y tendencias',
      Debate: 'Debate',
      Negotiation: 'Negociación',
      'Risk and tradeoffs': 'Riesgos y compensaciones',
      'Nuance and register': 'Matiz y registro',
      'Academic synthesis': 'Síntesis académica',
      Subtext: 'Subtexto',
      'Idiomatic control': 'Control idiomático',
      'Near-native synthesis': 'Síntesis casi nativa',
      'C2 mastery exam': 'Examen de maestría C2',
    },
    Italian: {
      Introductions: 'Presentazioni',
      Numbers: 'Numeri',
      Family: 'Famiglia',
      'Daily routine': 'Routine quotidiana',
      Food: 'Cibo',
      City: 'Città',
      Home: 'Casa',
      Shopping: 'Acquisti',
      Weather: 'Tempo',
      Transport: 'Trasporti',
      Health: 'Salute',
      Review: 'Ripasso',
      Plans: 'Piani',
      Appointments: 'Appuntamenti',
      Travel: 'Viaggi',
      Work: 'Lavoro',
      'Digital life': 'Vita digitale',
      Services: 'Servizi',
      Comparisons: 'Confronti',
      Stories: 'Storie',
      Rules: 'Regole',
      Opinions: 'Opinioni',
      Emails: 'Email',
      Checkpoint: 'Verifica',
      Neighbourhood: 'Quartiere',
      Schedules: 'Orari',
      Invitations: 'Inviti',
      'Past weekend': 'Lo scorso fine settimana',
      'At the doctor': 'Dal medico',
      Directions: 'Indicazioni',
      Requests: 'Richieste',
      Preferences: 'Preferenze',
      'Small problems': 'Piccoli problemi',
      'Travel changes': 'Cambi di viaggio',
      'Short messages': 'Messaggi brevi',
      'A2 review': 'Ripasso A2',
      Workday: 'Giornata lavorativa',
      Housing: 'Abitazione',
      'Customer service': 'Servizio clienti',
      'Public offices': 'Uffici pubblici',
      'Simple complaints': 'Reclami semplici',
      'Local events': 'Eventi locali',
      Advice: 'Consigli',
      'Learning habits': 'Abitudini di studio',
      'Polite calls': 'Telefonate cortesi',
      Experiences: 'Esperienze',
      'Problem solving': 'Soluzione dei problemi',
      'Study and work': 'Studio e lavoro',
      Community: 'Comunità',
      Culture: 'Cultura',
      Environment: 'Ambiente',
      Narratives: 'Narrazioni',
      'Work communication': 'Comunicazione professionale',
      'News stories': 'Notizie',
      Recommendations: 'Raccomandazioni',
      'Argument structure': 'Struttura argomentativa',
      'Data and trends': 'Dati e tendenze',
      Debate: 'Dibattito',
      Negotiation: 'Negoziazione',
      'Risk and tradeoffs': 'Rischi e compromessi',
      'Nuance and register': 'Sfumatura e registro',
      'Academic synthesis': 'Sintesi accademica',
      Subtext: 'Sottotesto',
      'Idiomatic control': 'Controllo idiomatico',
      'Near-native synthesis': 'Sintesi quasi nativa',
      'C2 mastery exam': 'Esame di padronanza C2',
    },
    French: {
      Introductions: 'Présentations',
      Numbers: 'Nombres',
      Family: 'Famille',
      'Daily routine': 'Routine quotidienne',
      Food: 'Nourriture',
      City: 'Ville',
      Home: 'Maison',
      Shopping: 'Achats',
      Weather: 'Météo',
      Transport: 'Transport',
      Health: 'Santé',
      Review: 'Révision',
      Plans: 'Projets',
      Appointments: 'Rendez-vous',
      Travel: 'Voyages',
      Work: 'Travail',
      'Digital life': 'Vie numérique',
      Services: 'Services',
      Comparisons: 'Comparaisons',
      Stories: 'Récits',
      Rules: 'Règles',
      Opinions: 'Opinions',
      Emails: 'Courriels',
      Checkpoint: 'Bilan',
      Neighbourhood: 'Quartier',
      Schedules: 'Horaires',
      Invitations: 'Invitations',
      'Past weekend': 'Le week-end dernier',
      'At the doctor': 'Chez le médecin',
      Directions: 'Itinéraires',
      Requests: 'Demandes',
      Preferences: 'Préférences',
      'Small problems': 'Petits problèmes',
      'Travel changes': 'Changements de voyage',
      'Short messages': 'Messages courts',
      'A2 review': 'Révision A2',
      Workday: 'Journée de travail',
      Housing: 'Logement',
      'Customer service': 'Service client',
      'Public offices': 'Administrations',
      'Simple complaints': 'Réclamations simples',
      'Local events': 'Événements locaux',
      Advice: 'Conseils',
      'Learning habits': 'Habitudes d’apprentissage',
      'Polite calls': 'Appels polis',
      Experiences: 'Expériences',
      'Problem solving': 'Résolution de problèmes',
      'Study and work': 'Études et travail',
      Community: 'Communauté',
      Culture: 'Culture',
      Environment: 'Environnement',
      Narratives: 'Narrations',
      'Work communication': 'Communication professionnelle',
      'News stories': 'Actualités',
      Recommendations: 'Recommandations',
      'Argument structure': 'Structure argumentative',
      'Data and trends': 'Données et tendances',
      Debate: 'Débat',
      Negotiation: 'Négociation',
      'Risk and tradeoffs': 'Risques et compromis',
      'Nuance and register': 'Nuance et registre',
      'Academic synthesis': 'Synthèse académique',
      Subtext: 'Sous-texte',
      'Idiomatic control': 'Maîtrise idiomatique',
      'Near-native synthesis': 'Synthèse quasi native',
      'C2 mastery exam': 'Examen de maîtrise C2',
    },
  };

  return Object.fromEntries(
    Object.entries(COMMON_THEMES).map(([level, themes]) => [
      Number(level),
      themes.map((theme) => translations[language][theme] ?? theme),
    ]),
  ) as Record<number, string[]>;
}

function localizeGrammar(language: Exclude<CurriculumLanguage, 'English'>): Record<number, string[]> {
  const labels: Record<Exclude<CurriculumLanguage, 'English'>, Record<CefrBand, string[]>> = {
    German: {
      A1: ['sein und Personalpronomen', 'Zahlen und Pluralformen', 'Possessivartikel', 'Präsens für Routinen', 'Artikel und einfache Nomen', 'Wo-Fragen', 'Präpositionen des Ortes', 'dieser und diese', 'Adjektive zum Wetter', 'Uhrzeiten', 'Körperteile mit haben', 'A1-Wiederholung'],
      A2: ['Zeitangaben und möchte', 'Tage mit am und um', 'Perfekt mit haben', 'dritte Person im Präsens', 'Imperativ', 'höfliche Fragen', 'Komparativ', 'Perfekt mit sein', 'Modalverben', 'weil-Sätze', 'E-Mail-Formeln', 'A2-Wiederholung'],
      B1: ['Erzähltempora', 'Konnektoren', 'Meinungssätze', 'Relativsätze', 'Ursache und Folge', 'Gegensatz und Einschränkung', 'indirekte Erfahrung', 'Problem-Lösung-Struktur', 'Mengenangaben', 'Kollokationen', 'Absatzkohäsion', 'B1-Wiederholung'],
      B2: ['These und Begründung', 'Nominalisierung', 'komplexe Nominalgruppen', 'Trendsprache', 'Positionsmarker', 'Konzessivsätze', 'Quellenbezug', 'Fallanalyse', 'formelles Register', 'Präsentationssignale', 'ausgewogene Argumentation', 'B2-Wiederholung'],
      C1: ['Registerwechsel', 'Hedging und Präzision', 'Synthesesätze', 'professioneller Widerspruch', 'implizite Bedeutung', 'redaktionelle Kohäsion', 'Stakeholder-Framing', 'Umformulierung', 'Interviewdiskurs', 'Risikoeinschränkung', 'anspruchsvolle Korrespondenz', 'C1-Wiederholung'],
      C2: ['idiomatische Nuance', 'Subtextkontrolle', 'verdichtete Argumentation', 'Expertenhaltung', 'Ellipse und Implikation', 'Ironiesignale', 'formale Präzision', 'Rekonstruktion schneller Sprache', 'ethische Einschränkung', 'Diskursstrategie', 'Mikro-Editing', 'C2-Wiederholung'],
    },
    Spanish: {
      A1: ['ser, estar y pronombres', 'números y plurales', 'posesivos', 'presente para rutinas', 'artículos y nombres básicos', 'preguntas con dónde', 'preposiciones de lugar', 'este y esa', 'adjetivos del tiempo', 'expresiones de hora', 'partes del cuerpo con tener', 'repaso A1'],
      A2: ['querer y tiempo futuro', 'días y horas', 'pretérito perfecto básico', 'tercera persona en presente', 'imperativo', 'preguntas corteses', 'comparativos', 'pretérito indefinido básico', 'verbos modales', 'oraciones con porque', 'fórmulas de correo', 'repaso A2'],
      B1: ['tiempos narrativos', 'conectores', 'oraciones de opinión', 'oraciones relativas', 'causa y efecto', 'contraste y concesión', 'experiencias reportadas', 'estructura problema-solución', 'cuantificadores', 'colocaciones', 'cohesión de párrafo', 'repaso B1'],
      B2: ['tesis y apoyo', 'nominalización', 'grupos nominales complejos', 'lenguaje de tendencias', 'marcadores de postura', 'concesión', 'atribución de fuentes', 'análisis de casos', 'registro formal', 'señalización de presentaciones', 'argumentación equilibrada', 'repaso B2'],
      C1: ['cambios de registro', 'matización y precisión', 'síntesis compleja', 'desacuerdo profesional', 'significado implícito', 'cohesión editorial', 'marco de actores', 'reformulación', 'discurso de entrevista', 'cualificación del riesgo', 'correspondencia avanzada', 'repaso C1'],
      C2: ['matiz idiomático', 'control del subtexto', 'argumentación condensada', 'postura experta', 'elipsis e implicación', 'marcas de ironía', 'precisión formal', 'reconstrucción de habla rápida', 'cualificación ética', 'estrategia discursiva', 'microedición', 'repaso C2'],
    },
    Italian: {
      A1: ['essere, stare e pronomi', 'numeri e plurali', 'possessivi', 'presente per routine', 'articoli e nomi di base', 'domande con dove', 'preposizioni di luogo', 'questo e quella', 'aggettivi del tempo', 'espressioni dell’ora', 'parti del corpo con avere', 'ripasso A1'],
      A2: ['volere e tempo futuro', 'giorni e orari', 'passato prossimo di base', 'terza persona al presente', 'imperativo', 'domande cortesi', 'comparativi', 'passato remoto introduttivo', 'verbi modali', 'frasi con perché', 'formule email', 'ripasso A2'],
      B1: ['tempi narrativi', 'connettori', 'frasi di opinione', 'frasi relative', 'causa ed effetto', 'contrasto e concessione', 'esperienze riportate', 'struttura problema-soluzione', 'quantificatori', 'collocazioni', 'coesione del paragrafo', 'ripasso B1'],
      B2: ['tesi e supporto', 'nominalizzazione', 'gruppi nominali complessi', 'linguaggio delle tendenze', 'marcatori di posizione', 'concessione', 'attribuzione delle fonti', 'analisi di casi', 'registro formale', 'segnali di presentazione', 'argomentazione equilibrata', 'ripasso B2'],
      C1: ['cambi di registro', 'sfumatura e precisione', 'sintesi complessa', 'disaccordo professionale', 'significato implicito', 'coesione editoriale', 'inquadramento degli stakeholder', 'riformulazione', 'discorso d’intervista', 'qualificazione del rischio', 'corrispondenza avanzata', 'ripasso C1'],
      C2: ['sfumatura idiomatica', 'controllo del sottotesto', 'argomentazione condensata', 'posizione esperta', 'ellissi e implicazione', 'segnali di ironia', 'precisione formale', 'ricostruzione del parlato rapido', 'qualificazione etica', 'strategia discorsiva', 'microrevisione', 'ripasso C2'],
    },
    French: {
      A1: ['être, avoir et pronoms', 'nombres et pluriels', 'possessifs', 'présent des routines', 'articles et noms simples', 'questions avec où', 'prépositions de lieu', 'ce et cette', 'adjectifs de météo', 'expressions de l’heure', 'parties du corps avec avoir', 'révision A1'],
      A2: ['vouloir et futur proche', 'jours et heures', 'passé composé de base', 'troisième personne au présent', 'impératif', 'questions polies', 'comparatifs', 'récit au passé', 'verbes modaux', 'phrases avec parce que', 'formules de courriel', 'révision A2'],
      B1: ['temps narratifs', 'connecteurs', 'phrases d’opinion', 'propositions relatives', 'cause et conséquence', 'contraste et concession', 'expérience rapportée', 'structure problème-solution', 'quantificateurs', 'collocations', 'cohésion du paragraphe', 'révision B1'],
      B2: ['thèse et soutien', 'nominalisation', 'groupes nominaux complexes', 'langage des tendances', 'marqueurs de position', 'concession', 'attribution des sources', 'analyse de cas', 'registre formel', 'signalisation de présentation', 'argumentation équilibrée', 'révision B2'],
      C1: ['changements de registre', 'nuance et précision', 'synthèse complexe', 'désaccord professionnel', 'sens implicite', 'cohésion éditoriale', 'cadrage des parties prenantes', 'reformulation', 'discours d’entretien', 'qualification du risque', 'correspondance avancée', 'révision C1'],
      C2: ['nuance idiomatique', 'maîtrise du sous-texte', 'argumentation condensée', 'position d’expert', 'ellipse et implication', 'marques d’ironie', 'précision formelle', 'reconstruction du débit rapide', 'qualification éthique', 'stratégie discursive', 'microédition', 'révision C2'],
    },
  };

  return Object.fromEntries(
    CURRICULUM_LEVELS.map((level) => [level.levelNumber, labels[language][level.cefrLevel]]),
  ) as Record<number, string[]>;
}

function englishInstruction(skill: CurriculumSkill, seed: LessonSeed) {
  const shared = `Lesson goal: ${seed.canDo}`;
  if (skill === 'dictation') return `Listen, then type the target sentence exactly. ${shared}`;
  if (skill === 'writing') return `Write a response using the lesson vocabulary. ${shared}`;
  if (skill === 'speaking') return `Answer aloud with a complete sentence. ${shared}`;
  if (skill === 'conversation') return `Complete the roleplay naturally. ${shared}`;
  if (skill === 'pronunciation') return `Repeat the model sentence and focus on ${seed.pronunciation}.`;
  if (skill === 'reading') return `Read the text and answer the question. ${shared}`;
  if (skill === 'listening') return `Listen to the model and choose the exact meaning or sentence. ${shared}`;
  if (skill === 'grammar') return `Choose the sentence that correctly uses ${seed.grammarFocus}.`;
  return shared;
}

function germanInstruction(skill: CurriculumSkill, seed: LessonSeed) {
  const shared = `Lernziel: ${seed.canDo}`;
  if (skill === 'dictation') return `Höre zu und tippe den Zielsatz genau ab. ${shared}`;
  if (skill === 'writing') return `Schreibe eine Antwort mit dem Wortschatz der Lektion. ${shared}`;
  if (skill === 'speaking') return `Antworte laut mit einem ganzen Satz. ${shared}`;
  if (skill === 'conversation') return `Führe das Rollenspiel natürlich weiter. ${shared}`;
  if (skill === 'pronunciation') return `Sprich den Modellsatz nach und achte auf ${seed.pronunciation}.`;
  if (skill === 'reading') return `Lies den Text und beantworte die Frage. ${shared}`;
  if (skill === 'listening') return `Höre das Modell und wähle die genaue Bedeutung oder den genauen Satz. ${shared}`;
  if (skill === 'grammar') return `Wähle den Satz, der ${seed.grammarFocus} korrekt nutzt.`;
  return shared;
}

function localizedInstruction(language: 'Spanish' | 'Italian' | 'French', skill: CurriculumSkill, seed: LessonSeed) {
  const copy = {
    Spanish: {
      shared: `Objetivo: ${seed.canDo}`,
      dictation: 'Escucha y escribe la frase meta exactamente.',
      writing: 'Escribe una respuesta con el vocabulario de la lección.',
      speaking: 'Responde en voz alta con una frase completa.',
      conversation: 'Completa el diálogo de forma natural.',
      pronunciation: `Repite la frase modelo y enfócate en ${seed.pronunciation}.`,
      reading: 'Lee el texto y responde la pregunta.',
      grammar: `Elige la frase que usa correctamente ${seed.grammarFocus}.`,
    },
    Italian: {
      shared: `Obiettivo: ${seed.canDo}`,
      dictation: 'Ascolta e scrivi la frase modello esattamente.',
      writing: 'Scrivi una risposta con il vocabolario della lezione.',
      speaking: 'Rispondi ad alta voce con una frase completa.',
      conversation: 'Completa il dialogo in modo naturale.',
      pronunciation: `Ripeti la frase modello e concentrati su ${seed.pronunciation}.`,
      reading: 'Leggi il testo e rispondi alla domanda.',
      grammar: `Scegli la frase che usa correttamente ${seed.grammarFocus}.`,
    },
    French: {
      shared: `Objectif : ${seed.canDo}`,
      dictation: 'Écoute et écris exactement la phrase cible.',
      writing: 'Rédige une réponse avec le vocabulaire de la leçon.',
      speaking: 'Réponds à voix haute avec une phrase complète.',
      conversation: 'Complète le dialogue de façon naturelle.',
      pronunciation: `Répète la phrase modèle et concentre-toi sur ${seed.pronunciation}.`,
      reading: 'Lis le texte et réponds à la question.',
      grammar: `Choisis la phrase qui utilise correctement ${seed.grammarFocus}.`,
    },
  }[language];

  if (skill === 'dictation') return `${copy.dictation} ${copy.shared}`;
  if (skill === 'writing') return `${copy.writing} ${copy.shared}`;
  if (skill === 'speaking') return `${copy.speaking} ${copy.shared}`;
  if (skill === 'conversation') return `${copy.conversation} ${copy.shared}`;
  if (skill === 'pronunciation') return copy.pronunciation;
  if (skill === 'reading') return `${copy.reading} ${copy.shared}`;
  if (skill === 'grammar') return copy.grammar;
  return copy.shared;
}

function localizedObjective(language: 'Spanish' | 'Italian' | 'French', theme: string, profile: LevelProfile) {
  if (language === 'Spanish') return `desarrollar control ${profile.label} para ${theme.toLowerCase()} con vocabulario preciso y estructura natural.`;
  if (language === 'Italian') return `sviluppare controllo ${profile.label} su ${theme.toLowerCase()} con vocabolario preciso e struttura naturale.`;
  return `développer une maîtrise ${profile.label} de ${theme.toLowerCase()} avec un vocabulaire précis et une structure naturelle.`;
}

function localizedCanDo(language: 'Spanish' | 'Italian' | 'French', theme: string, profile: LevelProfile) {
  if (language === 'Spanish') return `Puedo manejar ${theme.toLowerCase()} en ${profile.label} con lenguaje apropiado para ${profile.cefrLevel}.`;
  if (language === 'Italian') return `So gestire ${theme.toLowerCase()} a livello ${profile.label} con lingua adatta al ${profile.cefrLevel}.`;
  return `Je peux gérer ${theme.toLowerCase()} au niveau ${profile.label} avec une langue adaptée au ${profile.cefrLevel}.`;
}

function writingTask(language: CurriculumLanguage, theme: string, profile: LevelProfile) {
  const tasks: Record<CurriculumLanguage, Record<LevelProfile['intensity'], string>> = {
    English: {
      foundation: `Write three simple sentences about ${theme.toLowerCase()}.`,
      survival: `Write a short practical message about ${theme.toLowerCase()} with one reason.`,
      independent: `Write a connected paragraph about ${theme.toLowerCase()} with a problem and solution.`,
      upper: `Write a structured explanation about ${theme.toLowerCase()} with evidence and contrast.`,
      advanced: `Write a precise professional response about ${theme.toLowerCase()} with nuance and register control.`,
      mastery: `Write a polished, stylistically controlled response about ${theme.toLowerCase()} with implicit meaning and precise qualification.`,
    },
    German: {
      foundation: `Schreibe drei einfache Sätze über ${theme.toLowerCase()}.`,
      survival: `Schreibe eine kurze praktische Nachricht über ${theme.toLowerCase()} mit einem Grund.`,
      independent: `Schreibe einen zusammenhängenden Absatz über ${theme.toLowerCase()} mit Problem und Lösung.`,
      upper: `Schreibe eine strukturierte Erklärung über ${theme.toLowerCase()} mit Beleg und Gegensatz.`,
      advanced: `Schreibe eine präzise berufliche Antwort über ${theme.toLowerCase()} mit Nuance und Registerkontrolle.`,
      mastery: `Schreibe eine geschliffene, stilistisch kontrollierte Antwort über ${theme.toLowerCase()} mit Subtext und genauer Einschränkung.`,
    },
    Spanish: {
      foundation: `Escribe tres frases sencillas sobre ${theme.toLowerCase()}.`,
      survival: `Escribe un mensaje práctico breve sobre ${theme.toLowerCase()} con una razón.`,
      independent: `Escribe un párrafo conectado sobre ${theme.toLowerCase()} con problema y solución.`,
      upper: `Escribe una explicación estructurada sobre ${theme.toLowerCase()} con evidencia y contraste.`,
      advanced: `Escribe una respuesta profesional precisa sobre ${theme.toLowerCase()} con matiz y control de registro.`,
      mastery: `Escribe una respuesta pulida y estilísticamente controlada sobre ${theme.toLowerCase()} con significado implícito y matización precisa.`,
    },
    Italian: {
      foundation: `Scrivi tre frasi semplici su ${theme.toLowerCase()}.`,
      survival: `Scrivi un breve messaggio pratico su ${theme.toLowerCase()} con una ragione.`,
      independent: `Scrivi un paragrafo collegato su ${theme.toLowerCase()} con problema e soluzione.`,
      upper: `Scrivi una spiegazione strutturata su ${theme.toLowerCase()} con prove e contrasto.`,
      advanced: `Scrivi una risposta professionale precisa su ${theme.toLowerCase()} con sfumatura e controllo del registro.`,
      mastery: `Scrivi una risposta rifinita e stilisticamente controllata su ${theme.toLowerCase()} con significato implicito e qualificazione precisa.`,
    },
    French: {
      foundation: `Écris trois phrases simples sur ${theme.toLowerCase()}.`,
      survival: `Écris un court message pratique sur ${theme.toLowerCase()} avec une raison.`,
      independent: `Écris un paragraphe lié sur ${theme.toLowerCase()} avec un problème et une solution.`,
      upper: `Écris une explication structurée sur ${theme.toLowerCase()} avec preuve et contraste.`,
      advanced: `Rédige une réponse professionnelle précise sur ${theme.toLowerCase()} avec nuance et maîtrise du registre.`,
      mastery: `Rédige une réponse soignée et stylistiquement maîtrisée sur ${theme.toLowerCase()} avec sens implicite et qualification précise.`,
    },
  };
  return tasks[language][profile.intensity];
}

function speakingPrompt(language: CurriculumLanguage, theme: string, profile: LevelProfile) {
  const prompts: Record<CurriculumLanguage, string> = {
    English: `Speak for ${profile.cefrLevel === 'A1' ? '20 seconds' : profile.cefrLevel === 'A2' ? '30 seconds' : '60 seconds'} about ${theme.toLowerCase()} using the target sentence pattern.`,
    German: `Sprich ${profile.cefrLevel === 'A1' ? '20 Sekunden' : profile.cefrLevel === 'A2' ? '30 Sekunden' : '60 Sekunden'} über ${theme.toLowerCase()} und nutze das Satzmuster.`,
    Spanish: `Habla durante ${profile.cefrLevel === 'A1' ? '20 segundos' : profile.cefrLevel === 'A2' ? '30 segundos' : '60 segundos'} sobre ${theme.toLowerCase()} usando el modelo.`,
    Italian: `Parla per ${profile.cefrLevel === 'A1' ? '20 secondi' : profile.cefrLevel === 'A2' ? '30 secondi' : '60 secondi'} su ${theme.toLowerCase()} usando il modello.`,
    French: `Parle pendant ${profile.cefrLevel === 'A1' ? '20 secondes' : profile.cefrLevel === 'A2' ? '30 secondes' : '60 secondes'} de ${theme.toLowerCase()} en utilisant le modèle.`,
  };
  return prompts[language];
}

function roleplayPrompt(language: CurriculumLanguage, theme: string, profile: LevelProfile) {
  const prompts: Record<CurriculumLanguage, string> = {
    English: `Roleplay a ${profile.label} exchange about ${theme.toLowerCase()}. Ask one question, respond, and close naturally.`,
    German: `Spiele einen ${profile.label}-Dialog über ${theme.toLowerCase()}. Stelle eine Frage, antworte und schließe natürlich ab.`,
    Spanish: `Representa un diálogo ${profile.label} sobre ${theme.toLowerCase()}. Haz una pregunta, responde y cierra de forma natural.`,
    Italian: `Simula uno scambio ${profile.label} su ${theme.toLowerCase()}. Fai una domanda, rispondi e chiudi in modo naturale.`,
    French: `Joue un échange ${profile.label} sur ${theme.toLowerCase()}. Pose une question, réponds et termine naturellement.`,
  };
  return prompts[language];
}

function readingExtension(language: CurriculumLanguage, band: CefrBand, index: number) {
  const extensions: Record<CurriculumLanguage, Record<CefrBand, string[]>> = {
    English: {
      A1: ['The learner repeats the sentence slowly and writes the new words.', 'The text uses short words and clear personal information.', 'The task checks basic meaning and spelling.'],
      A2: ['The situation includes a time, a place, and a simple reason.', 'The learner compares options and chooses the practical one.', 'The message is polite and useful for everyday life.'],
      B1: ['The speaker links events, explains a problem, and gives a practical conclusion.', 'The paragraph includes opinion, reason, and a short recommendation.', 'The task trains connected speech and self-correction.'],
      B2: ['The argument uses evidence, contrast, and a clear conclusion.', 'The text asks the learner to notice register and paragraph structure.', 'The detail matters because it changes the strength of the claim.'],
      C1: ['The writer balances precision with caution and adapts the register to the reader.', 'The text expects inference, synthesis, and careful reformulation.', 'The meaning depends on nuance rather than isolated vocabulary.'],
      C2: ['The style relies on implication, compression, and subtle stance.', 'The reader must infer what is suggested rather than directly stated.', 'The task rewards exact control of tone and micro-meaning.'],
    },
    German: {
      A1: ['Der Lernende wiederholt den Satz langsam und schreibt die neuen Wörter.', 'Der Text nutzt kurze Wörter und klare persönliche Informationen.', 'Die Aufgabe prüft Bedeutung und Rechtschreibung.'],
      A2: ['Die Situation enthält Zeit, Ort und einen einfachen Grund.', 'Der Lernende vergleicht Optionen und wählt die praktische Lösung.', 'Die Nachricht ist höflich und im Alltag nützlich.'],
      B1: ['Der Sprecher verbindet Ereignisse, erklärt ein Problem und nennt ein praktisches Ergebnis.', 'Der Absatz enthält Meinung, Grund und Empfehlung.', 'Die Aufgabe trainiert zusammenhängendes Sprechen und Selbstkorrektur.'],
      B2: ['Das Argument nutzt Belege, Gegensatz und einen klaren Schluss.', 'Der Text verlangt Aufmerksamkeit für Register und Absatzstruktur.', 'Das Detail verändert die Stärke der These.'],
      C1: ['Der Text verbindet Präzision mit Vorsicht und passt das Register an.', 'Er verlangt Schlussfolgerung, Synthese und genaue Umformulierung.', 'Die Bedeutung hängt von Nuancen ab.'],
      C2: ['Der Stil arbeitet mit Implikation, Verdichtung und subtiler Haltung.', 'Der Leser muss Erschlossenes von Gesagtem trennen.', 'Die Aufgabe belohnt genaue Kontrolle von Ton und Mikro-Bedeutung.'],
    },
    Spanish: {
      A1: ['El estudiante repite la frase despacio y escribe las palabras nuevas.', 'El texto usa palabras cortas e información personal clara.', 'La tarea comprueba significado básico y ortografía.'],
      A2: ['La situación incluye una hora, un lugar y una razón sencilla.', 'El estudiante compara opciones y elige la más práctica.', 'El mensaje es cortés y útil para la vida diaria.'],
      B1: ['El hablante conecta hechos, explica un problema y da una conclusión práctica.', 'El párrafo incluye opinión, razón y recomendación breve.', 'La tarea entrena discurso conectado y autocorrección.'],
      B2: ['El argumento usa evidencia, contraste y una conclusión clara.', 'El texto exige atención al registro y a la estructura del párrafo.', 'El detalle cambia la fuerza de la tesis.'],
      C1: ['El escritor equilibra precisión y cautela y adapta el registro al lector.', 'El texto exige inferencia, síntesis y reformulación cuidadosa.', 'El significado depende de matices, no de palabras aisladas.'],
      C2: ['El estilo se apoya en implicación, condensación y postura sutil.', 'El lector debe inferir lo sugerido y separarlo de lo dicho.', 'La tarea premia el control exacto del tono y del micro-significado.'],
    },
    Italian: {
      A1: ['Lo studente ripete la frase lentamente e scrive le parole nuove.', 'Il testo usa parole brevi e informazioni personali chiare.', 'L’attività controlla significato di base e ortografia.'],
      A2: ['La situazione include un orario, un luogo e una ragione semplice.', 'Lo studente confronta le opzioni e sceglie quella pratica.', 'Il messaggio è cortese e utile nella vita quotidiana.'],
      B1: ['Il parlante collega eventi, spiega un problema e dà una conclusione pratica.', 'Il paragrafo contiene opinione, ragione e breve raccomandazione.', 'L’attività allena discorso collegato e autocorrezione.'],
      B2: ['L’argomento usa prove, contrasto e una conclusione chiara.', 'Il testo richiede attenzione al registro e alla struttura del paragrafo.', 'Il dettaglio cambia la forza della tesi.'],
      C1: ['Lo scrittore bilancia precisione e cautela e adatta il registro al lettore.', 'Il testo richiede inferenza, sintesi e riformulazione accurata.', 'Il significato dipende dalle sfumature, non da parole isolate.'],
      C2: ['Lo stile si basa su implicazione, compressione e posizione sottile.', 'Il lettore deve inferire ciò che è suggerito e distinguerlo da ciò che è detto.', 'L’attività premia il controllo esatto del tono e del micro-significato.'],
    },
    French: {
      A1: ['L’apprenant répète la phrase lentement et écrit les nouveaux mots.', 'Le texte utilise des mots courts et des informations personnelles claires.', 'La tâche vérifie le sens de base et l’orthographe.'],
      A2: ['La situation contient une heure, un lieu et une raison simple.', 'L’apprenant compare les options et choisit la plus pratique.', 'Le message est poli et utile dans la vie quotidienne.'],
      B1: ['Le locuteur relie les événements, explique un problème et donne une conclusion pratique.', 'Le paragraphe contient une opinion, une raison et une brève recommandation.', 'La tâche entraîne le discours lié et l’autocorrection.'],
      B2: ['L’argument utilise des preuves, un contraste et une conclusion claire.', 'Le texte demande de remarquer le registre et la structure du paragraphe.', 'Le détail change la force de la thèse.'],
      C1: ['L’auteur équilibre précision et prudence et adapte le registre au lecteur.', 'Le texte exige inférence, synthèse et reformulation soigneuse.', 'Le sens dépend des nuances plutôt que de mots isolés.'],
      C2: ['Le style repose sur l’implication, la compression et une position subtile.', 'Le lecteur doit inférer ce qui est suggéré plutôt que formulé directement.', 'La tâche récompense la maîtrise exacte du ton et du micro-sens.'],
    },
  };
  return extensions[language][band][index % 3];
}

function repeatQuestionsByBand(questions: ChoiceQuestion[]) {
  return {
    A1: questions,
    A2: questions,
    B1: questions,
    B2: questions,
    C1: questions,
    C2: questions,
  };
}

function listeningPrompt(language: CurriculumLanguage) {
  return {
    English: 'Which sentence did you hear?',
    German: 'Welchen Satz hast du gehört?',
    Spanish: '¿Qué frase escuchaste?',
    Italian: 'Quale frase hai sentito?',
    French: 'Quelle phrase as-tu entendue ?',
  }[language];
}

function q(question: string, answer: string, choices: string[]): ChoiceQuestion {
  return { question, answer, choices: unique([answer, ...choices]).slice(0, 4) };
}

function rotate<T>(items: T[], amount: number) {
  if (items.length === 0) return [];
  const offset = amount % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function tokenizeSentence(sentence: string) {
  return sentence.split(/\s+/).filter(Boolean).map((word, index) => ({
    id: `${index}-${word.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')}`,
    word,
  }));
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
