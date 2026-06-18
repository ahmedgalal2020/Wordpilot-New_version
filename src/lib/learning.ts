import type { WeeklyReport, WeeklyMistakeStatus } from '../hooks/useWeeklyReport';

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type LearningLanguage = 'English' | 'German' | 'Spanish' | 'Italian' | 'French';
export type PracticeSkill = 'Dictation' | 'Reading' | 'Listening' | 'Writing';
export type PracticeStatus = 'not_started' | 'in_progress' | 'completed';

export type PracticeExercise = {
  id: string;
  lessonId?: string;
  lessonTitle?: string;
  title: string;
  skill: PracticeSkill;
  level: CefrLevel;
  focus: string;
  duration: string;
  difficulty: 'Foundation' | 'Steady' | 'Challenging' | 'Advanced';
  status: PracticeStatus;
  description: string;
  sourceText: string;
  language: string;
};

export type PracticeLesson = {
  id: string;
  number: number;
  title: string;
  level: CefrLevel;
  language: LearningLanguage;
  theme: string;
  objective: string;
  canDo: string;
  grammarFocus: string;
  vocabulary: string[];
  exercises: PracticeExercise[];
};

export const CEFR_LEVELS: Array<{ level: CefrLevel; title: string; description: string }> = [
  { level: 'A1', title: 'Beginner basics', description: 'Short phrases, simple vocabulary, and first listening habits.' },
  { level: 'A2', title: 'Simple daily language', description: 'Everyday topics, clear sentences, and practical comprehension.' },
  { level: 'B1', title: 'Independent communication', description: 'Connected speech, familiar topics, and stronger self-correction.' },
  { level: 'B2', title: 'Academic and work topics', description: 'Longer paragraphs, precise vocabulary, and complex sentence endings.' },
  { level: 'C1', title: 'Advanced fluent practice', description: 'Dense arguments, nuance, idioms, and confident written reconstruction.' },
  { level: 'C2', title: 'Near-native mastery', description: 'Subtle register, speed, style, and near-native accuracy goals.' },
];

export const PRACTICE_SKILLS: PracticeSkill[] = ['Dictation', 'Reading', 'Listening', 'Writing'];
export const LEARNING_LANGUAGES: Array<{ language: LearningLanguage; description: string }> = [
  { language: 'English', description: 'Global academic, workplace, and everyday communication.' },
  { language: 'German', description: 'Structured CEFR practice for study, work, and daily fluency.' },
  { language: 'Spanish', description: 'Practical communication with clear listening and writing paths.' },
  { language: 'Italian', description: 'Foundational to advanced practice with natural sentence rhythm.' },
  { language: 'French', description: 'Focused training for pronunciation, spelling, and connected ideas.' },
];

const LEVEL_ORDER: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function normalizeCefrLevel(value?: string | null): CefrLevel {
  return CEFR_LEVELS.some((item) => item.level === value) ? (value as CefrLevel) : 'B1';
}

export function normalizeLearningLanguage(value?: string | null): LearningLanguage {
  return LEARNING_LANGUAGES.some((item) => item.language === value) ? (value as LearningLanguage) : 'English';
}

export function getLevelProgress(_level: CefrLevel, completedCount: number, totalCount: number) {
  if (totalCount <= 0 || completedCount <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((completedCount / totalCount) * 100));
}

export function getPracticeExercises(level: CefrLevel, language: LearningLanguage = 'English'): PracticeExercise[] {
  const templates: Record<PracticeSkill, Omit<PracticeExercise, 'id' | 'level' | 'status' | 'difficulty' | 'sourceText'>> = {
    Dictation: {
      title: getSkillTitle(level, 'Dictation', language),
      skill: 'Dictation',
      focus: getSkillFocus(level, 'Dictation', language),
      duration: '12 min',
      description: getSkillDescription('Dictation', language),
      language,
    },
    Reading: {
      title: getSkillTitle(level, 'Reading', language),
      skill: 'Reading',
      focus: getSkillFocus(level, 'Reading', language),
      duration: '10 min',
      description: getSkillDescription('Reading', language),
      language,
    },
    Listening: {
      title: getSkillTitle(level, 'Listening', language),
      skill: 'Listening',
      focus: getSkillFocus(level, 'Listening', language),
      duration: '15 min',
      description: getSkillDescription('Listening', language),
      language,
    },
    Writing: {
      title: getSkillTitle(level, 'Writing', language),
      skill: 'Writing',
      focus: getSkillFocus(level, 'Writing', language),
      duration: '18 min',
      description: getSkillDescription('Writing', language),
      language,
    },
  };

  return PRACTICE_SKILLS.map((skill) => ({
    ...templates[skill],
    id: `${language.toLowerCase()}-${level.toLowerCase()}-${skill.toLowerCase()}`,
    level,
    difficulty: getDifficulty(level),
    status: 'not_started',
    sourceText: getPracticeSource(level, skill, language),
  }));
}

export function getCurriculumLessons(level: CefrLevel, language: LearningLanguage): PracticeLesson[] {
  return LESSON_THEMES[level].map((theme, index) => {
    const number = index + 1;
    const vocabulary = getLessonVocabulary(language, level, index);
    const lessonId = `${language.toLowerCase()}-${level.toLowerCase()}-lesson-${number}`;
    const localizedTheme = getLocalizedLessonTheme(language, level, number, theme);
    const lessonTitle = `${number}. ${localizedTheme.title}`;

    const lesson: Omit<PracticeLesson, 'exercises'> = {
      id: lessonId,
      number,
      title: lessonTitle,
      level,
      language,
      theme: localizedTheme.title,
      objective: localizedTheme.objective,
      canDo: localizedTheme.canDo,
      grammarFocus: localizedTheme.grammarFocus,
      vocabulary,
    };

    return {
      ...lesson,
      exercises: buildLessonExercises(lesson, vocabulary),
    };
  });
}

export function buildPracticeRecommendation(level: CefrLevel, report: WeeklyReport, fallbackLanguage = 'English') {
  const focus = getRecommendationFocus(level);
  const isGerman = fallbackLanguage === 'German';

  if (report.currentWeek.sessionsCount === 0) {
    if (isGerman) {
      return `Beginne mit Deutsch ${level}: ${focus.germanDictation}, damit dein erster Wochenfortschritt sauber erfasst wird.`;
    }

    return `Start with ${fallbackLanguage} ${level} ${focus.dictation} to create your first weekly progress signal.`;
  }

  const topMistake = report.topMistakes[0];

  if (topMistake?.status === 'missing') {
    if (isGerman) {
      return `Übe fehlende Wörter in Deutsch ${level}, besonders Artikel, Endungen und Satzschlüsse.`;
    }

    return `Focus on missing words in ${fallbackLanguage} ${level} listening exercises, especially sentence endings.`;
  }

  if (topMistake?.status === 'extra') {
    if (isGerman) {
      return `Wähle ein langsameres Deutsch-${level}-Diktat und schreibe nur die Wörter, die du sicher hörst.`;
    }

    return `Try a slower ${fallbackLanguage} ${level} dictation and type only the words you clearly hear.`;
  }

  if (topMistake?.status === 'wrong') {
    if (isGerman) {
      return `Trainiere Deutsch ${level} mit wiederholten Zielwörtern aus deiner Fehlerliste.`;
    }

    return `Practice ${fallbackLanguage} ${level} vocabulary dictation with repeated words from your mistake list.`;
  }

  if (report.currentWeek.averageAccuracy !== null && report.currentWeek.averageAccuracy < 70) {
    const easierLevel = LEVEL_ORDER[Math.max(0, LEVEL_ORDER.indexOf(level) - 1)];
    if (isGerman) {
      return `Gehe kurz auf Deutsch ${easierLevel} zurück und festige Diktat, Artikel und Wortstellung, bevor du wieder ${level} übst.`;
    }

    return `Try an easier ${fallbackLanguage} ${easierLevel} dictation session before moving back to ${level}.`;
  }

  if (report.currentWeek.averageAccuracy !== null && report.currentWeek.averageAccuracy >= 88) {
    if (isGerman) {
      return `Steigere dich mit Deutsch ${level}: ${focus.germanNextStep}.`;
    }

    return `Practice ${fallbackLanguage} ${level} ${focus.nextStep}.`;
  }

  if (isGerman) {
    return `Setze mit Deutsch ${level}: ${focus.germanDictation} fort und ergänze diese Woche eine Hörübung.`;
  }

  return `Continue with ${fallbackLanguage} ${level} ${focus.dictation}, then add one listening exercise this week.`;
}

function getRecommendationFocus(level: CefrLevel) {
  const focus: Record<CefrLevel, { dictation: string; nextStep: string; germanDictation: string; germanNextStep: string }> = {
    A1: {
      dictation: 'beginner word and short sentence dictation',
      nextStep: 'short dictation with names, places, time, and everyday objects',
      germanDictation: 'Wort- und Kurzsatzdiktat mit Namen, Orten, Zeiten und Alltagsgegenständen',
      germanNextStep: 'kurze Diktate mit Artikeln, Zahlen und einfachen Fragen',
    },
    A2: {
      dictation: 'everyday sentence dictation',
      nextStep: 'daily-life dictation with plans, simple reasons, and clear sentence endings',
      germanDictation: 'Alltagssatz-Diktat mit Plänen, Gründen und höflichen Bitten',
      germanNextStep: 'kurze Alltagstexte mit Perfekt, weil-Sätzen und Modalverben',
    },
    B1: {
      dictation: 'connected paragraph dictation',
      nextStep: 'paragraph dictation with stories, opinions, and practical explanations',
      germanDictation: 'Absatzdiktat mit Erfahrungen, Meinung und praktischer Erklärung',
      germanNextStep: 'zusammenhängende Absätze mit Konnektoren, Relativsätzen und Begründungen',
    },
    B2: {
      dictation: 'academic and work-topic dictation',
      nextStep: 'academic dictation with longer sentences and denser vocabulary',
      germanDictation: 'Diktat zu Studium und Beruf mit präzisem Wortschatz und längeren Sätzen',
      germanNextStep: 'argumentative Absätze mit Belegen, Gegenpositionen und formellem Stil',
    },
    C1: {
      dictation: 'advanced argument dictation',
      nextStep: 'advanced dictation with nuance, register, and precise reformulation',
      germanDictation: 'fortgeschrittenes Argumentationsdiktat mit Register und Nuance',
      germanNextStep: 'präzise Umformulierung mit Hedging, Synthese und Registerkontrolle',
    },
    C2: {
      dictation: 'near-native rhythm dictation',
      nextStep: 'near-native dictation with subtext, style, speed, and micro-accuracy',
      germanDictation: 'nahezu muttersprachliches Rhythmusdiktat mit Subtext und Stilkontrolle',
      germanNextStep: 'Feinschliff an Subtext, Kadenz, Variation und mikropräziser Formulierung',
    },
  };

  return focus[level];
}

