import { type CefrBand, type CurriculumExercise, type CurriculumLanguage, type CurriculumLesson, type CurriculumSkill } from '../../lib/curriculumCore';
import type { CefrLevel, LearningLanguage } from '../../lib/learning';
import { loadCurriculumLevelSummaries, loadCurriculumLevelsByBand } from '../../lib/curriculumRepository';
import type { PracticePathExercise, PracticePathLevelMap, PracticePathLesson, PracticePathSkill } from './types';

const PRACTICE_PATH_SKILLS: PracticePathSkill[] = ['Listening', 'Dictation', 'Reading', 'Speaking', 'Writing', 'Review', 'Progress Check'];

export async function loadStructuredPracticeLessons(level: CefrLevel, language: LearningLanguage): Promise<PracticePathLesson[]> {
  const curriculumLevels = await loadCurriculumLevelsByBand(toCurriculumLanguage(language), level as CefrBand);
  return curriculumLevels
    .flatMap((curriculumLevel) => curriculumLevel.lessons)
    .map((lesson, index) => adaptStructuredLesson(lesson, index + 1));
}

export async function loadStructuredLevelMap(language: LearningLanguage): Promise<PracticePathLevelMap[]> {
  return loadCurriculumLevelSummaries(toCurriculumLanguage(language));
}

function adaptStructuredLesson(lesson: CurriculumLesson, number: number): PracticePathLesson {
  const vocabulary = lesson.vocabulary.map((item) => item.word);
  const structuredBySkill = buildExerciseMap(lesson.exercises);
  const adaptedLesson: Omit<PracticePathLesson, 'exercises'> = {
    id: lesson.id,
    number,
    levelNumber: lesson.levelNumber,
    title: lesson.title,
    level: lesson.cefrLevel,
    language: lesson.language,
    theme: lesson.theme,
    objective: lesson.objective,
    canDo: lesson.canDo,
    grammarFocus: lesson.grammarFocus,
    vocabulary,
  };

  return {
    ...adaptedLesson,
    exercises: getAvailablePracticeSkills(structuredBySkill).map((skill) => {
      const exercise = structuredBySkill.get(skill);
      const template = getTemplate(lesson.language, skill);
      return {
        id: exercise?.id ?? `${lesson.id}-${toTrainingSlug(skill)}`,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        levelNumber: lesson.levelNumber,
        title: exercise?.title ?? template.title,
        skill,
        level: lesson.cefrLevel,
        focus: `${lesson.cefrLevel} ${skill.toLowerCase()} - ${lesson.grammarFocus}`,
        duration: template.duration,
        difficulty: getDifficulty(lesson.cefrLevel),
        status: 'not_started',
        description: exercise?.instruction ?? template.description,
        sourceText: buildStructuredSourceText(lesson, skill),
        language: lesson.language,
        curriculumExerciseId: exercise?.id,
      } satisfies PracticePathExercise;
    }),
  };
}

function buildExerciseMap(exercises: CurriculumExercise[]) {
  const map = new Map<PracticePathSkill, CurriculumExercise>();
  const pick = (skill: PracticePathSkill, candidates: CurriculumSkill[]) => {
    const exercise = exercises.find((item) => candidates.includes(item.skill));
    if (exercise) map.set(skill, exercise);
  };

  pick('Listening', ['listening']);
  pick('Dictation', ['dictation']);
  pick('Reading', ['reading']);
  pick('Speaking', ['speaking', 'conversation', 'pronunciation']);
  pick('Writing', ['writing']);
  pick('Review', ['vocabulary', 'grammar', 'sentence_building']);
  pick('Progress Check', ['test']);

  return map;
}

function getAvailablePracticeSkills(structuredBySkill: Map<PracticePathSkill, CurriculumExercise>) {
  return PRACTICE_PATH_SKILLS.filter((skill) => structuredBySkill.has(skill));
}

function buildStructuredSourceText(lesson: CurriculumLesson, skill: PracticePathSkill) {
  const exercise = getExerciseForPathSkill(lesson, skill);
  const target = String(exercise?.content.targetSentence ?? lesson.targetSentence);
  const reading = String(exercise?.content.readingText ?? lesson.readingText);
  const listening = String(exercise?.content.listeningScript ?? lesson.listeningScript);
  const question = String(exercise?.content.question ?? '');

  if (skill === 'Reading') {
    return [reading, question].filter(Boolean).join('\n\n');
  }

  if (skill === 'Listening') {
    return [listening, question].filter(Boolean).join('\n\n');
  }

  if (skill === 'Writing') {
    return String(exercise?.content.prompt ?? lesson.canDo);
  }

  if (skill === 'Speaking') {
    return String(exercise?.content.prompt ?? lesson.speakingTask.prompt ?? lesson.roleplay.scenario ?? lesson.canDo);
  }

  if (skill === 'Review') {
    return [lesson.grammarFocus, lesson.vocabulary.slice(0, 6).map((item) => item.word).join(', ')].filter(Boolean).join('\n\n');
  }

  if (skill === 'Progress Check') {
    return lesson.objective;
  }

  return target;
}

function getExerciseForPathSkill(lesson: CurriculumLesson, skill: PracticePathSkill) {
  const map = buildExerciseMap(lesson.exercises);
  return map.get(skill);
}

function getTemplate(language: CurriculumLanguage, skill: PracticePathSkill) {
  const templates: Record<PracticePathSkill, { title: string; duration: string; description: string }> = {
    Listening: {
      title: language === 'German' ? 'Hören & Verstehen' : 'Listen & Understand',
      duration: '12 min',
      description: 'Listen first, answer comprehension questions, then reveal the transcript after completion.',
    },
    Dictation: {
      title: language === 'German' ? 'Hören & Schreiben' : 'Listen & Type',
      duration: '12 min',
      description: 'Type the target passage exactly and review missing, wrong, and extra words.',
    },
    Reading: {
      title: language === 'German' ? 'Lesen & Verstehen' : 'Read & Understand',
      duration: '10 min',
      description: 'Read the passage, answer the question, and rebuild the meaning from memory.',
    },
    Speaking: {
      title: language === 'German' ? 'Sprechen & Antworten' : 'Speak & Respond',
      duration: '10 min',
      description: 'Use the scenario, useful phrases, and a recording area to produce your own answer.',
    },
    Writing: {
      title: language === 'German' ? 'Eigene Version Schreiben' : 'Write Your Version',
      duration: '18 min',
      description: 'Write with the target vocabulary and the grammar focus for this lesson.',
    },
    Review: {
      title: language === 'German' ? 'Wiederholen & Festigen' : 'Review & Reinforce',
      duration: '8 min',
      description: 'Mix vocabulary, grammar, and sentence-building material from the selected lesson.',
    },
    'Progress Check': {
      title: language === 'German' ? 'Fortschritt Prüfen' : 'Progress Check',
      duration: '14 min',
      description: 'Complete a small mixed check across comprehension, form, and production.',
    },
  };

  return templates[skill];
}

function getDifficulty(level: CefrLevel): PracticePathExercise['difficulty'] {
  if (level === 'A1') return 'Foundation';
  if (level === 'A2' || level === 'B1') return 'Steady';
  if (level === 'B2') return 'Challenging';
  return 'Advanced';
}

function toCurriculumLanguage(language: LearningLanguage): CurriculumLanguage {
  return language;
}

function toTrainingSlug(skill: PracticePathSkill) {
  return skill.toLowerCase().replace(/\s+/g, '-');
}
