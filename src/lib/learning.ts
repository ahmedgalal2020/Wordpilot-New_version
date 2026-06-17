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
      title: getSkillTitle(level, 'Dictation'),
      skill: 'Dictation',
      focus: getSkillFocus(level, 'Dictation'),
      duration: '12 min',
      description: 'Listen, type, compare, then repeat the hardest sentence.',
      language,
    },
    Reading: {
      title: getSkillTitle(level, 'Reading'),
      skill: 'Reading',
      focus: getSkillFocus(level, 'Reading'),
      duration: '10 min',
      description: 'Read the text, mark useful words, then practise the key sentence.',
      language,
    },
    Listening: {
      title: getSkillTitle(level, 'Listening'),
      skill: 'Listening',
      focus: getSkillFocus(level, 'Listening'),
      duration: '15 min',
      description: 'Replay phrase groups and focus on endings, connectors, and rhythm.',
      language,
    },
    Writing: {
      title: getSkillTitle(level, 'Writing'),
      skill: 'Writing',
      focus: getSkillFocus(level, 'Writing'),
      duration: '18 min',
      description: 'Rebuild the idea from memory, then compare with the original.',
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

  if (report.currentWeek.sessionsCount === 0) {
    return `Start with ${fallbackLanguage} ${level} ${focus.dictation} to create your first weekly progress signal.`;
  }

  const topMistake = report.topMistakes[0];

  if (topMistake?.status === 'missing') {
    return `Focus on missing words in ${fallbackLanguage} ${level} listening exercises, especially sentence endings.`;
  }

  if (topMistake?.status === 'extra') {
    return `Try a slower ${fallbackLanguage} ${level} dictation and type only the words you clearly hear.`;
  }

  if (topMistake?.status === 'wrong') {
    return `Practice ${fallbackLanguage} ${level} vocabulary dictation with repeated words from your mistake list.`;
  }

  if (report.currentWeek.averageAccuracy !== null && report.currentWeek.averageAccuracy < 70) {
    const easierLevel = LEVEL_ORDER[Math.max(0, LEVEL_ORDER.indexOf(level) - 1)];
    return `Try an easier ${fallbackLanguage} ${easierLevel} dictation session before moving back to ${level}.`;
  }

  if (report.currentWeek.averageAccuracy !== null && report.currentWeek.averageAccuracy >= 88) {
    return `Practice ${fallbackLanguage} ${level} ${focus.nextStep}.`;
  }

  return `Continue with ${fallbackLanguage} ${level} ${focus.dictation}, then add one listening exercise this week.`;
}

