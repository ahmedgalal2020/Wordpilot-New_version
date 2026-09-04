import type { CurriculumExercise, ExerciseType } from '../../lib/curriculumCore';
import { getExerciseRendererKind } from './exerciseRendererRegistry';
import { getScoringMode } from './exerciseTaxonomy';

export type ExerciseContract =
  | { kind: 'multiple_choice'; prompt: string; choices: string[]; correctAnswer: string; explanation?: string }
  | { kind: 'gap_fill'; template: string; acceptedAnswers: string[]; choices?: string[] }
  | { kind: 'sentence_order'; tokens: string[]; correctAnswer: string }
  | { kind: 'vocabulary_match'; pairs: Array<{ term: string; meaning: string }> }
  | { kind: 'reading'; sourceText: string; question: string; choices: string[]; correctAnswer: string; explanation?: string }
  | { kind: 'listening'; audioText: string; question: string; choices: string[]; correctAnswer: string; explanation?: string }
  | { kind: 'dictation'; audioText: string; acceptedAnswers: string[] }
  | { kind: 'pronunciation'; targetText: string; audioText: string; focus: string[] }
  | { kind: 'speaking'; prompt: string; goal: string; focus: string[]; expectedDuration?: string }
  | { kind: 'writing'; prompt: string; purpose?: string; suggestedLength?: string; criteria: string[] }
  | { kind: 'invalid'; reason: string; missing: string[] };

const UNSAFE_GENERATED_CHOICE_PATTERNS = [
  /core vocabulary for/i,
  /target level/i,
  /billing error/i,
  /sports result/i,
  /holiday package/i,
  /change the target language/i,
  /skip the lesson/i,
  /direct factual detail/i,
  /unsupported claim/i,
  /register mismatch/i,
];

export function parseExerciseContract(exercise: CurriculumExercise): ExerciseContract {
  if (exercise.type === 'vocabulary_match') return parseVocabularyMatch(exercise);
  if (exercise.type === 'gap_fill' || exercise.type === 'grammar_gap' || exercise.type === 'dictation_gap') return parseGapFill(exercise);
  if (exercise.type === 'sentence_order') return parseSentenceOrder(exercise);
  if (isReadingType(exercise.type)) return parseReading(exercise);
  if (isListeningType(exercise.type)) return parseListening(exercise);
  if (isDictationType(exercise.type)) return parseDictation(exercise);
  if (isPronunciationType(exercise.type)) return parsePronunciation(exercise);
  if (getExerciseRendererKind(exercise.type) === 'speaking') return parseSpeaking(exercise);
  if (getExerciseRendererKind(exercise.type) === 'writing') return parseWriting(exercise);
  if (getScoringMode(exercise.type) === 'objective') return parseMultipleChoice(exercise);
  return invalid('No renderer contract exists for this exercise type.', ['supported contract']);
}

export function isInvalidExerciseContract(contract: ExerciseContract): contract is Extract<ExerciseContract, { kind: 'invalid' }> {
  return contract.kind === 'invalid';
}

type MultipleChoiceContract = Extract<ExerciseContract, { kind: 'multiple_choice' }>;
type InvalidContract = Extract<ExerciseContract, { kind: 'invalid' }>;

function parseMultipleChoice(exercise: CurriculumExercise): MultipleChoiceContract | InvalidContract {
  const prompt = readString(exercise.content.prompt) || readString(exercise.content.question);
  const choices = readStringArray(exercise.content.choices);
  const correctAnswer = readAnswer(exercise.correctAnswer);
  const explanation = readString(exercise.content.explanation);
  const missing = [
    ...(!prompt ? ['prompt'] : []),
    ...(choices.length < 2 ? ['choices'] : []),
    ...(!correctAnswer ? ['correctAnswer'] : []),
    ...(correctAnswer && choices.length >= 2 && !choices.some((choice) => same(choice, correctAnswer)) ? ['correctAnswer in choices'] : []),
    ...(hasUnsafeGeneratedChoices(choices) ? ['authored choices'] : []),
  ];
  return missing.length ? invalid('Multiple-choice exercise payload is incomplete or appears generated from unrelated metadata.', missing) : { kind: 'multiple_choice', prompt, choices, correctAnswer, explanation };
}

