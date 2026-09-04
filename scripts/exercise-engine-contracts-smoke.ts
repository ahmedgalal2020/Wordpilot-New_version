import { parseExerciseContract } from '../src/features/training/exerciseContracts';
import { buildTrainingExerciseModel, getTrainingAudioText } from '../src/features/training/exerciseAdapter';
import { getExerciseRendererDefinition } from '../src/features/training/exerciseRendererRegistry';
import { getExercisesForExperience, getExperienceForExercise } from '../src/features/training/registry';
import type { CurriculumExercise, CurriculumLesson, ExerciseType } from '../src/lib/curriculumCore';

const lesson = makeLesson();

expect(parseExerciseContract(makeExercise('gap-invalid', 'grammar_gap', 'grammar', { prompt: 'She is my teacher.' }, 'is')).kind === 'invalid', 'grammar_gap without a blank is not rendered as generic multiple choice.');
expect(parseExerciseContract(makeExercise('gap-valid', 'grammar_gap', 'grammar', { template: 'She ___ my teacher.' }, 'is')).kind === 'gap_fill', 'grammar_gap with a blank renders as gap fill.');
expect(parseExerciseContract(makeExercise('order-valid', 'sentence_order', 'sentence_building', { targetSentence: "I'm from Brazil." }, "I'm from Brazil.")).kind === 'sentence_order', 'sentence_order renders orderable tokens from exercise-specific target text.');
expect(parseExerciseContract(makeExercise('match-invalid', 'vocabulary_match', 'vocabulary', { question: 'Pick one.' }, 'surname')).kind === 'invalid', 'vocabulary_match requires authored pairs.');
expect(parseExerciseContract(makeExercise('match-valid', 'vocabulary_match', 'vocabulary', { pairs: [{ term: 'surname', meaning: 'family name' }, { term: 'city', meaning: 'large town' }] }, undefined)).kind === 'vocabulary_match', 'vocabulary_match accepts authored pairs.');

const unsafeVocabularyChoice = parseExerciseContract(makeExercise(
  'vocab-choice-invalid',
  'vocabulary_choice',
  'vocabulary',
  { prompt: 'Which word fits?', choices: ['first name', 'surname', 'Introductions', 'A direct factual detail'] },
  'first name',
));
expect(unsafeVocabularyChoice.kind === 'invalid', 'vocabulary_choice rejects choices that look generated from lesson metadata.');

const validReading = parseExerciseContract(makeExercise('reading-valid', 'reading_detail', 'reading', { readingText: 'Mia meets Tom at school.', prompt: 'Where are they?', choices: ['At school', 'At home'] }, 'At school'));
expect(validReading.kind === 'reading' && validReading.sourceText !== validReading.question, 'readingText and reading question remain separate.');

const validListening = parseExerciseContract(makeExercise('listen-valid', 'listen_for_detail', 'listening', { listeningScript: 'Mia says hello at school.', prompt: 'Where is Mia?', choices: ['At school', 'At home'] }, 'At school'));
expect(validListening.kind === 'listening' && validListening.audioText === 'Mia says hello at school.', 'listening audio uses listeningScript.');
expect(getTrainingAudioText('listening', { listeningScript: 'authored audio', targetText: 'correct answer' }) !== 'correct answer', 'correctAnswer never becomes listening audio when listeningScript exists.');

const invalidUnknown = parseExerciseContract(makeExercise('invalid-choice', 'grammar_choice', 'grammar', { prompt: 'Choose.', choices: ['A', 'B'] }, 'C'));
expect(invalidUnknown.kind === 'invalid', 'invalid exercise payload fails gracefully instead of inventing content.');

expect(getExerciseRendererDefinition('grammar_gap').rendererKind === 'completion', 'grammar_gap is not forced into generic multiple choice by registry.');
expect(getExerciseRendererDefinition('sentence_order').rendererKind === 'ordering', 'sentence_order keeps an ordering renderer.');
expect(getExerciseRendererDefinition('guided_writing').rendererKind === 'writing', 'writing workspace remains registered as writing.');
expect(getExerciseRendererDefinition('guided_speaking').rendererKind === 'speaking', 'speaking recording path remains registered as speaking.');
expect(getExerciseRendererDefinition('dictation_sentence').rendererKind === 'dictation', 'Dictation still resolves as dictation.');
expect(getExerciseRendererDefinition('shadowing').rendererKind === 'speaking', 'Shadowing remains separate from generic multiple choice.');

