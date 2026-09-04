import {
  CURRICULUM_SPEECH_LOCALES,
  type ChoiceQuestion,
  type CurriculumExercise,
  type CurriculumLanguage,
  type CurriculumLesson,
  type RoleplayTask,
  type SpeakingTask,
  type WritingTask,
} from '../../lib/curriculumCore';
import { parseExerciseContract, type ExerciseContract } from './exerciseContracts';
import { getScoringMode } from './exerciseTaxonomy';
import { isChoiceType, type TrainingExperience } from './registry';

export type TrainingQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  correctAnswer: string;
};

export type TrainingExerciseModel = {
  id: string;
  title: string;
  instruction: string;
  experience: TrainingExperience;
  locale: string;
  prompt: string;
  audioText: string;
  targetText: string;
  readingText: string;
  transcript: string;
  questions: TrainingQuestion[];
  writingTask?: WritingTask;
  speakingTask?: SpeakingTask;
  roleplay?: RoleplayTask;
  usefulLanguage: string[];
  minScoreToPass: number;
  objectivelyScorable: boolean;
  contract: ExerciseContract;
};

export function buildTrainingExerciseModel(
  lesson: CurriculumLesson,
  exercise: CurriculumExercise,
  experience: TrainingExperience,
): TrainingExerciseModel {
  const content = exercise.content;
  const contract = parseExerciseContract(exercise);
  const language = readLanguage(content.language, lesson.language);
  const targetText = getContractTargetText(contract);
  const readingText = contract.kind === 'reading' ? contract.sourceText : '';
  const listeningScript = contract.kind === 'listening' ? contract.audioText : '';
  const prompt = getContractPrompt(contract) || exercise.instruction;
  const writingTask = readObject<WritingTask>(content.writingTask) ?? lesson.writingTask;
  const speakingTask = readObject<SpeakingTask>(content.speakingTask) ?? lesson.speakingTask;
  const roleplay = readObject<RoleplayTask>(content.roleplay) ?? lesson.roleplay;
  const questions = getQuestions(exercise, contract);

  return {
    id: exercise.id,
    title: exercise.title,
    instruction: exercise.instruction,
    experience,
    locale: readString(content.locale) || CURRICULUM_SPEECH_LOCALES[language],
    prompt,
    audioText: getTrainingAudioText(experience, { listeningScript, targetText, prompt }),
    targetText,
    readingText,
    transcript: listeningScript,
    questions,
    writingTask,
    speakingTask,
    roleplay,
    usefulLanguage: getUsefulLanguage(lesson, writingTask, roleplay),
    minScoreToPass: exercise.minScoreToPass,
    objectivelyScorable: getScoringMode(exercise.type) !== 'subjective' && (isChoiceType(exercise.type) || questions.length > 0 || exercise.type === 'gap_fill' || exercise.type === 'sentence_order'),
    contract,
  };
}

export function getTrainingAudioText(
  experience: TrainingExperience,
  sources: { listeningScript?: string; targetText?: string; prompt?: string },
) {
  const listeningScript = sources.listeningScript?.trim() ?? '';
  const targetText = sources.targetText?.trim() ?? '';
  const prompt = sources.prompt?.trim() ?? '';

  if (experience === 'listening') return listeningScript || targetText || prompt;
  if (experience === 'speaking') return targetText || prompt;
  return targetText || prompt;
}

export function scoreTrainingChoice(model: TrainingExerciseModel, selected: string) {
  const question = model.questions[0];
  if (!question) return { score: 0, passed: false, feedback: 'No objective question is available for this item.' };

  const correct = normalize(selected) === normalize(question.correctAnswer);
  return {
    score: correct ? 100 : 0,
    passed: correct,
    feedback: correct ? 'Correct. Good comprehension.' : `Try again. Correct answer: ${question.correctAnswer}`,
  };
}

function getQuestions(exercise: CurriculumExercise, contract: ExerciseContract): TrainingQuestion[] {
  if (contract.kind === 'multiple_choice') {
    return [{ id: `${exercise.id}-question`, prompt: contract.prompt, choices: contract.choices, correctAnswer: contract.correctAnswer }];
  }
  if (contract.kind === 'reading') {
    return [{ id: `${exercise.id}-question`, prompt: contract.question, choices: contract.choices, correctAnswer: contract.correctAnswer }];
  }
  if (contract.kind === 'listening') {
    return [{ id: `${exercise.id}-question`, prompt: contract.question, choices: contract.choices, correctAnswer: contract.correctAnswer }];
  }

  return [];
}

function getUsefulLanguage(lesson: CurriculumLesson, writingTask?: WritingTask, roleplay?: RoleplayTask) {
  const taskLanguage = [
    ...(writingTask?.usefulLanguage ?? []),
    ...(roleplay?.successCriteria ?? []),
    ...lesson.chunks.map((chunk) => chunk.phrase),
  ];
  return [...new Set(taskLanguage)].slice(0, 8);
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function readObject<T>(value: unknown): T | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : undefined;
}

function readAnswer(value: CurriculumExercise['correctAnswer']) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return String(value[0] ?? '');
  if (value && typeof value === 'object') return readString((value as Record<string, unknown>).answer);
  return '';
}

function readLanguage(value: unknown, fallback: CurriculumLanguage): CurriculumLanguage {
  return value === 'English' || value === 'German' || value === 'Spanish' || value === 'Italian' || value === 'French' ? value : fallback;
}

function normalize(value: string) {
  return value.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}\s]/gu, '').trim();
}

function getContractPrompt(contract: ExerciseContract) {
  if (contract.kind === 'invalid') return '';
  if (contract.kind === 'multiple_choice') return contract.prompt;
  if (contract.kind === 'gap_fill') return contract.template;
  if (contract.kind === 'sentence_order') return contract.correctAnswer;
  if (contract.kind === 'vocabulary_match') return 'Match each term to its meaning.';
  if (contract.kind === 'reading') return contract.question;
  if (contract.kind === 'listening') return contract.question;
  if (contract.kind === 'dictation') return 'Type exactly what you hear.';
  if (contract.kind === 'pronunciation') return contract.targetText;
  if (contract.kind === 'speaking') return contract.prompt;
  return contract.prompt;
}

function getContractTargetText(contract: ExerciseContract) {
  if (contract.kind === 'sentence_order') return contract.correctAnswer;
  if (contract.kind === 'dictation') return contract.acceptedAnswers[0] ?? '';
  if (contract.kind === 'pronunciation') return contract.targetText;
  if (contract.kind === 'gap_fill') return contract.acceptedAnswers[0] ?? '';
  if (contract.kind === 'multiple_choice') return contract.correctAnswer;
  if (contract.kind === 'reading') return contract.correctAnswer;
  if (contract.kind === 'listening') return contract.correctAnswer;
  return '';
}
