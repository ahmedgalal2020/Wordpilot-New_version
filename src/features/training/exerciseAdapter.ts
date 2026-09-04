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
};

export function buildTrainingExerciseModel(
  lesson: CurriculumLesson,
  exercise: CurriculumExercise,
  experience: TrainingExperience,
): TrainingExerciseModel {
  const content = exercise.content;
  const language = readLanguage(content.language, lesson.language);
  const targetText = readString(content.targetSentence) || readAnswer(exercise.correctAnswer) || lesson.targetSentence;
  const readingText = readString(content.readingText) || lesson.readingText;
  const listeningScript = readString(content.listeningScript) || lesson.listeningScript;
  const prompt = readString(content.prompt) || readString(content.question) || exercise.instruction || lesson.canDo;
  const writingTask = readObject<WritingTask>(content.writingTask) ?? lesson.writingTask;
  const speakingTask = readObject<SpeakingTask>(content.speakingTask) ?? lesson.speakingTask;
  const roleplay = readObject<RoleplayTask>(content.roleplay) ?? lesson.roleplay;
  const questions = getQuestions(lesson, exercise, experience);

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
    objectivelyScorable: isChoiceType(exercise.type) || questions.length > 0 || exercise.type === 'gap_fill' || exercise.type === 'sentence_order',
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

function getQuestions(lesson: CurriculumLesson, exercise: CurriculumExercise, experience: TrainingExperience): TrainingQuestion[] {
  if (experience === 'reading') return fromChoiceQuestions(lesson.readingQuestions, exercise.id);
  if (experience === 'listening') return fromChoiceQuestions(lesson.listeningQuestions, exercise.id);

  const contentQuestion = readString(exercise.content.question) || readString(exercise.content.prompt);
  const contentChoices = readStringArray(exercise.content.choices);
  const answer = readAnswer(exercise.correctAnswer);

  if (contentQuestion && contentChoices.length > 0 && answer) {
    return [{ id: `${exercise.id}-question`, prompt: contentQuestion, choices: contentChoices, correctAnswer: answer }];
  }

  return [];
}

function fromChoiceQuestions(questions: ChoiceQuestion[], seed: string): TrainingQuestion[] {
  return questions.map((question, index) => ({
    id: `${seed}-${index}`,
    prompt: question.question,
    choices: question.choices,
    correctAnswer: question.answer,
  }));
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
