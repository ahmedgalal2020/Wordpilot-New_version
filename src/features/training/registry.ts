import type { CurriculumExercise, CurriculumLesson, CurriculumSkill, ExerciseType } from '../../lib/curriculumCore';
import { getScoringMode, getTaxonomyEntry } from './exerciseTaxonomy';

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
  const taxonomyExperience = getTaxonomyEntry(exercise.type)?.experience;
  if (taxonomyExperience) return taxonomyExperience;
  if (exercise.skill === 'listening' || isListeningType(exercise.type)) return 'listening';
  if (exercise.skill === 'reading' || isReadingType(exercise.type)) return 'reading';
  if (exercise.skill === 'writing' || exercise.type === 'guided_writing' || exercise.type === 'free_writing') return 'writing';
  if (isSpeakingSkill(exercise.skill) || isSpeakingType(exercise.type)) return 'speaking';
  if (exercise.skill === 'test' || exercise.type === 'lesson_test') return 'progress-check';
  return 'review';
}

export function getExercisesForExperience(lesson: CurriculumLesson, experience: TrainingExperience, requestedExerciseId?: string) {
  if (experience === 'progress-check') {
    const requested = requestedExerciseId ? lesson.exercises.find((exercise) => exercise.id === requestedExerciseId) : null;
    const checkItems = lesson.exercises.filter((exercise) => getExperienceForExercise(exercise) === 'progress-check' || exercise.skill === 'test');
    const supportItems = lesson.exercises.filter((exercise) => ['vocabulary', 'listening', 'grammar', 'reading', 'writing', 'speaking', 'conversation'].includes(exercise.skill));
    return uniqueById([...(requested ? [requested] : []), ...checkItems, ...supportItems]).slice(0, 6);
  }

  if (experience === 'review') {
    const requested = requestedExerciseId ? lesson.exercises.find((exercise) => exercise.id === requestedExerciseId) : null;
    const reviewItems = lesson.exercises.filter((exercise) => getExperienceForExercise(exercise) === 'review');
    const recapItems = lesson.exercises.filter((exercise) =>
      ['vocabulary', 'grammar', 'sentence_building', 'listening', 'reading', 'writing'].includes(exercise.skill) &&
      getExperienceForExercise(exercise) !== 'progress-check',
    );
    return uniqueById([...(requested ? [requested] : []), ...reviewItems, ...recapItems]).slice(0, 6);
  }

  const matching = lesson.exercises.filter((exercise) => getExperienceForExercise(exercise) === experience);
  const requested = requestedExerciseId ? matching.find((exercise) => exercise.id === requestedExerciseId) : null;
  return requested ? [requested, ...matching.filter((exercise) => exercise.id !== requested.id)] : matching;
}

export function isObjectiveExercise(type: ExerciseType) {
  return getScoringMode(type) === 'objective' || isChoiceType(type) || type === 'sentence_order' || type === 'gap_fill';
}

export function isChoiceType(type: ExerciseType) {
  return [
    'vocabulary_match',
    'audio_choice',
    'listen_and_select',
    'listen_for_detail',
    'grammar_choice',
    'vocabulary_choice',
    'picture_or_context_match',
    'listening_inference',
    'speaker_intention',
    'vocabulary_in_context',
    'collocation_choice',
    'paraphrase_choice',
    'contextual_grammar',
    'reading_main_idea',
    'reading_detail',
    'reading_inference',
    'reference_tracking',
    'reading_true_false',
    'stance_detection',
    'subtext_inference',
    'irony_interpretation',
    'hidden_assumption',
    'rhetorical_effect',
    'comparative_reading',
  ].includes(type);
}

function isListeningType(type: ExerciseType) {
  return type === 'audio_choice' || type === 'listen_and_select' || type === 'listen_for_detail' || type === 'listening_inference' || type === 'speaker_intention' || type === 'subtext_inference';
}

function isReadingType(type: ExerciseType) {
  return [
    'reading_main_idea',
    'reading_detail',
    'reading_true_false',
    'reading_heading_match',
    'reading_inference',
    'reference_tracking',
    'paragraph_order',
    'stance_detection',
    'irony_interpretation',
    'ambiguity_analysis',
    'hidden_assumption',
    'rhetorical_effect',
    'comparative_reading',
    'comparative_critique',
    'discourse_reconstruction',
  ].includes(type);
}

function isSpeakingSkill(skill: CurriculumSkill) {
  return skill === 'speaking' || skill === 'conversation' || skill === 'pronunciation';
}

function isSpeakingType(type: ExerciseType) {
  return [
    'pronunciation_repeat',
    'guided_speaking',
    'free_speaking',
    'roleplay',
    'shadowing',
    'mini_dialogue',
    'extended_speaking',
    'scenario_response',
    'guided_argument',
    'strategic_response',
    'expert_roleplay',
    'synthesis_speaking',
  ].includes(type);
}

function uniqueById(exercises: CurriculumExercise[]) {
  const seen = new Set<string>();
  return exercises.filter((exercise) => {
    if (seen.has(exercise.id)) return false;
    seen.add(exercise.id);
    return true;
  });
}
