import { type CefrBand, type CurriculumLanguage, type CurriculumLesson } from '../../lib/curriculumCore';
import type { CefrLevel, LearningLanguage, PracticeExercise, PracticeLesson, PracticeSkill } from '../../lib/learning';
import { loadCurriculumLevelSummaries, loadCurriculumLevelsByBand } from '../../lib/curriculumRepository';
import type { PracticePathLevelMap } from './types';

const PRACTICE_PATH_SKILLS: PracticeSkill[] = ['Dictation', 'Reading', 'Listening', 'Writing'];

export async function loadStructuredPracticeLessons(level: CefrLevel, language: LearningLanguage): Promise<PracticeLesson[]> {
  const curriculumLevels = await loadCurriculumLevelsByBand(toCurriculumLanguage(language), level as CefrBand);
  return curriculumLevels
    .flatMap((curriculumLevel) => curriculumLevel.lessons)
    .map((lesson, index) => adaptStructuredLesson(lesson, index + 1));
}

export async function loadStructuredLevelMap(language: LearningLanguage): Promise<PracticePathLevelMap[]> {
  return loadCurriculumLevelSummaries(toCurriculumLanguage(language));
}

function adaptStructuredLesson(lesson: CurriculumLesson, number: number): PracticeLesson {
  const vocabulary = lesson.vocabulary.map((item) => item.word);
  const structuredBySkill = new Map(lesson.exercises.map((exercise) => [exercise.skill, exercise]));
  const adaptedLesson: Omit<PracticeLesson, 'exercises'> = {
    id: lesson.id,
    number,
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
    exercises: PRACTICE_PATH_SKILLS.map((skill) => {
      const exercise = structuredBySkill.get(skill.toLowerCase() as CurriculumLesson['exercises'][number]['skill']);
      const template = getTemplate(lesson.language, skill);
      return {
        id: exercise?.id ?? `${lesson.id}-${skill.toLowerCase()}`,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
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
      } satisfies PracticeExercise;
    }),
  };
}

function buildStructuredSourceText(lesson: CurriculumLesson, skill: PracticeSkill) {
  const exercise = lesson.exercises.find((item) => item.skill === skill.toLowerCase());
  const target = String(exercise?.content.targetSentence ?? lesson.targetSentence);
  const reading = String(exercise?.content.readingText ?? lesson.readingText);
  const question = String(exercise?.content.question ?? '');

  if (skill === 'Reading') {
    return [reading, question].filter(Boolean).join('\n\n');
  }

  if (skill === 'Listening') {
    return [target, question].filter(Boolean).join('\n\n');
  }

  if (skill === 'Writing') {
    return String(exercise?.content.prompt ?? lesson.canDo);
  }

  return target;
}

function getTemplate(language: CurriculumLanguage, skill: PracticeSkill) {
  const templates: Record<PracticeSkill, { title: string; duration: string; description: string }> = {
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
    Listening: {
      title: language === 'German' ? 'Details Erkennen' : 'Catch the Details',
      duration: '15 min',
      description: 'Replay phrase groups and capture connectors, endings, and key vocabulary.',
    },
    Writing: {
      title: language === 'German' ? 'Eigene Version Schreiben' : 'Write Your Version',
      duration: '18 min',
      description: 'Write with the target vocabulary and the grammar focus for this lesson.',
    },
  };

  return templates[skill];
}

function getDifficulty(level: CefrLevel): PracticeExercise['difficulty'] {
  if (level === 'A1') return 'Foundation';
  if (level === 'A2' || level === 'B1') return 'Steady';
  if (level === 'B2') return 'Challenging';
  return 'Advanced';
}

function toCurriculumLanguage(language: LearningLanguage): CurriculumLanguage {
  return language;
}