export function getMistakeBreakdown(topMistakes: WeeklyReport['topMistakes']) {
  return topMistakes.reduce<Record<WeeklyMistakeStatus, number>>(
    (breakdown, mistake) => {
      breakdown[mistake.status] += mistake.count;
      return breakdown;
    },
    { wrong: 0, missing: 0, extra: 0 },
  );
}

function buildLessonExercises(
  lesson: Omit<PracticeLesson, 'exercises'>,
  vocabulary: string[],
): PracticeExercise[] {
  const templates = getLessonExerciseTemplates(lesson.language);

  return PRACTICE_SKILLS.map((skill) => ({
    id: `${lesson.id}-${skill.toLowerCase()}`,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    title: templates[skill].title,
    skill,
    level: lesson.level,
    focus: getLessonFocus(lesson, skill),
    duration: templates[skill].duration,
    difficulty: getDifficulty(lesson.level),
    status: 'not_started',
    description: templates[skill].description,
    sourceText: buildLessonSourceText(lesson, skill, vocabulary),
    language: lesson.language,
  }));
}

function buildLessonSourceText(lesson: Omit<PracticeLesson, 'exercises'>, skill: PracticeSkill, vocabulary: string[]) {
  if (lesson.language === 'German') {
    return buildGermanLessonSourceText(lesson, skill, vocabulary);
  }

  const words = vocabulary.slice(0, 5).join(', ');
  const targetLine = getLanguageLessonLine(lesson, vocabulary);
  const labels = getSourceInstructionLabels(lesson.language);
  const shared = `${targetLine} ${labels.targetWords}: ${words}.`;

  if (skill === 'Writing') {
    return `${shared} ${labels.writingTask}: ${labels.writePrompt(lesson.canDo, lesson.grammarFocus)}.`;
  }

  if (skill === 'Reading') {
    return `${shared} ${labels.readingPrompt}.`;
  }

  if (skill === 'Listening') {
    return `${shared} ${labels.listeningPrompt}.`;
  }

  return `${shared} ${labels.dictationPrompt(lesson.grammarFocus)}.`;
}

function buildGermanLessonSourceText(
  lesson: Omit<PracticeLesson, 'exercises'>,
  skill: PracticeSkill,
  vocabulary: string[],
) {
  const passage = GERMAN_LESSON_PASSAGES[lesson.level][lesson.number - 1];
  const targetWords = vocabulary.slice(0, 5).join(', ');
  const base = `${passage} Lernziel: ${lesson.objective} Ergebnis: ${lesson.canDo} Grammatik: ${lesson.grammarFocus}. Zielwörter: ${targetWords}.`;

  if (skill === 'Writing') {
    return `${base} Schreibauftrag: Verfasse eine eigene Version mit mindestens vier Zielwörtern. Achte besonders auf ${lesson.grammarFocus.toLowerCase()} und schreibe zusammenhängend.`;
  }

  if (skill === 'Reading') {
    return `${base} Leseauftrag: Lies den Text sorgfältig, markiere die Zielwörter und rekonstruiere anschließend die Hauptaussage mit eigenen Worten.`;
  }

  if (skill === 'Listening') {
    return `${base} Hörauftrag: Höre in Sinnabschnitten. Notiere zuerst Schlüsselwörter, dann Satzenden, Konnektoren und die genaue Wortstellung.`;
  }

  return `${base} Diktatauftrag: Höre einmal vollständig zu, schreibe dann Satz für Satz und prüfe am Ende Großschreibung, Artikel, Endungen und Wortstellung.`;
}

function getLanguageLessonLine(lesson: Omit<PracticeLesson, 'exercises'>, vocabulary: string[]) {
  const [one, two, three, four] = vocabulary;
  const advanced = lesson.level === 'B2' || lesson.level === 'C1' || lesson.level === 'C2';

  const lines: Record<LearningLanguage, string> = {
    English: advanced
      ? `In this ${lesson.level} lesson about ${lesson.theme.toLowerCase()}, the learner studies ${one}, ${two}, and ${three} to build a precise argument with evidence and clear transitions.`
      : `In this ${lesson.level} lesson about ${lesson.theme.toLowerCase()}, I practise ${one}, ${two}, and ${three}. I use short clear sentences and check every word.`,
    German: advanced
      ? `In dieser ${lesson.level} Lektion zum Thema ${lesson.theme} analysiert der Lerner ${one}, ${two} und ${three}, damit ein präziser Text mit Belegen und klaren Übergängen entsteht.`
      : `In dieser ${lesson.level} Lektion zum Thema ${lesson.theme} übe ich ${one}, ${two} und ${three}. Ich schreibe kurze Sätze und prüfe jedes Wort.`,
    Spanish: advanced
      ? `En esta leccion ${lesson.level} sobre ${lesson.theme}, el estudiante analiza ${one}, ${two} y ${three} para construir un argumento preciso con evidencia y transiciones claras.`
      : `En esta leccion ${lesson.level} sobre ${lesson.theme}, practico ${one}, ${two} y ${three}. Uso frases cortas y reviso cada palabra.`,
    Italian: advanced
      ? `In questa lezione ${lesson.level} su ${lesson.theme}, lo studente analizza ${one}, ${two} e ${three} per costruire un argomento preciso con prove e passaggi chiari.`
      : `In questa lezione ${lesson.level} su ${lesson.theme}, pratico ${one}, ${two} e ${three}. Uso frasi brevi e controllo ogni parola.`,
    French: advanced
      ? `Dans cette lecon ${lesson.level} sur ${lesson.theme}, l apprenant analyse ${one}, ${two} et ${three} pour construire un argument precis avec des preuves et des transitions claires.`
      : `Dans cette lecon ${lesson.level} sur ${lesson.theme}, je travaille ${one}, ${two} et ${three}. J utilise des phrases courtes et je verifie chaque mot.`,
  };

  const endings: Record<LearningLanguage, string> = {
    English: `The lesson target is ${lesson.objective} Key outcome: ${lesson.canDo} Extra control word: ${four}.`,
    German: `Das Lernziel ist: ${lesson.objective} Ergebnis: ${lesson.canDo} Zusatzwort: ${four}.`,
    Spanish: `El objetivo es: ${lesson.objective} Resultado: ${lesson.canDo} Palabra extra: ${four}.`,
    Italian: `L obiettivo e: ${lesson.objective} Risultato: ${lesson.canDo} Parola extra: ${four}.`,
    French: `L objectif est: ${lesson.objective} Resultat: ${lesson.canDo} Mot supplementaire: ${four}.`,
  };

  return `${lines[lesson.language]} ${endings[lesson.language]}`;
}

function getLocalizedLessonTheme(
  language: LearningLanguage,
  level: CefrLevel,
  lessonNumber: number,
  fallback: { title: string; objective: string; canDo: string; grammarFocus: string },
) {
  if (language === 'English') {
    return fallback;
  }

  if (language === 'German') {
    return GERMAN_LESSON_THEMES[level][lessonNumber - 1] ?? fallback;
  }

  const labels: Record<Exclude<LearningLanguage, 'English' | 'German'>, { title: string; objective: string; canDo: string; grammarFocus: string }> = {
    Spanish: {
      title: `${level} Practica ${lessonNumber}`,
      objective: 'practicar vocabulario, estructura y comprension auditiva.',
      canDo: 'comprender el texto y reconstruirlo con precision.',
      grammarFocus: 'orden de palabras, conectores y finales claros',
    },
    Italian: {
      title: `${level} Pratica ${lessonNumber}`,
      objective: 'allenare vocabolario, struttura e ascolto.',
      canDo: 'capire il testo e ricostruirlo con precisione.',
      grammarFocus: 'ordine delle parole, connettori e finali chiari',
    },
    French: {
      title: `${level} Entrainement ${lessonNumber}`,
      objective: 'travailler le vocabulaire, la structure et l ecoute.',
      canDo: 'comprendre le texte et le reconstruire avec precision.',
      grammarFocus: 'ordre des mots, connecteurs et fins de phrases',
    },
  };

  return labels[language];
}

function getLessonExerciseTemplates(language: LearningLanguage): Record<PracticeSkill, { title: string; duration: string; description: string }> {
  if (language === 'German') {
    return {
      Dictation: {
        title: 'Hören & Schreiben',
        duration: '12 min',
        description: 'Schreibe den Zieltext genau mit und prüfe fehlende, falsche und zusätzliche Wörter.',
      },
      Reading: {
        title: 'Lesen & Rekonstruieren',
        duration: '10 min',
        description: 'Lies den Text, verdecke ihn und baue die Bedeutung aus dem Gedächtnis neu auf.',
      },
      Listening: {
        title: 'Details Erkennen',
        duration: '15 min',
        description: 'Höre Satzgruppen erneut und achte auf Endungen, Konnektoren und Zielwörter.',
      },
      Writing: {
        title: 'Eigene Version Schreiben',
        duration: '18 min',
        description: 'Schreibe eine klare eigene Version mit dem Wortschatz und der Grammatik der Lektion.',
      },
    };
  }

  return {
    Dictation: {
      title: 'Listen & Type',
      duration: '12 min',
      description: 'Type the target passage exactly and review missing, wrong, and extra words.',
    },
    Reading: {
      title: 'Read & Rebuild',
      duration: '10 min',
      description: 'Read the passage, hide it, then rebuild the meaning from memory.',
    },
    Listening: {
      title: 'Catch the Details',
      duration: '15 min',
      description: 'Replay phrase groups and capture connectors, endings, and key vocabulary.',
    },
    Writing: {
      title: 'Write Your Version',
      duration: '18 min',
      description: 'Use the lesson prompt to write a clear version with the target vocabulary.',
    },
  };
}

function getLessonFocus(lesson: Omit<PracticeLesson, 'exercises'>, skill: PracticeSkill) {
  if (lesson.language === 'German') {
    return `${lesson.theme.toLowerCase()} ${getLocalizedSkillFocus('German', lesson.level, skill).toLowerCase()}`;
  }

  return `${lesson.theme.toLowerCase()} ${skill.toLowerCase()}`;
}

function getSourceInstructionLabels(language: LearningLanguage) {
  if (language === 'German') {
    return {
      targetWords: 'Zielwörter',
      writingTask: 'Schreibaufgabe',
      writePrompt: (canDo: string, grammarFocus: string) =>
        `Schreibe eine klare Antwort und zeige, dass du ${canDo.toLowerCase()} Nutze mindestens vier Zielwörter und einen Satz mit ${grammarFocus.toLowerCase()}`,
      readingPrompt: 'Lies genau, achte auf den Grammatikfokus und rekonstruiere die Bedeutung mit eigenen Worten',
      listeningPrompt: 'Höre auf Satzgruppen, Endungen und Zielwörter. Pausiere nach jeder Wortgruppe und schreibe, was du verstanden hast',
      dictationPrompt: (grammarFocus: string) =>
        `Dieses Diktat prüft Rechtschreibung, Wortstellung und ${grammarFocus.toLowerCase()}. Höre einmal zu, schreibe sorgfältig und wiederhole den schwierigsten Satz`,
    };
  }

  return {
    targetWords: 'Target words',
    writingTask: 'Writing task',
    writePrompt: (canDo: string, grammarFocus: string) =>
      `produce a clear response that proves you can ${canDo.toLowerCase()} Use at least four target words and one sentence with ${grammarFocus.toLowerCase()}`,
    readingPrompt: 'Read carefully, notice the grammar focus, then rebuild the meaning in your own words',
    listeningPrompt: 'Listen for phrase groups, sentence endings, and the target words. Pause after each phrase, then write what you understood',
    dictationPrompt: (grammarFocus: string) =>
      `This dictation checks spelling, word order, and control of ${grammarFocus.toLowerCase()}. Listen once, type carefully, then repeat the hardest sentence`,
  };
}