function parseGapFill(exercise: CurriculumExercise): ExerciseContract {
  const template = readString(exercise.content.template) || readString(exercise.content.prompt);
  const acceptedAnswers = readAnswers(exercise.acceptableAnswers, exercise.correctAnswer);
  const choices = readStringArray(exercise.content.choices);
  const missing = [
    ...(!template || !template.includes('___') ? ['template with blank'] : []),
    ...(acceptedAnswers.length === 0 ? ['acceptedAnswers'] : []),
    ...(choices.length > 0 && hasUnsafeGeneratedChoices(choices) ? ['authored choices'] : []),
  ];
  return missing.length ? invalid('Gap-fill exercise needs a real blank and accepted answers.', missing) : { kind: 'gap_fill', template, acceptedAnswers, choices: choices.length ? choices : undefined };
}

function parseSentenceOrder(exercise: CurriculumExercise): ExerciseContract {
  const tokens = readTokenList(exercise.content.segments) || readTokenList(exercise.content.tokens) || readTokenList(exercise.content.orderTokens);
  const targetText = readString(exercise.content.targetText) || readString(exercise.content.targetSentence);
  const safeTokens = tokens ?? (targetText ? targetText.split(/\s+/).filter(Boolean) : []);
  const correctAnswer = targetText || safeTokens.join(' ');
  const missing = [
    ...(safeTokens.length < 2 ? ['tokens'] : []),
    ...(!correctAnswer ? ['correctAnswer'] : []),
  ];
  return missing.length ? invalid('Sentence-order exercise needs exercise-specific ordered tokens.', missing) : { kind: 'sentence_order', tokens: safeTokens, correctAnswer };
}

function parseVocabularyMatch(exercise: CurriculumExercise): ExerciseContract {
  const pairs = readPairs(exercise.content.pairs);
  return pairs.length < 2
    ? invalid('Vocabulary match requires authored term/meaning pairs.', ['pairs'])
    : { kind: 'vocabulary_match', pairs };
}

function parseReading(exercise: CurriculumExercise): ExerciseContract {
  const sourceText = readString(exercise.content.sourceText) || readString(exercise.content.readingText);
  const base = parseMultipleChoice(exercise);
  if (base.kind === 'invalid' || !sourceText) {
    return invalid('Reading exercise needs separate source text, question, choices, and answer.', [
      ...(!sourceText ? ['sourceText'] : []),
      ...(base.kind === 'invalid' ? base.missing : []),
    ]);
  }
  return { kind: 'reading', sourceText, question: base.prompt, choices: base.choices, correctAnswer: base.correctAnswer, explanation: base.explanation };
}

function parseListening(exercise: CurriculumExercise): ExerciseContract {
  const audioText = readString(exercise.content.audioText) || readString(exercise.content.listeningScript) || readString(exercise.content.sourceText);
  const base = parseMultipleChoice(exercise);
  if (base.kind === 'invalid' || !audioText) {
    return invalid('Listening exercise needs authored audio text plus a separate question.', [
      ...(!audioText ? ['audioText'] : []),
      ...(base.kind === 'invalid' ? base.missing : []),
    ]);
  }
  return { kind: 'listening', audioText, question: base.prompt, choices: base.choices, correctAnswer: base.correctAnswer, explanation: base.explanation };
}

function parseDictation(exercise: CurriculumExercise): ExerciseContract {
  const audioText = readString(exercise.content.audioText) || readString(exercise.content.targetText) || readString(exercise.content.targetSentence);
  const acceptedAnswers = readAnswers(exercise.acceptableAnswers, exercise.correctAnswer || audioText);
  const missing = [
    ...(!audioText ? ['audioText'] : []),
    ...(acceptedAnswers.length === 0 ? ['acceptedAnswers'] : []),
  ];
  return missing.length ? invalid('Dictation requires exercise-specific audio text and accepted answer.', missing) : { kind: 'dictation', audioText, acceptedAnswers };
}

function parsePronunciation(exercise: CurriculumExercise): ExerciseContract {
  const targetText = readString(exercise.content.targetText) || readString(exercise.content.targetSentence);
  const audioText = readString(exercise.content.audioText) || targetText;
  const focus = readStringArray(exercise.content.focus);
  const missing = [...(!targetText ? ['targetText'] : []), ...(!audioText ? ['audioText'] : [])];
  return missing.length ? invalid('Pronunciation requires target text and model audio text.', missing) : { kind: 'pronunciation', targetText, audioText, focus };
}

