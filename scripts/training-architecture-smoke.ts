import { readFileSync } from 'node:fs';
import { buildTrainingExerciseModel, getTrainingAudioText } from '../src/features/training/exerciseAdapter';
import { getExercisesForExperience, getTrainingRoute } from '../src/features/training/registry';
import type { CurriculumExercise, CurriculumLesson } from '../src/lib/curriculumCore';

const lesson = makeLesson();
const listening = lesson.exercises.find((exercise) => exercise.skill === 'listening')!;
const reading = lesson.exercises.find((exercise) => exercise.skill === 'reading')!;
const writing = lesson.exercises.find((exercise) => exercise.skill === 'writing')!;
const speaking = lesson.exercises.find((exercise) => exercise.skill === 'speaking')!;

const listeningRoute = getTrainingRoute({
  experience: 'listening',
  language: 'English',
  levelNumber: 1,
  lessonId: lesson.id,
  exerciseId: listening.id,
});
const readingRoute = getTrainingRoute({ experience: 'reading', language: 'English', levelNumber: 1, lessonId: lesson.id, exerciseId: reading.id });
const writingRoute = getTrainingRoute({ experience: 'writing', language: 'English', levelNumber: 1, lessonId: lesson.id, exerciseId: writing.id });

expect(!listeningRoute.includes('/workspace'), 'Listening must not route to the dictation workspace.');
expect(!readingRoute.includes('/workspace'), 'Reading must not route to the dictation workspace.');
expect(!writingRoute.includes('/workspace'), 'Writing must not route to the dictation workspace.');
expect(getTrainingAudioText('listening', { listeningScript: 'real listening script', targetText: 'wrong target' }) === 'real listening script', 'Listening audio must use listeningScript.');

const listeningModel = buildTrainingExerciseModel(lesson, listening, 'listening');
const readingModel = buildTrainingExerciseModel(lesson, reading, 'reading');
const writingModel = buildTrainingExerciseModel(lesson, writing, 'writing');
const speakingModel = buildTrainingExerciseModel(lesson, speaking, 'speaking');

expect(listeningModel.audioText === lesson.listeningScript, 'Listening model should expose the authored listening script as audio.');
expect(readingModel.readingText.length > 0 && readingModel.readingText !== readingModel.questions[0]?.prompt, 'Reading model should keep readingText separate from the question.');
expect(readingModel.questions[0]?.prompt === lesson.readingQuestions[0].question, 'Reading model should expose the actual reading question separately.');
expect(Boolean(writingModel.writingTask?.prompt), 'Writing model should expose writingTask.');
expect(Boolean(speakingModel.roleplay?.scenario || speakingModel.speakingTask?.prompt), 'Speaking model should expose speaking task or roleplay.');
expect(getExercisesForExperience(lesson, 'review').length >= 2, 'Review should render mixed exercise types.');
expect(new Set(getExercisesForExperience(lesson, 'progress-check').map((exercise) => exercise.skill)).size > 1, 'Progress Check should contain more than one skill.');

const appSource = readFileSync('src/App.tsx', 'utf8');
const trainingPageSource = readFileSync('src/features/training/PracticeTrainingPage.tsx', 'utf8');
expect(appSource.includes('/practice/:experience/:language/:levelNumber/:lessonId/:exerciseId'), 'Direct practice route should be registered.');
expect(!trainingPageSource.includes("from '../../lib/curriculum'"), 'Training page must not import local generated curriculum fallback.');
expect(trainingPageSource.includes('cursor-pointer') && trainingPageSource.includes('disabled:cursor-not-allowed'), 'Training CTAs should expose pointer and disabled cursor states.');

console.log('Training architecture smoke passed: skill routes, adapters, direct loading, and UX affordances are separated.');

function makeLesson(): CurriculumLesson {
  return {
    id: 'english-a1-lesson-1',
    levelNumber: 1,
    cefrLevel: 'A1',
    cefrSubLevel: '1',
    language: 'English',
    title: 'Lesson 1',
    theme: 'Daily greetings',
    objective: 'Greet someone and answer a simple question.',
    canDo: 'I can greet someone politely.',
    grammarFocus: 'be in simple present',
    grammarFocusId: 'simple-present-be',
    targetSentence: 'Good morning, I am ready.',
    readingText: 'Mia meets Tom at school. She says good morning and asks how he is.',
    newVocabulary: [],
    reviewVocabulary: [],
    vocabulary: [],
    chunks: [{ phrase: 'Good morning', meaning: 'greeting', example: 'Good morning, Tom.' }],
    exampleSentences: ['Good morning, I am Mia.'],
    readingQuestions: [{ question: 'Where does Mia meet Tom?', answer: 'At school', choices: ['At school', 'At home', 'At the station'] }],
    listeningScript: 'Good morning. I am Mia, and I am ready for class.',
    listeningQuestions: [{ question: 'What is Mia ready for?', answer: 'Class', choices: ['Class', 'Lunch', 'Travel'] }],
    grammarItems: [{ question: 'I ___ ready.', answer: 'am', choices: ['am', 'is', 'are'] }],
    writingTask: { prompt: 'Write two simple greetings.', purpose: 'Practice greeting language.', approximateLength: '2 sentences' },
    speakingTask: { prompt: 'Greet a classmate.', focus: ['greeting'], expectedDuration: '20 seconds', assessmentDimensions: ['clarity'] },
    roleplay: {
      scenario: 'You meet a classmate before class.',
      learnerRole: 'Student A',
      partnerRole: 'Student B',
      goal: 'Greet and answer how you are.',
      successCriteria: ['Use a greeting'],
    },
    exercises: [
      makeExercise('listen-1', 'listening', 'listen_for_detail', { listeningScript: 'Good morning. I am Mia, and I am ready for class.', prompt: 'What is Mia ready for?' }, 'Class'),
      makeExercise('dictation-1', 'dictation', 'dictation_sentence', { targetSentence: 'Good morning, I am ready.' }, 'Good morning, I am ready.'),
      makeExercise('reading-1', 'reading', 'reading_detail', { readingText: 'Mia meets Tom at school.', prompt: 'Where does Mia meet Tom?' }, 'At school'),
      makeExercise('speaking-1', 'speaking', 'guided_speaking', { prompt: 'Greet a classmate.' }, undefined),
      makeExercise('writing-1', 'writing', 'guided_writing', { prompt: 'Write two simple greetings.' }, undefined),
      makeExercise('grammar-1', 'grammar', 'grammar_choice', { question: 'I ___ ready.', choices: ['am', 'is', 'are'] }, 'am'),
      makeExercise('vocab-1', 'vocabulary', 'vocabulary_match', { question: 'Choose the greeting.', choices: ['Good morning', 'Goodbye'] }, 'Good morning'),
      makeExercise('test-1', 'test', 'lesson_test', { prompt: 'Complete the mini check.' }, undefined),
    ],
    mastery: { minOverallScore: 75, minSkillScore: 60, vocabularyRequired: 80 },
  };
}

function makeExercise(
  id: string,
  skill: CurriculumExercise['skill'],
  type: CurriculumExercise['type'],
  content: Record<string, unknown>,
  correctAnswer: CurriculumExercise['correctAnswer'],
): CurriculumExercise {
  return {
    id,
    skill,
    type,
    title: id,
    instruction: 'Complete the task.',
    content: {
      language: 'English',
      choices: ['Class', 'Lunch', 'Travel', 'At school', 'At home', 'am', 'is', 'are', 'Good morning', 'Goodbye'],
      ...content,
    },
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
