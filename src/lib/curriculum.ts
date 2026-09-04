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
  | 'vocabulary_choice'
  | 'picture_or_context_match'
  | 'audio_choice'
  | 'listen_and_select'
  | 'listen_for_detail'
  | 'listening_inference'
  | 'speaker_intention'
  | 'dictation_word'
  | 'dictation_sentence'
  | 'dictation_gap'
  | 'gap_fill'
  | 'sentence_order'
  | 'grammar_choice'
  | 'grammar_gap'
  | 'vocabulary_in_context'
  | 'collocation_choice'
  | 'paraphrase_choice'
  | 'sentence_transformation'
  | 'error_correction'
  | 'contextual_grammar'
  | 'reading_main_idea'
  | 'reading_detail'
  | 'reading_inference'
  | 'reference_tracking'
  | 'reading_true_false'
  | 'reading_heading_match'
  | 'paragraph_order'
  | 'pronunciation_repeat'
  | 'minimal_pairs'
  | 'shadowing'
  | 'mini_dialogue'
  | 'guided_speaking'
  | 'free_speaking'
  | 'extended_speaking'
  | 'scenario_response'
  | 'guided_argument'
  | 'guided_writing'
  | 'free_writing'
  | 'functional_writing'
  | 'roleplay'
  | 'stance_detection'
  | 'subtext_inference'
  | 'irony_interpretation'
  | 'register_shift'
  | 'precision_rewrite'
  | 'ambiguity_analysis'
  | 'argument_repair'
  | 'hidden_assumption'
  | 'rhetorical_effect'
  | 'source_synthesis'
  | 'comparative_reading'
  | 'comparative_critique'
  | 'discourse_reconstruction'
  | 'micro_editing'
  | 'strategic_response'
  | 'expert_roleplay'
  | 'advanced_writing'
  | 'synthesis_speaking'
  | 'lesson_test';

export type ScoringMode = 'objective' | 'rule_based' | 'subjective';

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

type LessonSeed = {
  theme: string;
  objective: string;
  canDo: string;
  grammarFocus: string;
  grammarFocusId: string;
  newVocabulary: CurriculumVocabularyItem[];
  reviewVocabulary: CurriculumVocabularyItem[];
  vocabulary: CurriculumVocabularyItem[];
  chunks: CurriculumChunk[];
  pronunciation: string;
  targetSentence: string;
  readingText: string;
  exampleSentences: string[];
  readingQuestion: ChoiceQuestion;
  readingQuestions: ChoiceQuestion[];
  listeningScript: string;
  listeningQuestion: ChoiceQuestion;
  listeningQuestions: ChoiceQuestion[];
  grammarQuestion: ChoiceQuestion;
  grammarItems: ChoiceQuestion[];
  writingTask: WritingTask;
  speakingTask: SpeakingTask;
  roleplay: RoleplayTask;
};

type ChoiceQuestion = {
  question: string;
  answer: string;
  choices: string[];
};

type WritingTask = {
  situation: string;
  audience: string;
  purpose: string;
  expectedOutput: string;
  approximateLength: string;
  usefulLanguage: string[];
  assessmentDimensions: string[];
};

type SpeakingTask = {
  prompt: string;
  expectedDuration: string;
  focus: string[];
  assessmentDimensions: string[];
};

type RoleplayTask = {
  scenario: string;
  learnerRole: string;
  partnerRole: string;
  goal: string;
  successCriteria: string[];
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
  3: ['past time expressions', 'object pronouns', 'requests with could', 'because and so', 'prepositions of movement', 'frequency adverbs', 'basic conditionals', 'preference verbs', 'problem descriptions', 'travel connectors', 'message sequencing', 'A2.1 review'],
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
  const levelExam = buildLevelExam(language, meta, pack.speechLocale, lessons);

  return {
    levelNumber,
    cefrLevel: meta.cefrLevel,
    cefrSubLevel: meta.cefrSubLevel,
    language,
    title: `${language} ${meta.label}`,
    lessons,
    levelExam,
  };
}

function buildLevelExam(
  language: CurriculumLanguage,
  meta: (typeof CURRICULUM_LEVELS)[number],
  locale: string,
  lessons: CurriculumLesson[],
): CurriculumExercise {
  const vocabularySample = lessons.flatMap((lesson) => lesson.newVocabulary.slice(0, 2).map((item) => item.word)).slice(0, 18);
  const grammarSample = lessons.flatMap((lesson) => lesson.grammarItems.slice(0, 1));
  const readingLesson = lessons[Math.floor(lessons.length / 2)];
  const listeningLesson = lessons[Math.max(0, lessons.length - 3)];
  const writingLesson = lessons[Math.max(0, lessons.length - 2)];
  const speakingLesson = lessons[lessons.length - 1];
  const prompt = `${meta.label} exam: vocabulary (${vocabularySample.slice(0, 6).join(', ')}), grammar (${grammarSample
    .slice(0, 4)
    .map((item) => item.question)
    .join(' / ')}), reading, listening, writing, and speaking.`;

  return {
    id: `${slug(language)}-${meta.label.toLowerCase()}-level-exam`,
    type: 'lesson_test',
    skill: 'test',
    title: `${meta.label} Level Exam`,
    instruction: `Complete a mixed ${meta.label} exam covering vocabulary, grammar, listening, reading, writing, and speaking.`,
    content: {
      language,
      locale,
      levelLabel: meta.label,
      lessonIds: lessons.map((lesson) => lesson.id),
      prompt,
      targetSentence: listeningLesson.targetSentence,
      sections: [
        { skill: 'vocabulary', items: vocabularySample },
        { skill: 'grammar', items: grammarSample.slice(0, 6) },
        { skill: 'listening', script: listeningLesson.listeningScript, questions: listeningLesson.listeningQuestions },
        { skill: 'reading', text: readingLesson.readingText, questions: readingLesson.readingQuestions },
        { skill: 'writing', task: writingLesson.writingTask },
        { skill: 'speaking', task: speakingLesson.speakingTask },
      ],
      skillScoreWeights: {
        vocabulary: 15,
        grammar: 20,
        listening: 15,
        reading: 15,
        writing: 20,
        speaking: 15,
      },
      reviewTargets: lessons.map((lesson) => ({
        lessonId: lesson.id,
        grammarFocusId: lesson.grammarFocusId,
        vocabulary: lesson.newVocabulary.slice(0, 2).map((item) => item.word),
      })),
    },
    correctAnswer: {
      listening: listeningLesson.targetSentence,
      grammar: grammarSample.slice(0, 6).map((item) => item.answer),
      reading: readingLesson.readingQuestions.map((item) => item.answer),
    },
    acceptableAnswers: vocabularySample,
    scoringRubric: { taskCompletion: 20, grammar: 20, vocabulary: 20, comprehension: 25, accuracy: 15 },
    minScoreToPass: 75,
  };
}

function buildSeeds(language: CurriculumLanguage, profile: LevelProfile): LessonSeed[] {
  const pack = LANGUAGE_PACKS[language];
  const themes = pack.themes[profile.levelNumber] ?? COMMON_THEMES[profile.levelNumber];
  const grammar = pack.grammar[profile.levelNumber] ?? BASE_GRAMMAR[profile.levelNumber];

  return themes.map((theme, index) => {
    const grammarFocus = coherentGrammarFocus(language, theme, grammar[index % grammar.length], profile.cefrLevel);
    const grammarFocusId = `${slug(language)}-${profile.label.toLowerCase()}-${slug(grammarFocus)}`;
    const newVocabulary = buildLessonVocabulary(language, profile, theme, grammarFocus, index);
    const reviewVocabulary = buildReviewVocabulary(pack.words[profile.cefrLevel], index, newVocabulary.map((item) => item.word));
    const vocabulary = [...newVocabulary, ...reviewVocabulary];
    const chunks = buildLessonChunks(language, profile, theme, grammarFocus, index);
    const exampleSentences = buildExampleSentences(language, profile, theme, grammarFocus, newVocabulary, chunks, index);
    const targetSentence = buildTargetSentence(language, profile, theme, grammarFocus, newVocabulary, index);
    const readingText = buildLessonReading(language, profile, theme, grammarFocus, newVocabulary, chunks, index);
    const readingQuestions = buildLessonReadingQuestions(language, theme, readingText, newVocabulary, profile);
    const listeningScript = buildListeningScript(language, profile, theme, grammarFocus, newVocabulary, index);
    const listeningQuestions = buildLessonListeningQuestions(language, listeningScript, theme, newVocabulary);
    const grammarItems = buildLessonGrammarItems(language, grammarFocus, grammarFocusId, targetSentence, index);
    const writingTask = buildWritingTaskObject(language, theme, profile, grammarFocus, newVocabulary, chunks, index);
    const speakingTask = buildSpeakingTaskObject(language, theme, profile, grammarFocus, newVocabulary, index);
    const roleplay = buildRoleplayTaskObject(language, theme, profile, grammarFocus, index);

    return {
      theme,
      objective: pack.objective(theme, profile),
      canDo: pack.canDo(theme, profile),
      grammarFocus,
      grammarFocusId,
      newVocabulary,
      reviewVocabulary,
      vocabulary,
      chunks,
      pronunciation: pack.pronunciation[profile.cefrLevel],
      targetSentence,
      readingText,
      exampleSentences,
      readingQuestion: readingQuestions[0],
      readingQuestions,
      listeningScript,
      listeningQuestion: listeningQuestions[0],
      listeningQuestions,
      grammarQuestion: grammarItems[0],
      grammarItems,
      writingTask,
      speakingTask,
      roleplay,
    };
  });
}