function getDifficulty(level: CefrLevel): PracticeExercise['difficulty'] {
  if (level === 'A1' || level === 'A2') return 'Foundation';
  if (level === 'B1') return 'Steady';
  if (level === 'B2') return 'Challenging';
  return 'Advanced';
}

const LESSON_THEMES: Record<CefrLevel, Array<{ title: string; objective: string; canDo: string; grammarFocus: string }>> = {
  A1: [
    { title: 'Introductions', objective: 'use greetings, names, and simple identity phrases.', canDo: 'introduce yourself and ask a basic question.', grammarFocus: 'be verbs and subject pronouns' },
    { title: 'Numbers & Time', objective: 'recognize numbers, days, and simple time expressions.', canDo: 'say when something happens.', grammarFocus: 'numbers and time phrases' },
    { title: 'Family & People', objective: 'describe close people with basic adjectives.', canDo: 'talk about family and friends.', grammarFocus: 'possessives and simple adjectives' },
    { title: 'Daily Routine', objective: 'understand common daily actions.', canDo: 'describe a normal day.', grammarFocus: 'present simple verbs' },
    { title: 'Food & Drinks', objective: 'use basic food vocabulary in polite requests.', canDo: 'order or ask for simple food.', grammarFocus: 'I want / I would like patterns' },
    { title: 'Places in Town', objective: 'identify common places and simple directions.', canDo: 'ask where a place is.', grammarFocus: 'there is / there are' },
    { title: 'Home & Objects', objective: 'name everyday objects and rooms.', canDo: 'describe a room simply.', grammarFocus: 'articles and singular/plural nouns' },
    { title: 'Shopping Basics', objective: 'understand price, color, and size words.', canDo: 'buy something simple.', grammarFocus: 'this/that and how much' },
    { title: 'Weather & Seasons', objective: 'recognize simple weather statements.', canDo: 'say what the weather is like.', grammarFocus: 'it is / it feels patterns' },
    { title: 'Transport Basics', objective: 'use basic travel words and short questions.', canDo: 'ask about a bus, train, or ticket.', grammarFocus: 'where/when questions' },
    { title: 'Health Basics', objective: 'say how you feel in simple words.', canDo: 'describe a basic problem.', grammarFocus: 'have/feel expressions' },
    { title: 'A1 Review Mission', objective: 'combine identity, routine, places, and needs.', canDo: 'handle a simple beginner conversation.', grammarFocus: 'short sentence control' },
  ],
  A2: [
    { title: 'Past Weekend', objective: 'understand simple past events.', canDo: 'describe what happened recently.', grammarFocus: 'past simple markers' },
    { title: 'Plans & Invitations', objective: 'use future plans and polite invitations.', canDo: 'arrange a simple meeting.', grammarFocus: 'going to / want to' },
    { title: 'Travel Problems', objective: 'explain basic travel issues.', canDo: 'ask for help during a trip.', grammarFocus: 'because and simple reasons' },
    { title: 'Work & Study', objective: 'describe jobs, classes, and responsibilities.', canDo: 'talk about a work or study day.', grammarFocus: 'frequency adverbs' },
    { title: 'Digital Life', objective: 'use common technology vocabulary.', canDo: 'explain a simple digital task.', grammarFocus: 'imperatives and sequence words' },
    { title: 'City Services', objective: 'understand public services and appointments.', canDo: 'request information politely.', grammarFocus: 'modal verbs for requests' },
    { title: 'Comparing Choices', objective: 'compare simple options.', canDo: 'choose and explain a preference.', grammarFocus: 'comparatives' },
    { title: 'Stories & Events', objective: 'follow a short chronological story.', canDo: 'retell a simple event.', grammarFocus: 'first/then/after that' },
    { title: 'Advice & Rules', objective: 'understand simple rules and advice.', canDo: 'give basic advice.', grammarFocus: 'should / must' },
    { title: 'Opinions', objective: 'express simple opinions with reasons.', canDo: 'say what you think and why.', grammarFocus: 'I think because' },
    { title: 'Messages & Emails', objective: 'write short practical messages.', canDo: 'send a clear request or reply.', grammarFocus: 'polite openings and closings' },
    { title: 'A2 Review Mission', objective: 'combine past, plans, opinions, and requests.', canDo: 'handle everyday practical situations.', grammarFocus: 'connected short paragraphs' },
  ],
  B1: [
    { title: 'Clear Experiences', objective: 'describe experiences with detail and sequence.', canDo: 'tell a connected personal story.', grammarFocus: 'past forms and linking words' },
    { title: 'Problems & Solutions', objective: 'explain a problem and suggest a solution.', canDo: 'participate in practical discussion.', grammarFocus: 'cause and result' },
    { title: 'Workplace Communication', objective: 'understand requests, updates, and priorities.', canDo: 'write a useful work update.', grammarFocus: 'modal verbs and polite tone' },
    { title: 'Study Skills', objective: 'discuss learning habits and progress.', canDo: 'explain a study strategy.', grammarFocus: 'gerunds and infinitives' },
    { title: 'Community Life', objective: 'talk about local issues and services.', canDo: 'give an opinion about community needs.', grammarFocus: 'relative clauses' },
    { title: 'Media & News', objective: 'identify main ideas in news-style text.', canDo: 'summarize a short report.', grammarFocus: 'reported information' },
    { title: 'Health & Lifestyle', objective: 'discuss habits, routines, and advice.', canDo: 'explain a lifestyle change.', grammarFocus: 'conditionals type 1' },
    { title: 'Culture & Travel', objective: 'compare places and customs.', canDo: 'describe cultural differences respectfully.', grammarFocus: 'comparatives and contrast' },
    { title: 'Money Decisions', objective: 'understand budgets, costs, and choices.', canDo: 'explain a financial decision.', grammarFocus: 'quantity expressions' },
    { title: 'Environment', objective: 'discuss everyday environmental actions.', canDo: 'suggest realistic improvements.', grammarFocus: 'passive basics' },
    { title: 'Presentations', objective: 'organize ideas for a short talk.', canDo: 'present a clear point with examples.', grammarFocus: 'signposting language' },
    { title: 'B1 Review Mission', objective: 'combine story, opinion, advice, and summary.', canDo: 'communicate independently on familiar topics.', grammarFocus: 'paragraph organization' },
  ],
  B2: [
    { title: 'Academic Claims', objective: 'follow claims, evidence, and examples.', canDo: 'explain an argument clearly.', grammarFocus: 'complex linking' },
    { title: 'Research & Data', objective: 'understand trends, figures, and cautious claims.', canDo: 'summarize data responsibly.', grammarFocus: 'hedging language' },
    { title: 'Workplace Strategy', objective: 'discuss goals, tradeoffs, and priorities.', canDo: 'write a professional recommendation.', grammarFocus: 'conditionals and contrast' },
    { title: 'Technology Impact', objective: 'evaluate benefits, risks, and ethics.', canDo: 'argue about technology thoughtfully.', grammarFocus: 'nominalization' },
    { title: 'Public Policy', objective: 'follow formal policy language.', canDo: 'explain a public issue with balance.', grammarFocus: 'passive and formal style' },
    { title: 'Culture & Identity', objective: 'analyze identity, values, and belonging.', canDo: 'compare perspectives with nuance.', grammarFocus: 'concession clauses' },
    { title: 'Business Cases', objective: 'understand market, customer, and decision language.', canDo: 'summarize a business case.', grammarFocus: 'cause/effect chains' },
    { title: 'Science Communication', objective: 'explain evidence without oversimplifying.', canDo: 'communicate scientific findings.', grammarFocus: 'relative and participle clauses' },
    { title: 'Debate Skills', objective: 'recognize counterarguments and rebuttals.', canDo: 'respond to opposing views.', grammarFocus: 'however/although/despite' },
    { title: 'Long Listening', objective: 'catch sentence endings in longer speech.', canDo: 'take notes from a dense passage.', grammarFocus: 'discourse markers' },
    { title: 'Formal Writing', objective: 'write organized, precise paragraphs.', canDo: 'build a strong academic/work paragraph.', grammarFocus: 'topic sentence and cohesion' },
    { title: 'B2 Review Mission', objective: 'combine evidence, balance, precision, and fluency.', canDo: 'handle upper-intermediate academic and work topics.', grammarFocus: 'advanced paragraph control' },
  ],
  C1: [
    { title: 'Nuanced Arguments', objective: 'track subtle claims and implications.', canDo: 'explain nuance without losing clarity.', grammarFocus: 'advanced subordination' },
    { title: 'Register & Tone', objective: 'notice formal, neutral, and persuasive style.', canDo: 'adjust tone for audience.', grammarFocus: 'register shifts' },
    { title: 'Critical Reading', objective: 'evaluate assumptions and evidence.', canDo: 'critique a text fairly.', grammarFocus: 'stance markers' },
    { title: 'Professional Briefings', objective: 'process dense updates quickly.', canDo: 'summarize executive information.', grammarFocus: 'compressed noun phrases' },
    { title: 'Abstract Concepts', objective: 'handle abstract vocabulary precisely.', canDo: 'define and apply complex ideas.', grammarFocus: 'definition structures' },
    { title: 'Negotiation Language', objective: 'understand concessions and conditions.', canDo: 'negotiate with tact.', grammarFocus: 'diplomatic phrasing' },
    { title: 'Academic Synthesis', objective: 'combine multiple viewpoints.', canDo: 'synthesize sources in one paragraph.', grammarFocus: 'synthesis language' },
    { title: 'Risk & Uncertainty', objective: 'express probability and limitation.', canDo: 'discuss risk responsibly.', grammarFocus: 'modality and hedging' },
    { title: 'Rhetorical Devices', objective: 'recognize emphasis and persuasion.', canDo: 'explain rhetorical effect.', grammarFocus: 'emphasis structures' },
    { title: 'Fast Speech', objective: 'catch reduced forms and dense phrasing.', canDo: 'follow fast expert speech.', grammarFocus: 'ellipsis and reference' },
    { title: 'Precision Editing', objective: 'improve clarity, flow, and concision.', canDo: 'edit a paragraph to C1 standard.', grammarFocus: 'cohesion and concision' },
    { title: 'C1 Review Mission', objective: 'combine nuance, speed, register, and precision.', canDo: 'operate fluently in advanced settings.', grammarFocus: 'controlled sophistication' },
  ],
  C2: [
    { title: 'Near-Native Flow', objective: 'control rhythm, implication, and emphasis.', canDo: 'produce natural high-level phrasing.', grammarFocus: 'information structure' },
    { title: 'Subtext & Implication', objective: 'infer what is suggested but not stated.', canDo: 'explain subtext accurately.', grammarFocus: 'pragmatic meaning' },
    { title: 'Editorial Style', objective: 'analyze voice, stance, and elegance.', canDo: 'rewrite with editorial control.', grammarFocus: 'style and cadence' },
    { title: 'Specialist Discourse', objective: 'handle domain-specific precision.', canDo: 'summarize expert material.', grammarFocus: 'technical nominal groups' },
    { title: 'Humor & Irony', objective: 'recognize layered meaning.', canDo: 'explain irony without flattening it.', grammarFocus: 'contrastive framing' },
    { title: 'Legal & Formal Precision', objective: 'notice obligations, exceptions, and scope.', canDo: 'interpret formal constraints.', grammarFocus: 'scope and qualification' },
    { title: 'Literary Texture', objective: 'track imagery, rhythm, and voice.', canDo: 'discuss literary effect precisely.', grammarFocus: 'figurative language' },
    { title: 'High-Speed Synthesis', objective: 'combine dense information quickly.', canDo: 'produce concise synthesis under pressure.', grammarFocus: 'compression' },
    { title: 'Persuasive Mastery', objective: 'control argument, tone, and audience.', canDo: 'write persuasive expert prose.', grammarFocus: 'rhetorical architecture' },
    { title: 'Accent & Variation', objective: 'handle variation in pronunciation and usage.', canDo: 'understand diverse high-level speech.', grammarFocus: 'variation awareness' },
    { title: 'Final Accuracy Lab', objective: 'remove small errors in spelling, order, and style.', canDo: 'produce near-native accuracy.', grammarFocus: 'micro-editing' },
    { title: 'C2 Review Mission', objective: 'combine mastery, nuance, speed, and style.', canDo: 'perform at near-native level.', grammarFocus: 'full-spectrum control' },
  ],
};

