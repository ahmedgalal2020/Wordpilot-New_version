export type CefrBand = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type CefrSubLevel = '1' | '2';
export type CurriculumLanguage = 'English' | 'German';
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

type LessonSeed = {
  theme: string;
  objective: string;
  canDo: string;
  grammarFocus: string;
  words: string[];
  chunks: string[];
  pronunciation: string;
};

const ENGLISH_A1_1: LessonSeed[] = [
  englishSeed('Introductions', 'give basic personal information', 'I can say my name, country, and language.', 'be, subject pronouns, simple questions', ['hello', 'name', 'from', 'country', 'language', 'teacher'], ['My name is', 'I am from'], 'word stress'),
  englishSeed('Numbers', 'understand numbers and short forms', 'I can give phone numbers and ages.', 'numbers, plural nouns', ['one', 'two', 'three', 'age', 'phone', 'number'], ['How old are you?', 'My number is'], 'th'),
  englishSeed('Family', 'name close family members', 'I can describe my family simply.', 'possessive adjectives', ['mother', 'father', 'sister', 'brother', 'child', 'family'], ['This is my', 'I have one'], 'v/w distinction'),
  englishSeed('Daily routine', 'talk about simple daily actions', 'I can describe a normal morning.', 'present simple I/you/we', ['wake', 'eat', 'go', 'study', 'work', 'sleep'], ['every day', 'in the morning'], 'schwa'),
  englishSeed('Food', 'order simple food and drink', 'I can ask for food politely.', 'a/an, countable nouns', ['water', 'coffee', 'bread', 'rice', 'apple', 'menu'], ['I would like', 'Can I have'], 'sentence stress'),
  englishSeed('City', 'ask for places in town', 'I can ask where a place is.', 'there is, where questions', ['street', 'station', 'bank', 'school', 'shop', 'park'], ['Where is', 'near here'], 'connected speech'),
  englishSeed('Home', 'describe rooms and objects', 'I can say what is in my home.', 'prepositions of place', ['room', 'table', 'chair', 'door', 'window', 'bed'], ['next to', 'on the left'], 'contractions'),
  englishSeed('Shopping', 'buy simple items', 'I can ask prices and sizes.', 'this/that, demonstratives', ['price', 'cheap', 'expensive', 'size', 'cash', 'card'], ['How much is', 'I need'], 'word stress'),
  englishSeed('Weather', 'describe basic weather', "I can talk about today's weather.", 'it is, adjectives', ['sunny', 'rainy', 'cold', 'hot', 'windy', 'cloudy'], ['It is sunny', 'Today is'], 'schwa'),
  englishSeed('Transport', 'buy a ticket and ask times', 'I can ask for basic travel information.', 'time expressions', ['ticket', 'bus', 'train', 'late', 'early', 'stop'], ['What time', 'a ticket to'], 'th'),
  englishSeed('Health', 'describe simple symptoms', 'I can say what hurts.', 'have got, body words', ['head', 'stomach', 'pain', 'tired', 'doctor', 'medicine'], ['I have a', 'I feel'], 'v/w distinction'),
  englishSeed('Review', 'combine A1.1 survival language', 'I can complete short everyday exchanges.', 'A1.1 review', ['review', 'question', 'answer', 'listen', 'speak', 'write'], ['Can you repeat?', 'I understand'], 'sentence stress'),
];

