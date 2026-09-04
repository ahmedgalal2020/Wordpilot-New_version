import type { ExerciseType } from '../../lib/curriculumCore';
import { EXERCISE_TAXONOMY, getScoringMode, getTaxonomyEntry } from './exerciseTaxonomy';

export type ExerciseRendererKind =
  | 'choice'
  | 'ordering'
  | 'dictation'
  | 'speaking'
  | 'writing'
  | 'source-analysis'
  | 'completion';

export type ExerciseRendererDefinition = {
  type: ExerciseType;
  rendererKind: ExerciseRendererKind;
  routeByExperience: boolean;
};

export const EXERCISE_RENDERER_REGISTRY: Record<ExerciseType, ExerciseRendererDefinition> = EXERCISE_TAXONOMY.reduce(
  (registry, entry) => ({
    ...registry,
    [entry.type]: {
      type: entry.type,
      rendererKind: inferRendererKind(entry.type),
      routeByExperience: true,
    },
  }),
  {} as Record<ExerciseType, ExerciseRendererDefinition>,
);

export function getExerciseRendererDefinition(type: ExerciseType) {
  return EXERCISE_RENDERER_REGISTRY[type] ?? {
    type,
    rendererKind: inferRendererKind(type),
    routeByExperience: Boolean(getTaxonomyEntry(type)),
  };
}

export function getExerciseRendererKind(type: ExerciseType) {
  return getExerciseRendererDefinition(type).rendererKind;
}

function inferRendererKind(type: ExerciseType): ExerciseRendererKind {
  if (type === 'sentence_order' || type === 'paragraph_order' || type === 'discourse_reconstruction') return 'ordering';
  if (type === 'dictation_word' || type === 'dictation_sentence' || type === 'dictation_gap') return 'dictation';
  if (
    [
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
    ].includes(type)
  ) {
    return 'speaking';
  }
  if (
    [
      'guided_writing',
      'free_writing',
      'functional_writing',
      'register_shift',
      'precision_rewrite',
      'argument_repair',
      'source_synthesis',
      'comparative_critique',
      'micro_editing',
      'advanced_writing',
    ].includes(type)
  ) {
    return 'writing';
  }
  if (getScoringMode(type) === 'objective') return 'choice';
  if (type.includes('reading') || type.includes('inference') || type.includes('stance') || type.includes('rhetorical')) return 'source-analysis';
  return 'completion';
}