const GERMAN_LESSON_THEMES: Record<CefrLevel, Array<{ title: string; objective: string; canDo: string; grammarFocus: string }>> = {
  A1: [
    { title: 'Begrüßung & Vorstellung', objective: 'Begrüßungen, Namen und einfache Angaben zur Person verwenden.', canDo: 'dich vorstellen und eine einfache Frage stellen.', grammarFocus: 'sein, heißen und Personalpronomen' },
    { title: 'Zahlen & Uhrzeit', objective: 'Zahlen, Tage und einfache Zeitangaben sicher erkennen.', canDo: 'sagen, wann etwas passiert.', grammarFocus: 'Zahlen, Uhrzeit und kurze Zeitphrasen' },
    { title: 'Familie & Personen', objective: 'nahe Personen mit einfachen Adjektiven beschreiben.', canDo: 'über Familie und Freunde sprechen.', grammarFocus: 'Possessivartikel und einfache Adjektive' },
    { title: 'Tagesablauf', objective: 'häufige Handlungen im Alltag verstehen.', canDo: 'einen normalen Tag einfach beschreiben.', grammarFocus: 'Präsens regelmäßiger Verben' },
    { title: 'Essen & Trinken', objective: 'Grundwortschatz für Essen in höflichen Bitten nutzen.', canDo: 'einfach etwas bestellen oder erfragen.', grammarFocus: 'ich möchte und ich nehme' },
    { title: 'Orte in der Stadt', objective: 'wichtige Orte und einfache Wegfragen erkennen.', canDo: 'fragen, wo ein Ort ist.', grammarFocus: 'wo, hier, dort und einfache Präpositionen' },
    { title: 'Wohnung & Dinge', objective: 'Zimmer und Alltagsgegenstände benennen.', canDo: 'ein Zimmer einfach beschreiben.', grammarFocus: 'Artikel, Singular und Plural' },
    { title: 'Einkaufen', objective: 'Preis, Farbe und Größe verstehen.', canDo: 'etwas Einfaches kaufen.', grammarFocus: 'dieser, diese, dieses und wie viel' },
    { title: 'Wetter & Jahreszeiten', objective: 'einfache Wetteraussagen erkennen.', canDo: 'sagen, wie das Wetter ist.', grammarFocus: 'es ist und es gibt' },
    { title: 'Verkehr', objective: 'einfache Reisewörter und kurze Fragen nutzen.', canDo: 'nach Bus, Zug oder Fahrkarte fragen.', grammarFocus: 'wohin, wann und kurze Fragen' },
    { title: 'Gesundheit', objective: 'einfach sagen, wie es dir geht.', canDo: 'ein einfaches Problem beschreiben.', grammarFocus: 'haben, sein und mir tut weh' },
    { title: 'A1 Wiederholung', objective: 'Vorstellung, Alltag, Orte und Bedürfnisse verbinden.', canDo: 'ein einfaches Anfängergespräch führen.', grammarFocus: 'kurze Hauptsätze' },
  ],
  A2: [
    { title: 'Letztes Wochenende', objective: 'einfache vergangene Ereignisse verstehen.', canDo: 'erzählen, was kürzlich passiert ist.', grammarFocus: 'Perfekt mit haben und sein' },
    { title: 'Pläne & Einladungen', objective: 'Pläne und höfliche Einladungen formulieren.', canDo: 'ein einfaches Treffen vereinbaren.', grammarFocus: 'möchte, wollen und werden' },
    { title: 'Probleme auf Reisen', objective: 'einfache Reiseprobleme erklären.', canDo: 'auf einer Reise um Hilfe bitten.', grammarFocus: 'weil und einfache Begründungen' },
    { title: 'Arbeit & Studium', objective: 'Aufgaben, Kurse und Verantwortungen beschreiben.', canDo: 'über einen Arbeits- oder Studientag sprechen.', grammarFocus: 'Häufigkeitsadverbien' },
    { title: 'Digitaler Alltag', objective: 'häufige Technikwörter verwenden.', canDo: 'eine einfache digitale Aufgabe erklären.', grammarFocus: 'Imperativ und Reihenfolgewörter' },
    { title: 'Termine & Behörden', objective: 'Informationen zu Terminen und Services verstehen.', canDo: 'höflich um Auskunft bitten.', grammarFocus: 'Modalverben für Bitten' },
    { title: 'Optionen Vergleichen', objective: 'einfache Möglichkeiten vergleichen.', canDo: 'eine Wahl begründen.', grammarFocus: 'Komparativ' },
    { title: 'Geschichten & Ereignisse', objective: 'einer kurzen chronologischen Geschichte folgen.', canDo: 'ein Ereignis einfach nacherzählen.', grammarFocus: 'zuerst, dann, danach' },
    { title: 'Regeln & Rat', objective: 'einfache Regeln und Ratschläge verstehen.', canDo: 'einen einfachen Rat geben.', grammarFocus: 'sollen und müssen' },
    { title: 'Meinungen', objective: 'einfache Meinungen mit Gründen ausdrücken.', canDo: 'sagen, was du denkst und warum.', grammarFocus: 'ich finde, dass und weil' },
    { title: 'Nachrichten & E-Mails', objective: 'kurze praktische Nachrichten schreiben.', canDo: 'eine klare Bitte oder Antwort senden.', grammarFocus: 'höfliche Anrede und Schlussformel' },
    { title: 'A2 Wiederholung', objective: 'Vergangenheit, Pläne, Meinungen und Bitten verbinden.', canDo: 'praktische Alltagssituationen bewältigen.', grammarFocus: 'verbundene kurze Absätze' },
  ],
  B1: [
    { title: 'Erfahrungen Erzählen', objective: 'Erfahrungen mit Details und Reihenfolge beschreiben.', canDo: 'eine zusammenhängende persönliche Geschichte erzählen.', grammarFocus: 'Perfekt, Präteritum und Konnektoren' },
    { title: 'Probleme & Lösungen', objective: 'ein Problem erklären und eine Lösung vorschlagen.', canDo: 'an einer praktischen Diskussion teilnehmen.', grammarFocus: 'Ursache und Folge' },
    { title: 'Kommunikation im Beruf', objective: 'Bitten, Updates und Prioritäten verstehen.', canDo: 'ein nützliches Arbeitsupdate schreiben.', grammarFocus: 'Modalverben und höflicher Ton' },
    { title: 'Lernstrategien', objective: 'Lerngewohnheiten und Fortschritt besprechen.', canDo: 'eine Lernstrategie erklären.', grammarFocus: 'Infinitiv mit zu' },
    { title: 'Gemeinschaft & Alltag', objective: 'über lokale Themen und Services sprechen.', canDo: 'eine Meinung zu Bedürfnissen im Umfeld geben.', grammarFocus: 'Relativsätze' },
    { title: 'Medien & Nachrichten', objective: 'Hauptideen in nachrichtenartigen Texten erkennen.', canDo: 'einen kurzen Bericht zusammenfassen.', grammarFocus: 'indirekte Rede in Grundform' },
    { title: 'Gesundheit & Lebensstil', objective: 'Gewohnheiten, Routinen und Rat besprechen.', canDo: 'eine Lebensstiländerung erklären.', grammarFocus: 'wenn-Sätze' },
    { title: 'Kultur & Reisen', objective: 'Orte und Gewohnheiten vergleichen.', canDo: 'kulturelle Unterschiede respektvoll beschreiben.', grammarFocus: 'Vergleich und Gegensatz' },
    { title: 'Geldentscheidungen', objective: 'Budgets, Kosten und Entscheidungen verstehen.', canDo: 'eine finanzielle Entscheidung erklären.', grammarFocus: 'Mengenangaben' },
    { title: 'Umwelt im Alltag', objective: 'über alltägliche Umweltmaßnahmen sprechen.', canDo: 'realistische Verbesserungen vorschlagen.', grammarFocus: 'Passiv Grundlagen' },
    { title: 'Kurzpräsentationen', objective: 'Ideen für einen kurzen Vortrag ordnen.', canDo: 'einen klaren Punkt mit Beispielen präsentieren.', grammarFocus: 'Redemittel zur Strukturierung' },
    { title: 'B1 Wiederholung', objective: 'Erzählen, Meinung, Rat und Zusammenfassung verbinden.', canDo: 'selbstständig über vertraute Themen kommunizieren.', grammarFocus: 'Absatzstruktur' },
  ],
  B2: [
    { title: 'Akademische Thesen', objective: 'Thesen, Belege und Beispiele nachvollziehen.', canDo: 'ein Argument klar erklären.', grammarFocus: 'komplexe Verknüpfungen' },
    { title: 'Forschung & Daten', objective: 'Trends, Zahlen und vorsichtige Aussagen verstehen.', canDo: 'Daten verantwortungsvoll zusammenfassen.', grammarFocus: 'Hedging und vorsichtige Formulierungen' },
    { title: 'Strategie im Beruf', objective: 'Ziele, Abwägungen und Prioritäten diskutieren.', canDo: 'eine professionelle Empfehlung schreiben.', grammarFocus: 'Konditionalsätze und Gegensatz' },
    { title: 'Auswirkung von Technologie', objective: 'Nutzen, Risiken und Ethik bewerten.', canDo: 'differenziert über Technologie argumentieren.', grammarFocus: 'Nominalisierung' },
    { title: 'Öffentliche Politik', objective: 'formelle Sprache in Politik und Verwaltung verstehen.', canDo: 'ein öffentliches Thema ausgewogen erklären.', grammarFocus: 'Passiv und formeller Stil' },
    { title: 'Kultur & Identität', objective: 'Identität, Werte und Zugehörigkeit analysieren.', canDo: 'Perspektiven differenziert vergleichen.', grammarFocus: 'Konzessivsätze' },
    { title: 'Business Cases', objective: 'Markt-, Kunden- und Entscheidungssprache verstehen.', canDo: 'einen Business Case zusammenfassen.', grammarFocus: 'Ursache-Wirkung-Ketten' },
    { title: 'Wissenschaft Vermitteln', objective: 'Belege erklären, ohne zu stark zu vereinfachen.', canDo: 'wissenschaftliche Ergebnisse verständlich kommunizieren.', grammarFocus: 'Relativ- und Partizipialkonstruktionen' },
    { title: 'Debatte & Gegenargumente', objective: 'Gegenargumente und Erwiderungen erkennen.', canDo: 'auf gegensätzliche Positionen reagieren.', grammarFocus: 'obwohl, dennoch und trotz' },
    { title: 'Längeres Hören', objective: 'Satzenden in längerer Sprache erkennen.', canDo: 'Notizen aus einem dichten Abschnitt machen.', grammarFocus: 'Diskursmarker' },
    { title: 'Formelles Schreiben', objective: 'geordnete und präzise Absätze schreiben.', canDo: 'einen starken akademischen oder beruflichen Absatz bauen.', grammarFocus: 'Themensatz und Kohäsion' },
    { title: 'B2 Wiederholung', objective: 'Belege, Ausgewogenheit, Präzision und Flüssigkeit verbinden.', canDo: 'anspruchsvolle Studien- und Berufsthemen bewältigen.', grammarFocus: 'fortgeschrittene Absatzkontrolle' },
  ],
  C1: [
    { title: 'Nuancierte Argumente', objective: 'subtile Aussagen und Implikationen verfolgen.', canDo: 'Nuancen erklären, ohne Klarheit zu verlieren.', grammarFocus: 'komplexe Unterordnung' },
    { title: 'Register & Ton', objective: 'formellen, neutralen und persuasiven Stil unterscheiden.', canDo: 'den Ton an Zielgruppe und Situation anpassen.', grammarFocus: 'Registerwechsel' },
    { title: 'Kritisches Lesen', objective: 'Annahmen und Belege bewerten.', canDo: 'einen Text fair kritisieren.', grammarFocus: 'Haltungsmarker' },
    { title: 'Professionelle Briefings', objective: 'dichte Updates schnell verarbeiten.', canDo: 'Managementinformationen zusammenfassen.', grammarFocus: 'komprimierte Nominalgruppen' },
    { title: 'Abstrakte Konzepte', objective: 'abstrakten Wortschatz präzise verwenden.', canDo: 'komplexe Begriffe definieren und anwenden.', grammarFocus: 'Definitionsstrukturen' },
    { title: 'Verhandlungssprache', objective: 'Zugeständnisse und Bedingungen verstehen.', canDo: 'taktvoll verhandeln.', grammarFocus: 'diplomatische Formulierungen' },
    { title: 'Akademische Synthese', objective: 'mehrere Sichtweisen verbinden.', canDo: 'Quellen in einem Absatz synthetisieren.', grammarFocus: 'Synthesesprache' },
    { title: 'Risiko & Unsicherheit', objective: 'Wahrscheinlichkeit und Begrenzung ausdrücken.', canDo: 'Risiko verantwortungsvoll diskutieren.', grammarFocus: 'Modalität und Einschränkung' },
    { title: 'Rhetorische Mittel', objective: 'Betonung und Überzeugung erkennen.', canDo: 'rhetorische Wirkung erklären.', grammarFocus: 'Emphasestrukturen' },
    { title: 'Schnelle Sprache', objective: 'reduzierte Formen und dichte Phrasen erfassen.', canDo: 'schneller Expertensprache folgen.', grammarFocus: 'Ellipse und Referenz' },
    { title: 'Präzises Redigieren', objective: 'Klarheit, Fluss und Knappheit verbessern.', canDo: 'einen Absatz auf C1-Niveau überarbeiten.', grammarFocus: 'Kohäsion und Knappheit' },
    { title: 'C1 Wiederholung', objective: 'Nuance, Tempo, Register und Präzision verbinden.', canDo: 'sicher in fortgeschrittenen Situationen handeln.', grammarFocus: 'kontrollierte sprachliche Differenzierung' },
  ],
  C2: [
    { title: 'Nahezu Muttersprachlicher Fluss', objective: 'Rhythmus, Implikation und Betonung kontrollieren.', canDo: 'natürliche anspruchsvolle Formulierungen produzieren.', grammarFocus: 'Informationsstruktur' },
    { title: 'Subtext & Implikation', objective: 'erkennen, was angedeutet, aber nicht gesagt wird.', canDo: 'Subtext präzise erklären.', grammarFocus: 'pragmatische Bedeutung' },
    { title: 'Redaktioneller Stil', objective: 'Stimme, Haltung und Eleganz analysieren.', canDo: 'mit redaktioneller Kontrolle umformulieren.', grammarFocus: 'Stil und Kadenz' },
    { title: 'Fachdiskurs', objective: 'fachspezifische Präzision bewältigen.', canDo: 'Expertentexte zusammenfassen.', grammarFocus: 'technische Nominalgruppen' },
    { title: 'Ironie & Mehrdeutigkeit', objective: 'vielschichtige Bedeutung erkennen.', canDo: 'Ironie erklären, ohne sie zu verflachen.', grammarFocus: 'kontrastive Rahmung' },
    { title: 'Juristische Präzision', objective: 'Pflichten, Ausnahmen und Reichweite erkennen.', canDo: 'formelle Einschränkungen interpretieren.', grammarFocus: 'Gültigkeit und Qualifikation' },
    { title: 'Literarische Textur', objective: 'Bildsprache, Rhythmus und Stimme verfolgen.', canDo: 'literarische Wirkung präzise besprechen.', grammarFocus: 'figurative Sprache' },
    { title: 'Schnelle Synthese', objective: 'dichte Informationen schnell verbinden.', canDo: 'unter Zeitdruck knapp synthetisieren.', grammarFocus: 'Verdichtung' },
    { title: 'Persuasive Meisterschaft', objective: 'Argument, Ton und Publikum kontrollieren.', canDo: 'überzeugende Expertentexte schreiben.', grammarFocus: 'rhetorische Architektur' },
    { title: 'Akzent & Variation', objective: 'Aussprache- und Gebrauchsvariation bewältigen.', canDo: 'vielfältige anspruchsvolle Sprache verstehen.', grammarFocus: 'Variationsbewusstsein' },
    { title: 'Finales Genauigkeitslabor', objective: 'kleine Fehler in Schreibung, Ordnung und Stil entfernen.', canDo: 'nahezu muttersprachliche Genauigkeit erreichen.', grammarFocus: 'Mikro-Editing' },
    { title: 'C2 Wiederholung', objective: 'Meisterschaft, Nuance, Tempo und Stil verbinden.', canDo: 'auf nahezu muttersprachlichem Niveau agieren.', grammarFocus: 'vollständige Sprachkontrolle' },
  ],
};