function coherentGrammarFocus(language: CurriculumLanguage, theme: string, fallback: string, band: CefrBand) {
  const domain = lessonDomain(theme);
  const byDomain = {
    English: {
      planning: band === 'A1' ? 'want to and future time' : 'time clauses and scheduling language',
      digital: band === 'A1' ? 'email openings and closings' : 'digital instructions and polite requests',
      travel: 'prepositions and travel connectors',
      shopping: 'polite questions and articles',
      health: 'symptoms, have, and polite requests',
      work: 'formal requests and workplace register',
      education: 'learning routines and reason clauses',
    },
    German: {
      planning: band === 'A1' ? 'Zeitangaben und möchte' : 'Terminabsprachen und Nebensätze',
      digital: band === 'A1' ? 'E-Mail-Formeln' : 'digitale Anweisungen und höfliche Bitten',
      travel: 'Wegbeschreibung und Präpositionen',
      shopping: 'höfliche Fragen und Artikel',
      health: 'Körper, haben und höfliche Bitten',
      work: 'formelle Bitten und berufliches Register',
      education: 'Lernroutinen und weil-Sätze',
    },
    Spanish: {
      planning: band === 'A1' ? 'querer y tiempo futuro' : 'citas y oraciones temporales',
      digital: band === 'A1' ? 'fórmulas de correo' : 'instrucciones digitales y peticiones corteses',
      travel: 'preposiciones y conectores de viaje',
      shopping: 'preguntas corteses y artículos',
      health: 'cuerpo, tener y peticiones corteses',
      work: 'peticiones formales y registro laboral',
      education: 'rutinas de aprendizaje y porque',
    },
    Italian: {
      planning: band === 'A1' ? 'volere e tempo futuro' : 'appuntamenti e frasi temporali',
      digital: band === 'A1' ? 'formule email' : 'istruzioni digitali e richieste cortesi',
      travel: 'preposizioni e connettori di viaggio',
      shopping: 'domande cortesi e articoli',
      health: 'corpo, avere e richieste cortesi',
      work: 'richieste formali e registro lavorativo',
      education: 'routine di apprendimento e perché',
    },
    French: {
      planning: band === 'A1' ? 'vouloir et futur proche' : 'rendez-vous et propositions temporelles',
      digital: band === 'A1' ? 'formules de courriel' : 'instructions numériques et demandes polies',
      travel: 'prépositions et connecteurs de voyage',
      shopping: 'questions polies et articles',
      health: 'corps, avoir et demandes polies',
      work: 'demandes formelles et registre professionnel',
      education: 'routines d’apprentissage et parce que',
    },
  } satisfies Record<CurriculumLanguage, Partial<Record<string, string>>>;
  return byDomain[language][domain] ?? fallback;
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
    grammarFocusId: seed.grammarFocusId,
    targetSentence: seed.targetSentence,
    readingText: seed.readingText,
    newVocabulary: seed.newVocabulary,
    reviewVocabulary: seed.reviewVocabulary,
    vocabulary: seed.vocabulary,
    chunks: seed.chunks,
    exampleSentences: seed.exampleSentences,
    readingQuestions: seed.readingQuestions,
    listeningScript: seed.listeningScript,
    listeningQuestions: seed.listeningQuestions,
    grammarItems: seed.grammarItems,
    writingTask: seed.writingTask,
    speakingTask: seed.speakingTask,
    roleplay: seed.roleplay,
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
    grammarFocusId: seed.grammarFocusId,
    newVocabulary: seed.newVocabulary.map((item) => item.word),
    reviewVocabulary: seed.reviewVocabulary.map((item) => item.word),
    exampleSentences: seed.exampleSentences,
    readingQuestions: seed.readingQuestions,
    listeningScript: seed.listeningScript,
    listeningQuestions: seed.listeningQuestions,
    grammarItems: seed.grammarItems,
    writingTask: seed.writingTask,
    speakingTask: seed.speakingTask,
    roleplay: seed.roleplay,
    orderTokens: tokenizeSentence(seed.targetSentence),
  };

  return {
    id: `${baseId}-${step.order}-${step.defaultType}`,
    type: step.defaultType,
    skill: step.skill,
    title: step.title,
    instruction: pack.instruction(step.skill, seed),
    content,
    grammarFocusId: seed.grammarFocusId,
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
  if (skill === 'writing') return formatWritingTask(seed.writingTask);
  if (skill === 'speaking') return seed.speakingTask.prompt;
  if (skill === 'conversation') return formatRoleplay(seed.roleplay);
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

function buildReviewVocabulary(words: Array<[string, string, string]>, index: number, excludedWords: string[] = []): CurriculumVocabularyItem[] {
  const excluded = new Set(excludedWords.map(normalizeText));
  return rotate(words, index)
    .filter(([word]) => !excluded.has(normalizeText(word)))
    .slice(0, 2)
    .map(([word, translation, example]) => ({
    word,
    translation,
    example,
    audioText: word,
  }));
}

function buildLessonVocabulary(
  language: CurriculumLanguage,
  profile: LevelProfile,
  theme: string,
  grammarFocus: string,
  index: number,
): CurriculumVocabularyItem[] {
  const domain = lessonDomain(theme);
  const constrainedDomain = domain === 'planning' || domain === 'digital';
  const semanticallyRelated = [
    ...domainVocabularyItems(language, profile.cefrLevel, domain),
    ...realVocabularyItems(language, profile.cefrLevel, theme),
    ...expandedVocabularyItems(language, profile.cefrLevel).filter((item) => relevanceScore(domain, item.term) > 0),
  ];
  const fallback = [...realVocabularyItems(language, profile.cefrLevel, theme), ...expandedVocabularyItems(language, profile.cefrLevel)];
  const source = constrainedDomain ? dedupeLexicalEntries(semanticallyRelated.length >= 12 ? semanticallyRelated : [...semanticallyRelated, ...fallback]) : dedupeLexicalEntries(fallback);
  const seed = `${language}-${profile.label}-${index}-${lessonTopic(language, theme)}`;
  const ordered = [...source]
    .sort((left, right) => {
      const relevance = relevanceScore(domain, right.term) - relevanceScore(domain, left.term);
      return relevance || hashString(`${seed}-${left.term}`) - hashString(`${seed}-${right.term}`);
    });
  const relevant = constrainedDomain ? ordered.filter((item) => relevanceScore(domain, item.term) > 0) : ordered;
  const pool = relevant.length >= 9 ? relevant : ordered;
  const offset = ((index + profile.levelNumber * 5) * 7) % pool.length;
  const items = rotate(pool, offset).slice(0, 9);
  return items.map((item, itemIndex) => {
    const word = item.term;
    const translation = item.meaning;
    const example = vocabularyExample(language, profile, theme, grammarFocus, word, itemIndex);
    return { word, translation, example, audioText: word };
  });
}

function dedupeLexicalEntries(entries: LexicalEntry[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = normalizeText(entry.term);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildLessonChunks(
  language: CurriculumLanguage,
  profile: LevelProfile,
  theme: string,
  grammarFocus: string,
  index: number,
): CurriculumChunk[] {
  return rotate(chunkFrames(language, profile.cefrLevel), index).slice(0, 5).map((frame, frameIndex) => ({
    phrase: frame.phrase(theme),
    meaning: frame.meaning,
    example: chunkExample(language, profile, frame.phrase(theme), frameIndex),
  }));
}

function buildExampleSentences(
  language: CurriculumLanguage,
  profile: LevelProfile,
  theme: string,
  grammarFocus: string,
  vocabulary: CurriculumVocabularyItem[],
  chunks: CurriculumChunk[],
  index: number,
) {
  const scenario = lessonScenario(language, theme, profile.cefrLevel, index);
  return authoredLessonLines(language, profile.cefrLevel, scenario.topic, scenario.setting, scenario.need, grammarFocus, vocabulary, chunks, index + profile.levelNumber * 13).slice(
    0,
    profile.cefrLevel === 'A1' ? 4 : profile.cefrLevel === 'A2' ? 5 : 6,
  );
}

function buildTargetSentence(
  language: CurriculumLanguage,
  profile: LevelProfile,
  theme: string,
  grammarFocus: string,
  vocabulary: CurriculumVocabularyItem[],
  index: number,
) {
  const word = vocabulary[index % Math.max(1, vocabulary.length)].word;
  return lessonScenario(language, theme, profile.cefrLevel, index).target(word);
}

function buildLessonReading(
  language: CurriculumLanguage,
  profile: LevelProfile,
  theme: string,
  grammarFocus: string,
  vocabulary: CurriculumVocabularyItem[],
  chunks: CurriculumChunk[],
  index: number,
) {
  const scenario = lessonScenario(language, theme, profile.cefrLevel, index);
  return authoredLessonLines(language, profile.cefrLevel, scenario.topic, scenario.setting, scenario.need, grammarFocus, vocabulary, chunks, index + profile.levelNumber * 13)
    .slice(0, readingSentenceCount(profile.cefrLevel))
    .join(' ');
}

function buildLessonReadingQuestions(
  language: CurriculumLanguage,
  theme: string,
  readingText: string,
  vocabulary: CurriculumVocabularyItem[],
  profile: LevelProfile,
): ChoiceQuestion[] {
  const labels = questionLabels(language);
  const detail = vocabulary[0].word;
  const groundedDetail = readingText.includes(detail) ? detail : vocabulary.find((item) => readingText.includes(item.word))?.word ?? detail;
  const inference = profile.cefrLevel === 'A1' || profile.cefrLevel === 'A2' ? labels.explicit : labels.inference;
  return [
    q(labels.mainIdea(theme), labels.mainIdeaAnswer(theme), [
      labels.mainIdeaAnswer(theme),
      labels.unrelatedTravel,
      labels.unrelatedBilling,
      labels.unrelatedSports,
    ]),
    q(labels.detail(groundedDetail), labels.detailAnswer(groundedDetail), [
      labels.detailAnswer(groundedDetail),
      labels.falseDetail,
      labels.skipLesson,
      labels.changeLanguage,
    ]),
    q(labels.inferenceQuestion(inference), labels.inferenceAnswer(inference), [
      labels.inferenceAnswer(inference),
      labels.noEvidence,
      labels.oppositeTone,
      labels.unrelatedBilling,
    ]),
    q(labels.vocabularyContext(groundedDetail), labels.detailAnswer(groundedDetail), [
      labels.detailAnswer(groundedDetail),
      labels.falseDetail,
      labels.oppositeTone,
      labels.skipLesson,
    ]),
  ].map((question, index) => ({ ...question, question: `${question.question} ${index === 0 ? '' : ''}`.trim() }));
}

function buildListeningScript(
  language: CurriculumLanguage,
  profile: LevelProfile,
  theme: string,
  grammarFocus: string,
  vocabulary: CurriculumVocabularyItem[],
  index: number,
) {
  const scenario = lessonScenario(language, theme, profile.cefrLevel, index);
  const chunks = buildLessonChunks(language, profile, theme, grammarFocus, index);
  const script = authoredLessonLines(language, profile.cefrLevel, scenario.topic, scenario.setting, scenario.need, grammarFocus, vocabulary, chunks, index + profile.levelNumber * 13)
    .slice(0, profile.cefrLevel === 'A1' ? 4 : 5)
    .join(' ');
  return `${script} ${listeningDetail(language, vocabulary[(index + 3) % vocabulary.length].word, index)}`;
}

function listeningDetail(language: CurriculumLanguage, word: string, index: number) {
  const detail = targetLexeme(language, '', word);
  const variants = {
    English: [`Please call me back today if "${detail}" changes.`, `I will send another message after three about "${detail}".`, `Please confirm "${detail}" before the end of the day.`],
    German: [`Bitte rufen Sie mich heute zurück, falls sich "${detail}" ändert.`, `Ich schicke nach drei Uhr noch eine Nachricht zu "${detail}".`, `Bitte bestätigen Sie "${detail}" bis zum Ende des Tages.`],
    Spanish: [`Llámame hoy si cambia "${detail}".`, `Enviaré otro mensaje después de las tres sobre "${detail}".`, `Confirma "${detail}" antes del final del día.`],
    Italian: [`Chiamami oggi se cambia "${detail}".`, `Manderò un altro messaggio dopo le tre su "${detail}".`, `Conferma "${detail}" entro la fine della giornata.`],
    French: [`Rappelez-moi aujourd’hui si "${detail}" change.`, `J’enverrai un autre message après quinze heures au sujet de "${detail}".`, `Confirmez "${detail}" avant la fin de la journée.`],
  } satisfies Record<CurriculumLanguage, string[]>;
  return variants[language][index % variants[language].length];
}

function buildLessonListeningQuestions(
  language: CurriculumLanguage,
  listeningScript: string,
  theme: string,
  vocabulary: CurriculumVocabularyItem[],
): ChoiceQuestion[] {
  const labels = questionLabels(language);
  return [
    q(labels.listenMain(theme), labels.mainIdeaAnswer(theme), [labels.mainIdeaAnswer(theme), labels.falseDetail, labels.unrelatedBilling, labels.changeLanguage]),
    q(labels.listenDetail(vocabulary[0].word), labels.detailAnswer(vocabulary[0].word), [labels.detailAnswer(vocabulary[0].word), labels.falseDetail, labels.noEvidence, labels.skipLesson]),
    q(labels.listenInference, labels.inferenceAnswer(labels.inference), [labels.inferenceAnswer(labels.inference), labels.oppositeTone, labels.unrelatedSports, labels.unrelatedTravel]),
  ];
}

function buildLessonGrammarItems(
  language: CurriculumLanguage,
  grammarFocus: string,
  grammarFocusId: string,
  targetSentence: string,
  index: number,
): ChoiceQuestion[] {
  const labels = grammarLabels(language);
  return [0, 1, 2, 3].map((offset) => {
    const answer = grammarAnswer(language, grammarFocus, targetSentence, index + offset);
    const distractors = grammarDistractors(language, answer, grammarFocus, index + offset);
    return {
      ...q(labels.choose(grammarFocus, offset + 1), answer, [answer, ...distractors]),
      grammarFocusId,
    } as ChoiceQuestion & { grammarFocusId: string };
  });
}

function buildWritingTaskObject(
  language: CurriculumLanguage,
  theme: string,
  profile: LevelProfile,
  grammarFocus: string,
  vocabulary: CurriculumVocabularyItem[],
  chunks: CurriculumChunk[],
  index: number,
): WritingTask {
  const labels = taskLabels(language);
  const scenario = lessonScenario(language, theme, profile.cefrLevel, index);
  return {
    situation: labels.writingSituation(scenario.topic, profile.label, scenario.setting),
    audience: labels.audience(profile.intensity),
    purpose: labels.writingPurpose(theme, grammarFocus, scenario.need),
    expectedOutput: labels.expectedOutput(profile.cefrLevel),
    approximateLength: labels.length(profile.cefrLevel),
    usefulLanguage: chunks.slice(0, 3).map((chunk) => chunk.phrase).concat(vocabulary.slice(0, 2).map((item) => item.word)),
    assessmentDimensions: labels.assessmentDimensions,
  };
}

function buildSpeakingTaskObject(
  language: CurriculumLanguage,
  theme: string,
  profile: LevelProfile,
  grammarFocus: string,
  vocabulary: CurriculumVocabularyItem[],
  index: number,
): SpeakingTask {
  const labels = taskLabels(language);
  const scenario = lessonScenario(language, theme, profile.cefrLevel, index + 1);
  return {
    prompt: labels.speakingPrompt(scenario.topic, profile.label, grammarFocus, scenario.setting, scenario.need),
    expectedDuration: labels.duration(profile.cefrLevel),
    focus: [grammarFocus, vocabulary[0].word, vocabulary[1].word],
    assessmentDimensions: labels.speakingDimensions,
  };
}

function buildRoleplayTaskObject(
  language: CurriculumLanguage,
  theme: string,
  profile: LevelProfile,
  grammarFocus: string,
  index: number,
): RoleplayTask {
  const labels = taskLabels(language);
  const scenario = lessonScenario(language, theme, profile.cefrLevel, index + profile.levelNumber);
  return {
    scenario: labels.roleplayScenario(scenario.topic, scenario.setting),
    learnerRole: labels.learnerRole(scenario.topic, scenario.need),
    partnerRole: labels.partnerRole(scenario.topic, scenario.setting),
    goal: labels.roleplayGoal(scenario.topic, grammarFocus, profile.label, scenario.need),
    successCriteria: labels.successCriteria(profile.cefrLevel),
  };
}

function formatWritingTask(task: WritingTask) {
  return `${task.situation} Audience: ${task.audience}. Purpose: ${task.purpose}. Output: ${task.expectedOutput}. Length: ${task.approximateLength}. Useful language: ${task.usefulLanguage.join(', ')}.`;
}

function formatRoleplay(task: RoleplayTask) {
  return `Scenario: ${task.scenario}. Learner: ${task.learnerRole}. Partner: ${task.partnerRole}. Goal: ${task.goal}. Success: ${task.successCriteria.join('; ')}.`;
}

type FrameContext = { theme: string; grammarFocus: string; word: string; chunk: string; level: string };
type TextFrame = (context: FrameContext) => string;
type LexicalEntry = { term: string; meaning: string };

function domainVocabularyItems(language: CurriculumLanguage, band: CefrBand, domain: string): LexicalEntry[] {
  const shared = {
    English: {
      planning: [['plan', 'plan'], ['appointment', 'appointment'], ['calendar', 'calendar'], ['tomorrow', 'tomorrow'], ['next week', 'next week'], ['available', 'available'], ['confirm', 'confirm'], ['change', 'change'], ['cancel', 'cancel'], ['meeting', 'meeting'], ['time slot', 'time slot'], ['deadline', 'deadline']],
      digital: [['account', 'account'], ['password', 'password'], ['email', 'email'], ['attachment', 'attachment'], ['message', 'message'], ['screen', 'screen'], ['login', 'login'], ['download', 'download'], ['file', 'file'], ['link', 'link'], ['notification', 'notification'], ['settings', 'settings']],
    },
    German: {
      planning: [['der Plan', 'plan'], ['der Termin', 'appointment'], ['der Kalender', 'calendar'], ['morgen', 'tomorrow'], ['nächste Woche', 'next week'], ['verfügbar', 'available'], ['bestätigen', 'confirm'], ['verschieben', 'move'], ['absagen', 'cancel'], ['die Besprechung', 'meeting'], ['das Zeitfenster', 'time slot'], ['die Frist', 'deadline']],
      digital: [['das Konto', 'account'], ['das Passwort', 'password'], ['die E-Mail', 'email'], ['der Anhang', 'attachment'], ['die Nachricht', 'message'], ['der Bildschirm', 'screen'], ['sich anmelden', 'log in'], ['herunterladen', 'download'], ['die Datei', 'file'], ['der Link', 'link'], ['die Benachrichtigung', 'notification'], ['die Einstellungen', 'settings']],
    },
    Spanish: {
      planning: [['el plan', 'plan'], ['la cita', 'appointment'], ['el calendario', 'calendar'], ['mañana', 'tomorrow'], ['la próxima semana', 'next week'], ['disponible', 'available'], ['confirmar', 'confirm'], ['cambiar', 'change'], ['cancelar', 'cancel'], ['la reunión', 'meeting'], ['la franja horaria', 'time slot'], ['el plazo', 'deadline']],
      digital: [['la cuenta', 'account'], ['la contraseña', 'password'], ['el correo', 'email'], ['el archivo adjunto', 'attachment'], ['el mensaje', 'message'], ['la pantalla', 'screen'], ['iniciar sesión', 'log in'], ['descargar', 'download'], ['el archivo', 'file'], ['el enlace', 'link'], ['la notificación', 'notification'], ['los ajustes', 'settings']],
    },
    Italian: {
      planning: [['il piano', 'plan'], ['l’appuntamento', 'appointment'], ['il calendario', 'calendar'], ['domani', 'tomorrow'], ['la prossima settimana', 'next week'], ['disponibile', 'available'], ['confermare', 'confirm'], ['spostare', 'move'], ['annullare', 'cancel'], ['la riunione', 'meeting'], ['la fascia oraria', 'time slot'], ['la scadenza', 'deadline']],
      digital: [['l’account', 'account'], ['la password', 'password'], ['l’email', 'email'], ['l’allegato', 'attachment'], ['il messaggio', 'message'], ['lo schermo', 'screen'], ['accedere', 'log in'], ['scaricare', 'download'], ['il file', 'file'], ['il link', 'link'], ['la notifica', 'notification'], ['le impostazioni', 'settings']],
    },
    French: {
      planning: [['le projet', 'plan'], ['le rendez-vous', 'appointment'], ['le calendrier', 'calendar'], ['demain', 'tomorrow'], ['la semaine prochaine', 'next week'], ['disponible', 'available'], ['confirmer', 'confirm'], ['déplacer', 'move'], ['annuler', 'cancel'], ['la réunion', 'meeting'], ['le créneau', 'time slot'], ['le délai', 'deadline']],
      digital: [['le compte', 'account'], ['le mot de passe', 'password'], ['le courriel', 'email'], ['la pièce jointe', 'attachment'], ['le message', 'message'], ['l’écran', 'screen'], ['se connecter', 'log in'], ['télécharger', 'download'], ['le fichier', 'file'], ['le lien', 'link'], ['la notification', 'notification'], ['les paramètres', 'settings']],
    },
  } satisfies Record<CurriculumLanguage, Record<'planning' | 'digital', Array<[string, string]>>>;

  const byDomain = {
    identity: realVocabularyItems(language, band, 'Introductions'),
    travel: realVocabularyItems(language, band, 'Travel'),
    shopping: realVocabularyItems(language, band, 'Shopping'),
    health: realVocabularyItems(language, band, 'Health'),
    work: realVocabularyItems(language, band, 'Work'),
    education: realVocabularyItems(language, band, 'Education'),
    advanced: expandedVocabularyItems(language, band),
    planning: shared[language].planning.map(([term, meaning]) => ({ term, meaning })),
    digital: shared[language].digital.map(([term, meaning]) => ({ term, meaning })),
    general: realVocabularyItems(language, band, 'Review'),
  } satisfies Record<string, LexicalEntry[]>;

  return byDomain[domain] ?? byDomain.general;
}

function realVocabularyItems(language: CurriculumLanguage, band: CefrBand, theme: string): LexicalEntry[] {
  const topic = lessonTopic(language, theme);
  const entries = {
    English: {
      A1: ['name', 'address', 'street', 'shop', 'station', 'ticket', 'meal', 'water', 'coffee', 'doctor', 'family', 'friend', 'morning', 'evening', 'home', 'school', 'price', 'receipt', 'bus stop', 'phone'],
      A2: ['appointment', 'platform', 'connection', 'delay', 'receipt', 'reservation', 'neighbour', 'repair', 'chemist', 'message', 'choice', 'reason', 'route', 'opening hours', 'meeting', 'advice', 'plan', 'change', 'queue', 'confirmation'],
      B1: ['complaint', 'solution', 'recommendation', 'experience', 'priority', 'deadline', 'feedback', 'application', 'budget', 'habit', 'community centre', 'survey', 'training', 'risk', 'benefit', 'schedule', 'support', 'request', 'summary', 'decision'],
      B2: ['evidence', 'stakeholder', 'proposal', 'tradeoff', 'impact', 'trend', 'case study', 'policy', 'counterargument', 'constraint', 'outcome', 'briefing', 'implementation', 'benchmark', 'perspective', 'assumption', 'indicator', 'negotiation', 'scope', 'recommendation'],
      C1: ['nuance', 'register', 'concession', 'synthesis', 'premise', 'implication', 'reformulation', 'stance', 'credibility', 'mitigation', 'alignment', 'interpretation', 'framing', 'rationale', 'ambiguity', 'criterion', 'objection', 'qualification', 'cohesion', 'emphasis'],
      C2: ['subtext', 'cadence', 'ellipsis', 'irony', 'allusion', 'inference', 'rhetoric', 'precision', 'discourse', 'undertone', 'equivocation', 'concision', 'counterpoint', 'resonance', 'jurisdiction', 'proportionality', 'diplomacy', 'metaphor', 'register shift', 'editorial judgment'],
    },
    German: {
      A1: ['der Name', 'die Adresse', 'die Straße', 'das Geschäft', 'der Bahnhof', 'die Fahrkarte', 'das Essen', 'das Wasser', 'der Kaffee', 'der Arzttermin', 'die Familie', 'der Freund', 'der Morgen', 'der Abend', 'das Zuhause', 'die Schule', 'der Preis', 'die Quittung', 'die Haltestelle', 'das Handy'],
      A2: ['der Termin', 'der Bahnsteig', 'die Verbindung', 'die Verspätung', 'die Reservierung', 'der Nachbar', 'die Reparatur', 'die Apotheke', 'die Nachricht', 'die Auswahl', 'der Grund', 'der Weg', 'die Öffnungszeiten', 'die Besprechung', 'der Rat', 'der Plan', 'die Änderung', 'die Warteschlange', 'die Bestätigung', 'der Anschluss'],
      B1: ['die Beschwerde', 'die Lösung', 'die Empfehlung', 'die Erfahrung', 'die Priorität', 'die Frist', 'das Feedback', 'die Bewerbung', 'das Budget', 'die Gewohnheit', 'das Bürgerzentrum', 'die Umfrage', 'die Fortbildung', 'das Risiko', 'der Vorteil', 'der Zeitplan', 'die Unterstützung', 'die Anfrage', 'die Zusammenfassung', 'die Entscheidung'],
      B2: ['der Beleg', 'der Beteiligte', 'der Vorschlag', 'die Abwägung', 'die Auswirkung', 'der Trend', 'die Fallstudie', 'die Richtlinie', 'das Gegenargument', 'die Einschränkung', 'das Ergebnis', 'das Briefing', 'die Umsetzung', 'der Vergleichswert', 'die Perspektive', 'die Annahme', 'der Indikator', 'die Verhandlung', 'der Umfang', 'die Empfehlung'],
      C1: ['die Nuance', 'das Register', 'das Zugeständnis', 'die Synthese', 'die Prämisse', 'die Implikation', 'die Umformulierung', 'die Haltung', 'die Glaubwürdigkeit', 'die Minderung', 'die Abstimmung', 'die Deutung', 'die Rahmung', 'die Begründung', 'die Mehrdeutigkeit', 'das Kriterium', 'der Einwand', 'die Einschränkung', 'die Kohärenz', 'die Betonung'],
      C2: ['der Subtext', 'die Kadenz', 'die Ellipse', 'die Ironie', 'die Anspielung', 'die Schlussfolgerung', 'die Rhetorik', 'die Präzision', 'der Diskurs', 'der Unterton', 'die Zweideutigkeit', 'die Knappheit', 'der Kontrapunkt', 'die Resonanz', 'die Zuständigkeit', 'die Verhältnismäßigkeit', 'die Diplomatie', 'die Metapher', 'der Registerwechsel', 'das redaktionelle Urteil'],
    },
    Spanish: {
      A1: ['el nombre', 'la dirección', 'la calle', 'la tienda', 'la estación', 'el billete', 'la comida', 'el agua', 'el café', 'la cita médica', 'la familia', 'el amigo', 'la mañana', 'la tarde', 'la casa', 'la escuela', 'el precio', 'el recibo', 'la parada', 'el móvil'],
      A2: ['la cita', 'el andén', 'la conexión', 'el retraso', 'la reserva', 'el vecino', 'la reparación', 'la farmacia', 'el mensaje', 'la opción', 'la razón', 'la ruta', 'el horario', 'la reunión', 'el consejo', 'el plan', 'el cambio', 'la fila', 'la confirmación', 'el transbordo'],
      B1: ['la queja', 'la solución', 'la recomendación', 'la experiencia', 'la prioridad', 'el plazo', 'la opinión', 'la solicitud', 'el presupuesto', 'el hábito', 'el centro comunitario', 'la encuesta', 'la formación', 'el riesgo', 'la ventaja', 'el calendario', 'el apoyo', 'la petición', 'el resumen', 'la decisión'],
      B2: ['la evidencia', 'el actor implicado', 'la propuesta', 'la compensación', 'el impacto', 'la tendencia', 'el estudio de caso', 'la política', 'el contraargumento', 'la limitación', 'el resultado', 'el informe breve', 'la implementación', 'el indicador', 'la perspectiva', 'la suposición', 'la negociación', 'el alcance', 'la recomendación', 'la prioridad estratégica'],
      C1: ['el matiz', 'el registro', 'la concesión', 'la síntesis', 'la premisa', 'la implicación', 'la reformulación', 'la postura', 'la credibilidad', 'la mitigación', 'la alineación', 'la interpretación', 'el encuadre', 'la justificación', 'la ambigüedad', 'el criterio', 'la objeción', 'la matización', 'la cohesión', 'el énfasis'],
      C2: ['el subtexto', 'la cadencia', 'la elipsis', 'la ironía', 'la alusión', 'la inferencia', 'la retórica', 'la precisión', 'el discurso', 'el trasfondo', 'la equivocidad', 'la concisión', 'el contrapunto', 'la resonancia', 'la jurisdicción', 'la proporcionalidad', 'la diplomacia', 'la metáfora', 'el cambio de registro', 'el criterio editorial'],
    },
    Italian: {
      A1: ['il nome', 'l’indirizzo', 'la strada', 'il negozio', 'la stazione', 'il biglietto', 'il pasto', 'l’acqua', 'il caffè', 'la visita medica', 'la famiglia', 'l’amico', 'la mattina', 'la sera', 'la casa', 'la scuola', 'il prezzo', 'lo scontrino', 'la fermata', 'il cellulare'],
      A2: ['l’appuntamento', 'il binario', 'la coincidenza', 'il ritardo', 'la prenotazione', 'il vicino', 'la riparazione', 'la farmacia', 'il messaggio', 'l’opzione', 'il motivo', 'il percorso', 'l’orario', 'la riunione', 'il consiglio', 'il piano', 'il cambiamento', 'la fila', 'la conferma', 'il cambio'],
      B1: ['il reclamo', 'la soluzione', 'la raccomandazione', 'l’esperienza', 'la priorità', 'la scadenza', 'il feedback', 'la candidatura', 'il budget', 'l’abitudine', 'il centro civico', 'il sondaggio', 'la formazione', 'il rischio', 'il vantaggio', 'il calendario', 'il sostegno', 'la richiesta', 'il riassunto', 'la decisione'],
      B2: ['la prova', 'il soggetto coinvolto', 'la proposta', 'il compromesso', 'l’impatto', 'la tendenza', 'il caso studio', 'la politica', 'il controargomento', 'il vincolo', 'il risultato', 'il briefing', 'l’attuazione', 'l’indicatore', 'la prospettiva', 'il presupposto', 'la negoziazione', 'l’ambito', 'la raccomandazione', 'la priorità strategica'],
      C1: ['la sfumatura', 'il registro', 'la concessione', 'la sintesi', 'la premessa', 'l’implicazione', 'la riformulazione', 'la posizione', 'la credibilità', 'la mitigazione', 'l’allineamento', 'l’interpretazione', 'l’inquadramento', 'la giustificazione', 'l’ambiguità', 'il criterio', 'l’obiezione', 'la qualificazione', 'la coesione', 'l’enfasi'],
      C2: ['il sottotesto', 'la cadenza', 'l’ellissi', 'l’ironia', 'l’allusione', 'l’inferenza', 'la retorica', 'la precisione', 'il discorso', 'il sottinteso', 'l’equivocità', 'la concisione', 'il contrappunto', 'la risonanza', 'la giurisdizione', 'la proporzionalità', 'la diplomazia', 'la metafora', 'il cambio di registro', 'il giudizio editoriale'],
    },
    French: {
      A1: ['le nom', 'l’adresse', 'la rue', 'le magasin', 'la gare', 'le billet', 'le repas', 'l’eau', 'le café', 'le rendez-vous médical', 'la famille', 'l’ami', 'le matin', 'le soir', 'la maison', 'l’école', 'le prix', 'le reçu', 'l’arrêt', 'le téléphone'],
      A2: ['le rendez-vous', 'le quai', 'la correspondance', 'le retard', 'la réservation', 'le voisin', 'la réparation', 'la pharmacie', 'le message', 'l’option', 'la raison', 'l’itinéraire', 'les horaires', 'la réunion', 'le conseil', 'le projet', 'le changement', 'la file', 'la confirmation', 'le trajet'],
      B1: ['la réclamation', 'la solution', 'la recommandation', 'l’expérience', 'la priorité', 'le délai', 'le retour', 'la candidature', 'le budget', 'l’habitude', 'le centre associatif', 'l’enquête', 'la formation', 'le risque', 'l’avantage', 'le calendrier', 'le soutien', 'la demande', 'le résumé', 'la décision'],
      B2: ['la preuve', 'la partie prenante', 'la proposition', 'le compromis', 'l’impact', 'la tendance', 'l’étude de cas', 'la politique', 'le contre-argument', 'la contrainte', 'le résultat', 'le briefing', 'la mise en oeuvre', 'l’indicateur', 'la perspective', 'l’hypothèse', 'la négociation', 'la portée', 'la recommandation', 'la priorité stratégique'],
      C1: ['la nuance', 'le registre', 'la concession', 'la synthèse', 'la prémisse', 'l’implication', 'la reformulation', 'la posture', 'la crédibilité', 'l’atténuation', 'l’alignement', 'l’interprétation', 'le cadrage', 'la justification', 'l’ambiguïté', 'le critère', 'l’objection', 'la qualification', 'la cohésion', 'l’emphase'],
      C2: ['le sous-texte', 'la cadence', 'l’ellipse', 'l’ironie', 'l’allusion', 'l’inférence', 'la rhétorique', 'la précision', 'le discours', 'le non-dit', 'l’équivoque', 'la concision', 'le contrepoint', 'la résonance', 'la juridiction', 'la proportionnalité', 'la diplomatie', 'la métaphore', 'le changement de registre', 'le jugement éditorial'],
    },
  } satisfies Record<CurriculumLanguage, Record<CefrBand, string[]>>;

  return entries[language][band].map((term) => ({
    term,
    meaning: lexicalMeaning(language, topic, term),
  }));
}

function lessonTopic(language: CurriculumLanguage, theme: string) {
  const clean = theme.trim();
  if (/\b(mastery|exam|prüfung|meister|maestr|padronanza|maîtrise)\b/i.test(clean)) {
    return {
      English: 'final assessment',
      German: 'Abschlussprüfung',
      Spanish: 'evaluación final',
      Italian: 'valutazione finale',
      French: 'évaluation finale',
    }[language];
  }
  if (/\b(checkpoint|kontrollpunkt|control|verifica|bilan)\b/i.test(clean)) {
    return {
      English: 'level check',
      German: 'Lernkontrolle',
      Spanish: 'control de nivel',
      Italian: 'verifica di livello',
      French: 'bilan de niveau',
    }[language];
  }
  if (/\b(review|wiederholung|repaso|ripasso|révision)\b/i.test(clean)) {
    return {
      English: 'level review',
      German: 'Wiederholung',
      Spanish: 'repaso del nivel',
      Italian: 'ripasso del livello',
      French: 'révision du niveau',
    }[language];
  }
  if (clean) return clean;
  return {
    English: 'personal progress',
    German: 'persönlicher Fortschritt',
    Spanish: 'progreso personal',
    Italian: 'progresso personale',
    French: 'progrès personnel',
  }[language];
}

function lexicalMeaning(language: CurriculumLanguage, topic: string, term: string) {
  if (language === 'English') return `core vocabulary for ${topic.toLowerCase()}`;
  if (language === 'German') return `zentraler Wortschatz`;
  if (language === 'Spanish') return `vocabulario central`;
  if (language === 'Italian') return `lessico centrale`;
  return `vocabulaire essentiel`;
}

function expandedVocabularyItems(language: CurriculumLanguage, band: CefrBand): LexicalEntry[] {
  const terms = {
    English: {
      A1: ['first name', 'surname', 'postcode', 'flat', 'door', 'key', 'bread', 'milk', 'apple', 'cash', 'card', 'minute', 'today', 'tomorrow', 'left', 'right', 'near', 'open', 'closed', 'help'],
      A2: ['boarding pass', 'single room', 'return ticket', 'lost property', 'health card', 'waiting room', 'invoice', 'refund', 'delivery', 'discount', 'weather forecast', 'invitation', 'deadline', 'colleague', 'shift', 'holiday request', 'confirmation email', 'appointment time', 'traffic jam', 'personal details'],
      B1: ['maintenance issue', 'customer review', 'training course', 'team update', 'rent increase', 'public transport pass', 'insurance claim', 'job interview', 'workload', 'community project', 'volunteer work', 'energy bill', 'online banking', 'technical problem', 'follow-up email', 'pros and cons', 'shared responsibility', 'unexpected delay', 'practical compromise', 'clear recommendation'],
      B2: ['feasibility', 'accountability', 'data privacy', 'cost estimate', 'implementation risk', 'long-term impact', 'stakeholder concern', 'legal requirement', 'environmental benefit', 'negotiating position', 'resource allocation', 'measurable outcome', 'quality assurance', 'public perception', 'strategic priority', 'evidence base', 'critical assumption', 'implementation timeline', 'balanced assessment', 'contingency plan'],
      C1: ['implicit assumption', 'methodological limitation', 'institutional constraint', 'rhetorical framing', 'discursive shift', 'measured concession', 'strategic ambiguity', 'normative claim', 'evidential basis', 'policy rationale', 'register-sensitive phrasing', 'deliberate omission', 'countervailing evidence', 'interpretive pressure', 'qualified endorsement', 'analytical lens', 'professional discretion', 'critical distance', 'nuanced objection', 'synthesis paragraph'],
      C2: ['pragmatic inference', 'semantic compression', 'rhetorical understatement', 'layered implication', 'ironic distance', 'stylistic economy', 'conceptual slippage', 'diplomatic hedging', 'epistemic caution', 'authorial stance', 'latent contradiction', 'forensic reading', 'register calibration', 'discursive asymmetry', 'elliptical phrasing', 'tonal ambiguity', 'subtle rebuke', 'metadiscursive cue', 'high-level mediation', 'interpretive restraint'],
    },
    German: {
      A1: ['der Vorname', 'der Nachname', 'die Postleitzahl', 'die Wohnung', 'die Tür', 'der Schlüssel', 'das Brot', 'die Milch', 'der Apfel', 'das Bargeld', 'die Karte', 'die Minute', 'heute', 'morgen', 'links', 'rechts', 'in der Nähe', 'geöffnet', 'geschlossen', 'die Hilfe'],
      A2: ['die Bordkarte', 'das Einzelzimmer', 'die Rückfahrkarte', 'das Fundbüro', 'die Gesundheitskarte', 'das Wartezimmer', 'die Rechnung', 'die Rückerstattung', 'die Lieferung', 'der Rabatt', 'die Wettervorhersage', 'die Einladung', 'die Frist', 'der Kollege', 'die Schicht', 'der Urlaubsantrag', 'die Bestätigungsmail', 'die Uhrzeit', 'der Stau', 'die persönlichen Daten'],
      B1: ['das Wartungsproblem', 'die Kundenbewertung', 'der Fortbildungskurs', 'die Teamnachricht', 'die Mieterhöhung', 'das Monatsticket', 'der Versicherungsfall', 'das Vorstellungsgespräch', 'die Arbeitsbelastung', 'das Gemeinschaftsprojekt', 'die Freiwilligenarbeit', 'die Energierechnung', 'das Online-Banking', 'das technische Problem', 'die Rückfrage', 'die Vor- und Nachteile', 'die gemeinsame Verantwortung', 'die unerwartete Verzögerung', 'der praktische Kompromiss', 'die klare Empfehlung'],
      B2: ['die Machbarkeit', 'die Rechenschaftspflicht', 'der Datenschutz', 'die Kostenschätzung', 'das Umsetzungsrisiko', 'die langfristige Wirkung', 'das Anliegen der Beteiligten', 'die rechtliche Vorgabe', 'der ökologische Nutzen', 'die Verhandlungsposition', 'die Ressourcenverteilung', 'das messbare Ergebnis', 'die Qualitätssicherung', 'die öffentliche Wahrnehmung', 'die strategische Priorität', 'die Beleggrundlage', 'die kritische Annahme', 'der Zeitplan für die Umsetzung', 'die ausgewogene Bewertung', 'der Notfallplan'],
      C1: ['die implizite Annahme', 'die methodische Grenze', 'die institutionelle Einschränkung', 'die rhetorische Rahmung', 'der diskursive Wechsel', 'das abgewogene Zugeständnis', 'die strategische Mehrdeutigkeit', 'der normative Anspruch', 'die Belegbasis', 'die politische Begründung', 'die registersensible Formulierung', 'die bewusste Auslassung', 'der gegenläufige Befund', 'der Deutungsdruck', 'die eingeschränkte Zustimmung', 'die analytische Perspektive', 'das professionelle Ermessen', 'die kritische Distanz', 'der nuancierte Einwand', 'der synthetisierende Absatz'],
      C2: ['die pragmatische Schlussfolgerung', 'die semantische Verdichtung', 'die rhetorische Untertreibung', 'die vielschichtige Implikation', 'die ironische Distanz', 'die stilistische Ökonomie', 'die begriffliche Verschiebung', 'die diplomatische Absicherung', 'die epistemische Vorsicht', 'die Autorhaltung', 'der latente Widerspruch', 'die forensische Lektüre', 'die Registerkalibrierung', 'die diskursive Asymmetrie', 'die elliptische Formulierung', 'die tonale Mehrdeutigkeit', 'der subtile Tadel', 'das metadiskursive Signal', 'die anspruchsvolle Vermittlung', 'die interpretative Zurückhaltung'],
    },
    Spanish: {
      A1: ['el nombre de pila', 'el apellido', 'el código postal', 'el piso', 'la puerta', 'la llave', 'el pan', 'la leche', 'la manzana', 'el efectivo', 'la tarjeta', 'el minuto', 'hoy', 'mañana', 'a la izquierda', 'a la derecha', 'cerca', 'abierto', 'cerrado', 'la ayuda'],
      A2: ['la tarjeta de embarque', 'la habitación individual', 'el billete de vuelta', 'la oficina de objetos perdidos', 'la tarjeta sanitaria', 'la sala de espera', 'la factura', 'el reembolso', 'la entrega', 'el descuento', 'la previsión del tiempo', 'la invitación', 'el plazo', 'el compañero', 'el turno', 'la solicitud de vacaciones', 'el correo de confirmación', 'la hora de la cita', 'el atasco', 'los datos personales'],
      B1: ['el problema de mantenimiento', 'la reseña del cliente', 'el curso de formación', 'la actualización del equipo', 'la subida del alquiler', 'el abono de transporte', 'la reclamación al seguro', 'la entrevista de trabajo', 'la carga de trabajo', 'el proyecto comunitario', 'el voluntariado', 'la factura de energía', 'la banca en línea', 'el problema técnico', 'el correo de seguimiento', 'los pros y los contras', 'la responsabilidad compartida', 'el retraso imprevisto', 'el compromiso práctico', 'la recomendación clara'],
      B2: ['la viabilidad', 'la rendición de cuentas', 'la privacidad de los datos', 'la estimación de costes', 'el riesgo de implementación', 'el impacto a largo plazo', 'la preocupación de los actores', 'el requisito legal', 'el beneficio ambiental', 'la posición negociadora', 'la asignación de recursos', 'el resultado medible', 'el control de calidad', 'la percepción pública', 'la prioridad estratégica', 'la base probatoria', 'la suposición crítica', 'el calendario de implementación', 'la evaluación equilibrada', 'el plan de contingencia'],
      C1: ['la suposición implícita', 'la limitación metodológica', 'la restricción institucional', 'el encuadre retórico', 'el giro discursivo', 'la concesión medida', 'la ambigüedad estratégica', 'la afirmación normativa', 'la base empírica', 'la justificación política', 'la formulación sensible al registro', 'la omisión deliberada', 'la evidencia contraria', 'la presión interpretativa', 'el respaldo matizado', 'la lente analítica', 'la discreción profesional', 'la distancia crítica', 'la objeción matizada', 'el párrafo de síntesis'],
      C2: ['la inferencia pragmática', 'la compresión semántica', 'la subestimación retórica', 'la implicación estratificada', 'la distancia irónica', 'la economía estilística', 'el deslizamiento conceptual', 'la cobertura diplomática', 'la cautela epistémica', 'la postura autoral', 'la contradicción latente', 'la lectura forense', 'la calibración del registro', 'la asimetría discursiva', 'la formulación elíptica', 'la ambigüedad tonal', 'el reproche sutil', 'la señal metadiscursiva', 'la mediación de alto nivel', 'la contención interpretativa'],
    },
    Italian: {
      A1: ['il nome proprio', 'il cognome', 'il codice postale', 'l’appartamento', 'la porta', 'la chiave', 'il pane', 'il latte', 'la mela', 'i contanti', 'la carta', 'il minuto', 'oggi', 'domani', 'a sinistra', 'a destra', 'vicino', 'aperto', 'chiuso', 'l’aiuto'],
      A2: ['la carta d’imbarco', 'la camera singola', 'il biglietto di ritorno', 'l’ufficio oggetti smarriti', 'la tessera sanitaria', 'la sala d’attesa', 'la fattura', 'il rimborso', 'la consegna', 'lo sconto', 'le previsioni del tempo', 'l’invito', 'la scadenza', 'il collega', 'il turno', 'la richiesta di ferie', 'l’email di conferma', 'l’orario dell’appuntamento', 'l’ingorgo', 'i dati personali'],
      B1: ['il problema di manutenzione', 'la recensione del cliente', 'il corso di formazione', 'l’aggiornamento del team', 'l’aumento dell’affitto', 'l’abbonamento ai trasporti', 'la richiesta all’assicurazione', 'il colloquio di lavoro', 'il carico di lavoro', 'il progetto di comunità', 'il volontariato', 'la bolletta energetica', 'l’home banking', 'il problema tecnico', 'l’email di follow-up', 'i pro e i contro', 'la responsabilità condivisa', 'il ritardo imprevisto', 'il compromesso pratico', 'la raccomandazione chiara'],
      B2: ['la fattibilità', 'la responsabilità pubblica', 'la privacy dei dati', 'la stima dei costi', 'il rischio di attuazione', 'l’impatto a lungo termine', 'la preoccupazione degli stakeholder', 'il requisito legale', 'il beneficio ambientale', 'la posizione negoziale', 'l’allocazione delle risorse', 'il risultato misurabile', 'il controllo qualità', 'la percezione pubblica', 'la priorità strategica', 'la base probatoria', 'il presupposto critico', 'il calendario di attuazione', 'la valutazione equilibrata', 'il piano di emergenza'],
      C1: ['il presupposto implicito', 'il limite metodologico', 'il vincolo istituzionale', 'l’inquadramento retorico', 'lo spostamento discorsivo', 'la concessione misurata', 'l’ambiguità strategica', 'l’affermazione normativa', 'la base empirica', 'la giustificazione politica', 'la formulazione sensibile al registro', 'l’omissione deliberata', 'la prova contraria', 'la pressione interpretativa', 'l’approvazione qualificata', 'la lente analitica', 'la discrezionalità professionale', 'la distanza critica', 'l’obiezione sfumata', 'il paragrafo di sintesi'],
      C2: ['l’inferenza pragmatica', 'la compressione semantica', 'l’understatement retorico', 'l’implicazione stratificata', 'la distanza ironica', 'l’economia stilistica', 'lo slittamento concettuale', 'la cautela diplomatica', 'la prudenza epistemica', 'la postura autoriale', 'la contraddizione latente', 'la lettura forense', 'la calibrazione del registro', 'l’asimmetria discorsiva', 'la formulazione ellittica', 'l’ambiguità tonale', 'il rimprovero sottile', 'il segnale metadiscorsivo', 'la mediazione di alto livello', 'la sobrietà interpretativa'],
    },
    French: {
      A1: ['le prénom', 'le nom de famille', 'le code postal', 'l’appartement', 'la porte', 'la clé', 'le pain', 'le lait', 'la pomme', 'l’argent liquide', 'la carte', 'la minute', 'aujourd’hui', 'demain', 'à gauche', 'à droite', 'près d’ici', 'ouvert', 'fermé', 'l’aide'],
      A2: ['la carte d’embarquement', 'la chambre simple', 'le billet retour', 'le bureau des objets trouvés', 'la carte vitale', 'la salle d’attente', 'la facture', 'le remboursement', 'la livraison', 'la réduction', 'la météo', 'l’invitation', 'le délai', 'le collègue', 'le service', 'la demande de congé', 'le courriel de confirmation', 'l’heure du rendez-vous', 'l’embouteillage', 'les données personnelles'],
      B1: ['le problème d’entretien', 'l’avis client', 'la formation professionnelle', 'le point d’équipe', 'l’augmentation du loyer', 'l’abonnement de transport', 'la déclaration d’assurance', 'l’entretien d’embauche', 'la charge de travail', 'le projet associatif', 'le bénévolat', 'la facture d’énergie', 'la banque en ligne', 'le problème technique', 'le courriel de suivi', 'les avantages et les inconvénients', 'la responsabilité partagée', 'le retard imprévu', 'le compromis pratique', 'la recommandation claire'],
      B2: ['la faisabilité', 'la redevabilité', 'la confidentialité des données', 'l’estimation des coûts', 'le risque de mise en oeuvre', 'l’impact à long terme', 'la préoccupation des parties prenantes', 'l’exigence juridique', 'le bénéfice environnemental', 'la position de négociation', 'l’allocation des ressources', 'le résultat mesurable', 'l’assurance qualité', 'la perception publique', 'la priorité stratégique', 'la base factuelle', 'l’hypothèse critique', 'le calendrier de mise en oeuvre', 'l’évaluation équilibrée', 'le plan de secours'],
      C1: ['l’hypothèse implicite', 'la limite méthodologique', 'la contrainte institutionnelle', 'le cadrage rhétorique', 'le glissement discursif', 'la concession mesurée', 'l’ambiguïté stratégique', 'l’affirmation normative', 'la base empirique', 'la justification politique', 'la formulation sensible au registre', 'l’omission délibérée', 'la preuve contraire', 'la pression interprétative', 'l’approbation nuancée', 'la grille d’analyse', 'la marge d’appréciation professionnelle', 'la distance critique', 'l’objection nuancée', 'le paragraphe de synthèse'],
      C2: ['l’inférence pragmatique', 'la compression sémantique', 'l’euphémisation rhétorique', 'l’implication stratifiée', 'la distance ironique', 'l’économie stylistique', 'le glissement conceptuel', 'la précaution diplomatique', 'la prudence épistémique', 'la posture auctoriale', 'la contradiction latente', 'la lecture forensique', 'le calibrage du registre', 'l’asymétrie discursive', 'la formulation elliptique', 'l’ambiguïté tonale', 'le reproche subtil', 'le signal métadiscursif', 'la médiation de haut niveau', 'la retenue interprétative'],
    },
  } satisfies Record<CurriculumLanguage, Record<CefrBand, string[]>>;
  return terms[language][band].map((term) => ({ term, meaning: lexicalMeaning(language, '', term) }));
}

function lessonScenario(language: CurriculumLanguage, theme: string, band: CefrBand, index: number) {
  const topic = lessonTopic(language, theme);
  const settings = {
    English: {
      A1: ['at a cafe counter', 'in a small shop', 'at school', 'at the bus stop', 'at home', 'at a clinic desk', 'in a language class', 'at a ticket machine'],
      A2: ['during a travel delay', 'in a hotel message', 'at a repair appointment', 'in a simple workplace chat', 'on a neighbourhood noticeboard', 'during a planning call', 'at a pharmacy', 'in an email thread'],
      B1: ['in a workplace update', 'on a community forum', 'during a complaint call', 'in a job interview', 'at a housing office', 'in a project meeting', 'after a course feedback survey', 'in a customer support exchange'],
      B2: ['in a negotiation meeting', 'inside a policy briefing', 'during a stakeholder review', 'in a formal proposal', 'in a data-privacy discussion', 'during a panel debate', 'in a risk assessment', 'in a professional report'],
      C1: ['in an editorial response', 'during an academic seminar', 'inside a strategy memo', 'in a diplomatic email', 'during a tense board discussion', 'in a critical review', 'in a policy consultation', 'during a professional mediation'],
      C2: ['in an expert panel', 'inside a literary commentary', 'during high-stakes mediation', 'in a subtle editorial', 'during a policy dispute', 'in a rhetorical critique', 'inside a legal-style argument', 'in a register-sensitive rewrite'],
    },
    German: {
      A1: ['am Tresen im Café', 'in einem kleinen Geschäft', 'in der Schule', 'an der Bushaltestelle', 'zu Hause', 'am Empfang einer Praxis', 'im Sprachkurs', 'am Fahrkartenautomaten'],
      A2: ['bei einer Reiseverspätung', 'in einer Hotelnachricht', 'bei einem Reparaturtermin', 'in einem einfachen Arbeitschat', 'auf einem Aushang im Viertel', 'in einem Planungsgespräch', 'in der Apotheke', 'in einem E-Mail-Verlauf'],
      B1: ['in einer Arbeitsbesprechung', 'in einem Nachbarschaftsforum', 'bei einem Beschwerdeanruf', 'im Vorstellungsgespräch', 'im Wohnungsamt', 'in einer Projektbesprechung', 'nach einer Kursumfrage', 'im Kundendienstgespräch'],
      B2: ['in einer Verhandlung', 'in einem politischen Briefing', 'bei einer Prüfung durch Beteiligte', 'in einem formellen Vorschlag', 'in einer Datenschutzdiskussion', 'in einer Podiumsdiskussion', 'in einer Risikoanalyse', 'in einem Fachbericht'],
      C1: ['in einer redaktionellen Antwort', 'in einem akademischen Seminar', 'in einer Strategienotiz', 'in einer diplomatischen E-Mail', 'in einer angespannten Vorstandsrunde', 'in einer kritischen Rezension', 'in einer politischen Anhörung', 'in einer professionellen Mediation'],
      C2: ['in einem Expertengremium', 'in einem literarischen Kommentar', 'in einer Vermittlung mit hohem Risiko', 'in einem subtilen Leitartikel', 'in einem politischen Streitgespräch', 'in einer rhetorischen Kritik', 'in einer juristisch geprägten Argumentation', 'bei einer registersensiblen Umformulierung'],
    },
    Spanish: {
      A1: ['en la barra de una cafetería', 'en una tienda pequeña', 'en la escuela', 'en la parada del autobús', 'en casa', 'en recepción de una consulta', 'en una clase de idiomas', 'en una máquina de billetes'],
      A2: ['durante un retraso de viaje', 'en un mensaje de hotel', 'en una cita de reparación', 'en un chat laboral sencillo', 'en un aviso del barrio', 'durante una llamada de planificación', 'en la farmacia', 'en un hilo de correo'],
      B1: ['en una actualización laboral', 'en un foro comunitario', 'durante una llamada de queja', 'en una entrevista de trabajo', 'en una oficina de vivienda', 'en una reunión de proyecto', 'después de una encuesta del curso', 'en una conversación de atención al cliente'],
      B2: ['en una reunión de negociación', 'en un informe de política', 'durante una revisión con actores implicados', 'en una propuesta formal', 'en una discusión sobre privacidad de datos', 'en un debate de panel', 'en una evaluación de riesgos', 'en un informe profesional'],
      C1: ['en una respuesta editorial', 'durante un seminario académico', 'en un memorando estratégico', 'en un correo diplomático', 'durante una reunión directiva tensa', 'en una crítica cultural', 'en una consulta de política pública', 'durante una mediación profesional'],
      C2: ['en un panel de expertos', 'en un comentario literario', 'durante una mediación de alto riesgo', 'en un editorial sutil', 'durante una disputa política', 'en una crítica retórica', 'en un argumento de estilo jurídico', 'en una reescritura sensible al registro'],
    },
    Italian: {
      A1: ['al banco di un bar', 'in un piccolo negozio', 'a scuola', 'alla fermata dell’autobus', 'a casa', 'alla reception di uno studio medico', 'in un corso di lingua', 'alla biglietteria automatica'],
      A2: ['durante un ritardo di viaggio', 'in un messaggio dell’hotel', 'a un appuntamento per una riparazione', 'in una semplice chat di lavoro', 'su un avviso di quartiere', 'durante una chiamata di pianificazione', 'in farmacia', 'in uno scambio di email'],
      B1: ['in un aggiornamento di lavoro', 'in un forum di comunità', 'durante una chiamata di reclamo', 'a un colloquio di lavoro', 'in un ufficio casa', 'in una riunione di progetto', 'dopo un sondaggio del corso', 'in uno scambio con l’assistenza clienti'],
      B2: ['in una riunione negoziale', 'in un briefing politico', 'durante una revisione con gli stakeholder', 'in una proposta formale', 'in una discussione sulla privacy dei dati', 'in un dibattito pubblico', 'in una valutazione dei rischi', 'in una relazione professionale'],
      C1: ['in una risposta editoriale', 'durante un seminario accademico', 'in una nota strategica', 'in un’email diplomatica', 'durante una riunione direttiva tesa', 'in una recensione critica', 'in una consultazione politica', 'durante una mediazione professionale'],
      C2: ['in un panel di esperti', 'in un commento letterario', 'durante una mediazione ad alta posta in gioco', 'in un editoriale sottile', 'durante una disputa politica', 'in una critica retorica', 'in un’argomentazione di taglio giuridico', 'in una riscrittura sensibile al registro'],
    },
    French: {
      A1: ['au comptoir d’un café', 'dans une petite boutique', 'à l’école', 'à l’arrêt de bus', 'à la maison', 'à l’accueil d’un cabinet médical', 'dans un cours de langue', 'à un distributeur de billets'],
      A2: ['pendant un retard de voyage', 'dans un message d’hôtel', 'lors d’un rendez-vous de réparation', 'dans un simple chat professionnel', 'sur une affiche de quartier', 'pendant un appel de planification', 'à la pharmacie', 'dans un échange de courriels'],
      B1: ['dans un point d’équipe', 'sur un forum associatif', 'pendant un appel de réclamation', 'dans un entretien d’embauche', 'dans un bureau du logement', 'en réunion de projet', 'après une enquête de cours', 'dans un échange avec le service client'],
      B2: ['en réunion de négociation', 'dans une note politique', 'pendant une revue avec les parties prenantes', 'dans une proposition formelle', 'dans une discussion sur la confidentialité des données', 'dans un débat public', 'dans une évaluation des risques', 'dans un rapport professionnel'],
      C1: ['dans une réponse éditoriale', 'pendant un séminaire universitaire', 'dans une note stratégique', 'dans un courriel diplomatique', 'pendant une réunion de direction tendue', 'dans une critique culturelle', 'dans une consultation publique', 'pendant une médiation professionnelle'],
      C2: ['dans un panel d’experts', 'dans un commentaire littéraire', 'pendant une médiation à forts enjeux', 'dans un éditorial subtil', 'pendant un différend politique', 'dans une critique rhétorique', 'dans une argumentation de style juridique', 'dans une réécriture sensible au registre'],
    },
  } satisfies Record<CurriculumLanguage, Record<CefrBand, string[]>>;
  const needs = {
    English: ['get a clear answer', 'explain a small change politely', 'choose between two realistic options', 'report what happened', 'ask for a practical solution', 'summarize the decision'],
    German: ['eine klare Antwort zu bekommen', 'eine kleine Änderung höflich zu erklären', 'zwischen zwei realistischen Optionen zu wählen', 'zu berichten, was passiert ist', 'um eine praktische Lösung zu bitten', 'die Entscheidung zusammenzufassen'],
    Spanish: ['pedir una respuesta clara', 'explicar un pequeño cambio con cortesía', 'elegir entre dos opciones realistas', 'contar lo que ocurrió', 'pedir una solución práctica', 'resumir la decisión'],
    Italian: ['chiedere una risposta chiara', 'spiegare un piccolo cambiamento con cortesia', 'scegliere tra due opzioni realistiche', 'raccontare che cosa è successo', 'chiedere una soluzione pratica', 'riassumere la decisione'],
    French: ['demander une réponse claire', 'mieux expliquer un petit changement', 'choisir entre deux options réalistes', 'raconter ce qui s’est passé', 'demander une solution pratique', 'résumer la décision'],
  } satisfies Record<CurriculumLanguage, string[]>;
  const domainSettings = scenarioSettingsForDomain(language, lessonDomain(theme));
  const setting = domainSettings.length > 0 ? domainSettings[index % domainSettings.length] : settings[language][band][index % settings[language][band].length];
  const need = needs[language][index % needs[language].length];
  return {
    topic,
    setting,
    need,
    target: (word: string) => naturalTargetSentence(language, band, topic, setting, need, word),
  };
}

function scenarioSettingsForDomain(language: CurriculumLanguage, domain: string) {
  const settings = {
    English: {
      planning: ['during a planning call', 'in a calendar message', 'after an appointment change'],
      digital: ['in an email thread', 'during a support chat', 'on an account settings screen'],
    },
    German: {
      planning: ['in einem Planungsgespräch', 'in einer Kalendernachricht', 'nach einer Terminänderung'],
      digital: ['in einem E-Mail-Verlauf', 'in einem Support-Chat', 'auf der Seite mit den Kontoeinstellungen'],
    },
    Spanish: {
      planning: ['durante una llamada de planificación', 'en un mensaje de calendario', 'después de un cambio de cita'],
      digital: ['en un hilo de correo', 'en un chat de soporte', 'en la pantalla de ajustes de la cuenta'],
    },
    Italian: {
      planning: ['durante una chiamata di pianificazione', 'in un messaggio di calendario', 'dopo un cambio di appuntamento'],
      digital: ['in una conversazione email', 'in una chat di assistenza', 'nella schermata delle impostazioni dell’account'],
    },
    French: {
      planning: ['pendant un appel de planification', 'dans un message de calendrier', 'après un changement de rendez-vous'],
      digital: ['dans un fil de courriels', 'dans un chat d’assistance', 'sur l’écran des paramètres du compte'],
    },
  } satisfies Record<CurriculumLanguage, Record<'planning' | 'digital', string[]>>;
  return domain === 'planning' || domain === 'digital' ? settings[language][domain] : [];
}

function naturalTargetSentence(language: CurriculumLanguage, band: CefrBand, topic: string, setting: string, need: string, word: string) {
  const term = targetLexeme(language, topic, word);
  const context = `${setting}`;
  const frames: Record<CurriculumLanguage, Record<CefrBand, string>> = {
    English: {
      A1: `Can you help me with "${term}" ${context}?`,
      A2: `I changed the plan ${context} because "${term}" was not confirmed yesterday.`,
      B1: `When "${term}" caused a problem ${context}, I explained what had happened and asked for help.`,
      B2: `Although "${term}" looked convenient ${context}, the team chose the safer option after comparing the evidence.`,
      C1: `The manager ${context} acknowledged the value of "${term}", but argued that its impact had been overstated.`,
      C2: `What sounded like praise for "${term}" ${context} was actually a carefully phrased warning about the whole proposal.`,
    },
    German: {
      A1: `Können Sie mir ${context} bei "${term}" helfen?`,
      A2: `Ich habe den Plan ${context} geändert, weil "${term}" gestern nicht bestätigt wurde.`,
      B1: `Als "${term}" ${context} ein Problem verursachte, erklärte ich den Ablauf und bat um Hilfe.`,
      B2: `Obwohl "${term}" ${context} praktisch wirkte, wählte das Team nach dem Vergleich der Belege die sicherere Option.`,
      C1: `Die Leitung ${context} erkannte den Wert von "${term}" an, betonte jedoch, die Wirkung werde überschätzt.`,
      C2: `Was ${context} wie Lob für "${term}" klang, war eigentlich eine vorsichtig formulierte Warnung.`,
    },
    Spanish: {
      A1: `¿Me puedes ayudar ${context} con "${term}"?`,
      A2: `Cambié el plan ${context} porque "${term}" no se confirmó ayer.`,
      B1: `Cuando "${term}" causó un problema ${context}, expliqué lo que había pasado y pedí ayuda.`,
      B2: `Aunque "${term}" parecía conveniente ${context}, el equipo eligió la opción más segura tras comparar la evidencia.`,
      C1: `La directora ${context} reconoció el valor de "${term}", pero sostuvo que su impacto se había exagerado.`,
      C2: `Lo que sonaba a elogio de "${term}" ${context} era en realidad una advertencia cuidadosamente formulada.`,
    },
    Italian: {
      A1: `Può aiutarmi ${context} con "${term}"?`,
      A2: `Ho cambiato il piano ${context} perché "${term}" ieri non è stato confermato.`,
      B1: `Quando "${term}" ha creato un problema ${context}, ho spiegato che cosa era successo e ho chiesto aiuto.`,
      B2: `Sebbene "${term}" sembrasse conveniente ${context}, il team ha scelto l’opzione più sicura dopo aver confrontato le prove.`,
      C1: `La responsabile ${context} ha riconosciuto il valore di "${term}", ma ha detto che il suo impatto era stato sopravvalutato.`,
      C2: `Quello che sembrava un elogio di "${term}" ${context} era in realtà un avvertimento formulato con cautela.`,
    },
    French: {
      A1: `Vous pouvez m’aider ${context} avec "${term}" ?`,
      A2: `J’ai changé le projet ${context} parce que "${term}" n’a pas été confirmé hier.`,
      B1: `Quand "${term}" a posé problème ${context}, j’ai expliqué ce qui s’était passé et j’ai demandé de l’aide.`,
      B2: `Même si "${term}" semblait pratique ${context}, l’équipe a choisi l’option la plus sûre après avoir comparé les preuves.`,
      C1: `La responsable ${context} a reconnu la valeur de "${term}", mais a estimé que son impact avait été exagéré.`,
      C2: `Ce qui ressemblait à un éloge de "${term}" ${context} était en fait un avertissement soigneusement formulé.`,
    },
  };
  return frames[language][band].replace('  ', ' ');
}

function targetLexeme(language: CurriculumLanguage, topic: string, value: string) {
  const escapedTopic = escapeForRegex(topic.toLowerCase());
  return value
    .replace(new RegExp(`^${escapedTopic}\\s+`, 'i'), '')
    .replace(new RegExp(`\\s+(for|in)\\s+${escapedTopic}$`, 'i'), '')
    .replace(new RegExp(`\\s+(im Kontext|für)\\s+${escapeForRegex(topic)}$`, 'i'), '')
    .replace(new RegExp(`\\s+(de|para|di|per|pour)\\s+${escapedTopic}$`, 'i'), '')
    .trim();
}

function escapeForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function lessonDomain(theme: string) {
  const value = normalizeText(theme);
  if (/(intro|vorstellung|presenta|présent|nome|name|famil|personal)/i.test(value)) return 'identity';
  if (/(plan|project|appointment|schedule|calendar|termin|tagesplan|pläne|projets|cita|appuntament|rendez|calendrier|horaire)/i.test(value)) return 'planning';
  if (/(digital|email|e mail|courriel|correo|mail|technik|technology|tecnolog|numérique|account|konto|compte)/i.test(value)) return 'digital';
  if (/(city|stadt|ciudad|città|ville|direction|weg|ruta|stazione|station|gare|reisen|travel|viaj|viagg)/i.test(value)) return 'travel';
  if (/(food|essen|comida|cibo|repas|café|restaurant|shopping|shop|tienda|negozio|magasin|precio|price|preis)/i.test(value)) return 'shopping';
  if (/(health|arzt|médic|medic|farmacia|apotheke|doctor|clinic|santé|salud)/i.test(value)) return 'health';
  if (/(work|arbeit|laboral|lavor|profession|career|karriere|meeting|réunion|riunione)/i.test(value)) return 'work';
  if (/(education|bildung|educación|istruzione|éducation|school|schule|escuela|scuola|école)/i.test(value)) return 'education';
  if (/(register|nuance|style|stil|estilo|stile|synth|sint|subtext|impliz|implíc|implic|crit)/i.test(value)) return 'advanced';
  return 'general';
}

function relevanceScore(domain: string, term: string) {
  const value = normalizeText(term);
  const groups: Record<string, string[]> = {
    identity: ['name', 'address', 'family', 'friend', 'morning', 'evening', 'der name', 'adresse', 'familie', 'freund', 'nombre', 'dirección', 'familia', 'amigo', 'nome', 'indirizzo', 'famiglia', 'amico', 'nom', 'adresse', 'famille', 'ami'],
    travel: ['station', 'ticket', 'street', 'bus stop', 'route', 'platform', 'connection', 'delay', 'bahnhof', 'fahrkarte', 'straße', 'haltestelle', 'weg', 'bahnsteig', 'verbindung', 'verspätung', 'estación', 'billete', 'calle', 'parada', 'ruta', 'andén', 'conexión', 'retraso', 'stazione', 'biglietto', 'strada', 'fermata', 'percorso', 'binario', 'coincidenza', 'ritardo', 'gare', 'billet', 'rue', 'arrêt', 'itinéraire', 'quai', 'correspondance', 'retard'],
    shopping: ['shop', 'meal', 'water', 'coffee', 'price', 'receipt', 'reservation', 'queue', 'geschäft', 'essen', 'wasser', 'kaffee', 'preis', 'quittung', 'reservierung', 'warteschlange', 'tienda', 'comida', 'agua', 'café', 'precio', 'recibo', 'reserva', 'fila', 'negozio', 'pasto', 'acqua', 'caffè', 'prezzo', 'scontrino', 'prenotazione', 'fila', 'magasin', 'repas', 'eau', 'café', 'prix', 'reçu', 'réservation', 'file'],
    health: ['doctor', 'appointment', 'chemist', 'clinic', 'arzt', 'termin', 'apotheke', 'cita', 'farmacia', 'visita', 'farmacia', 'rendez', 'pharmacie'],
    planning: ['plan', 'appointment', 'calendar', 'tomorrow', 'next week', 'available', 'confirm', 'change', 'cancel', 'meeting', 'time slot', 'deadline', 'termin', 'kalender', 'morgen', 'nächste woche', 'verfügbar', 'bestätigen', 'verschieben', 'absagen', 'besprechung', 'zeitfenster', 'frist', 'cita', 'calendario', 'mañana', 'próxima semana', 'disponible', 'confirmar', 'cambiar', 'cancelar', 'reunión', 'franja', 'plazo', 'appuntamento', 'calendario', 'domani', 'prossima settimana', 'confermare', 'spostare', 'annullare', 'riunione', 'fascia', 'scadenza', 'rendez', 'calendrier', 'demain', 'semaine prochaine', 'confirmer', 'déplacer', 'annuler', 'créneau', 'délai'],
    digital: ['account', 'password', 'email', 'attachment', 'message', 'screen', 'login', 'download', 'file', 'link', 'notification', 'settings', 'konto', 'passwort', 'e mail', 'anhang', 'nachricht', 'bildschirm', 'anmelden', 'herunterladen', 'datei', 'benachrichtigung', 'einstellungen', 'cuenta', 'contraseña', 'correo', 'archivo', 'adjunto', 'pantalla', 'sesión', 'descargar', 'enlace', 'notificación', 'ajustes', 'account', 'password', 'email', 'allegato', 'messaggio', 'schermo', 'accedere', 'scaricare', 'notifica', 'impostazioni', 'compte', 'mot de passe', 'courriel', 'pièce jointe', 'écran', 'connecter', 'télécharger', 'fichier', 'lien', 'notification', 'paramètres'],
    work: ['meeting', 'deadline', 'feedback', 'budget', 'schedule', 'request', 'decision', 'proposal', 'briefing', 'besprechung', 'frist', 'bewerbung', 'zeitplan', 'anfrage', 'entscheidung', 'vorschlag', 'reunión', 'plazo', 'solicitud', 'presupuesto', 'calendario', 'petición', 'decisión', 'propuesta', 'riunione', 'scadenza', 'candidatura', 'calendario', 'richiesta', 'decisione', 'proposta', 'réunion', 'délai', 'candidature', 'calendrier', 'demande', 'décision', 'proposition'],
    education: ['school', 'training', 'application', 'advice', 'support', 'community', 'schule', 'fortbildung', 'bewerbung', 'rat', 'unterstützung', 'escuela', 'formación', 'solicitud', 'consejo', 'apoyo', 'scuola', 'formazione', 'candidatura', 'consiglio', 'sostegno', 'école', 'formation', 'candidature', 'conseil', 'soutien'],
    advanced: ['nuance', 'register', 'synthesis', 'implication', 'stance', 'ambiguity', 'subtext', 'rhetoric', 'irony', 'precision', 'credibility', 'mitigation', 'alignment', 'framing', 'rationale', 'qualification', 'cohesion', 'emphasis', 'concession', 'premise', 'interpretation', 'nuance', 'register', 'synthese', 'implikation', 'haltung', 'mehrdeutigkeit', 'subtext', 'rhetorik', 'ironie', 'präzision', 'glaubwürdigkeit', 'minderung', 'abstimmung', 'rahmung', 'begründung', 'einschränkung', 'kohärenz', 'betonung', 'zugeständnis', 'prämisse', 'deutung', 'matiz', 'registro', 'síntesis', 'implicación', 'postura', 'ambigüedad', 'subtexto', 'retórica', 'ironía', 'precisión', 'credibilidad', 'mitigación', 'alineación', 'encuadre', 'justificación', 'matización', 'cohesión', 'énfasis', 'concesión', 'premisa', 'interpretación', 'sfumatura', 'registro', 'sintesi', 'implicazione', 'posizione', 'ambiguità', 'sottotesto', 'retorica', 'ironia', 'precisione', 'credibilità', 'mitigazione', 'allineamento', 'inquadramento', 'giustificazione', 'qualificazione', 'coesione', 'enfasi', 'concessione', 'premessa', 'interpretazione', 'sous texte', 'registre', 'synthèse', 'implication', 'posture', 'ambiguïté', 'rhétorique', 'ironie', 'précision', 'crédibilité', 'atténuation', 'alignement', 'cadrage', 'justification', 'qualification', 'cohésion', 'emphase', 'concession', 'prémisse', 'interprétation'],
    general: [],
  };
  return groups[domain]?.some((needle) => value.includes(needle)) ? 1 : 0;
}

function vocabularyExample(language: CurriculumLanguage, _profile: LevelProfile, _theme: string, _grammarFocus: string, word: string, index: number) {
  const labels = {
    English: [`Listen for "${word}" in the next short exchange.`, `Use "${word}" when the detail is important.`, `Add "${word}" to your answer naturally.`],
    German: [`Achten Sie im nächsten kurzen Austausch auf "${word}".`, `Verwenden Sie "${word}", wenn das Detail wichtig ist.`, `Schreiben Sie einen klaren Satz mit "${word}".`],
    Spanish: [`Escucha "${word}" en el próximo intercambio breve.`, `Usa "${word}" cuando el detalle sea importante.`, `Escribe una frase clara con "${word}".`],
    Italian: [`Ascolta "${word}" nel prossimo breve scambio.`, `Usa "${word}" quando il dettaglio è importante.`, `Scrivi una frase chiara con "${word}".`],
    French: [`Écoutez "${word}" dans le prochain court échange.`, `Utilisez "${word}" quand le détail est important.`, `Écrivez une phrase claire avec "${word}".`],
  } satisfies Record<CurriculumLanguage, string[]>;
  return labels[language][index % labels[language].length];
}

function keyword(language: CurriculumLanguage, value: string) {
  const clean = targetLexeme(language, '', value);
  if (language === 'German') return `das Stichwort "${clean}"`;
  if (language === 'Spanish') return `la palabra clave "${clean}"`;
  if (language === 'Italian') return `la parola chiave "${clean}"`;
  if (language === 'French') return `le mot-clé "${clean}"`;
  return `the keyword "${clean}"`;
}

function authoredLessonLines(
  language: CurriculumLanguage,
  band: CefrBand,
  topic: string,
  setting: string,
  need: string,
  grammarFocus: string,
  vocabulary: CurriculumVocabularyItem[],
  chunks: CurriculumChunk[],
  index: number,
) {
  const first = targetLexeme(language, topic, vocabulary[index % vocabulary.length].word);
  const second = targetLexeme(language, topic, vocabulary[(index + 2) % vocabulary.length].word);
  const third = targetLexeme(language, topic, vocabulary[(index + 4) % vocabulary.length].word);
  const phrase = chunks[index % chunks.length].phrase;
  const advanced = band === 'C1' || band === 'C2';
  const upper = band === 'B2' || advanced;
  const sets = {
    English: [
      `Excuse me, I have a question about "${topic}".`,
      `${capitalizeFirst(setting)}, a short message about ${topic.toLowerCase()} arrives just before the plan changes.`,
      `The message mentions "${first}" and asks for a clear answer today.`,
      `The reply begins with "${phrase}" because one detail is still missing.`,
      `The detail "${second}" is important for the next step, so the answer stays specific.`,
      `The request stays polite while the person tries to ${need}.`,
      upper ? `Two options are compared before one practical next step is recommended.` : `The final line gives one practical next step.`,
      advanced ? `The wording is precise, but it avoids sounding cold or defensive.` : `The message is clear and easy to repeat.`,
      advanced ? `A slight hesitation suggests that the safer option is preferred for a reason not stated directly.` : `The important detail is repeated at the end.`,
      `The reply stays organized: situation, reason, then next step.`,
      `"${third}" appears only where it helps the other person act.`,
      upper ? `One detail remains open, so the final sentence needs a tactful tone.` : `The final sentence is polite and direct.`,
    ],
    German: [
      `Guten Tag, ich habe eine Frage zu "${topic}".`,
      `${capitalizeFirst(setting)} kommt kurz vor der Änderung eine Nachricht zu ${topic} an.`,
      `In der Nachricht steht "${first}", und heute wird eine klare Antwort gebraucht.`,
      `Die Antwort beginnt mit: "${phrase}", weil noch ein Detail fehlt.`,
      `Das Detail "${second}" ist wichtig für den nächsten Schritt, deshalb bleibt die Antwort konkret.`,
      `Das Gespräch bleibt höflich, weil die Person versucht, ${need}.`,
      upper ? `Am Ende werden zwei Möglichkeiten verglichen und ein sinnvoller nächster Schritt empfohlen.` : `Am Ende wird ein nächster Schritt genannt.`,
      advanced ? `Die Formulierung ist präzise, wirkt aber weder kalt noch abwehrend.` : `Die Nachricht ist klar und lässt sich gut wiederholen.`,
      advanced ? `Ein kurzes Zögern deutet an, dass die sicherere Option aus einem nicht direkt genannten Grund besser passt.` : `Das wichtige Detail wird am Ende wiederholt.`,
      `Die Antwort bleibt geordnet: Situation, Grund, nächster Schritt.`,
      `"${third}" erscheint nur dort, wo es für die nächste Handlung hilft.`,
      upper ? `Ein Detail bleibt bewusst offen, deshalb muss die Antwort taktvoll sein.` : `Der letzte Satz ist höflich und direkt.`,
    ],
    Spanish: [
      `Buenos días, tengo una pregunta sobre "${topic}".`,
      `${capitalizeFirst(setting)}, llega un mensaje breve sobre ${topic.toLowerCase()} justo antes del cambio de plan.`,
      `El mensaje menciona "${first}" y pide una respuesta clara hoy.`,
      `La respuesta empieza con "${phrase}" porque todavía falta un detalle.`,
      `El dato "${second}" es importante para el siguiente paso, así que la respuesta se mantiene concreta.`,
      `El intercambio sigue siendo cortés porque intenta ${need}.`,
      upper ? `Al final, se comparan dos opciones y se recomienda un siguiente paso práctico.` : `Al final, se propone un siguiente paso.`,
      advanced ? `El registro es preciso sin resultar frío ni defensivo.` : `El mensaje es claro y fácil de repetir.`,
      advanced ? `Una breve duda sugiere que se prefiere la opción más segura por una razón implícita.` : `El detalle importante se repite al final.`,
      `La respuesta queda ordenada: situación, razón y siguiente paso.`,
      `"${third}" aparece solo cuando ayuda a actuar.`,
      upper ? `Un detalle queda abierto a propósito, por eso la respuesta debe ser diplomática.` : `La última frase es cortés y directa.`,
    ],
    Italian: [
      `Buongiorno, ho una domanda su "${topic}".`,
      `${capitalizeFirst(setting)}, arriva un breve messaggio su ${topic.toLowerCase()} poco prima del cambio di programma.`,
      `Il messaggio menziona "${first}" e chiede una risposta chiara entro oggi.`,
      `La risposta comincia con "${phrase}" perché manca ancora un dettaglio.`,
      `Il dettaglio "${second}" è importante per il prossimo passo, quindi la risposta resta concreta.`,
      `Lo scambio resta cortese perché la persona cerca di ${need}.`,
      upper ? `Alla fine, si confrontano due opzioni e si consiglia il prossimo passo pratico.` : `Alla fine, viene indicato un prossimo passo.`,
      advanced ? `Il registro è preciso senza sembrare freddo o difensivo.` : `Il messaggio è chiaro e facile da ripetere.`,
      advanced ? `Una breve esitazione lascia intendere che l’opzione più sicura è preferibile per un motivo implicito.` : `Il dettaglio importante viene ripetuto alla fine.`,
      `La risposta resta ordinata: situazione, motivo e prossimo passo.`,
      `"${third}" compare solo quando aiuta ad agire.`,
      upper ? `Un dettaglio resta volutamente aperto, quindi la risposta deve essere diplomatica.` : `L’ultima frase è cortese e diretta.`,
    ],
    French: [
      `Bonjour, j’ai une question sur "${topic}".`,
      `${capitalizeFirst(setting)}, un court message sur ${topic.toLowerCase()} arrive juste avant le changement de projet.`,
      `Le message mentionne "${first}" et demande une réponse claire aujourd’hui.`,
      `La réponse commence par : "${phrase}", car il manque encore un détail.`,
      `Le détail "${second}" compte pour la prochaine étape, donc la réponse reste précise.`,
      `L’échange reste poli parce que la personne essaie de ${need}.`,
      upper ? `À la fin, deux options sont comparées et une prochaine étape pratique est recommandée.` : `À la fin, une prochaine étape est proposée.`,
      advanced ? `Le registre est précis sans paraître froid ni défensif.` : `Le message est clair et facile à répéter.`,
      advanced ? `Une légère hésitation laisse entendre que l’option la plus sûre est préférable pour une raison implicite.` : `Le détail important est répété à la fin.`,
      `La réponse reste structurée : situation, raison, prochaine étape.`,
      `"${third}" apparaît seulement quand cela aide à agir.`,
      upper ? `Un détail reste volontairement ouvert, donc la réponse doit être diplomatique.` : `La dernière phrase est polie et directe.`,
    ],
  } satisfies Record<CurriculumLanguage, string[]>;
  const base = sets[language];
  return [readingOpening(language, band, topic, setting, index), ...base.slice(1), `${base[1]} ${advanced ? base[7] : base[3]}`.replace(first, third)];
}

function capitalizeFirst(value: string) {
  return value ? `${value.charAt(0).toLocaleUpperCase()}${value.slice(1)}` : value;
}

function readingOpening(language: CurriculumLanguage, band: CefrBand, topic: string, setting: string, index: number) {
  const domain = lessonDomain(topic);
  const domainOpenings = domainReadingOpenings(language, domain);
  if (domainOpenings.length > 0) return domainOpenings[(index + (band === 'A1' ? 0 : band === 'A2' ? 1 : band === 'B1' ? 2 : band === 'B2' ? 3 : band === 'C1' ? 4 : 5)) % domainOpenings.length];
  const variants = {
    English: {
      A1: [`Text message: I am here now, and I need help with "${topic}".`, `Short note: Please bring the form and wait near the door.`, `Simple dialogue: "Hello. Is this the right place?"`, `Profile: My name is Lina, and I learn after work.`, `Sign: Open today from nine to five.`, `Invitation: Come at four and bring a small notebook.`, `Menu note: Coffee, water, and bread are ready.`, `Timetable: The next bus leaves in ten minutes.`],
      A2: [`Voice message: The appointment has moved, so please check the new time.`, `Travel update: The platform changed after the delay.`, `Hotel email: Your room is ready, but payment is due at reception.`, `Review: The service was friendly, although the queue was long.`, `Instruction: Fill in your details before you send the request.`, `Complaint: The delivery arrived late and one item was missing.`, `Planning note: We can meet after work if the weather is good.`, `Story: Yesterday the ticket machine stopped working.`],
      B1: [`Forum post: I solved the problem by asking for a written confirmation.`, `Workplace email: The team needs a clearer plan before Friday.`, `Experience report: The interview felt difficult at first, but the feedback helped.`, `Customer response: We understand the complaint and propose a practical solution.`, `Article: Many learners improve when practice is short but regular.`, `Community notice: Volunteers will discuss the schedule and responsibilities.`, `Opinion paragraph: The new route is useful, yet it creates a problem for older residents.`, `Narrative: The decision changed after everyone described their experience.`],
      B2: [`Briefing: The proposal is feasible only if the cost estimate is realistic.`, `Debate excerpt: One side values speed, while the other stresses accountability.`, `Report: The data supports the policy, but the implementation risk remains high.`, `Formal email: We can approve the timeline if the privacy safeguards are clearer.`, `Review article: The public benefit is visible, though the tradeoff deserves attention.`, `Negotiation note: Both teams accept the goal but disagree about resources.`, `Risk memo: The strongest argument depends on an assumption that has not been tested.`, `Case analysis: The outcome looks positive, but the benchmark is weak.`],
      C1: [`Editorial: The argument gains force by conceding uncertainty before making its claim.`, `Seminar note: The speaker distinguishes evidence from interpretation with unusual care.`, `Strategy memo: The recommendation is persuasive because it anticipates the strongest objection.`, `Diplomatic email: The wording preserves cooperation while refusing the original request.`, `Critical review: The text is elegant, but its central premise remains underexamined.`, `Policy consultation: Several stakeholders agree on the goal but contest the framing.`, `Professional mediation: The conflict softens once both sides name what they cannot concede.`, `Essay excerpt: The paragraph links credibility to restraint rather than certainty.`],
      C2: [`Rhetorical commentary: The praise is so carefully limited that it becomes a warning.`, `Literary excerpt: What is omitted carries more weight than what is openly stated.`, `Expert panel: The disagreement turns on register, implication, and institutional memory.`, `Policy analysis: The compromise appears neutral, yet it redistributes responsibility quietly.`, `Satirical note: The politeness is flawless, which is precisely why the criticism lands.`, `Legal-style argument: The decisive clause narrows the claim without announcing retreat.`, `Mediation brief: The speaker must preserve ambiguity without sounding evasive.`, `Stylistic rewrite: A blunt refusal becomes a diplomatic reservation through syntax alone.`],
    },
    German: {
      A1: [`SMS: Ich bin jetzt hier und brauche Hilfe mit "${topic}".`, `Kurze Notiz: Bitte bringen Sie das Formular mit und warten Sie an der Tür.`, `Einfacher Dialog: "Guten Tag. Bin ich hier richtig?"`, `Profil: Ich heiße Lina und lerne nach der Arbeit.`, `Schild: Heute von neun bis fünf geöffnet.`, `Einladung: Kommen Sie um vier und bringen Sie ein kleines Heft mit.`, `Menü-Notiz: Kaffee, Wasser und Brot sind fertig.`, `Fahrplan: Der nächste Bus fährt in zehn Minuten.`],
      A2: [`Sprachnachricht: Der Termin wurde verschoben, bitte prüfen Sie die neue Uhrzeit.`, `Reisehinweis: Der Bahnsteig hat sich nach der Verspätung geändert.`, `Hotel-E-Mail: Ihr Zimmer ist bereit, aber die Zahlung erfolgt am Empfang.`, `Bewertung: Der Service war freundlich, obwohl die Warteschlange lang war.`, `Anweisung: Tragen Sie Ihre Daten ein, bevor Sie die Anfrage senden.`, `Beschwerde: Die Lieferung kam spät an und ein Artikel fehlte.`, `Planungsnotiz: Wir können uns nach der Arbeit treffen, wenn das Wetter gut ist.`, `Kurze Geschichte: Gestern funktionierte der Fahrkartenautomat nicht.`],
      B1: [`Forenbeitrag: Ich löste das Problem, indem ich um eine schriftliche Bestätigung bat.`, `Arbeits-E-Mail: Das Team braucht vor Freitag einen klareren Plan.`, `Erfahrungsbericht: Das Gespräch war zuerst schwierig, aber das Feedback half.`, `Kundenantwort: Wir verstehen die Beschwerde und schlagen eine praktische Lösung vor.`, `Artikel: Viele Lernende machen Fortschritte, wenn die Übung kurz, aber regelmäßig ist.`, `Aushang: Freiwillige besprechen den Zeitplan und die Verantwortlichkeiten.`, `Meinungsabschnitt: Die neue Verbindung ist nützlich, schafft aber ein Problem für ältere Bewohner.`, `Erzählung: Die Entscheidung änderte sich, nachdem alle ihre Erfahrung beschrieben hatten.`],
      B2: [`Briefing: Der Vorschlag ist nur machbar, wenn die Kostenschätzung realistisch ist.`, `Debattenauszug: Eine Seite legt Wert auf Tempo, die andere auf Rechenschaftspflicht.`, `Bericht: Die Daten stützen die Richtlinie, doch das Umsetzungsrisiko bleibt hoch.`, `Formelle E-Mail: Wir können den Zeitplan billigen, wenn der Datenschutz klarer ist.`, `Fachartikel: Der öffentliche Nutzen ist sichtbar, aber die Abwägung verdient Aufmerksamkeit.`, `Verhandlungsnotiz: Beide Teams akzeptieren das Ziel, streiten aber über Ressourcen.`, `Risikovermerk: Das stärkste Argument hängt von einer ungeprüften Annahme ab.`, `Fallanalyse: Das Ergebnis wirkt positiv, doch der Vergleichswert ist schwach.`],
      C1: [`Leitartikel: Das Argument gewinnt an Kraft, weil es Unsicherheit einräumt, bevor es seine These formuliert.`, `Seminarnotiz: Die Sprecherin trennt Beleg und Deutung mit ungewöhnlicher Sorgfalt.`, `Strategienotiz: Die Empfehlung überzeugt, weil sie den stärksten Einwand vorwegnimmt.`, `Diplomatische E-Mail: Die Formulierung bewahrt Kooperation und lehnt den ursprünglichen Wunsch dennoch ab.`, `Kritische Rezension: Der Text ist elegant, doch seine zentrale Prämisse bleibt zu wenig geprüft.`, `Politische Anhörung: Mehrere Beteiligte teilen das Ziel, bestreiten aber die Rahmung.`, `Professionelle Mediation: Der Konflikt entspannt sich, sobald beide Seiten benennen, worauf sie nicht verzichten können.`, `Essayauszug: Der Absatz verbindet Glaubwürdigkeit mit Zurückhaltung statt mit Gewissheit.`],
      C2: [`Rhetorischer Kommentar: Das Lob ist so sorgfältig begrenzt, dass es zur Warnung wird.`, `Literarischer Auszug: Was ausgelassen wird, wiegt schwerer als das ausdrücklich Gesagte.`, `Expertengremium: Der Dissens dreht sich um Register, Implikation und institutionelles Gedächtnis.`, `Politikanalyse: Der Kompromiss wirkt neutral und verteilt Verantwortung doch leise um.`, `Satirische Notiz: Die Höflichkeit ist makellos, und gerade deshalb trifft die Kritik.`, `Juristische Argumentation: Die entscheidende Klausel verengt die These, ohne Rückzug anzukündigen.`, `Mediationsbriefing: Die Sprecherin muss Mehrdeutigkeit bewahren, ohne ausweichend zu wirken.`, `Stilistische Umformulierung: Aus einer scharfen Ablehnung wird allein durch Syntax ein diplomatischer Vorbehalt.`],
    },
    Spanish: {
      A1: [`Mensaje: Estoy aquí ahora y necesito ayuda con "${topic}".`, `Nota breve: Trae el formulario y espera junto a la puerta.`, `Diálogo sencillo: "Hola. ¿Es este el lugar correcto?"`, `Perfil: Me llamo Lina y estudio después del trabajo.`, `Cartel: Abierto hoy de nueve a cinco.`, `Invitación: Ven a las cuatro y trae un cuaderno pequeño.`, `Nota de menú: El café, el agua y el pan están listos.`, `Horario: El próximo autobús sale en diez minutos.`],
      A2: [`Mensaje de voz: La cita cambió, así que revisa la nueva hora.`, `Aviso de viaje: El andén cambió después del retraso.`, `Correo del hotel: Tu habitación está lista, pero el pago se hace en recepción.`, `Reseña: El servicio fue amable, aunque la fila era larga.`, `Instrucción: Rellena tus datos antes de enviar la solicitud.`, `Queja: La entrega llegó tarde y faltaba un artículo.`, `Nota de planificación: Podemos vernos después del trabajo si hace buen tiempo.`, `Historia breve: Ayer la máquina de billetes dejó de funcionar.`],
      B1: [`Entrada de foro: Resolví el problema pidiendo una confirmación por escrito.`, `Correo laboral: El equipo necesita un plan más claro antes del viernes.`, `Relato de experiencia: La entrevista fue difícil al principio, pero la opinión recibida ayudó.`, `Respuesta al cliente: Entendemos la queja y proponemos una solución práctica.`, `Artículo: Muchos estudiantes mejoran cuando la práctica es breve pero regular.`, `Aviso comunitario: Los voluntarios hablarán del horario y de las responsabilidades.`, `Párrafo de opinión: La nueva ruta es útil, pero crea un problema para los vecinos mayores.`, `Narración: La decisión cambió después de que todos contaran su experiencia.`],
      B2: [`Informe breve: La propuesta es viable solo si la estimación de costes es realista.`, `Extracto de debate: Un lado valora la rapidez, mientras el otro insiste en la rendición de cuentas.`, `Reporte: Los datos apoyan la política, pero el riesgo de implementación sigue siendo alto.`, `Correo formal: Podemos aprobar el calendario si las garantías de privacidad son más claras.`, `Artículo de análisis: El beneficio público es visible, aunque la compensación merece atención.`, `Nota de negociación: Ambos equipos aceptan el objetivo, pero discrepan sobre los recursos.`, `Memorando de riesgo: El argumento más fuerte depende de una suposición no comprobada.`, `Análisis de caso: El resultado parece positivo, pero el indicador de referencia es débil.`],
      C1: [`Editorial: El argumento gana fuerza al admitir incertidumbre antes de formular su tesis.`, `Nota de seminario: La ponente distingue evidencia e interpretación con especial cuidado.`, `Memorando estratégico: La recomendación convence porque anticipa la objeción más fuerte.`, `Correo diplomático: La redacción conserva la cooperación mientras rechaza la petición inicial.`, `Crítica cultural: El texto es elegante, pero su premisa central queda poco examinada.`, `Consulta pública: Varios actores comparten el objetivo, pero discuten el encuadre.`, `Mediación profesional: El conflicto se suaviza cuando ambas partes nombran lo que no pueden ceder.`, `Fragmento de ensayo: El párrafo vincula la credibilidad con la contención, no con la certeza.`],
      C2: [`Comentario retórico: El elogio está tan cuidadosamente limitado que se convierte en advertencia.`, `Fragmento literario: Lo omitido pesa más que lo que se dice abiertamente.`, `Panel de expertos: El desacuerdo gira en torno al registro, la implicación y la memoria institucional.`, `Análisis político: El compromiso parece neutral, pero redistribuye la responsabilidad en silencio.`, `Nota satírica: La cortesía es impecable, y por eso mismo la crítica funciona.`, `Argumento jurídico: La cláusula decisiva estrecha la tesis sin anunciar retirada.`, `Informe de mediación: La hablante debe conservar la ambigüedad sin sonar evasiva.`, `Reescritura estilística: Una negativa directa se transforma en reserva diplomática solo por la sintaxis.`],
    },
    Italian: {
      A1: [`Messaggio: Sono qui adesso e ho bisogno di aiuto con "${topic}".`, `Nota breve: Porta il modulo e aspetta vicino alla porta.`, `Dialogo semplice: "Buongiorno. È questo il posto giusto?"`, `Profilo: Mi chiamo Lina e studio dopo il lavoro.`, `Cartello: Aperto oggi dalle nove alle cinque.`, `Invito: Vieni alle quattro e porta un quaderno piccolo.`, `Nota del menu: Caffè, acqua e pane sono pronti.`, `Orario: Il prossimo autobus parte tra dieci minuti.`],
      A2: [`Messaggio vocale: L’appuntamento è cambiato, quindi controlla il nuovo orario.`, `Avviso di viaggio: Il binario è cambiato dopo il ritardo.`, `Email dell’hotel: La camera è pronta, ma il pagamento si fa alla reception.`, `Recensione: Il servizio era gentile, anche se la fila era lunga.`, `Istruzione: Inserisci i tuoi dati prima di inviare la richiesta.`, `Reclamo: La consegna è arrivata tardi e mancava un articolo.`, `Nota di pianificazione: Possiamo incontrarci dopo il lavoro se il tempo è buono.`, `Breve storia: Ieri la biglietteria automatica ha smesso di funzionare.`],
      B1: [`Post sul forum: Ho risolto il problema chiedendo una conferma scritta.`, `Email di lavoro: Il team ha bisogno di un piano più chiaro entro venerdì.`, `Racconto di esperienza: Il colloquio all’inizio era difficile, ma il feedback ha aiutato.`, `Risposta al cliente: Comprendiamo il reclamo e proponiamo una soluzione pratica.`, `Articolo: Molti studenti migliorano quando la pratica è breve ma regolare.`, `Avviso di comunità: I volontari discuteranno calendario e responsabilità.`, `Paragrafo di opinione: La nuova linea è utile, però crea un problema per i residenti anziani.`, `Narrazione: La decisione è cambiata dopo che tutti hanno descritto la propria esperienza.`],
      B2: [`Briefing: La proposta è fattibile solo se la stima dei costi è realistica.`, `Estratto di dibattito: Una parte valorizza la rapidità, mentre l’altra insiste sulla responsabilità.`, `Relazione: I dati sostengono la politica, ma il rischio di attuazione resta alto.`, `Email formale: Possiamo approvare il calendario se le garanzie sulla privacy sono più chiare.`, `Articolo di analisi: Il beneficio pubblico è visibile, anche se il compromesso merita attenzione.`, `Nota negoziale: Entrambi i team accettano l’obiettivo, ma non concordano sulle risorse.`, `Promemoria sui rischi: L’argomento più forte dipende da un presupposto non verificato.`, `Analisi di caso: Il risultato sembra positivo, ma l’indicatore di riferimento è debole.`],
      C1: [`Editoriale: L’argomento acquista forza perché ammette l’incertezza prima di formulare la tesi.`, `Nota di seminario: La relatrice distingue prova e interpretazione con particolare cura.`, `Nota strategica: La raccomandazione convince perché anticipa l’obiezione più forte.`, `Email diplomatica: La formulazione preserva la cooperazione pur respingendo la richiesta iniziale.`, `Recensione critica: Il testo è elegante, ma la premessa centrale resta poco esaminata.`, `Consultazione politica: Diversi stakeholder condividono l’obiettivo, ma contestano l’inquadramento.`, `Mediazione professionale: Il conflitto si attenua quando entrambe le parti nominano ciò a cui non possono rinunciare.`, `Estratto di saggio: Il paragrafo collega la credibilità alla cautela più che alla certezza.`],
      C2: [`Commento retorico: L’elogio è così accuratamente limitato da diventare un avvertimento.`, `Estratto letterario: Ciò che viene omesso pesa più di ciò che viene dichiarato.`, `Panel di esperti: Il dissenso ruota attorno a registro, implicazione e memoria istituzionale.`, `Analisi politica: Il compromesso sembra neutrale, ma ridistribuisce silenziosamente la responsabilità.`, `Nota satirica: La cortesia è impeccabile, ed è proprio per questo che la critica colpisce.`, `Argomentazione giuridica: La clausola decisiva restringe la tesi senza annunciare una ritirata.`, `Brief di mediazione: Chi parla deve conservare l’ambiguità senza sembrare evasivo.`, `Riscrittura stilistica: Un rifiuto netto diventa una riserva diplomatica attraverso la sola sintassi.`],
    },
    French: {
      A1: [`Message : Je suis ici maintenant et j’ai besoin d’aide avec "${topic}".`, `Petite note : Apportez le formulaire et attendez près de la porte.`, `Dialogue simple : "Bonjour. C’est bien ici ?"`, `Profil : Je m’appelle Lina et j’étudie après le travail.`, `Panneau : Ouvert aujourd’hui de neuf heures à cinq heures.`, `Invitation : Venez à quatre heures et apportez un petit cahier.`, `Note de menu : Le café, l’eau et le pain sont prêts.`, `Horaire : Le prochain bus part dans dix minutes.`],
      A2: [`Message vocal : Le rendez-vous a changé, alors vérifiez la nouvelle heure.`, `Avis de voyage : Le quai a changé après le retard.`, `Courriel d’hôtel : Votre chambre est prête, mais le paiement se fait à l’accueil.`, `Avis : Le service était aimable, même si la file était longue.`, `Instruction : Remplissez vos données avant d’envoyer la demande.`, `Réclamation : La livraison est arrivée en retard et il manquait un article.`, `Note de planification : Nous pouvons nous voir après le travail s’il fait beau.`, `Petite histoire : Hier, le distributeur de billets ne fonctionnait plus.`],
      B1: [`Message de forum : J’ai résolu le problème en demandant une confirmation écrite.`, `Courriel professionnel : L’équipe a besoin d’un plan plus clair avant vendredi.`, `Récit d’expérience : L’entretien semblait difficile au début, mais le retour a aidé.`, `Réponse client : Nous comprenons la réclamation et proposons une solution pratique.`, `Article : Beaucoup d’apprenants progressent quand la pratique est courte mais régulière.`, `Avis associatif : Les bénévoles discuteront du calendrier et des responsabilités.`, `Paragraphe d’opinion : Le nouvel itinéraire est utile, mais il crée un problème pour les habitants âgés.`, `Récit : La décision a changé après que chacun a décrit son expérience.`],
      B2: [`Briefing : La proposition n’est faisable que si l’estimation des coûts est réaliste.`, `Extrait de débat : Un camp valorise la rapidité, tandis que l’autre insiste sur la redevabilité.`, `Rapport : Les données soutiennent la politique, mais le risque de mise en oeuvre reste élevé.`, `Courriel formel : Nous pouvons approuver le calendrier si les garanties de confidentialité sont plus claires.`, `Article d’analyse : Le bénéfice public est visible, même si le compromis mérite attention.`, `Note de négociation : Les deux équipes acceptent l’objectif, mais divergent sur les ressources.`, `Mémo de risque : L’argument le plus fort dépend d’une hypothèse non vérifiée.`, `Étude de cas : Le résultat paraît positif, mais l’indicateur de référence est faible.`],
      C1: [`Éditorial : L’argument gagne en force parce qu’il admet l’incertitude avant d’énoncer sa thèse.`, `Note de séminaire : L’intervenante distingue preuve et interprétation avec une rare précision.`, `Note stratégique : La recommandation convainc parce qu’elle anticipe l’objection la plus solide.`, `Courriel diplomatique : La formulation maintient la coopération tout en refusant la demande initiale.`, `Critique culturelle : Le texte est élégant, mais sa prémisse centrale reste trop peu examinée.`, `Consultation publique : Plusieurs parties prenantes partagent l’objectif, mais contestent le cadrage.`, `Médiation professionnelle : Le conflit s’apaise quand les deux parties nomment ce qu’elles ne peuvent pas céder.`, `Extrait d’essai : Le paragraphe relie la crédibilité à la retenue plutôt qu’à la certitude.`],
      C2: [`Commentaire rhétorique : L’éloge est si soigneusement limité qu’il devient un avertissement.`, `Extrait littéraire : Ce qui est omis pèse davantage que ce qui est déclaré.`, `Panel d’experts : Le désaccord porte sur le registre, l’implication et la mémoire institutionnelle.`, `Analyse politique : Le compromis paraît neutre, mais il redistribue discrètement la responsabilité.`, `Note satirique : La politesse est impeccable, et c’est précisément pourquoi la critique porte.`, `Argumentation juridique : La clause décisive resserre la thèse sans annoncer de recul.`, `Brief de médiation : La locutrice doit préserver l’ambiguïté sans paraître esquiver.`, `Réécriture stylistique : Un refus frontal devient une réserve diplomatique par la seule syntaxe.`],
    },
  } satisfies Record<CurriculumLanguage, Record<CefrBand, string[]>>;
  return variants[language][band][index % variants[language][band].length];
}

function domainReadingOpenings(language: CurriculumLanguage, domain: string) {
  const openings = {
    English: {
      planning: ['Calendar note: The appointment has moved to Friday morning.', 'Short message: I can meet tomorrow, but only after ten.', 'Planning chat: Please confirm the new time before lunch.'],
      digital: ['Email: I cannot open the attachment on my phone.', 'Support chat: The password works, but the screen stays blank.', 'Notification: Please confirm your account before you download the file.'],
    },
    German: {
      planning: ['Kalendernotiz: Der Termin wurde auf Freitagmorgen verschoben.', 'Kurze Nachricht: Ich kann mich morgen treffen, aber erst nach zehn Uhr.', 'Planungschat: Bitte bestätigen Sie die neue Uhrzeit vor der Mittagspause.'],
      digital: ['E-Mail: Ich kann den Anhang auf meinem Handy nicht öffnen.', 'Support-Chat: Das Passwort funktioniert, aber der Bildschirm bleibt leer.', 'Benachrichtigung: Bitte bestätigen Sie Ihr Konto, bevor Sie die Datei herunterladen.'],
    },
    Spanish: {
      planning: ['Nota de calendario: La cita pasó al viernes por la mañana.', 'Mensaje breve: Puedo quedar mañana, pero solo después de las diez.', 'Chat de planificación: Confirma la nueva hora antes del almuerzo.'],
      digital: ['Correo: No puedo abrir el archivo adjunto en el móvil.', 'Chat de soporte: La contraseña funciona, pero la pantalla queda en blanco.', 'Notificación: Confirma tu cuenta antes de descargar el archivo.'],
    },
    Italian: {
      planning: ['Nota di calendario: L’appuntamento è stato spostato a venerdì mattina.', 'Messaggio breve: Posso incontrarti domani, ma solo dopo le dieci.', 'Chat di pianificazione: Conferma il nuovo orario prima di pranzo.'],
      digital: ['Email: Non riesco ad aprire l’allegato sul telefono.', 'Chat di supporto: La password funziona, ma lo schermo resta vuoto.', 'Notifica: Conferma l’account prima di scaricare il file.'],
    },
    French: {
      planning: ['Note de calendrier : Le rendez-vous a été déplacé à vendredi matin.', 'Message court : Je peux te voir demain, mais seulement après dix heures.', 'Discussion de planification : Confirmez la nouvelle heure avant midi.'],
      digital: ['Courriel : Je n’arrive pas à ouvrir la pièce jointe sur mon téléphone.', 'Chat d’assistance : Le mot de passe fonctionne, mais l’écran reste vide.', 'Notification : Confirmez votre compte avant de télécharger le fichier.'],
    },
  } satisfies Record<CurriculumLanguage, Record<'planning' | 'digital', string[]>>;
  return domain === 'planning' || domain === 'digital' ? openings[language][domain] : [];
}

function chunkFrames(language: CurriculumLanguage, band: CefrBand): Array<{ phrase: (theme: string) => string; meaning: string }> {
  const frames = {
    English: {
      A1: [
        { phrase: 'Could you repeat that, please?', meaning: 'asks for repetition politely' },
        { phrase: 'I would like ...', meaning: 'makes a polite request' },
        { phrase: 'That works for me.', meaning: 'accepts an option' },
        { phrase: 'There is one problem.', meaning: 'introduces a simple problem' },
      ],
      A2: [
        { phrase: 'I have to change the time.', meaning: 'explains a simple arrangement change' },
        { phrase: 'Can we compare the two options?', meaning: 'starts a practical comparison' },
        { phrase: 'The main reason is ...', meaning: 'introduces a reason' },
        { phrase: 'I sent a short confirmation.', meaning: 'confirms an arrangement' },
        { phrase: 'Could you let me know today?', meaning: 'requests a timely answer' },
        { phrase: 'It was not available yesterday.', meaning: 'reports a simple problem in the past' },
      ],
      B1: [
        { phrase: 'From my experience, ...', meaning: 'introduces a personal account' },
        { phrase: 'The problem started when ...', meaning: 'narrates a cause' },
        { phrase: 'That led to ...', meaning: 'connects events and consequences' },
        { phrase: 'I would recommend ...', meaning: 'gives a recommendation' },
        { phrase: 'The advantage is clear, but ...', meaning: 'balances a view' },
        { phrase: 'Let me summarize the decision.', meaning: 'signals a summary' },
      ],
      B2: [
        { phrase: 'The evidence suggests that ...', meaning: 'grounds an argument in evidence' },
        { phrase: 'The tradeoff is worth naming.', meaning: 'introduces a balanced assessment' },
        { phrase: 'From a stakeholder perspective, ...', meaning: 'frames a professional viewpoint' },
        { phrase: 'If we assume that ..., then ...', meaning: 'builds a conditional argument' },
        { phrase: 'I agree in principle; however, ...', meaning: 'disagrees constructively' },
        { phrase: 'The risk can be mitigated by ...', meaning: 'proposes risk reduction' },
      ],
      C1: [
        { phrase: 'That interpretation is plausible, provided that ...', meaning: 'qualifies a claim' },
        { phrase: 'I would frame the issue differently.', meaning: 'signals analytical reframing' },
        { phrase: 'The wording softens the objection without removing it.', meaning: 'discusses register and stance' },
        { phrase: 'There is a tension between ... and ...', meaning: 'identifies conceptual tension' },
        { phrase: 'A more measured formulation would be ...', meaning: 'reformulates diplomatically' },
        { phrase: 'The implication is not stated, but it is hard to miss.', meaning: 'marks implied meaning' },
      ],
      C2: [
        { phrase: 'The apparent concession is doing more work than it admits.', meaning: 'analyses rhetorical subtext' },
        { phrase: 'The sentence withholds judgment while steering the reader toward it.', meaning: 'detects controlled ambiguity' },
        { phrase: 'A literal paraphrase would flatten the irony.', meaning: 'protects stylistic nuance' },
        { phrase: 'The register shift is strategic, not accidental.', meaning: 'explains advanced register control' },
        { phrase: 'The understatement functions as a polite rebuke.', meaning: 'identifies indirect criticism' },
        { phrase: 'Keep the ambiguity, but remove the evasiveness.', meaning: 'sets a high-level rewriting goal' },
      ],
    },
    German: {
      A1: [
        { phrase: 'Könnten Sie das bitte wiederholen?', meaning: 'höflich um Wiederholung bitten' },
        { phrase: 'Ich hätte gern ...', meaning: 'höflich bestellen oder bitten' },
        { phrase: 'Das passt für mich.', meaning: 'eine Option annehmen' },
        { phrase: 'Es gibt ein Problem.', meaning: 'ein einfaches Problem einleiten' },
      ],
      A2: [
        { phrase: 'Ich muss die Uhrzeit ändern.', meaning: 'eine einfache Änderung erklären' },
        { phrase: 'Können wir die zwei Optionen vergleichen?', meaning: 'einen praktischen Vergleich beginnen' },
        { phrase: 'Der wichtigste Grund ist ...', meaning: 'einen Grund nennen' },
        { phrase: 'Ich habe eine kurze Bestätigung geschickt.', meaning: 'eine Absprache bestätigen' },
        { phrase: 'Könnten Sie mir heute Bescheid geben?', meaning: 'um eine zeitnahe Antwort bitten' },
        { phrase: 'Das war gestern nicht verfügbar.', meaning: 'ein einfaches Problem in der Vergangenheit melden' },
      ],
      B1: [
        { phrase: 'Aus meiner Erfahrung ...', meaning: 'eine persönliche Erfahrung einleiten' },
        { phrase: 'Das Problem begann, als ...', meaning: 'eine Ursache erzählen' },
        { phrase: 'Das führte dazu, dass ...', meaning: 'Folgen verbinden' },
        { phrase: 'Ich würde empfehlen, ...', meaning: 'eine Empfehlung geben' },
        { phrase: 'Der Vorteil ist klar, aber ...', meaning: 'eine Meinung abwägen' },
        { phrase: 'Lassen Sie mich die Entscheidung zusammenfassen.', meaning: 'eine Zusammenfassung markieren' },
      ],
      B2: [
        { phrase: 'Die Belege sprechen dafür, dass ...', meaning: 'ein Argument belegen' },
        { phrase: 'Die Abwägung sollte ausdrücklich benannt werden.', meaning: 'eine ausgewogene Bewertung einleiten' },
        { phrase: 'Aus Sicht der Beteiligten ...', meaning: 'eine professionelle Perspektive markieren' },
        { phrase: 'Wenn wir davon ausgehen, dass ..., dann ...', meaning: 'hypothetisch argumentieren' },
        { phrase: 'Grundsätzlich stimme ich zu; allerdings ...', meaning: 'konstruktiv widersprechen' },
        { phrase: 'Das Risiko lässt sich mindern, indem ...', meaning: 'Risikominderung vorschlagen' },
      ],
      C1: [
        { phrase: 'Diese Deutung ist plausibel, sofern ...', meaning: 'eine Aussage einschränken' },
        { phrase: 'Ich würde die Frage anders rahmen.', meaning: 'analytisch umdeuten' },
        { phrase: 'Die Formulierung schwächt den Einwand ab, ohne ihn aufzuheben.', meaning: 'Register und Haltung analysieren' },
        { phrase: 'Es besteht eine Spannung zwischen ... und ...', meaning: 'konzeptuelle Spannung erkennen' },
        { phrase: 'Eine abgewogenere Formulierung wäre ...', meaning: 'diplomatisch umformulieren' },
        { phrase: 'Die Implikation wird nicht ausgesprochen, ist aber kaum zu übersehen.', meaning: 'implizite Bedeutung markieren' },
      ],
      C2: [
        { phrase: 'Das scheinbare Zugeständnis leistet mehr, als es zugibt.', meaning: 'rhetorischen Subtext analysieren' },
        { phrase: 'Der Satz enthält sich eines Urteils und lenkt doch darauf hin.', meaning: 'kontrollierte Mehrdeutigkeit erkennen' },
        { phrase: 'Eine wörtliche Paraphrase würde die Ironie verflachen.', meaning: 'stilistische Nuance bewahren' },
        { phrase: 'Der Registerwechsel ist strategisch, nicht zufällig.', meaning: 'fortgeschrittene Registerkontrolle erklären' },
        { phrase: 'Die Untertreibung wirkt als höflicher Tadel.', meaning: 'indirekte Kritik erkennen' },
        { phrase: 'Bewahren Sie die Mehrdeutigkeit, aber entfernen Sie das Ausweichende.', meaning: 'anspruchsvoll umformulieren' },
      ],
    },
    Spanish: {
      A1: [
        { phrase: '¿Puedes repetirlo, por favor?', meaning: 'pide repetición con cortesía' },
        { phrase: 'Me gustaría ...', meaning: 'formula una petición' },
        { phrase: 'Me viene bien.', meaning: 'acepta una opción' },
        { phrase: 'Hay un problema.', meaning: 'introduce un problema sencillo' },
      ],
      A2: [
        { phrase: 'Tengo que cambiar la hora.', meaning: 'explica un cambio sencillo' },
        { phrase: '¿Podemos comparar las dos opciones?', meaning: 'empieza una comparación práctica' },
        { phrase: 'La razón principal es ...', meaning: 'introduce una razón' },
        { phrase: 'Envié una confirmación breve.', meaning: 'confirma un acuerdo' },
        { phrase: '¿Podría avisarme hoy?', meaning: 'pide una respuesta a tiempo' },
        { phrase: 'Ayer no estaba disponible.', meaning: 'informa de un problema en pasado' },
      ],
      B1: [
        { phrase: 'Según mi experiencia, ...', meaning: 'introduce una experiencia personal' },
        { phrase: 'El problema empezó cuando ...', meaning: 'narra una causa' },
        { phrase: 'Eso provocó que ...', meaning: 'relaciona hechos y consecuencias' },
        { phrase: 'Recomendaría ...', meaning: 'da una recomendación' },
        { phrase: 'La ventaja está clara, pero ...', meaning: 'equilibra una opinión' },
        { phrase: 'Permítame resumir la decisión.', meaning: 'señala un resumen' },
      ],
      B2: [
        { phrase: 'La evidencia indica que ...', meaning: 'fundamenta un argumento' },
        { phrase: 'Conviene nombrar la compensación.', meaning: 'introduce una evaluación equilibrada' },
        { phrase: 'Desde la perspectiva de los actores implicados, ...', meaning: 'enmarca una perspectiva profesional' },
        { phrase: 'Si asumimos que ..., entonces ...', meaning: 'construye un argumento hipotético' },
        { phrase: 'Estoy de acuerdo en principio; sin embargo, ...', meaning: 'disiente de forma constructiva' },
        { phrase: 'El riesgo puede mitigarse mediante ...', meaning: 'propone reducir un riesgo' },
      ],
      C1: [
        { phrase: 'Esa interpretación es plausible, siempre que ...', meaning: 'matiza una afirmación' },
        { phrase: 'Yo encuadraría el problema de otra manera.', meaning: 'reformula analíticamente' },
        { phrase: 'La formulación suaviza la objeción sin eliminarla.', meaning: 'analiza registro y postura' },
        { phrase: 'Hay una tensión entre ... y ...', meaning: 'identifica una tensión conceptual' },
        { phrase: 'Una formulación más medida sería ...', meaning: 'reformula con diplomacia' },
        { phrase: 'La implicación no se dice, pero cuesta no verla.', meaning: 'marca significado implícito' },
      ],
      C2: [
        { phrase: 'La concesión aparente hace más de lo que admite.', meaning: 'analiza el subtexto retórico' },
        { phrase: 'La frase evita juzgar y aun así orienta al lector.', meaning: 'detecta ambigüedad controlada' },
        { phrase: 'Una paráfrasis literal aplanaría la ironía.', meaning: 'protege el matiz estilístico' },
        { phrase: 'El cambio de registro es estratégico, no accidental.', meaning: 'explica control avanzado del registro' },
        { phrase: 'La subestimación funciona como reproche cortés.', meaning: 'identifica crítica indirecta' },
        { phrase: 'Mantén la ambigüedad, pero elimina lo evasivo.', meaning: 'plantea una reescritura avanzada' },
      ],
    },
    Italian: {
      A1: [
        { phrase: 'Può ripetere, per favore?', meaning: 'chiede di ripetere con cortesia' },
        { phrase: 'Vorrei ...', meaning: 'formula una richiesta' },
        { phrase: 'Per me va bene.', meaning: 'accetta un’opzione' },
        { phrase: 'C’è un problema.', meaning: 'introduce un problema semplice' },
      ],
      A2: [
        { phrase: 'Devo cambiare l’orario.', meaning: 'spiega un semplice cambiamento' },
        { phrase: 'Possiamo confrontare le due opzioni?', meaning: 'avvia un confronto pratico' },
        { phrase: 'Il motivo principale è ...', meaning: 'introduce una ragione' },
        { phrase: 'Ho inviato una breve conferma.', meaning: 'conferma un accordo' },
        { phrase: 'Potrebbe farmelo sapere oggi?', meaning: 'chiede una risposta in tempo' },
        { phrase: 'Ieri non era disponibile.', meaning: 'segnala un problema al passato' },
      ],
      B1: [
        { phrase: 'Secondo la mia esperienza, ...', meaning: 'introduce un’esperienza personale' },
        { phrase: 'Il problema è iniziato quando ...', meaning: 'racconta una causa' },
        { phrase: 'Questo ha portato a ...', meaning: 'collega eventi e conseguenze' },
        { phrase: 'Consiglierei di ...', meaning: 'formula una raccomandazione' },
        { phrase: 'Il vantaggio è chiaro, però ...', meaning: 'bilancia un’opinione' },
        { phrase: 'Mi permetta di riassumere la decisione.', meaning: 'segnala una sintesi' },
      ],
      B2: [
        { phrase: 'Le prove indicano che ...', meaning: 'fonda un argomento sulle prove' },
        { phrase: 'Il compromesso va esplicitato.', meaning: 'introduce una valutazione equilibrata' },
        { phrase: 'Dal punto di vista degli stakeholder, ...', meaning: 'inquadra una prospettiva professionale' },
        { phrase: 'Se assumiamo che ..., allora ...', meaning: 'costruisce un ragionamento ipotetico' },
        { phrase: 'Sono d’accordo in linea di principio; tuttavia ...', meaning: 'dissente in modo costruttivo' },
        { phrase: 'Il rischio può essere mitigato attraverso ...', meaning: 'propone una riduzione del rischio' },
      ],
      C1: [
        { phrase: 'Questa interpretazione è plausibile, purché ...', meaning: 'qualifica un’affermazione' },
        { phrase: 'Inquadrerei la questione in modo diverso.', meaning: 'segnala una riformulazione analitica' },
        { phrase: 'La formulazione attenua l’obiezione senza eliminarla.', meaning: 'analizza registro e postura' },
        { phrase: 'C’è una tensione tra ... e ...', meaning: 'identifica una tensione concettuale' },
        { phrase: 'Una formulazione più misurata sarebbe ...', meaning: 'riformula diplomaticamente' },
        { phrase: 'L’implicazione non è dichiarata, ma è difficile ignorarla.', meaning: 'segnala significato implicito' },
      ],
      C2: [
        { phrase: 'La concessione apparente fa più di quanto ammetta.', meaning: 'analizza il sottotesto retorico' },
        { phrase: 'La frase sospende il giudizio eppure lo orienta.', meaning: 'individua ambiguità controllata' },
        { phrase: 'Una parafrasi letterale appiattirebbe l’ironia.', meaning: 'protegge la sfumatura stilistica' },
        { phrase: 'Il cambio di registro è strategico, non casuale.', meaning: 'spiega controllo avanzato del registro' },
        { phrase: 'L’understatement funziona come rimprovero cortese.', meaning: 'identifica critica indiretta' },
        { phrase: 'Mantieni l’ambiguità, ma elimina l’evasività.', meaning: 'definisce una riscrittura avanzata' },
      ],
    },
    French: {
      A1: [
        { phrase: 'Vous pouvez répéter, s’il vous plaît ?', meaning: 'demande une répétition polie' },
        { phrase: 'Je voudrais ...', meaning: 'formule une demande' },
        { phrase: 'Ça me convient.', meaning: 'accepte une option' },
        { phrase: 'Il y a un problème.', meaning: 'introduit un problème simple' },
      ],
      A2: [
        { phrase: 'Je dois changer l’heure.', meaning: 'explique un changement simple' },
        { phrase: 'On peut comparer les deux options ?', meaning: 'lance une comparaison pratique' },
        { phrase: 'La raison principale, c’est ...', meaning: 'introduit une raison' },
        { phrase: 'J’ai envoyé une courte confirmation.', meaning: 'confirme un accord' },
        { phrase: 'Vous pouvez me répondre aujourd’hui ?', meaning: 'demande une réponse rapide' },
        { phrase: 'Ce n’était pas disponible hier.', meaning: 'signale un problème au passé' },
      ],
      B1: [
        { phrase: 'D’après mon expérience, ...', meaning: 'introduit une expérience personnelle' },
        { phrase: 'Le problème a commencé quand ...', meaning: 'raconte une cause' },
        { phrase: 'Cela a entraîné ...', meaning: 'relie des faits et des conséquences' },
        { phrase: 'Je recommanderais de ...', meaning: 'donne une recommandation' },
        { phrase: 'L’avantage est clair, mais ...', meaning: 'équilibre une opinion' },
        { phrase: 'Permettez-moi de résumer la décision.', meaning: 'signale une synthèse' },
      ],
      B2: [
        { phrase: 'Les preuves suggèrent que ...', meaning: 'fonde un argument sur des preuves' },
        { phrase: 'Le compromis mérite d’être nommé.', meaning: 'introduit une évaluation équilibrée' },
        { phrase: 'Du point de vue des parties prenantes, ...', meaning: 'cadre une perspective professionnelle' },
        { phrase: 'Si l’on suppose que ..., alors ...', meaning: 'construit un raisonnement hypothétique' },
        { phrase: 'Je suis d’accord sur le principe ; cependant ...', meaning: 'exprime un désaccord constructif' },
        { phrase: 'Le risque peut être atténué par ...', meaning: 'propose une réduction du risque' },
      ],
      C1: [
        { phrase: 'Cette interprétation est plausible, à condition que ...', meaning: 'nuance une affirmation' },
        { phrase: 'Je cadrerais la question autrement.', meaning: 'signale un recadrage analytique' },
        { phrase: 'La formulation atténue l’objection sans l’effacer.', meaning: 'analyse registre et posture' },
        { phrase: 'Il existe une tension entre ... et ...', meaning: 'identifie une tension conceptuelle' },
        { phrase: 'Une formulation plus mesurée serait ...', meaning: 'reformule diplomatiquement' },
        { phrase: 'L’implicite n’est pas formulé, mais il est difficile à manquer.', meaning: 'marque le sens implicite' },
      ],
      C2: [
        { phrase: 'La concession apparente fait plus qu’elle ne l’avoue.', meaning: 'analyse le sous-texte rhétorique' },
        { phrase: 'La phrase suspend le jugement tout en l’orientant.', meaning: 'détecte une ambiguïté contrôlée' },
        { phrase: 'Une paraphrase littérale écraserait l’ironie.', meaning: 'préserve la nuance stylistique' },
        { phrase: 'Le changement de registre est stratégique, pas accidentel.', meaning: 'explique le contrôle avancé du registre' },
        { phrase: 'L’euphémisation agit comme un reproche poli.', meaning: 'identifie une critique indirecte' },
        { phrase: 'Gardez l’ambiguïté, mais retirez l’esquive.', meaning: 'fixe un objectif de réécriture avancé' },
      ],
    },
  } satisfies Record<CurriculumLanguage, Record<CefrBand, Array<{ phrase: string; meaning: string }>>>;
  return frames[language][band].map((frame) => ({ phrase: () => frame.phrase, meaning: frame.meaning }));
}

function chunkExample(language: CurriculumLanguage, profile: LevelProfile, chunk: string, _index: number) {
  const advanced = profile.cefrLevel === 'C1' || profile.cefrLevel === 'C2';
  const examples = {
    English: advanced ? `In the final response, I write "${chunk}" to keep the tone precise.` : `In a short reply, I say "${chunk}" before adding the missing detail.`,
    German: advanced ? `In der abschließenden Antwort schreibe ich: "${chunk}", damit der Ton präzise bleibt.` : `In einer kurzen Antwort sage ich: "${chunk}" und ergänze dann das fehlende Detail.`,
    Spanish: advanced ? `En la respuesta final escribo "${chunk}" para mantener un tono preciso.` : `En una respuesta breve digo "${chunk}" antes de añadir el dato que falta.`,
    Italian: advanced ? `Nella risposta finale scrivo "${chunk}" per mantenere un tono preciso.` : `In una risposta breve dico "${chunk}" prima di aggiungere il dettaglio mancante.`,
    French: advanced ? `Dans la réponse finale, j’écris : "${chunk}" pour garder un ton précis.` : `Dans une réponse courte, je dis : "${chunk}" avant d’ajouter le détail manquant.`,
  } satisfies Record<CurriculumLanguage, string>;
  return examples[language];
}

function sentenceTemplates(language: CurriculumLanguage, band: CefrBand): TextFrame[] {
  const frames: Record<CurriculumLanguage, Record<CefrBand, TextFrame[]>> = {
    English: {
      A1: [
        ({ theme, word }) => `I use ${word} when I talk about ${theme.toLowerCase()}.`,
        ({ chunk }) => `Please note ${chunk}.`,
        ({ word }) => `${word} is useful today.`,
        ({ theme }) => `I can ask a short question about ${theme.toLowerCase()}.`,
      ],
      A2: [
        ({ theme, word }) => `Yesterday I needed ${word} because the ${theme.toLowerCase()} situation changed.`,
        ({ chunk }) => `Could you explain ${chunk} before we decide?`,
        ({ grammarFocus }) => `The sentence uses ${grammarFocus} in a practical message.`,
        ({ theme }) => `I compared two options and chose the best one for ${theme.toLowerCase()}.`,
        ({ word }) => `I wrote a short reply and included ${word}.`,
      ],
      B1: [
        ({ theme, word }) => `My experience with ${theme.toLowerCase()} improved when I paid attention to ${word}.`,
        ({ chunk }) => `The speaker used ${chunk} to explain the problem clearly.`,
        ({ grammarFocus }) => `A connected answer should include ${grammarFocus} and a reason.`,
        ({ theme }) => `The story about ${theme.toLowerCase()} has a problem, a decision, and a result.`,
        ({ word }) => `The recommendation is stronger when it includes ${word}.`,
        ({ theme }) => `I can summarize the situation and add my opinion about ${theme.toLowerCase()}.`,
      ],
      B2: [
        ({ theme, word }) => `A balanced argument about ${theme.toLowerCase()} needs evidence, contrast, and ${word}.`,
        ({ chunk }) => `The paragraph becomes clearer when ${chunk} introduces the second point.`,
        ({ grammarFocus }) => `The answer uses ${grammarFocus} to connect claims with consequences.`,
        ({ theme }) => `The professional email about ${theme.toLowerCase()} should define the tradeoff before recommending action.`,
        ({ word }) => `The presenter qualifies the claim by referring to ${word}.`,
        ({ theme }) => `Different stakeholders interpret ${theme.toLowerCase()} in different ways.`,
      ],
      C1: [
        ({ theme, word }) => `A nuanced briefing on ${theme.toLowerCase()} depends on precise framing, register control, and ${word}.`,
        ({ chunk }) => `The writer uses ${chunk} to reformulate a sensitive point without sounding evasive.`,
        ({ grammarFocus }) => `The response demonstrates ${grammarFocus} while preserving a professional tone.`,
        ({ theme }) => `The analysis of ${theme.toLowerCase()} distinguishes evidence, assumption, and implication.`,
        ({ word }) => `The conclusion remains cautious because ${word} limits the claim.`,
        ({ theme }) => `A stronger version would synthesize opposing views on ${theme.toLowerCase()} rather than listing them.`,
      ],
      C2: [
        ({ theme, word }) => `The passage about ${theme.toLowerCase()} compresses stance, subtext, and ${word} into a deceptively plain sentence.`,
        ({ chunk }) => `The phrase ${chunk} functions less as information than as a controlled rhetorical signal.`,
        ({ grammarFocus }) => `The speaker manipulates ${grammarFocus} to create distance without explicit refusal.`,
        () => `At C2, the listener has to infer meaning from tone, omission, and stylistic pressure.`,
        ({ word }) => `The revision turns ${word} into a subtle qualification rather than a visible hedge.`,
        ({ theme }) => `A near-native response should preserve ambiguity in ${theme.toLowerCase()} while making the argument readable.`,
      ],
    },
    German: {
      A1: [
        ({ theme, word }) => `Ich benutze ${word}, wenn ich über ${theme} spreche.`,
        ({ chunk }) => `Bitte beachten Sie: ${chunk}.`,
        ({ word }) => `${word} ist heute wichtig.`,
        ({ theme }) => `Ich kann eine kurze Frage zu ${theme} stellen.`,
      ],
      A2: [
        ({ theme, word }) => `Gestern brauchte ich ${word}, weil sich die Situation bei ${theme} geändert hat.`,
        ({ chunk }) => `Können Sie ${chunk} kurz erklären?`,
        ({ grammarFocus }) => `Der Satz nutzt ${grammarFocus} in einer praktischen Nachricht.`,
        ({ theme }) => `Ich vergleiche zwei Optionen und wähle die beste Lösung für ${theme}.`,
        ({ word }) => `Ich schreibe eine kurze Antwort und benutze ${word}.`,
      ],
      B1: [
        ({ theme, word }) => `Meine Erfahrung mit ${theme} wurde besser, als ich auf ${word} geachtet habe.`,
        ({ chunk }) => `Der Sprecher nutzt ${chunk}, um das Problem klar zu erklären.`,
        ({ grammarFocus }) => `Eine zusammenhängende Antwort enthält ${grammarFocus} und einen Grund.`,
        ({ theme }) => `Die Geschichte über ${theme} hat ein Problem, eine Entscheidung und ein Ergebnis.`,
        ({ word }) => `Die Empfehlung wirkt stärker, wenn sie ${word} enthält.`,
        ({ theme }) => `Ich kann die Situation zusammenfassen und meine Meinung zu ${theme} ergänzen.`,
      ],
      B2: [
        ({ theme, word }) => `Ein ausgewogenes Argument zu ${theme} braucht Belege, Gegensatz und ${word}.`,
        ({ chunk }) => `Der Absatz wird klarer, wenn ${chunk} den zweiten Punkt einleitet.`,
        ({ grammarFocus }) => `Die Antwort nutzt ${grammarFocus}, um Thesen mit Folgen zu verbinden.`,
        ({ theme }) => `Die berufliche E-Mail zu ${theme} sollte die Abwägung vor der Empfehlung erklären.`,
        ({ word }) => `Die Präsentation schränkt die These mit ${word} präzise ein.`,
        ({ theme }) => `Verschiedene Beteiligte deuten ${theme} unterschiedlich.`,
      ],
      C1: [
        ({ theme, word }) => `Ein nuanciertes Briefing zu ${theme} braucht präzise Rahmung, Registerkontrolle und ${word}.`,
        ({ chunk }) => `Der Autor nutzt ${chunk}, um einen sensiblen Punkt nicht ausweichend wirken zu lassen.`,
        ({ grammarFocus }) => `Die Antwort zeigt ${grammarFocus} und bewahrt trotzdem einen professionellen Ton.`,
        ({ theme }) => `Die Analyse von ${theme} unterscheidet Beleg, Annahme und Implikation.`,
        ({ word }) => `Der Schluss bleibt vorsichtig, weil ${word} die These einschränkt.`,
        ({ theme }) => `Eine stärkere Version synthetisiert gegensätzliche Sichtweisen zu ${theme}, statt sie nur aufzuzählen.`,
      ],
      C2: [
        ({ theme, word }) => `Der Text zu ${theme} verdichtet Haltung, Subtext und ${word} in einem scheinbar einfachen Satz.`,
        ({ chunk }) => `Die Wendung ${chunk} funktioniert weniger als Information denn als kontrolliertes rhetorisches Signal.`,
        ({ grammarFocus }) => `Der Sprecher nutzt ${grammarFocus}, um Distanz ohne ausdrückliche Ablehnung zu erzeugen.`,
        () => `Auf C2 muss man Bedeutung aus Ton, Auslassung und stilistischem Druck erschließen.`,
        ({ word }) => `Die Überarbeitung macht aus ${word} eine subtile Einschränkung statt einer sichtbaren Absicherung.`,
        ({ theme }) => `Eine nahezu muttersprachliche Antwort bewahrt die Mehrdeutigkeit von ${theme} und bleibt dennoch lesbar.`,
      ],
    },
    Spanish: romanceSentenceTemplates('Spanish'),
    Italian: romanceSentenceTemplates('Italian'),
    French: romanceSentenceTemplates('French'),
  };
  return frames[language][band];
}

function romanceSentenceTemplates(language: 'Spanish' | 'Italian' | 'French'): Record<CefrBand, TextFrame[]> {
  const c = {
    Spanish: {
      use: 'Uso',
      when: 'cuando hablo de',
      lesson: 'Por favor, ten en cuenta',
      important: 'es útil hoy',
      ask: 'Puedo hacer una pregunta breve sobre',
      yesterday: 'Ayer necesité',
      changed: 'porque la situación cambió en',
      explain: '¿Podría explicar',
      grammar: 'La frase usa',
      practical: 'en un mensaje práctico',
      compare: 'Comparo dos opciones y elijo la mejor para',
      experience: 'Mi experiencia con',
      improved: 'mejoró cuando presté atención a',
      argument: 'Un argumento equilibrado sobre',
      needs: 'necesita evidencia, contraste y',
      nuanced: 'Un informe matizado sobre',
      depends: 'depende de precisión, registro y',
      c2: 'El texto sobre',
      compresses: 'condensa postura, subtexto y',
      shortReply: 'Uso {word} en una respuesta breve.',
      clarifies: '{chunk} aclara el problema y la solución.',
      reason: 'La frase usa {grammarFocus} para dar una razón.',
      story: 'La historia sobre {theme} presenta un problema, una decisión y un resultado.',
      recommendation: 'La recomendación se vuelve más fuerte con {word}.',
      summarize: 'Puedo resumir {theme} y añadir mi opinión.',
      secondPoint: '{chunk} introduce un segundo punto con más claridad.',
      consequence: 'La frase usa {grammarFocus} para relacionar causas y consecuencias.',
      professional: 'Un mensaje profesional sobre {theme} debe explicar la compensación.',
      qualifies: 'El presentador matiza la afirmación con {word}.',
      stakeholders: 'Distintos actores interpretan {theme} de manera diferente.',
      sensitive: '{chunk} reformula un punto sensible sin perder el registro.',
      professionalTone: 'La frase usa {grammarFocus} y conserva un tono profesional.',
      analysis: 'El análisis de {theme} distingue evidencia, suposición e implicación.',
      cautious: 'La conclusión sigue siendo prudente gracias a {word}.',
      synthesize: 'Una versión mejor sintetiza puntos de vista opuestos sobre {theme}.',
      rhetorical: '{chunk} funciona como señal retórica más que como simple información.',
      distance: 'La frase usa {grammarFocus} para crear distancia implícita.',
      omission: 'En C2, el oyente infiere el sentido a partir del tono y la omisión.',
      subtle: '{word} se convierte en una matización sutil, no en una reserva visible.',
      ambiguity: 'Una respuesta casi nativa mantiene la ambigüedad de {theme} sin perder claridad.',
    },
    Italian: {
      use: 'Uso',
      when: 'quando parlo di',
      lesson: 'Per favore, considera',
      important: 'è utile oggi',
      ask: 'Posso fare una domanda breve su',
      yesterday: 'Ieri ho avuto bisogno di',
      changed: 'perché la situazione è cambiata in',
      explain: 'Potrebbe spiegare',
      grammar: 'La frase usa',
      practical: 'in un messaggio pratico',
      compare: 'Confronto due opzioni e scelgo la migliore per',
      experience: 'La mia esperienza con',
      improved: 'è migliorata quando ho prestato attenzione a',
      argument: 'Un argomento equilibrato su',
      needs: 'ha bisogno di prove, contrasto e',
      nuanced: 'Un briefing sfumato su',
      depends: 'dipende da precisione, registro e',
      c2: 'Il testo su',
      compresses: 'comprime posizione, sottotesto e',
      shortReply: 'Uso {word} in una risposta breve.',
      clarifies: '{chunk} chiarisce il problema e la soluzione.',
      reason: 'La frase usa {grammarFocus} per dare una ragione.',
      story: 'La storia su {theme} presenta un problema, una decisione e un risultato.',
      recommendation: 'La raccomandazione diventa più forte con {word}.',
      summarize: 'Posso riassumere {theme} e aggiungere la mia opinione.',
      secondPoint: '{chunk} introduce un secondo punto con più chiarezza.',
      consequence: 'La frase usa {grammarFocus} per collegare cause e conseguenze.',
      professional: 'Un messaggio professionale su {theme} deve spiegare il compromesso.',
      qualifies: 'Il relatore sfuma l’affermazione con {word}.',
      stakeholders: 'Attori diversi interpretano {theme} in modi diversi.',
      sensitive: '{chunk} riformula un punto sensibile senza perdere il registro.',
      professionalTone: 'La frase usa {grammarFocus} e conserva un tono professionale.',
      analysis: 'L’analisi di {theme} distingue prova, presupposto e implicazione.',
      cautious: 'La conclusione resta prudente grazie a {word}.',
      synthesize: 'Una versione migliore sintetizza punti di vista opposti su {theme}.',
      rhetorical: '{chunk} funziona come segnale retorico più che come semplice informazione.',
      distance: 'La frase usa {grammarFocus} per creare distanza implicita.',
      omission: 'Al livello C2, chi ascolta ricava il senso dal tono e dall’omissione.',
      subtle: '{word} diventa una qualificazione sottile, non una riserva visibile.',
      ambiguity: 'Una risposta quasi nativa mantiene l’ambiguità di {theme} restando chiara.',
    },
    French: {
      use: 'J’utilise',
      when: 'quand je parle de',
      lesson: 'Veuillez noter',
      important: 'est utile aujourd’hui',
      ask: 'Je peux poser une brève question sur',
      yesterday: 'Hier, j’ai eu besoin de',
      changed: 'parce que la situation a changé dans',
      explain: 'Pourriez-vous expliquer',
      grammar: 'La phrase utilise',
      practical: 'dans un message pratique',
      compare: 'Je compare deux options et je choisis la meilleure pour',
      experience: 'Mon expérience avec',
      improved: 's’est améliorée quand j’ai fait attention à',
      argument: 'Un argument équilibré sur',
      needs: 'a besoin de preuves, de contraste et de',
      nuanced: 'Un briefing nuancé sur',
      depends: 'dépend de la précision, du registre et de',
      c2: 'Le texte sur',
      compresses: 'condense position, sous-texte et',
      shortReply: 'J’utilise {word} dans une réponse courte.',
      clarifies: '{chunk} clarifie le problème et la solution.',
      reason: 'La phrase utilise {grammarFocus} pour donner une raison.',
      story: 'L’histoire sur {theme} présente un problème, une décision et un résultat.',
      recommendation: 'La recommandation devient plus forte avec {word}.',
      summarize: 'Je peux résumer {theme} et ajouter mon opinion.',
      secondPoint: '{chunk} introduit un second point avec plus de clarté.',
      consequence: 'La phrase utilise {grammarFocus} pour relier les causes et les conséquences.',
      professional: 'Un message professionnel sur {theme} doit expliquer le compromis.',
      qualifies: 'Le présentateur nuance l’affirmation avec {word}.',
      stakeholders: 'Différents acteurs interprètent {theme} différemment.',
      sensitive: '{chunk} reformule un point sensible sans perdre le registre.',
      professionalTone: 'La phrase utilise {grammarFocus} tout en conservant un ton professionnel.',
      analysis: 'L’analyse de {theme} distingue preuve, hypothèse et implication.',
      cautious: 'La conclusion reste prudente grâce à {word}.',
      synthesize: 'Une meilleure version synthétise les points de vue opposés sur {theme}.',
      rhetorical: '{chunk} sert de signal rhétorique plus que de simple information.',
      distance: 'La phrase utilise {grammarFocus} pour créer de la distance implicite.',
      omission: 'Au niveau C2, l’auditeur déduit le sens à partir du ton et de l’omission.',
      subtle: '{word} devient une qualification subtile plutôt qu’une réserve visible.',
      ambiguity: 'Une réponse quasi native garde l’ambiguïté de {theme} tout en restant lisible.',
    },
  }[language];
  const fill = (template: string, context: FrameContext) =>
    template
      .replace('{word}', context.word)
      .replace('{chunk}', context.chunk)
      .replace('{grammarFocus}', context.grammarFocus)
      .replace('{theme}', context.theme.toLowerCase());
  return {
    A1: [
      ({ theme, word }) => `${c.use} ${word} ${c.when} ${theme.toLowerCase()}.`,
      ({ chunk }) => `${c.lesson} ${chunk}.`,
      ({ word }) => `${word} ${c.important}.`,
      ({ theme }) => `${c.ask} ${theme.toLowerCase()}.`,
    ],
    A2: [
      ({ theme, word }) => `${c.yesterday} ${word} ${c.changed} ${theme.toLowerCase()}.`,
      ({ chunk }) => `${c.explain} ${chunk} ?`,
      ({ grammarFocus }) => `${c.grammar} ${grammarFocus} ${c.practical}.`,
      ({ theme }) => `${c.compare} ${theme.toLowerCase()}.`,
      (context) => fill(c.shortReply, context),
    ],
    B1: [
      ({ theme, word }) => `${c.experience} ${theme.toLowerCase()} ${c.improved} ${word}.`,
      (context) => fill(c.clarifies, context),
      (context) => fill(c.reason, context),
      (context) => fill(c.story, context),
      (context) => fill(c.recommendation, context),
      (context) => fill(c.summarize, context),
    ],
    B2: [
      ({ theme, word }) => `${c.argument} ${theme.toLowerCase()} ${c.needs} ${word}.`,
      (context) => fill(c.secondPoint, context),
      (context) => fill(c.consequence, context),
      (context) => fill(c.professional, context),
      (context) => fill(c.qualifies, context),
      (context) => fill(c.stakeholders, context),
    ],
    C1: [
      ({ theme, word }) => `${c.nuanced} ${theme.toLowerCase()} ${c.depends} ${word}.`,
      (context) => fill(c.sensitive, context),
      (context) => fill(c.professionalTone, context),
      (context) => fill(c.analysis, context),
      (context) => fill(c.cautious, context),
      (context) => fill(c.synthesize, context),
    ],
    C2: [
      ({ theme, word }) => `${c.c2} ${theme.toLowerCase()} ${c.compresses} ${word}.`,
      (context) => fill(c.rhetorical, context),
      (context) => fill(c.distance, context),
      (context) => fill(c.omission, context),
      (context) => fill(c.subtle, context),
      (context) => fill(c.ambiguity, context),
    ],
  };
}

function readingSentenceFrames(language: CurriculumLanguage, band: CefrBand) {
  return sentenceTemplates(language, band);
}

function readingSentenceCount(band: CefrBand) {
  return { A1: 6, A2: 7, B1: 9, B2: 11, C1: 13, C2: 15 }[band];
}

function listeningFrames(language: CurriculumLanguage, band: CefrBand) {
  const intro = sentenceTemplates(language, band);
  return intro.map((frame, index) => (context: FrameContext) => {
    const first = frame(context);
    const second = intro[(index + 2) % intro.length](context);
    return `${first} ${second}`;
  });
}

function questionLabels(language: CurriculumLanguage) {
  const labels = {
    English: {
      explicit: 'explicit information',
      inference: 'inference from tone and context',
      unrelatedTravel: 'It advertises a holiday package.',
      unrelatedBilling: 'It explains a billing error.',
      unrelatedSports: 'It reports a sports result.',
      falseDetail: 'The speaker refuses to practise.',
      skipLesson: 'Skip the lesson entirely.',
      changeLanguage: 'Change the target language.',
      noEvidence: 'There is no evidence in the text.',
      oppositeTone: 'The tone is openly hostile.',
      mainIdea: (theme: string) => `What is the main idea of this ${theme.toLowerCase()} text?`,
      mainIdeaAnswer: (theme: string) => `It explains how to communicate about ${theme.toLowerCase()} at the target level.`,
      detail: (word: string) => `Which detail is directly connected to "${word}"?`,
      detailAnswer: (word: string) => `"${word}" supports the lesson goal.`,
      inferenceQuestion: (focus: string) => `What should the learner notice about ${focus}?`,
      inferenceAnswer: (focus: string) => `The text uses ${focus} to guide interpretation.`,
      vocabularyContext: (word: string) => `What does "${word}" do in context?`,
      listenMain: (theme: string) => `What is the listening script mainly about in ${theme.toLowerCase()}?`,
      listenDetail: (word: string) => `Which heard detail matches "${word}"?`,
      listenInference: 'What is implied by the speaker?',
    },
    German: questionLabelSet('German', 'Was ist die Hauptidee', 'Der Text erklärt Kommunikation zu', 'Welches Detail passt zu', 'Der Ausdruck unterstützt das Lernziel', 'Was soll der Lernende beachten?', 'Der Text nutzt diese Information zur Deutung', 'Worum geht der Hörtext hauptsächlich bei', 'Welche gehörte Information passt zu', 'Was wird impliziert?'),
    Spanish: questionLabelSet('Spanish', '¿Cuál es la idea principal', 'El texto explica cómo comunicarse sobre', '¿Qué detalle corresponde a', 'La expresión apoya el objetivo de la lección', '¿Qué debe notar el estudiante?', 'El texto usa esta información para orientar la interpretación', '¿De qué trata principalmente el audio sobre', '¿Qué detalle escuchado corresponde a', '¿Qué se implica?'),
    Italian: questionLabelSet('Italian', 'Qual è l’idea principale', 'Il testo spiega come comunicare su', 'Quale dettaglio corrisponde a', 'L’espressione sostiene l’obiettivo della lezione', 'Che cosa deve notare lo studente?', 'Il testo usa questa informazione per guidare l’interpretazione', 'Di che cosa parla soprattutto l’audio su', 'Quale dettaglio ascoltato corrisponde a', 'Che cosa viene implicato?'),
    French: questionLabelSet('French', 'Quelle est l’idée principale', 'Le texte explique comment communiquer sur', 'Quel détail correspond à', 'L’expression soutient l’objectif de la leçon', 'Que doit remarquer l’apprenant ?', 'Le texte utilise cette information pour guider l’interprétation', 'De quoi parle principalement l’audio sur', 'Quel détail entendu correspond à', 'Qu’est-ce qui est implicite ?'),
  } satisfies Record<CurriculumLanguage, ReturnType<typeof questionLabelSet>>;
  return labels[language];
}

function questionLabelSet(
  language: Exclude<CurriculumLanguage, 'English'>,
  mainStem: string,
  mainAnswerStem: string,
  detailStem: string,
  detailAnswerStem: string,
  inferenceStem: string,
  inferenceAnswerStem: string,
  listenMainStem: string,
  listenDetailStem: string,
  listenInference: string,
) {
  const shared = {
    German: {
      explicit: 'explizite Information',
      inference: 'Schlussfolgerung aus Ton und Kontext',
      unrelatedTravel: 'Der Text bewirbt eine Pauschalreise.',
      unrelatedBilling: 'Der Text erklärt einen Rechnungsfehler.',
      unrelatedSports: 'Der Text meldet ein Sportergebnis.',
      falseDetail: 'Die sprechende Person weigert sich zu üben.',
      skipLesson: 'Die ganze Lektion überspringen.',
      changeLanguage: 'Die Zielsprache ändern.',
      noEvidence: 'Dafür gibt es im Text keinen Beleg.',
      oppositeTone: 'Der Ton ist offen feindselig.',
      vocabularyContext: (word: string) => `Welche Funktion hat "${word}" im Zusammenhang?`,
    },
    Spanish: {
      explicit: 'información explícita',
      inference: 'inferencia por tono y contexto',
      unrelatedTravel: 'El texto anuncia un paquete de vacaciones.',
      unrelatedBilling: 'El texto explica un error de facturación.',
      unrelatedSports: 'El texto informa de un resultado deportivo.',
      falseDetail: 'La persona que habla se niega a practicar.',
      skipLesson: 'Saltar toda la lección.',
      changeLanguage: 'Cambiar la lengua meta.',
      noEvidence: 'No hay pruebas de eso en el texto.',
      oppositeTone: 'El tono es abiertamente hostil.',
      vocabularyContext: (word: string) => `¿Qué función tiene "${word}" en el contexto?`,
    },
    Italian: {
      explicit: 'informazione esplicita',
      inference: 'inferenza da tono e contesto',
      unrelatedTravel: 'Il testo pubblicizza un pacchetto vacanze.',
      unrelatedBilling: 'Il testo spiega un errore di fatturazione.',
      unrelatedSports: 'Il testo riporta un risultato sportivo.',
      falseDetail: 'La persona che parla si rifiuta di esercitarsi.',
      skipLesson: 'Saltare tutta la lezione.',
      changeLanguage: 'Cambiare la lingua obiettivo.',
      noEvidence: 'Non ci sono prove nel testo.',
      oppositeTone: 'Il tono è apertamente ostile.',
      vocabularyContext: (word: string) => `Che funzione ha "${word}" nel contesto?`,
    },
    French: {
      explicit: 'information explicite',
      inference: 'inférence et contexte',
      unrelatedTravel: 'Le texte annonce un voyage.',
      unrelatedBilling: 'Le texte explique une facture.',
      unrelatedSports: 'Le texte décrit un résultat sportif.',
      falseDetail: 'Le locuteur refuse de pratiquer.',
      skipLesson: 'Sauter toute la leçon.',
      changeLanguage: 'Changer la langue cible.',
      noEvidence: 'Aucune preuve ne le montre.',
      oppositeTone: 'Le ton est hostile.',
      vocabularyContext: (word: string) => `Que fait "${word}" en contexte ?`,
    },
  }[language];
  const themeText = (theme: string) => theme.toLowerCase();
  const mainIdeaQuestion = (theme: string) => {
    if (language === 'German') return `${mainStem} des Textes zu ${theme}?`;
    if (language === 'Spanish') return `${mainStem} del texto sobre ${themeText(theme)}?`;
    if (language === 'Italian') return `${mainStem} del testo su ${themeText(theme)}?`;
    return `${mainStem} du texte sur ${themeText(theme)} ?`;
  };
  const mainIdeaAnswer = (theme: string) => {
    if (language === 'German') return `${mainAnswerStem} ${theme}.`;
    if (language === 'Spanish') return `${mainAnswerStem} ${themeText(theme)} en el nivel objetivo.`;
    if (language === 'Italian') return `${mainAnswerStem} ${themeText(theme)} al livello obiettivo.`;
    return `${mainAnswerStem} ${themeText(theme)} au niveau cible.`;
  };
  return {
    ...shared,
    mainIdea: mainIdeaQuestion,
    mainIdeaAnswer,
    detail: (word: string) => `${detailStem} "${word}" ?`,
    detailAnswer: (word: string) => `${detailAnswerStem}: "${word}".`,
    inferenceQuestion: (focus: string) => `${inferenceStem} ${focus} ?`,
    inferenceAnswer: (focus: string) => `${inferenceAnswerStem}: ${focus}.`,
    listenMain: (theme: string) => `${listenMainStem} ${theme.toLowerCase()} ?`,
    listenDetail: (word: string) => `${listenDetailStem} "${word}" ?`,
    listenInference,
  };
}

function grammarLabels(language: CurriculumLanguage) {
  return {
    choose: (focus: string, number: number) =>
      language === 'German'
        ? `Wähle Satz ${number} mit korrektem Fokus: ${focus}.`
        : language === 'Spanish'
          ? `Elige la opción ${number} que aplica correctamente: ${focus}.`
          : language === 'Italian'
            ? `Scegli l’opzione ${number} che applica correttamente: ${focus}.`
            : language === 'French'
              ? `Choisis l’option ${number} qui applique correctement : ${focus}.`
              : `Choose option ${number} that correctly applies: ${focus}.`,
  };
}

function grammarAnswer(language: CurriculumLanguage, grammarFocus: string, targetSentence: string, index: number) {
  if (index % 2 === 0) return targetSentence;
  if (language === 'German') return `Der Satz zeigt ${grammarFocus} in einem sinnvollen Kontext.`;
  if (language === 'Spanish') return `La frase muestra ${grammarFocus} en un contexto claro.`;
  if (language === 'Italian') return `La frase mostra ${grammarFocus} in un contesto chiaro.`;
  if (language === 'French') return `La phrase montre ${grammarFocus} dans un contexte clair.`;
  return `The sentence shows ${grammarFocus} in a clear context.`;
}

function grammarDistractors(language: CurriculumLanguage, answer: string, grammarFocus: string, index: number) {
  const wrong = {
    English: [`Incorrect word order with ${grammarFocus}.`, `Missing agreement in ${grammarFocus}.`, `Informal fragment without ${grammarFocus}.`],
    German: [`Falsche Wortstellung bei ${grammarFocus}.`, `Fehlende Endung bei ${grammarFocus}.`, `Unvollständiger Satz ohne ${grammarFocus}.`],
    Spanish: [`Orden incorrecto con ${grammarFocus}.`, `Falta concordancia en ${grammarFocus}.`, `Fragmento sin ${grammarFocus}.`],
    Italian: [`Ordine scorretto con ${grammarFocus}.`, `Manca concordanza in ${grammarFocus}.`, `Frammento senza ${grammarFocus}.`],
    French: [`Ordre incorrect avec ${grammarFocus}.`, `Accord manquant dans ${grammarFocus}.`, `Fragment sans ${grammarFocus}.`],
  }[language];
  return rotate(wrong, index).filter((item) => normalizeText(item) !== normalizeText(answer)).slice(0, 3);
}

function taskLabels(language: CurriculumLanguage) {
  const labels = {
    English: {
      writingSituation: (theme: string, level: string, setting: string) => `Context: ${setting}. Write a short ${level} message about ${theme.toLowerCase()} with the details needed for a real next step.`,
      audience: (intensity: LevelProfile['intensity']) => intensity === 'foundation' ? 'a patient language tutor' : intensity === 'mastery' ? 'a senior editor who expects precision' : 'a real contact who needs a practical answer',
      writingPurpose: (_theme: string, focus: string, need: string) => `Complete the situation by trying to ${need}; let ${focus} appear naturally.`,
      expectedOutput: (band: CefrBand) => band === 'A1' ? 'three short connected sentences' : band === 'A2' ? 'a useful everyday message' : band === 'B1' ? 'a clear paragraph with context and next action' : band === 'B2' ? 'a structured email or report paragraph' : 'a nuanced professional response',
      length: (band: CefrBand) => ({ A1: '25-50 words', A2: '50-90 words', B1: '90-140 words', B2: '140-220 words', C1: '220-320 words', C2: '250-400 words' })[band],
      duration: (band: CefrBand) => ({ A1: '20 seconds', A2: '30 seconds', B1: '60 seconds', B2: '90 seconds', C1: '2 minutes', C2: '2-3 minutes' })[band],
      speakingPrompt: (theme: string, _level: string, focus: string, setting: string, need: string) => `Situation: ${setting}. Explain the ${theme.toLowerCase()} issue, say what happened, and try to ${need}. Use ${focus} only where it sounds natural.`,
      roleplayScenario: (theme: string, setting: string) => `A realistic ${theme.toLowerCase()} conversation happens ${setting}.`,
      learnerRole: (_theme: string, need: string) => `You need to ${need} without sounding rushed.`,
      partnerRole: (_theme: string, setting: string) => `The other person is connected to the situation ${setting} and asks for one missing detail.`,
      roleplayGoal: (theme: string, focus: string, level: string, need: string) => `Reach a clear ${level} outcome for ${theme.toLowerCase()}, respond to the follow-up, and use ${focus} if it helps you ${need}.`,
      successCriteria: (band: CefrBand) => band === 'A1' ? ['answer one direct question', 'use a useful phrase', 'finish politely'] : ['explain the situation', 'answer a follow-up', 'use precise vocabulary', 'close naturally'],
      assessmentDimensions: ['task completion', 'grammar accuracy', 'vocabulary range', 'coherence', 'register'],
      speakingDimensions: ['pronunciation clarity', 'task completion', 'fluency', 'grammar accuracy'],
    },
    German: {
      writingSituation: (theme: string, level: string, setting: string) => `Eine Kontaktperson ${setting} braucht eine kurze Nachricht auf ${level} zu ${theme}. Schreibe so, dass sie direkt handeln kann.`,
      audience: (intensity: LevelProfile['intensity']) => intensity === 'foundation' ? 'eine geduldige Lehrkraft' : intensity === 'mastery' ? 'eine erfahrene Redakteurin mit hohen Ansprüchen' : 'eine reale Kontaktperson mit einer praktischen Frage',
      writingPurpose: (_theme: string, focus: string, need: string) => `Löse die Situation, indem du versuchst, ${need}; ${focus} soll dabei natürlich wirken.`,
      expectedOutput: (band: CefrBand) => band === 'A1' ? 'drei kurze verbundene Sätze' : band === 'A2' ? 'eine nützliche Alltagsnachricht' : band === 'B1' ? 'ein klarer Absatz mit Kontext und nächstem Schritt' : band === 'B2' ? 'eine strukturierte E-Mail oder ein Berichtsabsatz' : 'eine nuancierte professionelle Antwort',
      length: (band: CefrBand) => ({ A1: '25-50 Wörter', A2: '50-90 Wörter', B1: '90-140 Wörter', B2: '140-220 Wörter', C1: '220-320 Wörter', C2: '250-400 Wörter' })[band],
      duration: (band: CefrBand) => ({ A1: '20 Sekunden', A2: '30 Sekunden', B1: '60 Sekunden', B2: '90 Sekunden', C1: '2 Minuten', C2: '2-3 Minuten' })[band],
      speakingPrompt: (theme: string, _level: string, focus: string, setting: string, need: string) => `Du bist ${setting}. Erkläre die Situation zu ${theme}, sage, was passiert ist, und versuche, ${need}. Nutze ${focus} nur dort, wo es natürlich klingt.`,
      roleplayScenario: (theme: string, setting: string) => `Ein realistisches Gespräch zu ${theme} findet ${setting} statt.`,
      learnerRole: (_theme: string, need: string) => `Dein Ziel ist es, ${need}, ohne gehetzt zu klingen.`,
      partnerRole: (_theme: string, setting: string) => `Die andere Person arbeitet ${setting} und fragt nach einem fehlenden Detail.`,
      roleplayGoal: (theme: string, focus: string, level: string, need: string) => `Erreiche ein klares Ergebnis auf ${level} zu ${theme}, reagiere auf eine Rückfrage und nutze ${focus}, wenn es dir bei "${need}" hilft.`,
      successCriteria: (band: CefrBand) => band === 'A1' ? ['eine direkte Frage beantworten', 'eine nützliche Wendung verwenden', 'höflich abschließen'] : ['die Situation erklären', 'auf eine Rückfrage reagieren', 'präzisen Wortschatz verwenden', 'natürlich abschließen'],
      assessmentDimensions: ['Aufgabenerfüllung', 'Grammatikgenauigkeit', 'Wortschatzbreite', 'Kohärenz', 'Register'],
      speakingDimensions: ['Ausspracheklarheit', 'Aufgabenerfüllung', 'Flüssigkeit', 'Grammatikgenauigkeit'],
    },
    Spanish: {
      writingSituation: (theme: string, level: string, setting: string) => `Una persona ${setting} necesita un mensaje breve de nivel ${level} sobre ${theme.toLowerCase()}. Escríbelo con la información necesaria para actuar.`,
      audience: (intensity: LevelProfile['intensity']) => intensity === 'foundation' ? 'un profesor paciente' : intensity === 'mastery' ? 'un editor exigente que espera precisión' : 'un contacto real que necesita una respuesta práctica',
      writingPurpose: (_theme: string, focus: string, need: string) => `Resuelve la situación intentando ${need}; deja que ${focus} aparezca de forma natural.`,
      expectedOutput: (band: CefrBand) => band === 'A1' ? 'tres frases breves conectadas' : band === 'A2' ? 'un mensaje cotidiano útil' : band === 'B1' ? 'un párrafo claro con contexto y próximo paso' : band === 'B2' ? 'un correo estructurado o un párrafo de informe' : 'una respuesta profesional matizada',
      length: (band: CefrBand) => ({ A1: '25-50 palabras', A2: '50-90 palabras', B1: '90-140 palabras', B2: '140-220 palabras', C1: '220-320 palabras', C2: '250-400 palabras' })[band],
      duration: (band: CefrBand) => ({ A1: '20 segundos', A2: '30 segundos', B1: '60 segundos', B2: '90 segundos', C1: '2 minutos', C2: '2-3 minutos' })[band],
      speakingPrompt: (theme: string, _level: string, focus: string, setting: string, need: string) => `Estás ${setting}. Explica la situación sobre ${theme.toLowerCase()}, cuenta lo que pasó e intenta ${need}. Usa ${focus} solo si suena natural.`,
      roleplayScenario: (theme: string, setting: string) => `Una conversación realista sobre ${theme.toLowerCase()} ocurre ${setting}.`,
      learnerRole: (_theme: string, need: string) => `Necesitas ${need} sin parecer apurado.`,
      partnerRole: (_theme: string, setting: string) => `La otra persona participa en la situación ${setting} y pide un dato que falta.`,
      roleplayGoal: (theme: string, focus: string, level: string, need: string) => `Llega a un resultado claro de nivel ${level} sobre ${theme.toLowerCase()}, responde a una pregunta adicional y mantén este objetivo: ${need}. Usa ${focus} solo si ayuda.`,
      successCriteria: (band: CefrBand) => band === 'A1' ? ['responder una pregunta directa', 'usar una expresión útil', 'cerrar con cortesía'] : ['explicar la situación', 'responder a una pregunta adicional', 'usar vocabulario preciso', 'cerrar con naturalidad'],
      assessmentDimensions: ['cumplimiento de la tarea', 'precisión gramatical', 'variedad léxica', 'coherencia', 'registro'],
      speakingDimensions: ['claridad de pronunciación', 'cumplimiento de la tarea', 'fluidez', 'precisión gramatical'],
    },
    Italian: {
      writingSituation: (theme: string, level: string, setting: string) => `Una persona ${setting} ha bisogno di un breve messaggio di livello ${level} su ${theme.toLowerCase()}. Scrivilo con i dettagli necessari per agire.`,
      audience: (intensity: LevelProfile['intensity']) => intensity === 'foundation' ? 'un insegnante paziente' : intensity === 'mastery' ? 'un redattore esigente che pretende precisione' : 'un contatto reale che ha bisogno di una risposta pratica',
      writingPurpose: (_theme: string, focus: string, need: string) => `Risolvi la situazione cercando di ${need}; lascia che ${focus} appaia in modo naturale.`,
      expectedOutput: (band: CefrBand) => band === 'A1' ? 'tre brevi frasi collegate' : band === 'A2' ? 'un messaggio quotidiano utile' : band === 'B1' ? 'un paragrafo chiaro con contesto e prossimo passo' : band === 'B2' ? 'un’email strutturata o un paragrafo di relazione' : 'una risposta professionale sfumata',
      length: (band: CefrBand) => ({ A1: '25-50 parole', A2: '50-90 parole', B1: '90-140 parole', B2: '140-220 parole', C1: '220-320 parole', C2: '250-400 parole' })[band],
      duration: (band: CefrBand) => ({ A1: '20 secondi', A2: '30 secondi', B1: '60 secondi', B2: '90 secondi', C1: '2 minuti', C2: '2-3 minuti' })[band],
      speakingPrompt: (theme: string, _level: string, focus: string, setting: string, need: string) => `Sei ${setting}. Spiega la situazione di ${theme.toLowerCase()}, racconta che cosa è successo e cerca di ${need}. Usa ${focus} solo dove suona naturale.`,
      roleplayScenario: (theme: string, setting: string) => `Una conversazione realistica su ${theme.toLowerCase()} si svolge ${setting}.`,
      learnerRole: (_theme: string, need: string) => `Devi ${need} senza sembrare frettoloso.`,
      partnerRole: (_theme: string, setting: string) => `L’altra persona partecipa alla situazione ${setting} e chiede un dettaglio mancante.`,
      roleplayGoal: (theme: string, focus: string, level: string, need: string) => `Raggiungi un risultato chiaro di livello ${level} su ${theme.toLowerCase()}, rispondi a una domanda di follow-up e usa ${focus} se aiuta a ${need}.`,
      successCriteria: (band: CefrBand) => band === 'A1' ? ['rispondere a una domanda diretta', 'usare un’espressione utile', 'chiudere con cortesia'] : ['spiegare la situazione', 'rispondere a una domanda di follow-up', 'usare lessico preciso', 'chiudere in modo naturale'],
      assessmentDimensions: ['completamento del compito', 'accuratezza grammaticale', 'varietà lessicale', 'coerenza', 'registro'],
      speakingDimensions: ['chiarezza della pronuncia', 'completamento del compito', 'fluidità', 'accuratezza grammaticale'],
    },
    French: {
      writingSituation: (theme: string, level: string, setting: string) => `Une personne ${setting} a besoin d’un court message de niveau ${level} sur ${theme.toLowerCase()}. Rédige-le avec les informations nécessaires pour agir.`,
      audience: (intensity: LevelProfile['intensity']) => intensity === 'foundation' ? 'un professeur patient' : intensity === 'mastery' ? 'un rédacteur exigeant qui attend de la précision' : 'un contact réel qui a besoin d’une réponse pratique',
      writingPurpose: (_theme: string, focus: string, need: string) => `Résous la situation en essayant de ${need}; laisse ${focus} apparaître naturellement.`,
      expectedOutput: (band: CefrBand) => band === 'A1' ? 'trois phrases courtes reliées' : band === 'A2' ? 'un message quotidien utile' : band === 'B1' ? 'un paragraphe clair avec contexte et prochaine action' : band === 'B2' ? 'un courriel structuré ou un paragraphe de rapport' : 'une réponse professionnelle nuancée',
      length: (band: CefrBand) => ({ A1: '25-50 mots', A2: '50-90 mots', B1: '90-140 mots', B2: '140-220 mots', C1: '220-320 mots', C2: '250-400 mots' })[band],
      duration: (band: CefrBand) => ({ A1: '20 secondes', A2: '30 secondes', B1: '60 secondes', B2: '90 secondes', C1: '2 minutes', C2: '2-3 minutes' })[band],
      speakingPrompt: (theme: string, _level: string, focus: string, setting: string, need: string) => `Tu es ${setting}. Explique la situation sur ${theme.toLowerCase()}, raconte ce qui s’est passé et essaie de ${need}. Utilise ${focus} seulement si cela paraît naturel.`,
      roleplayScenario: (theme: string, setting: string) => `Une conversation réaliste sur ${theme.toLowerCase()} a lieu ${setting}.`,
      learnerRole: (_theme: string, need: string) => `Tu dois ${need} sans paraître pressé.`,
      partnerRole: (_theme: string, setting: string) => `L’autre personne participe à la situation ${setting} et demande une information manquante.`,
      roleplayGoal: (theme: string, focus: string, level: string, need: string) => `Obtiens un résultat clair de niveau ${level} sur ${theme.toLowerCase()}, réponds à une question de suivi et utilise ${focus} si cela aide à ${need}.`,
      successCriteria: (band: CefrBand) => band === 'A1' ? ['répondre à une question directe', 'utiliser une expression utile', 'terminer poliment'] : ['expliquer la situation', 'répondre à une question de suivi', 'utiliser un vocabulaire précis', 'terminer naturellement'],
      assessmentDimensions: ['réalisation de la tâche', 'précision grammaticale', 'variété lexicale', 'cohérence', 'registre'],
      speakingDimensions: ['clarté de la prononciation', 'réalisation de la tâche', 'fluidité', 'précision grammaticale'],
    },
  } satisfies Record<
    CurriculumLanguage,
    {
      writingSituation: (theme: string, level: string, setting: string) => string;
      audience: (intensity: LevelProfile['intensity']) => string;
      writingPurpose: (theme: string, focus: string, need: string) => string;
      expectedOutput: (band: CefrBand) => string;
      length: (band: CefrBand) => string;
      duration: (band: CefrBand) => string;
      speakingPrompt: (theme: string, level: string, focus: string, setting: string, need: string) => string;
      roleplayScenario: (theme: string, setting: string) => string;
      learnerRole: (theme: string, need: string) => string;
      partnerRole: (theme: string, setting: string) => string;
      roleplayGoal: (theme: string, focus: string, level: string, need: string) => string;
      successCriteria: (band: CefrBand) => string[];
      assessmentDimensions: string[];
      speakingDimensions: string[];
    }
  >;
  return labels[language];
}

function normalizeText(value: string) {
  return value.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
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
      A1: language === 'French' ? 'français liaison, nasal vowels, and final silent letters' : language === 'Spanish' ? 'clear vowels, ñ, and sentence rhythm' : 'open vowels, double consonants, and stress',
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
      'A2 checkpoint': 'Control A2',
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
      'Travel stories': 'Relatos de viaje',
      'Comparing options': 'Comparación de opciones',
      'Personal goals': 'Objetivos personales',
      'Health choices': 'Decisiones de salud',
      'Money and planning': 'Dinero y planificación',
      'Technology habits': 'Hábitos tecnológicos',
      'Service issues': 'Problemas de servicio',
      'Project planning': 'Planificación de proyectos',
      Education: 'Educación',
      'Travel incidents': 'Incidentes de viaje',
      'Social decisions': 'Decisiones sociales',
      Instructions: 'Instrucciones',
      Feedback: 'Retroalimentación',
      'B1 review': 'Repaso B1',
      'B1 checkpoint': 'Control B1',
      'Academic routines': 'Rutinas académicas',
      'Workplace decisions': 'Decisiones laborales',
      'Media literacy': 'Alfabetización mediática',
      'Policy and society': 'Política y sociedad',
      'Research summaries': 'Resúmenes de investigación',
      'Customer cases': 'Casos de clientes',
      'Professional emails': 'Correos profesionales',
      Presentations: 'Presentaciones',
      'Balanced opinions': 'Opiniones equilibradas',
      'B2 review': 'Repaso B2',
      'B2 checkpoint': 'Control B2',
      'Detailed reports': 'Informes detallados',
      'Intercultural work': 'Trabajo intercultural',
      Sustainability: 'Sostenibilidad',
      'Career development': 'Desarrollo profesional',
      'Complex services': 'Servicios complejos',
      'Critical reading': 'Lectura crítica',
      'Long-form listening': 'Escucha extensa',
      'Formal proposals': 'Propuestas formales',
      'Strategic briefings': 'Informes estratégicos',
      'Professional disagreement': 'Desacuerdo profesional',
      'Implicit meaning': 'Significado implícito',
      'Editorial style': 'Estilo editorial',
      'Stakeholder language': 'Lenguaje de actores',
      'Precise reformulation': 'Reformulación precisa',
      'Complex interviews': 'Entrevistas complejas',
      'Risk framing': 'Marco de riesgo',
      'Advanced correspondence': 'Correspondencia avanzada',
      'C1 review': 'Repaso C1',
      'C1 checkpoint': 'Control C1',
      'Rhetorical control': 'Control retórico',
      'Policy analysis': 'Análisis de políticas',
      'Specialist vocabulary': 'Vocabulario especializado',
      'Literary tone': 'Tono literario',
      'Negotiating ambiguity': 'Gestión de la ambigüedad',
      'Executive summaries': 'Resúmenes ejecutivos',
      'Academic critique': 'Crítica académica',
      'Style shifting': 'Cambio de estilo',
      'Cultural references': 'Referencias culturales',
      'Dense lectures': 'Conferencias densas',
      'Persuasive writing': 'Escritura persuasiva',
      'Editorial argument': 'Argumento editorial',
      'Expert debate': 'Debate experto',
      'Stylistic compression': 'Compresión estilística',
      'Irony and stance': 'Ironía y postura',
      'Highly formal register': 'Registro muy formal',
      'Fast natural speech': 'Habla natural rápida',
      'Legal and ethical nuance': 'Matiz legal y ético',
      'Discourse strategy': 'Estrategia discursiva',
      'Micro-editing': 'Microedición',
      'C2 review': 'Repaso C2',
      'Specialist discourse': 'Discurso especializado',
      'Literary argument': 'Argumento literario',
      'Diplomatic language': 'Lenguaje diplomático',
      'Public rhetoric': 'Retórica pública',
      'Implicit criticism': 'Crítica implícita',
      'Precision under pressure': 'Precisión bajo presión',
      'Register mastery': 'Dominio del registro',
      'Long interviews': 'Entrevistas largas',
      'Comparative critique': 'Crítica comparativa',
      'Final portfolio': 'Portafolio final',
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
      'A2 checkpoint': 'Verifica A2',
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
      'Travel stories': 'Racconti di viaggio',
      'Comparing options': 'Confronto tra opzioni',
      'Personal goals': 'Obiettivi personali',
      'Health choices': 'Scelte di salute',
      'Money and planning': 'Denaro e pianificazione',
      'Technology habits': 'Abitudini tecnologiche',
      'Service issues': 'Problemi di servizio',
      'Project planning': 'Pianificazione di progetto',
      Education: 'Istruzione',
      'Travel incidents': 'Imprevisti di viaggio',
      'Social decisions': 'Decisioni sociali',
      Instructions: 'Istruzioni',
      Feedback: 'Feedback',
      'B1 review': 'Ripasso B1',
      'B1 checkpoint': 'Verifica B1',
      'Academic routines': 'Routine accademiche',
      'Workplace decisions': 'Decisioni sul lavoro',
      'Media literacy': 'Competenza mediatica',
      'Policy and society': 'Politica e società',
      'Research summaries': 'Sintesi di ricerca',
      'Customer cases': 'Casi cliente',
      'Professional emails': 'Email professionali',
      Presentations: 'Presentazioni',
      'Balanced opinions': 'Opinioni equilibrate',
      'B2 review': 'Ripasso B2',
      'B2 checkpoint': 'Verifica B2',
      'Detailed reports': 'Relazioni dettagliate',
      'Intercultural work': 'Lavoro interculturale',
      Sustainability: 'Sostenibilità',
      'Career development': 'Sviluppo di carriera',
      'Complex services': 'Servizi complessi',
      'Critical reading': 'Lettura critica',
      'Long-form listening': 'Ascolto esteso',
      'Formal proposals': 'Proposte formali',
      'Strategic briefings': 'Briefing strategici',
      'Professional disagreement': 'Disaccordo professionale',
      'Implicit meaning': 'Significato implicito',
      'Editorial style': 'Stile editoriale',
      'Stakeholder language': 'Linguaggio degli stakeholder',
      'Precise reformulation': 'Riformulazione precisa',
      'Complex interviews': 'Interviste complesse',
      'Risk framing': 'Inquadramento del rischio',
      'Advanced correspondence': 'Corrispondenza avanzata',
      'C1 review': 'Ripasso C1',
      'C1 checkpoint': 'Verifica C1',
      'Rhetorical control': 'Controllo retorico',
      'Policy analysis': 'Analisi delle politiche',
      'Specialist vocabulary': 'Vocabolario specialistico',
      'Literary tone': 'Tono letterario',
      'Negotiating ambiguity': 'Gestione dell’ambiguità',
      'Executive summaries': 'Sintesi esecutive',
      'Academic critique': 'Critica accademica',
      'Style shifting': 'Cambio di stile',
      'Cultural references': 'Riferimenti culturali',
      'Dense lectures': 'Lezioni dense',
      'Persuasive writing': 'Scrittura persuasiva',
      'Editorial argument': 'Argomento editoriale',
      'Expert debate': 'Dibattito tra esperti',
      'Stylistic compression': 'Compressione stilistica',
      'Irony and stance': 'Ironia e posizione',
      'Highly formal register': 'Registro molto formale',
      'Fast natural speech': 'Parlato naturale rapido',
      'Legal and ethical nuance': 'Sfumatura legale ed etica',
      'Discourse strategy': 'Strategia discorsiva',
      'Micro-editing': 'Microrevisione',
      'C2 review': 'Ripasso C2',
      'Specialist discourse': 'Discorso specialistico',
      'Literary argument': 'Argomento letterario',
      'Diplomatic language': 'Linguaggio diplomatico',
      'Public rhetoric': 'Retorica pubblica',
      'Implicit criticism': 'Critica implicita',
      'Precision under pressure': 'Precisione sotto pressione',
      'Register mastery': 'Padronanza del registro',
      'Long interviews': 'Interviste lunghe',
      'Comparative critique': 'Critica comparativa',
      'Final portfolio': 'Portfolio finale',
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
      'A2 checkpoint': 'Bilan A2',
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
      'Travel stories': 'Récits de voyage',
      'Comparing options': 'Comparer des options',
      'Personal goals': 'Objectifs personnels',
      'Health choices': 'Choix de santé',
      'Money and planning': 'Argent et planification',
      'Technology habits': 'Habitudes numériques',
      'Service issues': 'Problèmes de service',
      'Project planning': 'Planification de projet',
      Education: 'Éducation',
      'Travel incidents': 'Incidents de voyage',
      'Social decisions': 'Décisions sociales',
      Instructions: 'Instructions',
      Feedback: 'Retour',
      'B1 review': 'Révision B1',
      'B1 checkpoint': 'Bilan B1',
      'Academic routines': 'Routines académiques',
      'Workplace decisions': 'Décisions professionnelles',
      'Media literacy': 'Éducation aux médias',
      'Policy and society': 'Politique et société',
      'Research summaries': 'Synthèses de recherche',
      'Customer cases': 'Cas clients',
      'Professional emails': 'Courriels professionnels',
      Presentations: 'Présentations',
      'Balanced opinions': 'Opinions nuancées',
      'B2 review': 'Révision B2',
      'B2 checkpoint': 'Bilan B2',
      'Detailed reports': 'Rapports détaillés',
      'Intercultural work': 'Travail interculturel',
      Sustainability: 'Durabilité',
      'Career development': 'Développement de carrière',
      'Complex services': 'Services complexes',
      'Critical reading': 'Lecture critique',
      'Long-form listening': 'Écoute longue',
      'Formal proposals': 'Propositions formelles',
      'Strategic briefings': 'Briefings stratégiques',
      'Professional disagreement': 'Désaccord professionnel',
      'Implicit meaning': 'Sens implicite',
      'Editorial style': 'Style éditorial',
      'Stakeholder language': 'Langage des parties prenantes',
      'Precise reformulation': 'Reformulation précise',
      'Complex interviews': 'Entretiens complexes',
      'Risk framing': 'Cadrage du risque',
      'Advanced correspondence': 'Correspondance avancée',
      'C1 review': 'Révision C1',
      'C1 checkpoint': 'Bilan C1',
      'Rhetorical control': 'Maîtrise rhétorique',
      'Policy analysis': 'Analyse des politiques',
      'Specialist vocabulary': 'Vocabulaire spécialisé',
      'Literary tone': 'Ton littéraire',
      'Negotiating ambiguity': 'Gestion de l’ambiguïté',
      'Executive summaries': 'Synthèses exécutives',
      'Academic critique': 'Critique académique',
      'Style shifting': 'Changement de style',
      'Cultural references': 'Références culturelles',
      'Dense lectures': 'Cours denses',
      'Persuasive writing': 'Écriture persuasive',
      'Editorial argument': 'Argument éditorial',
      'Expert debate': 'Débat d’experts',
      'Stylistic compression': 'Compression stylistique',
      'Irony and stance': 'Ironie et posture',
      'Highly formal register': 'Registre très formel',
      'Fast natural speech': 'Parole naturelle rapide',
      'Legal and ethical nuance': 'Nuance juridique et éthique',
      'Discourse strategy': 'Stratégie discursive',
      'Micro-editing': 'Microédition',
      'C2 review': 'Révision C2',
      'Specialist discourse': 'Discours spécialisé',
      'Literary argument': 'Argument littéraire',
      'Diplomatic language': 'Langage diplomatique',
      'Public rhetoric': 'Rhétorique publique',
      'Implicit criticism': 'Critique implicite',
      'Precision under pressure': 'Précision sous pression',
      'Register mastery': 'Maîtrise du registre',
      'Long interviews': 'Entretiens longs',
      'Comparative critique': 'Critique comparative',
      'Final portfolio': 'Portfolio final',
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
