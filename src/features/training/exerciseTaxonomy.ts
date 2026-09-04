import type {
  CefrBand,
  CurriculumSkill,
  ExerciseType,
  ScoringMode,
} from '../../lib/curriculumCore';

export type ExerciseTaxonomyEntry = {
  type: ExerciseType;
  skill: CurriculumSkill;
  scoringMode: ScoringMode;
  minCefr: CefrBand;
  maxCefr?: CefrBand;
  experience: 'listening' | 'reading' | 'writing' | 'speaking' | 'review' | 'progress-check';
  description: string;
};

export type CefrExerciseRule = {
  band: CefrBand;
  learnerMode: string;
  exerciseCountRange: [number, number];
  preferredTypes: ExerciseType[];
  avoidTypes: ExerciseType[];
};

const CEFR_ORDER: CefrBand[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const EXERCISE_TAXONOMY: ExerciseTaxonomyEntry[] = [
  taxonomy('vocabulary_match', 'vocabulary', 'objective', 'A1', 'review', 'Match a known word to a meaning.'),
  taxonomy('vocabulary_choice', 'vocabulary', 'objective', 'A1', 'review', 'Recognize a useful word in a short context.'),
  taxonomy('picture_or_context_match', 'vocabulary', 'objective', 'A1', 'review', 'Connect a concrete word to a visual or situational cue.'),
  taxonomy('gap_fill', 'grammar', 'rule_based', 'A1', 'review', 'Complete one missing form in a short sentence.'),
  taxonomy('grammar_choice', 'grammar', 'objective', 'A1', 'review', 'Choose the correct grammar form from plausible distractors.'),
  taxonomy('grammar_gap', 'grammar', 'rule_based', 'A1', 'review', 'Produce the missing grammar form.'),
  taxonomy('sentence_order', 'sentence_building', 'rule_based', 'A1', 'review', 'Rebuild a simple sentence from shuffled tokens.'),
  taxonomy('dictation_sentence', 'dictation', 'rule_based', 'A1', 'review', 'Type a short utterance exactly as heard.'),
  taxonomy('listen_and_select', 'listening', 'objective', 'A1', 'listening', 'Listen for a concrete word or phrase.'),
  taxonomy('listen_for_detail', 'listening', 'objective', 'A1', 'listening', 'Answer a factual listening question.'),
  taxonomy('reading_main_idea', 'reading', 'objective', 'A1', 'reading', 'Identify the basic meaning of a short text.'),
  taxonomy('reading_detail', 'reading', 'objective', 'A1', 'reading', 'Find an explicit detail in a short text.'),
  taxonomy('pronunciation_repeat', 'pronunciation', 'subjective', 'A1', 'speaking', 'Repeat a short model aloud.'),
  taxonomy('mini_dialogue', 'conversation', 'subjective', 'A1', 'speaking', 'Complete a short everyday exchange.'),
  taxonomy('guided_speaking', 'speaking', 'subjective', 'A1', 'speaking', 'Answer with guided language support.'),
  taxonomy('guided_writing', 'writing', 'subjective', 'A1', 'writing', 'Write a short supported response.'),
  taxonomy('vocabulary_in_context', 'vocabulary', 'objective', 'B1', 'review', 'Choose a word based on meaning in context.'),
  taxonomy('collocation_choice', 'vocabulary', 'objective', 'B1', 'review', 'Choose the natural word partnership.'),
  taxonomy('paraphrase_choice', 'reading', 'objective', 'B1', 'reading', 'Select the closest meaning-preserving paraphrase.'),
  taxonomy('sentence_transformation', 'grammar', 'rule_based', 'B1', 'review', 'Transform a sentence while preserving meaning.'),
  taxonomy('error_correction', 'grammar', 'rule_based', 'B1', 'review', 'Find and correct a realistic learner error.'),
  taxonomy('listening_inference', 'listening', 'objective', 'B1', 'listening', 'Infer unstated meaning from a listening text.'),
  taxonomy('speaker_intention', 'listening', 'objective', 'B1', 'listening', 'Identify why a speaker says something.'),
  taxonomy('reading_inference', 'reading', 'objective', 'B1', 'reading', 'Infer meaning supported by the text.'),
  taxonomy('reference_tracking', 'reading', 'objective', 'B1', 'reading', 'Track pronouns and references across a text.'),
  taxonomy('paragraph_order', 'reading', 'rule_based', 'B1', 'reading', 'Reconstruct paragraph logic.'),
  taxonomy('contextual_grammar', 'grammar', 'objective', 'B1', 'review', 'Choose a grammar form based on surrounding meaning.'),
  taxonomy('guided_argument', 'speaking', 'subjective', 'B2', 'speaking', 'Build a supported argument.'),
  taxonomy('extended_speaking', 'speaking', 'subjective', 'B2', 'speaking', 'Speak for a longer turn with structure.'),
  taxonomy('scenario_response', 'conversation', 'subjective', 'B2', 'speaking', 'Respond appropriately to a realistic situation.'),
  taxonomy('functional_writing', 'writing', 'subjective', 'B1', 'writing', 'Write a practical message with purpose and audience.'),
  taxonomy('stance_detection', 'reading', 'objective', 'C1', 'reading', 'Identify a writer or speaker stance.'),
  taxonomy('subtext_inference', 'listening', 'objective', 'C1', 'listening', 'Interpret implied meaning and social intent.'),
  taxonomy('irony_interpretation', 'reading', 'objective', 'C2', 'reading', 'Recognize ironic or indirect meaning.'),
  taxonomy('register_shift', 'writing', 'subjective', 'C1', 'writing', 'Recast the same meaning for a different register.'),
  taxonomy('precision_rewrite', 'writing', 'subjective', 'C1', 'writing', 'Improve accuracy, concision, and rhetorical fit.'),
  taxonomy('ambiguity_analysis', 'reading', 'subjective', 'C2', 'reading', 'Explain competing interpretations of a passage.'),
  taxonomy('argument_repair', 'writing', 'subjective', 'C1', 'writing', 'Strengthen a weak or incomplete argument.'),
  taxonomy('hidden_assumption', 'reading', 'objective', 'C1', 'reading', 'Identify an assumption the text depends on.'),
  taxonomy('rhetorical_effect', 'reading', 'objective', 'C1', 'reading', 'Explain how a rhetorical choice affects meaning.'),
  taxonomy('source_synthesis', 'writing', 'subjective', 'C1', 'writing', 'Synthesize multiple inputs into a coherent response.'),
  taxonomy('comparative_reading', 'reading', 'objective', 'C1', 'reading', 'Compare two perspectives or texts.'),
  taxonomy('comparative_critique', 'writing', 'subjective', 'C2', 'writing', 'Evaluate competing claims with nuance.'),
  taxonomy('discourse_reconstruction', 'reading', 'rule_based', 'C1', 'reading', 'Rebuild advanced discourse logic.'),
  taxonomy('micro_editing', 'grammar', 'rule_based', 'C1', 'review', 'Make precise local edits without changing meaning.'),
  taxonomy('strategic_response', 'speaking', 'subjective', 'C1', 'speaking', 'Respond with tact, intent, and register control.'),
  taxonomy('expert_roleplay', 'conversation', 'subjective', 'C2', 'speaking', 'Handle a high-stakes expert interaction.'),
  taxonomy('advanced_writing', 'writing', 'subjective', 'C1', 'writing', 'Produce nuanced long-form written language.'),
  taxonomy('synthesis_speaking', 'speaking', 'subjective', 'C1', 'speaking', 'Summarize and evaluate sources aloud.'),
  taxonomy('lesson_test', 'test', 'rule_based', 'A1', 'progress-check', 'Check transfer across multiple skills.'),
];

export const CEFR_EXERCISE_RULES: Record<CefrBand, CefrExerciseRule> = {
  A1: {
    band: 'A1',
    learnerMode: 'heavy scaffolding, recognition, short production, sound/form mapping, simple comprehension',
    exerciseCountRange: [8, 10],
    preferredTypes: [
      'vocabulary_choice',
      'listen_and_select',
      'pronunciation_repeat',
      'sentence_order',
      'grammar_choice',
      'grammar_gap',
      'reading_detail',
      'mini_dialogue',
      'guided_writing',
      'lesson_test',
    ],
    avoidTypes: ['stance_detection', 'subtext_inference', 'register_shift', 'source_synthesis', 'expert_roleplay'],
  },
  A2: {
    band: 'A2',
    learnerMode: 'simple contextual production, basic transformation, longer everyday listening and reading',
    exerciseCountRange: [8, 10],
    preferredTypes: ['vocabulary_choice', 'gap_fill', 'listen_for_detail', 'reading_main_idea', 'grammar_gap', 'guided_speaking', 'functional_writing', 'lesson_test'],
    avoidTypes: ['subtext_inference', 'irony_interpretation', 'source_synthesis', 'expert_roleplay'],
  },
  B1: {
    band: 'B1',
    learnerMode: 'context, functional communication, short inference, controlled production',
    exerciseCountRange: [9, 11],
    preferredTypes: ['vocabulary_in_context', 'collocation_choice', 'listening_inference', 'reading_inference', 'sentence_transformation', 'error_correction', 'scenario_response', 'functional_writing', 'lesson_test'],
    avoidTypes: ['irony_interpretation', 'expert_roleplay'],
  },
  B2: {
    band: 'B2',
    learnerMode: 'inference, paraphrase, error correction, extended response, argument structure',
    exerciseCountRange: [9, 11],
    preferredTypes: ['paraphrase_choice', 'speaker_intention', 'reading_inference', 'reference_tracking', 'contextual_grammar', 'guided_argument', 'extended_speaking', 'functional_writing', 'lesson_test'],
    avoidTypes: ['sentence_order'],
  },
  C1: {
    band: 'C1',
    learnerMode: 'stance, register, implicit meaning, synthesis, complex reformulation',
    exerciseCountRange: [8, 10],
    preferredTypes: ['stance_detection', 'subtext_inference', 'register_shift', 'precision_rewrite', 'argument_repair', 'source_synthesis', 'strategic_response', 'advanced_writing', 'lesson_test'],
    avoidTypes: ['sentence_order', 'dictation_sentence', 'dictation_word', 'dictation_gap'],
  },
  C2: {
    band: 'C2',
    learnerMode: 'subtext, rhetorical precision, ambiguity, multi-source synthesis, expert debate, discourse strategy',
    exerciseCountRange: [8, 10],
    preferredTypes: ['stance_detection', 'subtext_inference', 'ambiguity_analysis', 'rhetorical_effect', 'comparative_reading', 'argument_repair', 'register_shift', 'precision_rewrite', 'source_synthesis', 'expert_roleplay', 'lesson_test'],
    avoidTypes: ['sentence_order', 'dictation_sentence', 'dictation_word', 'dictation_gap'],
  },
};

export function getScoringMode(type: ExerciseType): ScoringMode {
  return EXERCISE_TAXONOMY.find((entry) => entry.type === type)?.scoringMode ?? 'rule_based';
}

export function getTaxonomyEntry(type: ExerciseType) {
  return EXERCISE_TAXONOMY.find((entry) => entry.type === type) ?? null;
}

export function getCefrRule(band: CefrBand) {
  return CEFR_EXERCISE_RULES[band];
}

export function isAdvancedOnlyExercise(type: ExerciseType) {
  const entry = getTaxonomyEntry(type);
  return entry ? CEFR_ORDER.indexOf(entry.minCefr) >= CEFR_ORDER.indexOf('C1') : false;
}

function taxonomy(
  type: ExerciseType,
  skill: CurriculumSkill,
  scoringMode: ScoringMode,
  minCefr: CefrBand,
  experience: ExerciseTaxonomyEntry['experience'],
  description: string,
): ExerciseTaxonomyEntry {
  return { type, skill, scoringMode, minCefr, experience, description };
}