const GERMAN_LESSON_PASSAGES: Record<CefrLevel, string[]> = {
  A1: [
    'Hallo, ich heiße Sara. Ich komme aus Berlin und wohne jetzt in Köln. Am Morgen trinke ich Wasser und schreibe drei neue Wörter in mein Heft.',
    'Heute ist Montag. Der Kurs beginnt um neun Uhr. Um zehn Uhr machen wir eine kurze Pause und wiederholen die Zahlen von eins bis zwanzig.',
    'Meine Familie ist klein. Mein Bruder ist freundlich, meine Mutter arbeitet viel, und mein Vater kocht gern. Am Abend essen wir zusammen.',
    'Ich stehe um sieben Uhr auf. Danach wasche ich mich, frühstücke und gehe zur Schule. Jeden Tag lerne ich ein neues Wort.',
    'Im Café bestelle ich Tee und ein Brot. Ich sage bitte und danke. Die Verkäuferin spricht langsam, und ich verstehe den Preis.',
    'Die Apotheke ist neben dem Bahnhof. Der Supermarkt ist links, und die Schule ist rechts. Ich frage höflich nach dem Weg.',
    'Mein Zimmer ist hell. Auf dem Tisch liegt ein Buch. Neben dem Bett steht eine Lampe, und im Schrank sind meine Jacken.',
    'Ich kaufe einen blauen Stift. Der Stift kostet zwei Euro. Die Tasche ist zu groß, aber das Heft ist genau richtig.',
    'Heute ist es kalt und windig. Im Winter trage ich eine Jacke. Im Sommer ist es warm, und ich gehe gern in den Park.',
    'Ich brauche eine Fahrkarte nach Bonn. Der Zug fährt um acht Uhr ab. Am Gleis frage ich: Wann kommt der nächste Zug?',
    'Mir geht es nicht gut. Ich habe Kopfschmerzen und brauche einen Termin beim Arzt. Die Praxis ist heute bis fünf Uhr offen.',
    'Ich stelle mich vor, frage nach dem Weg und kaufe eine Fahrkarte. Danach schreibe ich fünf Sätze über meinen Tag.',
  ],
  A2: [
    'Am Wochenende habe ich meine Freundin besucht. Wir haben zusammen gekocht, Musik gehört und später einen kurzen Spaziergang gemacht.',
    'Morgen möchte ich ins Kino gehen. Ich lade dich ein, weil der Film früh beginnt. Wir können uns um sechs Uhr vor dem Eingang treffen.',
    'Am Bahnhof war mein Zug verspätet. Deshalb habe ich eine Mitarbeiterin gefragt und eine neue Verbindung gesucht.',
    'Ich studiere vormittags Deutsch und arbeite nachmittags im Büro. Meistens schreibe ich E-Mails und bereite kurze Termine vor.',
    'Zuerst öffne ich die App, dann gebe ich mein Passwort ein. Danach lade ich das Dokument hoch und sende eine kurze Nachricht.',
    'Ich brauche einen Termin beim Bürgerbüro. Könnten Sie mir bitte sagen, welche Unterlagen ich mitbringen muss?',
    'Diese Wohnung ist heller, aber die andere ist günstiger. Ich wähle die kleinere Wohnung, weil sie näher an meiner Arbeit liegt.',
    'Zuerst hat es geregnet, dann kam die Sonne heraus. Nach dem Kurs sind wir in ein Café gegangen und haben über den Tag gesprochen.',
    'Du solltest früher losgehen, wenn der Bus oft voll ist. In der Bibliothek musst du leise sprechen und dein Handy ausschalten.',
    'Ich finde den neuen Kurs gut, weil die Lehrerin klar spricht. Außerdem üben wir viel und bekommen schnelle Rückmeldung.',
    'Sehr geehrte Frau Weber, vielen Dank für Ihre Nachricht. Ich komme gern zum Termin und bringe die Unterlagen mit.',
    'Ich erzähle von gestern, plane ein Treffen, gebe eine Meinung und schreibe eine kurze höfliche Antwort.',
  ],
  B1: [
    'Letztes Jahr bin ich in eine neue Stadt gezogen. Am Anfang war vieles ungewohnt, aber durch den Sprachkurs habe ich schnell Kontakte gefunden.',
    'In unserem Haus gibt es zu wenig Platz für Fahrräder. Eine einfache Lösung wäre ein überdachter Bereich im Hof.',
    'Im Team müssen wir die Aufgaben klar verteilen. Ich übernehme die Präsentation, während meine Kollegin die Zahlen vorbereitet.',
    'Ich lerne besser, wenn ich kleine Ziele setze. Nach jeder Übung notiere ich Fehler und wiederhole die schwierigen Sätze laut.',
    'In meinem Stadtteil wünschen sich viele Menschen mehr sichere Wege. Besonders Kinder und ältere Personen brauchen bessere Übergänge.',
    'Der Artikel berichtet über steigende Mietpreise. Wichtig ist nicht nur der Preis, sondern auch die Frage, wer in der Stadt wohnen kann.',
    'Gesunde Routinen entstehen langsam. Wer regelmäßig schläft, sich bewegt und bewusst isst, hat im Alltag oft mehr Energie.',
    'Auf Reisen lernt man andere Gewohnheiten kennen. Manche Unterschiede sind klein, andere verändern den Blick auf den eigenen Alltag.',
    'Vor einer größeren Ausgabe vergleiche ich Preise und Nutzen. So vermeide ich spontane Käufe und plane mein Budget realistischer.',
    'Viele kleine Entscheidungen helfen der Umwelt. Man kann weniger Verpackung nutzen, öfter reparieren und kurze Wege zu Fuß gehen.',
    'In meiner Präsentation erkläre ich zuerst das Problem, dann zwei Beispiele und am Ende meinen Vorschlag.',
    'Ich erzähle eine Erfahrung, begründe eine Meinung, gebe einen Rat und fasse die wichtigsten Punkte klar zusammen.',
  ],
  B2: [
    'Eine überzeugende These braucht mehr als eine persönliche Meinung. Sie sollte mit Beispielen, Belegen und einer klaren Struktur gestützt werden.',
    'Statistiken zeigen Trends, aber sie erklären nicht automatisch die Ursachen. Deshalb müssen Daten vorsichtig interpretiert werden.',
    'Eine gute Strategie berücksichtigt Ziele, Kosten und mögliche Risiken. Erst danach kann ein Team eine tragfähige Empfehlung formulieren.',
    'Digitale Werkzeuge erleichtern den Alltag, werfen aber neue Fragen zum Datenschutz und zur Verantwortung auf.',
    'Öffentliche Entscheidungen wirken oft auf verschiedene Gruppen unterschiedlich. Eine faire Analyse nennt Vorteile, Nachteile und Grenzen.',
    'Identität entsteht aus Sprache, Erfahrung und Zugehörigkeit. Wer Perspektiven vergleicht, sollte Pauschalurteile vermeiden.',
    'Ein Business Case ist überzeugend, wenn er Kundennutzen, Marktbedingungen und finanzielle Folgen nachvollziehbar verbindet.',
    'Wissenschaftliche Ergebnisse müssen präzise und verständlich erklärt werden. Zu starke Vereinfachung kann die Aussage verfälschen.',
    'In einer Debatte reicht Widerspruch allein nicht aus. Ein starkes Gegenargument erkennt die andere Position an und zeigt dann ihre Schwäche.',
    'Bei längerem Zuhören helfen Notizen zu Schlüsselwörtern, Signalwörtern und Satzenden, damit die Argumentation nachvollziehbar bleibt.',
    'Ein formeller Absatz beginnt mit einem klaren Themensatz. Danach folgen Belege, Erläuterung und ein präziser Schluss.',
    'Ich verbinde These, Beleg, Gegenposition und Schlussfolgerung zu einem ausgewogenen Text auf gehobenem Niveau.',
  ],
  C1: [
    'Nuancierte Argumente verlangen genaue Unterscheidungen. Ein Text kann zustimmen, einschränken und zugleich eine kritische Distanz bewahren.',
    'Register entscheidet darüber, wie eine Aussage wirkt. Dieselbe Information kann sachlich, diplomatisch oder deutlich warnend formuliert werden.',
    'Kritisches Lesen bedeutet nicht, einen Text abzulehnen. Es bedeutet, Annahmen, Belege und Schlussfolgerungen systematisch zu prüfen.',
    'Ein professionelles Briefing verdichtet komplexe Informationen, ohne zentrale Risiken oder Zuständigkeiten unsichtbar zu machen.',
    'Abstrakte Begriffe werden erst verständlich, wenn sie definiert, eingegrenzt und in einem konkreten Zusammenhang angewendet werden.',
    'In Verhandlungen sind Zugeständnisse oft wirksamer, wenn sie an Bedingungen geknüpft und sprachlich respektvoll formuliert werden.',
    'Eine akademische Synthese reiht Quellen nicht nur aneinander. Sie zeigt Beziehungen, Spannungen und gemeinsame Linien zwischen Positionen.',
    'Wer über Risiko spricht, muss Wahrscheinlichkeit, Auswirkung und Unsicherheit trennen. Sonst entsteht eine scheinbare Genauigkeit.',
    'Rhetorische Mittel lenken Aufmerksamkeit. Wiederholung, Kontrast und Zuspitzung können ein Argument verstärken oder verzerren.',
    'Schnelle Expertensprache enthält oft Auslassungen und Verweise. Entscheidend ist, Bezugspunkte und logische Übergänge zu erkennen.',
    'Präzises Redigieren entfernt nicht nur Fehler. Es schärft Beziehungen zwischen Sätzen, reduziert Überflüssiges und stärkt den roten Faden.',
    'Ich formuliere differenziert, reagiere flexibel auf Register und überarbeite komplexe Aussagen mit kontrollierter Präzision.',
  ],
  C2: [
    'Nahezu muttersprachlicher Sprachfluss zeigt sich in Rhythmus, Schwerpunktsetzung und der Fähigkeit, implizite Bedeutungen mitzusteuern.',
    'Subtext entsteht dort, wo eine Aussage mehr andeutet, als sie offen benennt. Gute Analyse trennt Ton, Kontext und Absicht.',
    'Redaktioneller Stil verlangt Entscheidungen über Tempo, Eleganz und Leserführung. Jedes Wort trägt zur Haltung des Textes bei.',
    'Fachdiskurs verbindet terminologische Genauigkeit mit Verständlichkeit. Wer vereinfacht, darf die fachliche Reichweite nicht verfälschen.',
    'Ironie lebt von Distanz zwischen Gesagtem und Gemeintem. Wird diese Distanz falsch gelesen, kippt die Interpretation des ganzen Textes.',
    'Juristische und formelle Texte hängen an kleinen sprachlichen Markierungen. Ausnahmen, Bedingungen und Geltungsbereiche entscheiden über Bedeutung.',
    'Literarische Textur entsteht aus Bildsprache, Klang, Perspektive und Rhythmus. Eine präzise Deutung respektiert diese Mehrschichtigkeit.',
    'Schnelle Synthese unter Druck verlangt Auswahl. Nicht jede Information ist gleich wichtig; entscheidend ist die tragende Beziehung.',
    'Persuasive Meisterschaft verbindet Logik, Ton und Timing. Ein starker Text überzeugt, ohne seine Komplexität zu verstecken.',
    'Sprachvariation umfasst Akzent, Register und regionale Gewohnheiten. Fortgeschrittenes Verstehen erkennt Variation, ohne sie als Fehler zu behandeln.',
    'Im finalen Genauigkeitslabor zählen kleinste Nuancen: Satzrhythmus, Wortwahl, Bezug, Zeichensetzung und stilistische Stimmigkeit.',
    'Ich bewege mich sicher zwischen Stilen, erkenne Subtext und formuliere komplexe Bedeutungen präzise, elegant und situationsgerecht.',
  ],
};

