import { getExerciseAudioText } from '../src/components/ExerciseRenderer';
import type { ExerciseType } from '../src/lib/curriculumCore';

const listeningScript = 'Customer: Hello. I need three coffees and two teas, please.';
const correctAnswer = 'three coffees';
const targetSentence = 'I need two tickets and three bottles of water.';
const prompt = 'How many coffees does the customer want?';

expectAudio('listen_for_detail', listeningScript, 'listen_for_detail with listeningScript uses the actual listening script.');
expectAudio('audio_choice', listeningScript, 'audio_choice with listeningScript uses the actual listening script.');
expectAudio('listen_and_select', listeningScript, 'listen_and_select with listeningScript uses the actual listening script.');

expect(
  getExerciseAudioText('listen_for_detail', { listeningScript, targetText: correctAnswer, targetSentence, prompt }) !== correctAnswer,
  'listening correct_answer is not used as primary audio when listeningScript exists.',
);

expect(
  getExerciseAudioText('listen_for_detail', { targetText: correctAnswer, targetSentence, prompt }) === targetSentence,
  'listening exercise with missing listeningScript uses a safe target sentence fallback.',
);

expect(
  getExerciseAudioText('dictation_sentence', { listeningScript, targetText: correctAnswer, targetSentence, prompt }) === correctAnswer,
  'dictation_sentence keeps the dictation target instead of listeningScript.',
);

expect(
  getExerciseAudioText('pronunciation_repeat', { listeningScript, targetText: correctAnswer, targetSentence, prompt }) === targetSentence,
  'pronunciation_repeat keeps the pronunciation target sentence.',
);

expect(
  getExerciseAudioText('reading_detail', { listeningScript, targetText: correctAnswer, targetSentence, prompt }) === targetSentence,
  'reading exercise does not read reading/listening text as automatic TTS.',
);

console.log('Exercise renderer audio source smoke passed: listening audio uses listeningScript without changing scoring target behavior.');

function expectAudio(type: ExerciseType, expected: string, message: string) {
  expect(getExerciseAudioText(type, { listeningScript, targetText: correctAnswer, targetSentence, prompt }) === expected, message);
}

function expect(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