const ENGLISH_A1_2: LessonSeed[] = [
  englishSeed('Plans', 'make simple plans', 'I can say what I want to do tomorrow.', 'want to, future time', ['tomorrow', 'plan', 'visit', 'meet', 'call', 'later'], ['I want to', 'see you later'], 'connected speech'),
  englishSeed('Appointments', 'arrange times and days', 'I can make a simple appointment.', 'days, at/on', ['Monday', 'Tuesday', 'time', 'appointment', 'free', 'busy'], ['Are you free?', 'at three'], 'word stress'),
  englishSeed('Travel', 'describe simple trips', 'I can explain where I went.', 'past simple regular verbs', ['travel', 'hotel', 'map', 'ticket', 'arrive', 'leave'], ['last weekend', 'I visited'], 'contractions'),
  englishSeed('Work', 'talk about jobs and tasks', 'I can describe my work day.', 'present simple he/she', ['job', 'office', 'meeting', 'email', 'task', 'break'], ['I work as', 'She works in'], 'schwa'),
  englishSeed('Digital life', 'use common online language', 'I can ask for help with a device.', 'imperatives', ['phone', 'screen', 'password', 'message', 'online', 'app'], ['click here', 'send a message'], 'connected speech'),
  englishSeed('Services', 'handle simple public services', 'I can ask for forms and help.', 'polite questions', ['form', 'address', 'office', 'help', 'document', 'signature'], ['Could you help?', 'I need a form'], 'th'),
  englishSeed('Comparisons', 'compare everyday options', 'I can compare two simple things.', 'comparatives', ['better', 'cheaper', 'faster', 'slower', 'bigger', 'smaller'], ['better than', 'not as'], 'v/w distinction'),
  englishSeed('Stories', 'tell a short past event', 'I can tell a simple story in order.', 'past simple irregular verbs', ['went', 'saw', 'bought', 'found', 'lost', 'came'], ['first then', 'after that'], 'sentence stress'),
  englishSeed('Rules', 'explain simple rules', 'I can say what is allowed.', 'must, can, cannot', ['must', 'can', 'rule', 'allowed', 'quiet', 'safe'], ['You must', 'You cannot'], 'contractions'),
  englishSeed('Opinions', 'give simple opinions and reasons', 'I can say what I like and why.', 'because, like + noun', ['think', 'because', 'favorite', 'opinion', 'reason', 'agree'], ['I think', 'because it is'], 'word stress'),
  englishSeed('Emails', 'write short practical emails', 'I can write a polite short message.', 'email openings and closings', ['dear', 'thanks', 'reply', 'request', 'question', 'regards'], ['Thank you for', 'Best regards'], 'connected speech'),
  englishSeed('Review', 'pass the A1.2 checkpoint', 'I can handle predictable everyday tasks.', 'A1 review', ['checkpoint', 'progress', 'practice', 'mistake', 'review', 'ready'], ['I can explain', 'I need more practice'], 'sentence stress'),
];

const GERMAN_A1_1: LessonSeed[] = [
  germanSeed('Vorstellungen', 'Namen, Herkunft und Sprache nennen', 'Ich kann mich kurz vorstellen.', 'sein, ich/du, einfache Fragen', ['hallo', 'Name', 'kommen', 'Land', 'Sprache', 'Kurs'], ['Ich heisse', 'Ich komme aus'], 'ich-Laut'),
  germanSeed('Zahlen', 'Zahlen und Telefonnummern verstehen', 'Ich kann Alter und Nummern sagen.', 'Zahlen, Pluralformen', ['eins', 'zwei', 'drei', 'Alter', 'Telefon', 'Nummer'], ['Wie alt bist du?', 'Meine Nummer ist'], 'z'),
  germanSeed('Familie', 'Familienmitglieder benennen', 'Ich kann meine Familie einfach beschreiben.', 'mein/meine, der/die/das', ['Mutter', 'Vater', 'Schwester', 'Bruder', 'Kind', 'Familie'], ['Das ist meine', 'Ich habe einen'], 'sch'),
  germanSeed('Tagesroutine', 'einfache Routinen beschreiben', 'Ich kann meinen Morgen beschreiben.', 'Verbposition 2, regelmaessige Verben', ['aufstehen', 'essen', 'gehen', 'lernen', 'arbeiten', 'schlafen'], ['jeden Morgen', 'ich gehe'], 'st'),
  germanSeed('Essen', 'einfach bestellen', 'Ich kann Essen und Trinken bestellen.', 'Akkusativ mit haben/moechte', ['Wasser', 'Kaffee', 'Brot', 'Reis', 'Apfel', 'Speisekarte'], ['Ich moechte', 'Ich nehme'], 'r'),
  germanSeed('Stadt', 'Orte in der Stadt finden', 'Ich kann nach einem Ort fragen.', 'wo, es gibt', ['Strasse', 'Bahnhof', 'Bank', 'Schule', 'Laden', 'Park'], ['Wo ist', 'in der Naehe'], 'sp'),
  germanSeed('Zuhause', 'Zimmer und Dinge beschreiben', 'Ich kann sagen, was in meiner Wohnung ist.', 'Dativ bei in/auf neben', ['Zimmer', 'Tisch', 'Stuhl', 'Tuer', 'Fenster', 'Bett'], ['neben dem', 'auf dem Tisch'], 'ue'),
  germanSeed('Einkaufen', 'Preise und Groessen erfragen', 'Ich kann einfache Einkaeufe machen.', 'dieser/diese/dieses', ['Preis', 'billig', 'teuer', 'Groesse', 'bar', 'Karte'], ['Wie viel kostet', 'Ich brauche'], 'oe'),
  germanSeed('Wetter', 'Wetter beschreiben', 'Ich kann ueber das Wetter sprechen.', 'es ist, Adjektive', ['sonnig', 'regnerisch', 'kalt', 'warm', 'windig', 'bewoelkt'], ['Es ist sonnig', 'Heute ist'], 'ae'),
  germanSeed('Transport', 'Fahrkarten und Zeiten erfragen', 'Ich kann einfache Reiseinfos erfragen.', 'Uhrzeiten, nach/zu', ['Fahrkarte', 'Bus', 'Zug', 'spaet', 'frueh', 'Haltestelle'], ['Wann faehrt', 'eine Fahrkarte nach'], 'ach-Laut'),
  germanSeed('Gesundheit', 'einfache Beschwerden nennen', 'Ich kann sagen, was weh tut.', 'haben, Koerperteile', ['Kopf', 'Bauch', 'Schmerz', 'muede', 'Arzt', 'Medizin'], ['Ich habe', 'Mir tut weh'], 'sentence stress'),
  germanSeed('Wiederholung', 'A1.1 Sprache kombinieren', 'Ich kann kurze Alltagssituationen loesen.', 'A1.1 Wiederholung', ['Wiederholung', 'Frage', 'Antwort', 'hoeren', 'sprechen', 'schreiben'], ['Bitte wiederholen', 'Ich verstehe'], 'sch'),
];

