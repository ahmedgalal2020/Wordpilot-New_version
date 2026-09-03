import {
  CURRICULUM,
  SUPPORTED_CURRICULUM_LANGUAGES,
  type CefrBand,
  type CurriculumLanguage,
  type CurriculumLesson,
} from '../src/lib/curriculum';

type Issue = {
  lessonId: string;
  language: CurriculumLanguage;
  band: CefrBand;
  theme: string;
  field: string;
  reason: string;
};

const issues: Issue[] = [];
const bands: CefrBand[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

for (const level of CURRICULUM) {
  for (const lesson of level.lessons) {
    auditLesson(lesson);
  }
}

console.table(
  SUPPORTED_CURRICULUM_LANGUAGES.flatMap((language) =>
    bands.map((band) => {
      const lessons = CURRICULUM.filter((level) => level.language === language && level.cefrLevel === band).flatMap((level) => level.lessons);
      return {
        language,
        band,
        lessons: lessons.length,
        planningOrDigitalLessons: lessons.filter((lesson) => ['planning', 'digital'].includes(domainForTheme(lesson.theme))).length,
        issues: issues.filter((issue) => issue.language === language && issue.band === band).length,
      };
    }),
  ),
);

if (issues.length > 0) {
  console.error('Curriculum semantic coherence audit failed:');
  for (const issue of issues.slice(0, 80)) {
    console.error(`${issue.language} ${issue.band} ${issue.lessonId} [${issue.field}] ${issue.reason}`);
  }
  if (issues.length > 80) console.error(`...and ${issues.length - 80} more issue(s).`);
  process.exit(1);
}

console.log('Curriculum semantic coherence audit passed.');

function auditLesson(lesson: CurriculumLesson) {
  const domain = domainForTheme(lesson.theme);
  const learnerFields = {
    targetSentence: lesson.targetSentence,
    readingText: lesson.readingText,
    listeningScript: lesson.listeningScript,
    writingSituation: lesson.writingTask.situation,
    writingPurpose: lesson.writingTask.purpose,
    speakingPrompt: lesson.speakingTask.prompt,
    roleplayScenario: lesson.roleplay.scenario,
    roleplayGoal: lesson.roleplay.goal,
    roleplayPartner: lesson.roleplay.partnerRole,
    roleplayLearner: lesson.roleplay.learnerRole,
    exampleSentences: lesson.exampleSentences.join(' '),
  };

  for (const [field, value] of Object.entries(learnerFields)) {
    for (const pattern of malformedPatterns()) {
      if (pattern.test(value)) report(lesson, field, `malformed generated phrase: ${pattern}`);
    }
  }

  for (const [field, value] of Object.entries({ readingText: lesson.readingText, listeningScript: lesson.listeningScript })) {
    for (const pattern of metaContentPatterns()) {
      if (pattern.test(value)) report(lesson, field, `meta-language leaked into learner content: ${pattern}`);
    }
  }

  if (/\b(is the word|la palabra .* está bien|la parola .* va bene|le mot .* convient|das Wort .* richtig)\b/i.test(lesson.targetSentence)) {
    report(lesson, 'targetSentence', 'target sentence asks whether a word is correct instead of modeling real communication.');
  }

  if (domain === 'planning' || domain === 'digital') {
    const relevant = lesson.newVocabulary.filter((item) => termMatchesDomain(lesson.language, domain, item.word)).length;
    if (relevant / lesson.newVocabulary.length < 0.85) {
      report(lesson, 'newVocabulary', `${relevant}/${lesson.newVocabulary.length} vocabulary items match ${domain}.`);
    }
  }

  if (domain === 'digital' && /(body|corps|cuerpo|corpo|körper)/i.test(lesson.grammarFocus)) {
    report(lesson, 'grammarFocus', 'digital lesson is using body-parts grammar.');
  }

  if (domain === 'planning' && /(body|corps|cuerpo|corpo|körper|article|artikel|articles et noms simples)/i.test(lesson.grammarFocus)) {
    report(lesson, 'grammarFocus', 'planning lesson is using unrelated grammar.');
  }

  if (domain === 'digital' && /(menu|menü|note de menu|nota del menu|nota de menú|ticket machine|fahrkartenautomat|distributeur de billets)/i.test(lesson.readingText)) {
    report(lesson, 'readingText', 'digital lesson starts with an unrelated everyday-reading genre.');
  }

  for (const chunk of lesson.chunks) {
    if (!normalize(chunk.example).includes(normalize(chunk.phrase))) {
      report(lesson, 'chunk.example', `chunk example does not contain its phrase: ${chunk.phrase}`);
    }
  }
}

function report(lesson: CurriculumLesson, field: string, reason: string) {
  issues.push({
    lessonId: lesson.id,
    language: lesson.language,
    band: lesson.cefrLevel,
    theme: lesson.theme,
    field,
    reason,
  });
}

function malformedPatterns() {
  return [
    /\bat\s+(at|in|inside|during|after|before)\b/i,
    /\btakes place at\s+(during|inside|after|before|in)\b/i,
    /\byou are at\s+(in|inside|during|after|before)\b/i,
    /\bA colleague at\s+(at|in|inside|during|after|before)\b/i,
    /\bDu musst zu\b/i,
    /(^|[\s"“])à le\b/i,
    /(^|[\s"“])de le\b/i,
    /(^|[\s"“])de les\b/i,
    /(^|[\s"“])a el\b/i,
    /(^|[\s"“])de el\b/i,
  ];
}

function metaContentPatterns() {
  return [
    /\b(the learner|learner checks|speaker uses|speaker mentions|listen for|keyword|useful phrase can be reused)\b/i,
    /\b(die lernende person|sprechende person|stichwort|achten sie .*antwort)\b/i,
    /\b(el estudiante comprueba|palabra clave|escucha .*antes de responder)\b/i,
    /\b(lo studente controlla|parola chiave|ascolta .*prima di rispondere)\b/i,
    /\b(l’apprenant vérifie|mot-clé|écoutez .*avant de répondre)\b/i,
  ];
}

function domainForTheme(theme: string) {
  const value = normalize(theme);
  if (/(plan|project|appointment|schedule|calendar|termin|tagesplan|pläne|cita|appuntament|rendez|calendrier|horaire|projets)/i.test(value)) return 'planning';
  if (/(digital|email|e mail|courriel|correo|mail|technik|technology|tecnolog|numérique|account|konto|compte)/i.test(value)) return 'digital';
  return 'general';
}

function termMatchesDomain(language: CurriculumLanguage, domain: string, term: string) {
  const terms = {
    planning: [
      'plan', 'appointment', 'calendar', 'tomorrow', 'next week', 'available', 'confirm', 'change', 'cancel', 'meeting', 'time slot', 'deadline',
      'termin', 'kalender', 'morgen', 'nächste woche', 'verfügbar', 'bestätigen', 'verschieben', 'absagen', 'besprechung', 'zeitfenster', 'frist',
      'cita', 'calendario', 'mañana', 'próxima semana', 'disponible', 'confirmar', 'cambiar', 'cancelar', 'reunión', 'franja horaria', 'plazo',
      'appuntamento', 'domani', 'prossima settimana', 'confermare', 'spostare', 'annullare', 'riunione', 'fascia oraria', 'scadenza',
      'rendez', 'calendrier', 'demain', 'semaine prochaine', 'confirmer', 'déplacer', 'annuler', 'réunion', 'créneau', 'délai', 'projet',
    ],
    digital: [
      'account', 'password', 'email', 'attachment', 'message', 'screen', 'login', 'download', 'file', 'link', 'notification', 'settings',
      'konto', 'passwort', 'e mail', 'anhang', 'nachricht', 'bildschirm', 'anmelden', 'herunterladen', 'datei', 'benachrichtigung', 'einstellungen',
      'cuenta', 'contraseña', 'correo', 'archivo adjunto', 'mensaje', 'pantalla', 'iniciar sesión', 'descargar', 'archivo', 'enlace', 'notificación', 'ajustes',
      'account', 'password', 'email', 'allegato', 'messaggio', 'schermo', 'accedere', 'scaricare', 'file', 'link', 'notifica', 'impostazioni',
      'compte', 'mot de passe', 'courriel', 'pièce jointe', 'message', 'écran', 'connecter', 'télécharger', 'fichier', 'lien', 'notification', 'paramètres',
    ],
  } as const;
  void language;
  const value = normalize(term);
  return terms[domain as 'planning' | 'digital'].some((needle) => value.includes(normalize(needle)));
}

function normalize(value: string) {
  return value.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}