function getSkillTitle(level: CefrLevel, skill: PracticeSkill, language: LearningLanguage = 'English') {
  if (language === 'German') {
    const germanTitles: Record<PracticeSkill, Record<CefrLevel, string>> = {
      Dictation: {
        A1: 'Kernwörter',
        A2: 'Alltagssätze',
        B1: 'Klarer Absatz',
        B2: 'Akademischer Absatz',
        C1: 'Komplexes Argument',
        C2: 'Natürlicher Rhythmus',
      },
      Reading: {
        A1: 'Lesen & Zuordnen',
        A2: 'Lesen & Bemerken',
        B1: 'Hauptidee',
        B2: 'Wortschatzfokus',
        C1: 'Argumentkarte',
        C2: 'Stilanalyse',
      },
      Listening: {
        A1: 'Klangcheck',
        A2: 'Phrasenhören',
        B1: 'Satzfluss',
        B2: 'Lange Endungen',
        C1: 'Schnelle Details',
        C2: 'Subtile Bedeutung',
      },
      Writing: {
        A1: 'Abschreiben & Bauen',
        A2: 'Kurz Umformen',
        B1: 'Text Rekonstruieren',
        B2: 'Strukturiert Umformen',
        C1: 'Präzise Umformung',
        C2: 'Stiltransfer',
      },
    };

    return germanTitles[skill][level];
  }

  const titles: Record<PracticeSkill, Record<CefrLevel, string>> = {
    Dictation: {
      A1: 'Core Words',
      A2: 'Daily Sentences',
      B1: 'Clear Paragraph',
      B2: 'Academic Paragraph',
      C1: 'Complex Argument',
      C2: 'Native Rhythm',
    },
    Reading: {
      A1: 'Read & Match',
      A2: 'Read & Notice',
      B1: 'Main Idea',
      B2: 'Vocabulary Focus',
      C1: 'Argument Map',
      C2: 'Style Reading',
    },
    Listening: {
      A1: 'Sound Check',
      A2: 'Phrase Listening',
      B1: 'Sentence Flow',
      B2: 'Long Endings',
      C1: 'Fast Details',
      C2: 'Subtle Meaning',
    },
    Writing: {
      A1: 'Copy & Build',
      A2: 'Short Rewrite',
      B1: 'Rebuild Text',
      B2: 'Structured Rewrite',
      C1: 'Precise Rewrite',
      C2: 'Style Transfer',
    },
  };

  return titles[skill][level];
}