const GERMAN_A1_2: LessonSeed[] = [
  germanSeed('Plaene', 'einfache Plaene machen', 'Ich kann sagen, was ich morgen mache.', 'moechte, Zeitangaben', ['morgen', 'Plan', 'besuchen', 'treffen', 'anrufen', 'spaeter'], ['Ich moechte', 'bis spaeter'], 'ich-Laut'),
  germanSeed('Termine', 'Termine vereinbaren', 'Ich kann einen einfachen Termin machen.', 'am/um, Tage', ['Montag', 'Dienstag', 'Uhrzeit', 'Termin', 'frei', 'besetzt'], ['Haben Sie Zeit?', 'um drei Uhr'], 'r'),
  germanSeed('Reisen', 'kurze Reisen beschreiben', 'Ich kann sagen, wohin ich gefahren bin.', 'Perfekt mit sein/haben', ['Reise', 'Hotel', 'Karte', 'Fahrkarte', 'ankommen', 'abfahren'], ['am Wochenende', 'ich bin gefahren'], 'ach-Laut'),
  germanSeed('Arbeit', 'Berufe und Aufgaben nennen', 'Ich kann meinen Arbeitstag beschreiben.', 'trennbare Verben', ['Beruf', 'Buero', 'Besprechung', 'E-Mail', 'Aufgabe', 'Pause'], ['Ich arbeite als', 'Ich fange an'], 'sp'),
  germanSeed('Digitales Leben', 'ueber Handy und Internet sprechen', 'Ich kann um digitale Hilfe bitten.', 'Imperativ', ['Handy', 'Bildschirm', 'Passwort', 'Nachricht', 'online', 'App'], ['Klicken Sie hier', 'Schick mir'], 'st'),
  germanSeed('Aemter', 'Formulare und Unterlagen verstehen', 'Ich kann nach Unterlagen fragen.', 'hoefliche Fragen', ['Formular', 'Adresse', 'Amt', 'Hilfe', 'Unterlage', 'Unterschrift'], ['Koennen Sie helfen?', 'Ich brauche ein Formular'], 'ue'),
  germanSeed('Vergleiche', 'einfache Optionen vergleichen', 'Ich kann zwei Dinge vergleichen.', 'Komparativ', ['besser', 'guenstiger', 'schneller', 'langsamer', 'groesser', 'kleiner'], ['besser als', 'nicht so'], 'oe'),
  germanSeed('Geschichten', 'kurze Ereignisse erzaehlen', 'Ich kann eine einfache Geschichte ordnen.', 'Perfekt, Satzfolge', ['gegangen', 'gesehen', 'gekauft', 'gefunden', 'verloren', 'gekommen'], ['zuerst dann', 'danach'], 'ae'),
  germanSeed('Regeln', 'einfache Regeln erklaeren', 'Ich kann sagen, was erlaubt ist.', 'Modalverben muessen/duerfen', ['muessen', 'duerfen', 'Regel', 'erlaubt', 'leise', 'sicher'], ['Man muss', 'Man darf nicht'], 'sentence stress'),
  germanSeed('Meinungen', 'Meinungen und Gruende nennen', 'Ich kann sagen, was ich denke und warum.', 'weil-Saetze', ['denken', 'weil', 'Lieblings', 'Meinung', 'Grund', 'zustimmen'], ['Ich finde', 'weil es'], 'ich-Laut'),
  germanSeed('E-Mails', 'kurze praktische E-Mails schreiben', 'Ich kann eine kurze hoefliche Nachricht schreiben.', 'Anrede, Schlussformeln', ['Sehr geehrte', 'danke', 'Antwort', 'Bitte', 'Frage', 'Gruesse'], ['Vielen Dank fuer', 'Mit freundlichen Gruessen'], 'r'),
  germanSeed('Wiederholung', 'A1.2 pruefen und festigen', 'Ich kann vorhersehbare Alltagssituationen bewaeltigen.', 'A1 Wiederholung', ['Pruefung', 'Fortschritt', 'Uebung', 'Fehler', 'Wiederholung', 'bereit'], ['Ich kann erklaeren', 'Ich muss ueben'], 'sentence stress'),
];