function getRecommendationFocus(level: CefrLevel) {
  const focus: Record<CefrLevel, { dictation: string; nextStep: string }> = {
    A1: {
      dictation: 'beginner word and short sentence dictation',
      nextStep: 'short dictation with names, places, time, and everyday objects',
    },
    A2: {
      dictation: 'everyday sentence dictation',
      nextStep: 'daily-life dictation with plans, simple reasons, and clear sentence endings',
    },
    B1: {
      dictation: 'connected paragraph dictation',
      nextStep: 'paragraph dictation with stories, opinions, and practical explanations',
    },
    B2: {
      dictation: 'academic and work-topic dictation',
      nextStep: 'academic dictation with longer sentences and denser vocabulary',
    },
    C1: {
      dictation: 'advanced argument dictation',
      nextStep: 'advanced dictation with nuance, register, and precise reformulation',
    },
    C2: {
      dictation: 'near-native rhythm dictation',
      nextStep: 'near-native dictation with subtext, style, speed, and micro-accuracy',
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
  const templates: Record<PracticeSkill, { title: string; duration: string; description: string }> = {
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

  return PRACTICE_SKILLS.map((skill) => ({
    id: `${lesson.id}-${skill.toLowerCase()}`,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    title: templates[skill].title,
    skill,
    level: lesson.level,
    focus: `${lesson.theme.toLowerCase()} ${skill.toLowerCase()}`,
    duration: templates[skill].duration,
    difficulty: getDifficulty(lesson.level),
    status: 'not_started',
    description: templates[skill].description,
    sourceText: buildLessonSourceText(lesson, skill, vocabulary),
    language: lesson.language,
  }));
}

function buildLessonSourceText(lesson: Omit<PracticeLesson, 'exercises'>, skill: PracticeSkill, vocabulary: string[]) {
  const words = vocabulary.slice(0, 5).join(', ');
  const targetLine = getLanguageLessonLine(lesson, vocabulary);
  const shared = `${targetLine} Target words: ${words}.`;

  if (skill === 'Writing') {
    return `${shared} Writing task: produce a clear response that proves you can ${lesson.canDo.toLowerCase()} Use at least four target words and one sentence with ${lesson.grammarFocus.toLowerCase()}.`;
  }

  if (skill === 'Reading') {
    return `${shared} Read carefully, notice the grammar focus, then rebuild the meaning in your own words.`;
  }

  if (skill === 'Listening') {
    return `${shared} Listen for phrase groups, sentence endings, and the target words. Pause after each phrase, then write what you understood.`;
  }

  return `${shared} This dictation checks spelling, word order, and control of ${lesson.grammarFocus.toLowerCase()}. Listen once, type carefully, then repeat the hardest sentence.`;
}

function getLanguageLessonLine(lesson: Omit<PracticeLesson, 'exercises'>, vocabulary: string[]) {
  const [one, two, three, four] = vocabulary;
  const advanced = lesson.level === 'B2' || lesson.level === 'C1' || lesson.level === 'C2';

  const lines: Record<LearningLanguage, string> = {
    English: advanced
      ? `In this ${lesson.level} lesson about ${lesson.theme.toLowerCase()}, the learner studies ${one}, ${two}, and ${three} to build a precise argument with evidence and clear transitions.`
      : `In this ${lesson.level} lesson about ${lesson.theme.toLowerCase()}, I practise ${one}, ${two}, and ${three}. I use short clear sentences and check every word.`,
    German: advanced
      ? `In dieser ${lesson.level} Lektion zum Thema ${lesson.theme} analysiert der Lerner ${one}, ${two} und ${three}, damit ein praeziser Text mit Belegen und klaren Uebergaengen entsteht.`
      : `In dieser ${lesson.level} Lektion zum Thema ${lesson.theme} uebe ich ${one}, ${two} und ${three}. Ich schreibe kurze Saetze und pruefe jedes Wort.`,
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

  const labels: Record<Exclude<LearningLanguage, 'English'>, { title: string; objective: string; canDo: string; grammarFocus: string }> = {
    German: {
      title: `${level} Training ${lessonNumber}`,
      objective: 'zentrale Woerter, Satzbau und Hoerverstehen sicher trainieren.',
      canDo: 'den Text verstehen, nachsprechen und korrekt wiedergeben.',
      grammarFocus: 'Wortstellung, Artikel und klare Satzenden',
    },
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

function getSkillTitle(level: CefrLevel, skill: PracticeSkill) {
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

function getSkillFocus(level: CefrLevel, skill: PracticeSkill) {
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
    A1: ['hallo', 'Name', 'heute', 'Morgen', 'Familie', 'Freund', 'Haus', 'Schule', 'Essen', 'Wasser', 'Strasse', 'Laden', 'Wetter', 'Fahrkarte', 'Arzt', 'bitte'],
    A2: ['gestern', 'morgen', 'Einladung', 'weil', 'Problem', 'Bahnhof', 'Termin', 'vergleichen', 'guenstiger', 'Nachricht', 'Rat', 'Meinung', 'Antwort', 'Plan', 'Reise', 'online'],
    B1: ['Erfahrung', 'Loesung', 'Prioritaet', 'Strategie', 'Gemeinschaft', 'Zusammenfassung', 'Gewohnheit', 'Kultur', 'Budget', 'Umwelt', 'Praesentation', 'Beleg', 'verbessern', 'erklaeren', 'vergleichen', 'vorschlagen'],
    B2: ['These', 'Beleg', 'Trend', 'Strategie', 'Abwaegung', 'Auswirkung', 'Politik', 'Identitaet', 'Markt', 'Forschung', 'Gegenargument', 'Kohesion', 'praezise', 'bewerten', 'bedeutend', 'Ergebnis'],
    C1: ['Nuance', 'Andeutung', 'Register', 'Annahme', 'Briefing', 'abstrakt', 'Zugestaendnis', 'Synthese', 'Unsicherheit', 'Rhetorik', 'Ellipse', 'Knappheit', 'Haltung', 'Einschraenkung', 'Wahrscheinlichkeit', 'Perspektive'],
    C2: ['Rhythmus', 'Subtext', 'redaktionell', 'Fachdiskurs', 'Ironie', 'Verpflichtung', 'Bildsprache', 'Verdichtung', 'Ueberzeugung', 'Variation', 'Feinschliff', 'Meisterschaft', 'Gueltigkeit', 'Einschraenkung', 'Textur', 'Schlussfolgerung'],
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
    German: `Diese ${level} Uebung trainiert ${focus}. Hoer genau zu, markiere schwierige Woerter und wiederhole den wichtigsten Satz.`,
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
      Listening: 'Hoerverstehen und Satzrhythmus',
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
    B2: {
      Dictation: 'Academic progress depends on regular practice, focused listening, and careful review of sentence endings.',
      Reading: 'The paragraph explains how evidence, examples, and precise vocabulary make an argument stronger.',
      Listening: 'Long sentences are easier to understand when you hear connectors, pauses, and final words clearly.',
      Writing: 'Rebuild the paragraph with a clear topic sentence, one example, and a precise conclusion.',
    },
  },
  German: {
    A1: {
      Dictation: 'Ich lerne jeden Morgen. Ich hoere ein Wort und schreibe es langsam.',
      Reading: 'Das ist mein Heft. Ich lese neue Woerter vor dem Kurs.',
      Listening: 'Hoer den kurzen Satz. Mach nach jedem Wort eine Pause.',
      Writing: 'Ich schreibe einen kurzen Satz ueber meinen Tag.',
    },
    B2: {
      Dictation: 'Akademischer Fortschritt entsteht durch regelmaessige Uebung, genaues Zuhoeren und bewusste Arbeit an Satzenden.',
      Reading: 'Der Abschnitt zeigt, wie Beispiele, Belege und praezise Woerter ein Argument staerker machen.',
      Listening: 'Lange Saetze werden klarer, wenn man Konnektoren, Pausen und Endungen bewusst hoert.',
      Writing: 'Formuliere den Absatz mit einer klaren Hauptidee, einem Beispiel und einem praezisen Schluss neu.',
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