function getSkillFocus(level: CefrLevel, skill: PracticeSkill, language: LearningLanguage = 'English') {
  if (language === 'German') {
    return getLocalizedSkillFocus(language, level, skill);
  }

  const levelFocus: Record<CefrLevel, string> = {
    A1: 'basics',
    A2: 'daily use',
    B1: 'independence',
    B2: 'academic/work',
    C1: 'precision',
    C2: 'mastery',
  };

  return `${levelFocus[level]} ${skill.toLowerCase()}`;
}

function getSkillDescription(skill: PracticeSkill, language: LearningLanguage) {
  if (language === 'German') {
    const descriptions: Record<PracticeSkill, string> = {
      Dictation: 'Höre, schreibe, vergleiche und wiederhole den schwierigsten Satz.',
      Reading: 'Lies den Text, markiere nützliche Wörter und übe den Schlüsselsatz.',
      Listening: 'Höre Satzgruppen erneut und achte auf Endungen, Konnektoren und Rhythmus.',
      Writing: 'Baue die Idee aus dem Gedächtnis neu auf und vergleiche sie mit dem Original.',
    };

    return descriptions[skill];
  }

  const descriptions: Record<PracticeSkill, string> = {
    Dictation: 'Listen, type, compare, then repeat the hardest sentence.',
    Reading: 'Read the text, mark useful words, then practise the key sentence.',
    Listening: 'Replay phrase groups and focus on endings, connectors, and rhythm.',
    Writing: 'Rebuild the idea from memory, then compare with the original.',
  };

  return descriptions[skill];
}

function getLessonVocabulary(language: LearningLanguage, level: CefrLevel, lessonIndex: number) {
  const levelWords = VOCABULARY_BANK[language]?.[level] ?? VOCABULARY_BANK.English[level];
  const start = (lessonIndex * 5) % levelWords.length;
  const rotated = [...levelWords.slice(start), ...levelWords.slice(0, start)];
  return rotated.slice(0, 8);
}

const VOCABULARY_BANK: Record<LearningLanguage, Record<CefrLevel, string[]>> = {
  English: {
    A1: ['hello', 'name', 'from', 'today', 'morning', 'family', 'friend', 'home', 'school', 'food', 'water', 'street', 'shop', 'weather', 'ticket', 'doctor'],
    A2: ['yesterday', 'tomorrow', 'invite', 'because', 'problem', 'station', 'appointment', 'compare', 'cheaper', 'message', 'advice', 'opinion', 'reply', 'plan', 'travel', 'online'],
    B1: ['experience', 'solution', 'priority', 'strategy', 'community', 'summary', 'habit', 'culture', 'budget', 'environment', 'presentation', 'evidence', 'improve', 'explain', 'compare', 'suggest'],
    B2: ['claim', 'evidence', 'trend', 'strategy', 'tradeoff', 'impact', 'policy', 'identity', 'market', 'research', 'counterargument', 'cohesion', 'precise', 'evaluate', 'significant', 'outcome'],
    C1: ['nuance', 'implication', 'register', 'assumption', 'briefing', 'abstract', 'concession', 'synthesis', 'uncertainty', 'rhetoric', 'ellipsis', 'concision', 'stance', 'constraint', 'probability', 'perspective'],
    C2: ['cadence', 'subtext', 'editorial', 'specialist', 'irony', 'obligation', 'imagery', 'compression', 'persuasion', 'variation', 'micro-editing', 'mastery', 'scope', 'qualification', 'texture', 'inference'],
  },
  German: {
    A1: ['hallo', 'Name', 'heute', 'Morgen', 'Familie', 'Freund', 'Haus', 'Schule', 'Essen', 'Wasser', 'Straße', 'Laden', 'Wetter', 'Fahrkarte', 'Arzt', 'bitte', 'rechts', 'links', 'Zimmer', 'Termin'],
    A2: ['gestern', 'morgen', 'Einladung', 'weil', 'Problem', 'Bahnhof', 'Termin', 'vergleichen', 'günstiger', 'Nachricht', 'Rat', 'Meinung', 'Antwort', 'Plan', 'Reise', 'online', 'Unterlagen', 'Verspätung', 'höflich', 'Vorschlag'],
    B1: ['Erfahrung', 'Lösung', 'Priorität', 'Strategie', 'Gemeinschaft', 'Zusammenfassung', 'Gewohnheit', 'Kultur', 'Budget', 'Umwelt', 'Präsentation', 'Beleg', 'verbessern', 'erklären', 'vergleichen', 'vorschlagen', 'Übergang', 'Rückmeldung', 'Alltag', 'Standpunkt'],
    B2: ['These', 'Beleg', 'Trend', 'Strategie', 'Abwägung', 'Auswirkung', 'Politik', 'Identität', 'Markt', 'Forschung', 'Gegenargument', 'Kohäsion', 'präzise', 'bewerten', 'bedeutend', 'Ergebnis', 'Datenschutz', 'Verantwortung', 'Signalwort', 'Schlussfolgerung'],
    C1: ['Nuance', 'Implikation', 'Register', 'Annahme', 'Briefing', 'abstrakt', 'Zugeständnis', 'Synthese', 'Unsicherheit', 'Rhetorik', 'Ellipse', 'Knappheit', 'Haltung', 'Einschränkung', 'Wahrscheinlichkeit', 'Perspektive', 'Redigieren', 'Stimmigkeit', 'Bezugspunkt', 'Differenzierung'],
    C2: ['Rhythmus', 'Subtext', 'redaktionell', 'Fachdiskurs', 'Ironie', 'Verpflichtung', 'Bildsprache', 'Verdichtung', 'Überzeugung', 'Variation', 'Feinschliff', 'Meisterschaft', 'Gültigkeit', 'Einschränkung', 'Textur', 'Schlussfolgerung', 'Mehrdeutigkeit', 'Reichweite', 'Kadenz', 'Sprachgefühl'],
  },
  Spanish: {
    A1: ['hola', 'nombre', 'hoy', 'manana', 'familia', 'amigo', 'casa', 'escuela', 'comida', 'agua', 'calle', 'tienda', 'tiempo', 'boleto', 'medico', 'gracias'],
    A2: ['ayer', 'manana', 'invitacion', 'porque', 'problema', 'estacion', 'cita', 'comparar', 'barato', 'mensaje', 'consejo', 'opinion', 'respuesta', 'plan', 'viaje', 'internet'],
    B1: ['experiencia', 'solucion', 'prioridad', 'estrategia', 'comunidad', 'resumen', 'habito', 'cultura', 'presupuesto', 'ambiente', 'presentacion', 'evidencia', 'mejorar', 'explicar', 'comparar', 'sugerir'],
    B2: ['tesis', 'evidencia', 'tendencia', 'estrategia', 'compromiso', 'impacto', 'politica', 'identidad', 'mercado', 'investigacion', 'contraargumento', 'cohesion', 'preciso', 'evaluar', 'significativo', 'resultado'],
    C1: ['matiz', 'implicacion', 'registro', 'suposicion', 'informe', 'abstracto', 'concesion', 'sintesis', 'incertidumbre', 'retorica', 'elipsis', 'conciso', 'postura', 'restriccion', 'probabilidad', 'perspectiva'],
    C2: ['cadencia', 'subtexto', 'editorial', 'especializado', 'ironia', 'obligacion', 'imagen', 'compresion', 'persuasion', 'variacion', 'microedicion', 'maestria', 'alcance', 'matizacion', 'textura', 'inferencia'],
  },
  Italian: {
    A1: ['ciao', 'nome', 'oggi', 'mattina', 'famiglia', 'amico', 'casa', 'scuola', 'cibo', 'acqua', 'strada', 'negozio', 'tempo', 'biglietto', 'medico', 'grazie'],
    A2: ['ieri', 'domani', 'invito', 'perche', 'problema', 'stazione', 'appuntamento', 'confrontare', 'economico', 'messaggio', 'consiglio', 'opinione', 'risposta', 'piano', 'viaggio', 'online'],
    B1: ['esperienza', 'soluzione', 'priorita', 'strategia', 'comunita', 'riassunto', 'abitudine', 'cultura', 'budget', 'ambiente', 'presentazione', 'prova', 'migliorare', 'spiegare', 'confrontare', 'suggerire'],
    B2: ['tesi', 'prova', 'tendenza', 'strategia', 'compromesso', 'impatto', 'politica', 'identita', 'mercato', 'ricerca', 'controargomento', 'coesione', 'preciso', 'valutare', 'significativo', 'risultato'],
    C1: ['sfumatura', 'implicazione', 'registro', 'assunzione', 'briefing', 'astratto', 'concessione', 'sintesi', 'incertezza', 'retorica', 'ellissi', 'concisione', 'posizione', 'vincolo', 'probabilita', 'prospettiva'],
    C2: ['cadenza', 'sottotesto', 'editoriale', 'specialistico', 'ironia', 'obbligo', 'immagine', 'compressione', 'persuasione', 'variazione', 'microrevisione', 'maestria', 'ambito', 'qualifica', 'texture', 'inferenza'],
  },
  French: {
    A1: ['bonjour', 'nom', 'aujourd hui', 'matin', 'famille', 'ami', 'maison', 'ecole', 'nourriture', 'eau', 'rue', 'magasin', 'meteo', 'billet', 'medecin', 'merci'],
    A2: ['hier', 'demain', 'invitation', 'parce que', 'probleme', 'gare', 'rendez vous', 'comparer', 'moins cher', 'message', 'conseil', 'opinion', 'reponse', 'plan', 'voyage', 'internet'],
    B1: ['experience', 'solution', 'priorite', 'strategie', 'communaute', 'resume', 'habitude', 'culture', 'budget', 'environnement', 'presentation', 'preuve', 'ameliorer', 'expliquer', 'comparer', 'suggerer'],
    B2: ['these', 'preuve', 'tendance', 'strategie', 'compromis', 'impact', 'politique', 'identite', 'marche', 'recherche', 'contre argument', 'cohesion', 'precis', 'evaluer', 'significatif', 'resultat'],
    C1: ['nuance', 'implication', 'registre', 'hypothese', 'briefing', 'abstrait', 'concession', 'synthese', 'incertitude', 'rhetorique', 'ellipse', 'concision', 'position', 'contrainte', 'probabilite', 'perspective'],
    C2: ['cadence', 'sous texte', 'editorial', 'specialise', 'ironie', 'obligation', 'image', 'compression', 'persuasion', 'variation', 'microedition', 'maitrise', 'portee', 'qualification', 'texture', 'inference'],
  },
};

function getPracticeSource(level: CefrLevel, skill: PracticeSkill, language: LearningLanguage) {
  const localized = LOCALIZED_SOURCES[language]?.[level]?.[skill];
  if (localized) {
    return localized;
  }

  if (language !== 'English') {
    return getLanguageFallbackSource(language, level, skill);
  }

  if (level === 'A1') {
    return 'I study every morning. My teacher speaks slowly, and I write the new words in my notebook.';
  }

  if (level === 'A2') {
    return 'Tomorrow I will visit the city library because I need a quiet place to read and prepare my homework.';
  }

  if (level === 'B1') {
    return 'Many students improve faster when they practise a little every day and review their mistakes at the end of the week.';
  }

  if (level === 'B2') {
    return 'Academic progress depends on consistent practice, careful listening, and the ability to notice how sentence endings change meaning.';
  }

  if (level === 'C1') {
    return 'Advanced learners benefit from comparing subtle arguments, identifying implied meaning, and rebuilding complex sentences with precision.';
  }

  return 'Near-native mastery requires control of register, rhythm, implication, and concise reformulation under realistic time pressure.';
}