export const CURRICULUM: CurriculumLevel[] = [
  buildLevel(1, 'English', ENGLISH_A1_1),
  buildLevel(2, 'English', ENGLISH_A1_2),
  buildLevel(1, 'German', GERMAN_A1_1),
  buildLevel(2, 'German', GERMAN_A1_2),
];

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

function buildLevel(levelNumber: 1 | 2, language: CurriculumLanguage, seeds: LessonSeed[]): CurriculumLevel {
  const meta = CURRICULUM_LEVELS[levelNumber - 1];
  const lessons = seeds.map((seed, index) => buildLesson(language, meta.levelNumber, meta.cefrLevel, meta.cefrSubLevel, seed, index + 1));

  return {
    levelNumber,
    cefrLevel: meta.cefrLevel,
    cefrSubLevel: meta.cefrSubLevel,
    language,
    title: `${language} ${meta.label}`,
    lessons,
    levelExam: {
      id: `${language.toLowerCase()}-${meta.label.toLowerCase()}-level-exam`,
      type: 'lesson_test',
      skill: 'test',
      title: `${meta.label} Level Exam`,
      instruction: 'Complete mixed comprehension, speaking, writing, and dictation tasks before unlocking the next level.',
      content: { lessonIds: lessons.map((lesson) => lesson.id), sections: ['listening', 'reading', 'speaking', 'writing', 'dictation'] },
      scoringRubric: { taskCompletion: 25, grammar: 20, vocabulary: 20, comprehension: 20, accuracy: 15 },
      minScoreToPass: 75,
    },
  };
}

function buildLesson(
  language: CurriculumLanguage,
  levelNumber: number,
  cefrLevel: CefrBand,
  cefrSubLevel: CefrSubLevel,
  seed: LessonSeed,
  lessonNumber: number,
): CurriculumLesson {
  const baseId = `${language.toLowerCase()}-level-${levelNumber}-lesson-${lessonNumber}`;
  const vocabulary = seed.words.map((word, index) => ({
    word,
    translation: language === 'German' ? englishGloss(word) : germanGloss(word),
    example: language === 'German' ? `Ich uebe das Wort "${word}" in einem kurzen Satz.` : `I practise the word "${word}" in a short sentence.`,
    audioText: word,
  }));
  const chunks = seed.chunks.map((phrase) => ({
    phrase,
    meaning: language === 'German' ? 'useful classroom and everyday phrase' : 'useful everyday phrase',
    example: language === 'German' ? `${phrase} passt in eine kurze Alltagssituation.` : `${phrase} fits a short everyday situation.`,
  }));

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
    vocabulary,
    chunks,
    exercises: LESSON_JOURNEY.map((step) => buildExercise(baseId, seed, step, language)),
    mastery: {
      minOverallScore: 75,
      minSkillScore: 60,
      vocabularyRequired: 80,
    },
  };
}