const reviewExercises = getExercisesForExperience(lesson, 'review');
const progressExercises = getExercisesForExperience(lesson, 'progress-check');
expect(reviewExercises.some((exercise) => exercise.type === 'grammar_gap'), 'Review preserves native gap-fill exercises.');
expect(reviewExercises.some((exercise) => exercise.type === 'sentence_order'), 'Review preserves native sentence-order exercises.');
expect(progressExercises.some((exercise) => exercise.type === 'lesson_test') && new Set(progressExercises.map((exercise) => exercise.skill)).size > 1, 'Progress Check preserves native mixed exercises.');

const listeningModel = buildTrainingExerciseModel(lesson, lesson.exercises.find((exercise) => exercise.type === 'listen_for_detail')!, 'listening');
expect(listeningModel.audioText === 'Mia says hello at school.', 'training adapter uses contract audio, not the answer.');
const invalidModel = buildTrainingExerciseModel(lesson, makeExercise('unsafe-model', 'vocabulary_choice', 'vocabulary', { prompt: lesson.canDo, choices: ['first name', 'surname', lesson.theme, 'A direct factual detail'] }, 'first name'), 'review');
expect(invalidModel.contract.kind === 'invalid', 'adapter does not use lesson canDo/theme as an automatic vocabulary interaction.');

console.log('Exercise engine contracts smoke passed: unsafe fallbacks are rejected, native renderers are preserved, and invalid payloads fail gracefully.');

function makeLesson(): CurriculumLesson {
  return {
    id: 'english-a1-lesson-1',
    levelNumber: 1,
    cefrLevel: 'A1',
    cefrSubLevel: '1',
    language: 'English',
    title: 'Lesson 1',
    theme: 'Introductions',
    objective: 'Say your name and ask for another name.',
    canDo: 'I can say my name.',
    grammarFocus: 'be and subject pronouns',
    grammarFocusId: 'be-subject-pronouns',
    targetSentence: 'My name is Mia.',
    readingText: 'Mia meets Tom at school.',
    newVocabulary: [],
    reviewVocabulary: [],
    vocabulary: [],
    chunks: [],
    exampleSentences: [],
    readingQuestions: [],
    listeningScript: 'Mia says hello at school.',
    listeningQuestions: [],
    grammarItems: [],
    writingTask: {},
    speakingTask: { prompt: 'Say your name.', focus: ['clarity'], expectedDuration: '15 seconds', assessmentDimensions: ['clarity'] },
    roleplay: { scenario: 'Meet a classmate.', learnerRole: 'Student', partnerRole: 'Classmate', goal: 'Exchange names.', successCriteria: ['say your name'] },
    exercises: [
      makeExercise('vocab-match', 'vocabulary_match', 'vocabulary', { pairs: [{ term: 'surname', meaning: 'family name' }, { term: 'city', meaning: 'large town' }] }, undefined),
      makeExercise('listen', 'listen_for_detail', 'listening', { listeningScript: 'Mia says hello at school.', prompt: 'Where is Mia?', choices: ['At school', 'At home'] }, 'At school'),
      makeExercise('order', 'sentence_order', 'sentence_building', { targetSentence: "I'm from Brazil." }, "I'm from Brazil."),
      makeExercise('grammar-gap', 'grammar_gap', 'grammar', { template: 'She ___ my teacher.' }, 'is'),
      makeExercise('reading', 'reading_detail', 'reading', { readingText: 'Mia meets Tom at school.', prompt: 'Where are they?', choices: ['At school', 'At home'] }, 'At school'),
      makeExercise('writing', 'guided_writing', 'writing', { prompt: 'Write two sentences introducing yourself.' }, undefined),
      makeExercise('speaking', 'guided_speaking', 'speaking', { speakingTask: { prompt: 'Introduce yourself.', focus: ['name'], expectedDuration: '15 seconds' } }, undefined),
      makeExercise('test', 'lesson_test', 'test', { prompt: 'Complete the mini check.' }, undefined),
    ],
    mastery: { minOverallScore: 75, minSkillScore: 60, vocabularyRequired: 80 },
  };
}

function makeExercise(
  id: string,
  type: ExerciseType,
  skill: CurriculumExercise['skill'],
  content: Record<string, unknown>,
  correctAnswer: CurriculumExercise['correctAnswer'],
): CurriculumExercise {
  return {
    id,
    type,
    skill,
    title: id,
    instruction: 'Complete the authored interaction.',
    content: { language: 'English', ...content },
    correctAnswer,
    scoringRubric: {},
    minScoreToPass: 60,
  };
}

function expect(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