function getLanguageFallbackSource(language: LearningLanguage, level: CefrLevel, skill: PracticeSkill) {
  const focus = getLocalizedSkillFocus(language, level, skill);
  const sources: Record<Exclude<LearningLanguage, 'English'>, string> = {
    German: `Diese ${level}-Übung trainiert ${focus}. Höre genau zu, markiere schwierige Wörter und wiederhole den wichtigsten Satz.`,
    Spanish: `Este ejercicio ${level} entrena ${focus}. Escucha con atencion, marca las palabras dificiles y repite la frase principal.`,
    Italian: `Questo esercizio ${level} allena ${focus}. Ascolta con attenzione, segna le parole difficili e ripeti la frase principale.`,
    French: `Cet exercice ${level} travaille ${focus}. Ecoute attentivement, note les mots difficiles et repete la phrase principale.`,
  };

  return sources[language];
}

function getLocalizedSkillFocus(language: LearningLanguage, level: CefrLevel, skill: PracticeSkill) {
  if (language === 'English') {
    return getSkillFocus(level, skill);
  }

  const skillLabels: Record<Exclude<LearningLanguage, 'English'>, Record<PracticeSkill, string>> = {
    German: {
      Dictation: 'Diktat und genaue Rechtschreibung',
      Reading: 'Lesen und Verstehen',
      Listening: 'Hörverstehen und Satzrhythmus',
      Writing: 'Schreiben und klare Formulierung',
    },
    Spanish: {
      Dictation: 'dictado y ortografia precisa',
      Reading: 'lectura y comprension',
      Listening: 'escucha y ritmo de frases',
      Writing: 'escritura y formulacion clara',
    },
    Italian: {
      Dictation: 'dettato e ortografia precisa',
      Reading: 'lettura e comprensione',
      Listening: 'ascolto e ritmo della frase',
      Writing: 'scrittura e formulazione chiara',
    },
    French: {
      Dictation: 'dictee et orthographe precise',
      Reading: 'lecture et comprehension',
      Listening: 'ecoute et rythme des phrases',
      Writing: 'ecriture et formulation claire',
    },
  };

  return `${level} ${skillLabels[language][skill]}`;
}

const LOCALIZED_SOURCES: Partial<Record<LearningLanguage, Partial<Record<CefrLevel, Partial<Record<PracticeSkill, string>>>>>> = {
  English: {
    A1: {
      Dictation: 'I study every morning. I read one word, listen again, and write it slowly.',
      Reading: 'This is my notebook. I write new words and read them before class.',
      Listening: 'Listen to the short sentence. Pause after each word and repeat it once.',
      Writing: 'I can write a short sentence about my day.',
    },
    A2: {
      Dictation: 'Yesterday I missed the bus, so I walked to the station and bought a new ticket.',
      Reading: 'The message explains the time, place, and reason for the meeting in simple sentences.',
      Listening: 'Listen for the plan, the problem, and the polite request at the end of the message.',
      Writing: 'Write a short reply. Say thank you, explain your plan, and ask one clear question.',
    },
    B1: {
      Dictation: 'Many learners improve when they practise regularly, review mistakes, and explain their strategy in clear paragraphs.',
      Reading: 'The report describes a local problem, compares two solutions, and suggests a practical next step.',
      Listening: 'Follow the speaker as they tell a short experience, give an opinion, and summarize the result.',
      Writing: 'Rebuild the story with a beginning, a problem, a solution, and one personal opinion.',
    },
    B2: {
      Dictation: 'Academic progress depends on regular practice, focused listening, and careful review of sentence endings.',
      Reading: 'The paragraph explains how evidence, examples, and precise vocabulary make an argument stronger.',
      Listening: 'Long sentences are easier to understand when you hear connectors, pauses, and final words clearly.',
      Writing: 'Rebuild the paragraph with a clear topic sentence, one example, and a precise conclusion.',
    },
    C1: {
      Dictation: 'Advanced learners refine their accuracy by identifying nuance, questioning assumptions, and reformulating dense arguments precisely.',
      Reading: 'The briefing balances evidence, uncertainty, and stakeholder concerns without losing a clear professional tone.',
      Listening: 'Track the speaker\'s stance, concessions, and implied meaning while the argument moves quickly.',
      Writing: 'Rewrite the argument with a sharper register, controlled hedging, and concise transitions.',
    },
    C2: {
      Dictation: 'Near-native command requires sensitivity to subtext, cadence, register, and the smallest shifts in emphasis.',
      Reading: 'The editorial uses irony, compressed references, and stylistic contrast to guide the reader\'s interpretation.',
      Listening: 'Notice implication, rhythm, and variation while preserving the exact meaning of each phrase.',
      Writing: 'Transform the text into a polished version with editorial control, precision, and natural flow.',
    },
  },
  German: {
    A1: {
      Dictation: 'Ich lerne jeden Morgen. Ich höre ein Wort und schreibe es langsam.',
      Reading: 'Das ist mein Heft. Ich lese neue Wörter vor dem Kurs.',
      Listening: 'Höre den kurzen Satz. Mache nach jedem Wort eine Pause.',
      Writing: 'Ich schreibe einen kurzen Satz über meinen Tag.',
    },
    A2: {
      Dictation: 'Gestern habe ich den Bus verpasst, deshalb bin ich zum Bahnhof gelaufen.',
      Reading: 'Die Nachricht nennt die Zeit, den Ort und den Grund für das Treffen in einfachen Sätzen.',
      Listening: 'Höre auf den Plan, das Problem und die höfliche Bitte am Ende der Nachricht.',
      Writing: 'Schreibe eine kurze Antwort. Bedanke dich, erkläre deinen Plan und stelle eine klare Frage.',
    },
    B1: {
      Dictation: 'Viele Lernende machen Fortschritte, wenn sie regelmäßig üben und ihre Fehler am Ende der Woche prüfen.',
      Reading: 'Der Bericht beschreibt ein lokales Problem, vergleicht zwei Lösungen und schlägt einen praktischen Schritt vor.',
      Listening: 'Folge dem Sprecher, wenn er eine Erfahrung erzählt, eine Meinung gibt und das Ergebnis zusammenfasst.',
      Writing: 'Baue die Geschichte mit Anfang, Problem, Lösung und einer persönlichen Meinung neu auf.',
    },
    B2: {
      Dictation: 'Akademischer Fortschritt entsteht durch regelmäßige Übung, genaues Zuhören und bewusste Arbeit an Satzenden.',
      Reading: 'Der Abschnitt zeigt, wie Beispiele, Belege und präzise Wörter ein Argument stärker machen.',
      Listening: 'Lange Sätze werden klarer, wenn man Konnektoren, Pausen und Endungen bewusst hört.',
      Writing: 'Formuliere den Absatz mit einer klaren Hauptidee, einem Beispiel und einem präzisen Schluss neu.',
    },
    C1: {
      Dictation: 'Fortgeschrittene Lernende verbessern ihre Genauigkeit, indem sie Nuancen erkennen und dichte Argumente präzise umformulieren.',
      Reading: 'Das Briefing verbindet Belege, Unsicherheit und Interessen verschiedener Gruppen in einem professionellen Ton.',
      Listening: 'Achte auf Haltung, Zugeständnisse und implizite Bedeutung, während das Argument schnell voranschreitet.',
      Writing: 'Formuliere das Argument mit passendem Register, vorsichtiger Einschränkung und knappen Übergängen neu.',
    },
    C2: {
      Dictation: 'Nahezu muttersprachliche Sicherheit verlangt Gespür für Subtext, Rhythmus, Register und feinste Betonungsunterschiede.',
      Reading: 'Der Kommentar nutzt Ironie, verdichtete Bezüge und stilistische Kontraste, um die Deutung zu lenken.',
      Listening: 'Erkenne Implikation, Rhythmus und Variation, ohne die genaue Bedeutung der einzelnen Phrasen zu verlieren.',
      Writing: 'Verwandle den Text in eine geschliffene Fassung mit redaktioneller Kontrolle, Präzision und natürlichem Fluss.',
    },
  },
  Spanish: {
    A1: {
      Dictation: 'Estudio cada manana. Escucho una palabra y la escribo despacio.',
      Reading: 'Este es mi cuaderno. Leo palabras nuevas antes de la clase.',
      Listening: 'Escucha la frase corta. Haz una pausa despues de cada palabra.',
      Writing: 'Escribo una frase corta sobre mi dia.',
    },
    B2: {
      Dictation: 'El progreso academico depende de la practica constante, la escucha cuidadosa y la atencion a los finales de las frases.',
      Reading: 'El parrafo muestra como los ejemplos, la evidencia y el vocabulario preciso fortalecen un argumento.',
      Listening: 'Las frases largas son mas claras cuando escuchas conectores, pausas y palabras finales.',
      Writing: 'Reconstruye el parrafo con una idea principal, un ejemplo claro y una conclusion precisa.',
    },
  },
  Italian: {
    A1: {
      Dictation: 'Studio ogni mattina. Ascolto una parola e la scrivo lentamente.',
      Reading: 'Questo e il mio quaderno. Leggo parole nuove prima della lezione.',
      Listening: 'Ascolta la frase breve. Fai una pausa dopo ogni parola.',
      Writing: 'Scrivo una frase breve sulla mia giornata.',
    },
    B2: {
      Dictation: 'Il progresso accademico dipende dalla pratica costante, dall ascolto attento e dalla precisione nelle frasi lunghe.',
      Reading: 'Il paragrafo mostra come esempi, prove e vocaboli precisi rendono piu forte un argomento.',
      Listening: 'Le frasi lunghe diventano piu chiare quando ascolti connettori, pause e parole finali.',
      Writing: 'Ricostruisci il paragrafo con un idea principale, un esempio e una conclusione precisa.',
    },
  },
  French: {
    A1: {
      Dictation: 'J etudie chaque matin. J ecoute un mot et je l ecris lentement.',
      Reading: 'Voici mon cahier. Je lis les nouveaux mots avant le cours.',
      Listening: 'Ecoute la phrase courte. Fais une pause apres chaque mot.',
      Writing: 'J ecris une phrase courte sur ma journee.',
    },
    B2: {
      Dictation: 'Le progres academique depend d une pratique reguliere, d une ecoute attentive et de phrases plus precises.',
      Reading: 'Le paragraphe montre comment les exemples, les preuves et le vocabulaire precis renforcent une idee.',
      Listening: 'Les phrases longues deviennent plus claires quand tu entends les connecteurs, les pauses et les fins.',
      Writing: 'Reconstruis le paragraphe avec une idee principale, un exemple et une conclusion precise.',
    },
  },
};