function buildExercise(baseId: string, seed: LessonSeed, step: (typeof LESSON_JOURNEY)[number], language: CurriculumLanguage): CurriculumExercise {
  const rubric = getRubric(step.skill);
  return {
    id: `${baseId}-${step.order}-${step.defaultType}`,
    type: step.defaultType,
    skill: step.skill,
    title: step.title,
    instruction: getInstruction(step.skill, seed),
    content: {
      language,
      theme: seed.theme,
      prompt: seed.canDo,
      vocabulary: seed.words,
      chunks: seed.chunks,
      pronunciation: seed.pronunciation,
      grammarFocus: seed.grammarFocus,
    },
    correctAnswer: getCorrectAnswer(step.defaultType, seed),
    acceptableAnswers: step.skill === 'writing' || step.skill === 'speaking' ? seed.words.slice(0, 4) : undefined,
    scoringRubric: rubric,
    minScoreToPass: step.skill === 'test' ? 75 : 60,
  };
}

function getRubric(skill: CurriculumSkill): ScoringRubric {
  if (skill === 'writing') {
    return { taskCompletion: 25, grammar: 20, vocabulary: 20, coherence: 15, spelling: 10, cefrAppropriateness: 10 };
  }

  if (skill === 'speaking' || skill === 'conversation' || skill === 'pronunciation') {
    return { pronunciation: 30, fluency: 20, grammar: 15, vocabulary: 15, taskCompletion: 20 };
  }

  if (skill === 'dictation') {
    return { accuracy: 100 };
  }

  if (skill === 'reading' || skill === 'listening') {
    return { comprehension: 60, vocabulary: 20, taskCompletion: 20 };
  }

  return { taskCompletion: 40, grammar: 20, vocabulary: 20, accuracy: 20 };
}

function getInstruction(skill: CurriculumSkill, seed: LessonSeed) {
  const shared = `Use the ${seed.theme} lesson goal: ${seed.canDo}`;
  if (skill === 'dictation') return `Type the target sentence exactly. ${shared}`;
  if (skill === 'writing') return `Write your own short response. Do not copy the model sentence. ${shared}`;
  if (skill === 'speaking') return `Answer aloud with the target vocabulary and a complete sentence. ${shared}`;
  if (skill === 'pronunciation') return `Repeat and record the target sounds: ${seed.pronunciation}.`;
  if (skill === 'reading') return `Answer comprehension questions about the main idea and details. ${shared}`;
  if (skill === 'listening') return `Listen for meaning, details, and speaker intention. ${shared}`;
  return shared;
}

function getCorrectAnswer(type: ExerciseType, seed: LessonSeed) {
  if (type === 'sentence_order') return seed.chunks[0];
  if (type === 'vocabulary_match') return seed.words.slice(0, 4);
  if (type === 'dictation_sentence') return `${seed.chunks[0]} ${seed.words[0]}.`;
  if (type === 'grammar_choice') return seed.grammarFocus;
  return undefined;
}

function englishSeed(theme: string, objective: string, canDo: string, grammarFocus: string, words: string[], chunks: string[], pronunciation: string): LessonSeed {
  return { theme, objective, canDo, grammarFocus, words, chunks, pronunciation };
}

function germanSeed(theme: string, objective: string, canDo: string, grammarFocus: string, words: string[], chunks: string[], pronunciation: string): LessonSeed {
  return { theme, objective, canDo, grammarFocus, words, chunks, pronunciation };
}

function germanGloss(word: string) {
  return `German gloss for ${word}`;
}

function englishGloss(word: string) {
  return `English gloss for ${word}`;
}
