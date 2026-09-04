import type { CurriculumExercise, CurriculumLesson, CurriculumSkill, ExerciseType } from '../../lib/curriculumCore';

export type TrainingExperience = 'listening' | 'reading' | 'writing' | 'speaking' | 'review' | 'progress-check';

export type TrainingRouteTarget = {
  experience: TrainingExperience;
  language: string;
  levelNumber: number;
  lessonId: string;
  exerciseId: string;
};

export const TRAINING_EXPERIENCE_LABELS: Record<TrainingExperience, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
  review: 'Review',
  'progress-check': 'Progress Check',
};

export function getTrainingRoute(target: TrainingRouteTarget) {
  return `/practice/${target.experience}/${encodeURIComponent(target.language)}/${target.levelNumber}/${encodeURIComponent(target.lessonId)}/${encodeURIComponent(target.exerciseId)}`;
}

export function parseTrainingExperience(value?: string): TrainingExperience | null {
  if (
    value === 'listening' ||
    value === 'reading' ||
    value === 'writing' ||
    value === 'speaking' ||
    value === 'review' ||
    value === 'progress-check'
  ) {
    return value;
  }
  return null;
}

export function getExperienceForExercise(exercise: CurriculumExercise): TrainingExperience {
  if (exercise.skill === 'listening' || isListeningType(exercise.type)) return 'listening';
  if (exercise.skill === 'reading' || isReadingType(exercise.type)) return 'reading';
  if (exercise.skill === 'writing' || exercise.type === 'guided_writing' || exercise.type === 'free_writing') return 'writing';
  if (isSpeakingSkill(exercise.skill) || isSpeakingType(exercise.type)) return 'speaking';
  if (exercise.skill === 'test' || exercise.type === 'lesson_test') return 'progress-check';
  return 'review';
}

export function getExercisesForExperience(lesson: CurriculumLesson, experience: TrainingExperience, requestedExerciseId?: string) {
  if (experience === 'progress-check') {
    return [
      ...lesson.exercises.filter((exercise) => ['vocabulary', 'listening', 'grammar', 'reading', 'writing', 'speaking', 'test'].includes(exercise.skill)),
    ].slice(0, 6);
  }

  if (experience === 'review') {
    return lesson.exercises.filter((exercise) =>
      ['vocabulary', 'grammar', 'sentence_building', 'listening', 'reading'].includes(exercise.skill),
    );
  }

  const matching = lesson.exercises.filter((exercise) => getExperienceForExercise(exercise) === experience);
  const requested = requestedExerciseId ? matching.find((exercise) => exercise.id === requestedExerciseId) : null;
  return requested ? [requested, ...matching.filter((exercise) => exercise.id !== requested.id)] : matching;
}

export function isObjectiveExercise(type: ExerciseType) {
  return isChoiceType(type) || type === 'sentence_order' || type === 'gap_fill';
}

export function isChoiceType(type: ExerciseType) {
  return [
    'vocabulary_match',
    'audio_choice',
    'listen_and_select',
    'listen_for_detail',
    'grammar_choice',
    'reading_main_idea',
    'reading_detail',
    'reading_true_false',
  ].includes(type);
}

function isListeningType(type: ExerciseType) {
  return type === 'audio_choice' || type === 'listen_and_select' || type === 'listen_for_detail';
}

function isReadingType(type: ExerciseType) {
  return type === 'reading_main_idea' || type === 'reading_detail' || type === 'reading_true_false' || type === 'reading_heading_match';
}

function isSpeakingSkill(skill: CurriculumSkill) {
  return skill === 'speaking' || skill === 'conversation' || skill === 'pronunciation';
}

function isSpeakingType(type: ExerciseType) {
  return type === 'pronunciation_repeat' || type === 'guided_speaking' || type === 'free_speaking' || type === 'roleplay' || type === 'shadowing';
}