function parseSpeaking(exercise: CurriculumExercise): ExerciseContract {
  const task = readRecord(exercise.content.speakingTask);
  const roleplay = readRecord(exercise.content.roleplay);
  const prompt = readString(exercise.content.prompt) || readString(task?.prompt) || readString(roleplay?.scenario);
  const goal = readString(exercise.content.goal) || readString(roleplay?.goal) || readString(task?.focus);
  const focus = readStringArray(exercise.content.focus).concat(readStringArray(task?.focus));
  const expectedDuration = readString(exercise.content.expectedDuration) || readString(task?.expectedDuration);
  const missing = [...(!prompt ? ['prompt'] : []), ...(!goal ? ['goal'] : [])];
  return missing.length ? invalid('Speaking exercise requires its own prompt and goal.', missing) : { kind: 'speaking', prompt, goal, focus: unique(focus), expectedDuration };
}

function parseWriting(exercise: CurriculumExercise): ExerciseContract {
  const task = readRecord(exercise.content.writingTask);
  const prompt = readString(exercise.content.prompt) || readString(task?.prompt) || readString(task?.situation);
  const purpose = readString(exercise.content.purpose) || readString(task?.purpose);
  const suggestedLength = readString(exercise.content.suggestedLength) || readString(task?.approximateLength) || readString(task?.expectedOutput);
  const criteria = readStringArray(exercise.content.criteria).concat(readStringArray(task?.assessmentDimensions));
  const missing = !prompt ? ['prompt'] : [];
  return missing.length ? invalid('Writing exercise requires its own prompt.', missing) : { kind: 'writing', prompt, purpose, suggestedLength, criteria: unique(criteria) };
}

function invalid(reason: string, missing: string[]): InvalidContract {
  return { kind: 'invalid', reason, missing };
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

function readAnswer(value: CurriculumExercise['correctAnswer']) {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return String(value[0] ?? '').trim();
  if (value && typeof value === 'object') return readString((value as Record<string, unknown>).answer);
  return '';
}

function readAnswers(acceptableAnswers: string[] | undefined, correctAnswer: CurriculumExercise['correctAnswer']) {
  return unique([...(acceptableAnswers ?? []), readAnswer(correctAnswer)].filter(Boolean));
}

function readTokenList(value: unknown) {
  if (!Array.isArray(value)) return null;
  const tokens = value
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') return readString((item as Record<string, unknown>).word);
      return '';
    })
    .filter(Boolean);
  return tokens.length ? tokens : null;
}

function readPairs(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const pair = item as Record<string, unknown>;
      const term = readString(pair.term) || readString(pair.word);
      const meaning = readString(pair.meaning) || readString(pair.translation);
      return term && meaning ? { term, meaning } : null;
    })
    .filter((item): item is { term: string; meaning: string } => Boolean(item));
}

function readRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function hasUnsafeGeneratedChoices(choices: string[]) {
  return choices.some((choice) => UNSAFE_GENERATED_CHOICE_PATTERNS.some((pattern) => pattern.test(choice)));
}

function isReadingType(type: ExerciseType) {
  return ['reading_main_idea', 'reading_detail', 'reading_true_false', 'reading_heading_match', 'reading_inference', 'reference_tracking', 'stance_detection', 'irony_interpretation', 'ambiguity_analysis', 'hidden_assumption', 'rhetorical_effect', 'comparative_reading'].includes(type);
}

function isListeningType(type: ExerciseType) {
  return ['audio_choice', 'listen_and_select', 'listen_for_detail', 'listening_inference', 'speaker_intention', 'subtext_inference'].includes(type);
}

function isDictationType(type: ExerciseType) {
  return ['dictation_word', 'dictation_sentence'].includes(type);
}

function isPronunciationType(type: ExerciseType) {
  return ['pronunciation_repeat', 'minimal_pairs', 'shadowing'].includes(type);
}

function same(left: string, right: string) {
  return normalize(left) === normalize(right);
}

function normalize(value: string) {
  return value.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}\s]/gu, '').trim();
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
