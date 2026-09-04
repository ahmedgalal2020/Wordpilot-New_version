import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Award, CheckCircle, Mic, Play, RotateCcw, Sparkles, Target, Volume2 } from 'lucide-react';
import { CURRICULUM_SPEECH_LOCALES, type CurriculumExercise, type CurriculumLanguage, type ExerciseType, type ScoringRubric } from '../lib/curriculumCore';
import { isInvalidExerciseContract, parseExerciseContract, type ExerciseContract } from '../features/training/exerciseContracts';
import { getExerciseRendererKind } from '../features/training/exerciseRendererRegistry';
import { getScoringMode } from '../features/training/exerciseTaxonomy';
import { cn } from '../lib/utils';

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives?: number;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionResultEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export type ExerciseResult = {
  score: number;
  feedback: string;
  rubricScores: ScoringRubric;
  response: Record<string, unknown>;
  passed: boolean;
};

type ExerciseRendererProps = {
  exercise: CurriculumExercise;
  onComplete: (result: ExerciseResult) => void;
  onNext?: () => void;
  hasNext?: boolean;
  autoAdvanceOnPass?: boolean;
};

type OrderToken = {
  id: string;
  word: string;
};

export function ExerciseRenderer({ exercise, onComplete, onNext, hasNext = false, autoAdvanceOnPass = true }: ExerciseRendererProps) {
  const [selected, setSelected] = useState<string>('');
  const [orderedTokens, setOrderedTokens] = useState<OrderToken[]>([]);
  const [textResponse, setTextResponse] = useState('');
  const [spokenResponse, setSpokenResponse] = useState('');
  const [selfChecks, setSelfChecks] = useState<Record<string, boolean>>({});
  const [lastResult, setLastResult] = useState<ExerciseResult | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const speechWindow = typeof window !== 'undefined' ? (window as unknown as SpeechWindow) : null;
  const speechRecognitionAvailable = Boolean(speechWindow?.SpeechRecognition || speechWindow?.webkitSpeechRecognition);

  const model = useMemo(() => buildExerciseModel(exercise), [exercise]);
  const rendererKind = getExerciseRendererKind(exercise.type);
  const scoringMode = getScoringMode(exercise.type);
  const isWriting = rendererKind === 'writing';
  const isSpeaking = rendererKind === 'speaking';
  const isDictation = rendererKind === 'dictation';
  const needsTextInput = isWriting || isSpeaking || isDictation || exercise.type === 'gap_fill' || exercise.type === 'grammar_gap' || scoringMode === 'subjective' || exercise.type === 'lesson_test';
  const needsChoices = isChoiceExercise(exercise.type);
  const needsOrdering = rendererKind === 'ordering';
  const invalidContract = isInvalidExerciseContract(model.contract);

  useEffect(() => {
    clearAutoAdvanceTimer();
    setSelected('');
    setOrderedTokens([]);
    setTextResponse('');
    setSpokenResponse('');
    setSelfChecks({});
    setLastResult(null);
    stopRecognition();
  }, [exercise.id]);

  useEffect(() => () => clearAutoAdvanceTimer(), []);

  function speak(text: string) {
    if (!('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.lang = model.locale;
    window.speechSynthesis.speak(utterance);
  }

  function startRecognition() {
    if (!speechRecognitionAvailable) {
      return;
    }

    const RecognitionCtor = speechWindow?.SpeechRecognition ?? speechWindow?.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      return;
    }
    const recognition = new RecognitionCtor() as SpeechRecognitionLike;
    recognition.lang = model.locale;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      setSpokenResponse(transcript);
      setTextResponse(transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopRecognition() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }

  function addOrderedToken(token: OrderToken) {
    setOrderedTokens((current) => (current.some((item) => item.id === token.id) ? current : [...current, token]));
  }

  function submit() {
    const response = buildResponse();
    const result = scoreExercise(exercise, model, response);
    setLastResult(result);
    onComplete(result);
    void celebrateExerciseResult(result.score);

    if (result.passed && hasNext && autoAdvanceOnPass && onNext) {
      clearAutoAdvanceTimer();
      autoAdvanceTimerRef.current = window.setTimeout(onNext, 1100);
    }
  }

  function clearAutoAdvanceTimer() {
    if (autoAdvanceTimerRef.current !== null) {
      window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  }

  function buildResponse() {
    if (needsChoices) return { selected };
    if (needsOrdering) return { ordered: orderedTokens.map((token) => token.word), orderedTokenIds: orderedTokens.map((token) => token.id) };
    if (isSpeaking) return { transcript: spokenResponse || textResponse, selfChecks };
    return { text: textResponse };
  }

  const resultEncouragement = lastResult ? getExerciseEncouragement(lastResult.score, exercise.minScoreToPass) : null;
  const ResultIcon = resultEncouragement?.icon ?? Target;

  return (
    <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/10 p-5 sm:p-6 whisper-shadow">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary">{formatExerciseType(exercise.type)}</p>
          <h3 className="mt-2 font-headline font-black text-2xl text-on-surface">{exercise.title}</h3>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">{exercise.instruction}</p>
        </div>
        <span className="inline-flex shrink-0 rounded-full bg-primary-container px-3 py-1 text-xs font-bold text-primary">
          Pass {exercise.minScoreToPass}%
        </span>
      </div>

      <div className="mt-5 rounded-2xl bg-surface-container-low p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Prompt</p>
        {invalidContract ? (
          <InvalidExerciseState exercise={exercise} contract={model.contract} />
        ) : (
          <p className="mt-2 text-base leading-7 text-on-surface">{model.prompt}</p>
        )}
        {!invalidContract && (exercise.type.includes('audio') || exercise.type.includes('listen') || exercise.type === 'subtext_inference' || isDictation || isSpeaking) && (
          <button
            type="button"
            onClick={() => speak(model.audioText)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-on-primary"
          >
            <Volume2 className="h-4 w-4" />
            Play audio
          </button>
        )}
      </div>

      {!invalidContract && needsChoices && (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {model.choices.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => setSelected(choice)}
              className={cn(
                'rounded-2xl border px-4 py-3 text-left text-sm font-bold transition',
                selected === choice ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant/20 bg-surface-container-low text-on-surface',
              )}
            >
              {choice}
            </button>
          ))}
        </div>
      )}

      {!invalidContract && needsOrdering && (
        <div className="mt-5 space-y-4">
          <div className="flex min-h-14 flex-wrap gap-2 rounded-2xl bg-surface-container-low p-3">
            {orderedTokens.length === 0 ? (
              <span className="text-sm text-on-surface-variant">Build the sentence here.</span>
            ) : (
              orderedTokens.map((token) => (
                <span key={token.id} className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-on-primary">{token.word}</span>
              ))
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {model.orderTokens.map((token) => (
              <button
                key={token.id}
                type="button"
                disabled={orderedTokens.some((item) => item.id === token.id)}
                onClick={() => addOrderedToken(token)}
                className="rounded-full bg-surface-container-low px-3 py-2 text-xs font-bold text-on-surface disabled:opacity-40"
              >
                {token.word}
              </button>
            ))}
            <button type="button" onClick={() => setOrderedTokens([])} className="inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-2 text-xs font-bold text-on-surface-variant">
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
        </div>
      )}

      {!invalidContract && isSpeaking && (
        <div className="mt-5 rounded-2xl bg-surface-container-low p-4">
          <div className="flex flex-wrap gap-3">
            {speechRecognitionAvailable ? (
              <button type="button" onClick={startRecognition} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-on-primary">
                <Mic className="h-4 w-4" />
                Record answer
              </button>
            ) : (
              <span className="rounded-full bg-primary-container px-3 py-2 text-xs font-bold text-primary">
                Speech recognition unavailable. Use self-check.
              </span>
            )}
            <button type="button" onClick={() => speak(model.targetText)} className="inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2 text-sm font-bold text-on-surface">
              <Play className="h-4 w-4" />
              Model
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {['pronunciation', 'fluency', 'grammar', 'vocabulary', 'task completion'].map((item) => (
              <label key={item} className="flex items-center gap-2 rounded-xl bg-surface-container-lowest px-3 py-2 text-sm font-semibold text-on-surface">
                <input
                  type="checkbox"
                  checked={Boolean(selfChecks[item])}
                  onChange={(event) => setSelfChecks((current) => ({ ...current, [item]: event.target.checked }))}
                />
                {item}
              </label>
            ))}
          </div>
        </div>
      )}

      {!invalidContract && needsTextInput && (
        <textarea
          value={textResponse}
          onChange={(event) => setTextResponse(event.target.value)}
          rows={isWriting || exercise.type === 'lesson_test' ? 6 : 3}
          className="mt-5 w-full rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm leading-6 text-on-surface outline-none focus:border-primary"
          placeholder={getPlaceholder(exercise.type)}
        />
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={submit} disabled={invalidContract} className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-55">
          Grade exercise
        </button>
        {lastResult && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className={cn(
              'grid max-w-xl grid-cols-[2.75rem_1fr] gap-3 rounded-2xl px-4 py-3 text-sm text-on-surface',
              resultEncouragement?.toneClass,
            )}>
              <span className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', resultEncouragement?.iconClass)}>
                <ResultIcon className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-headline text-base font-black text-on-surface">
                  {lastResult.score}% - {resultEncouragement?.title}
                </span>
                <span className="mt-0.5 block text-sm leading-6 text-on-surface-variant">
                  {resultEncouragement?.body} {lastResult.feedback}
                </span>
              </span>
            </div>
            {hasNext && onNext && (
              <button
                type="button"
                onClick={() => {
                  clearAutoAdvanceTimer();
                  onNext();
                }}
                className="inline-flex items-center justify-center rounded-full bg-surface-container-low px-5 py-3 text-sm font-bold text-on-surface hover:bg-surface-container"
              >
                Next exercise
              </button>
            )}
          </div>
        )}
      </div>
      {lastResult?.passed && hasNext && autoAdvanceOnPass && (
        <p className="mt-3 text-xs font-semibold text-primary">Correct. Moving to the next exercise...</p>
      )}
    </div>
  );
}

function buildExerciseModel(exercise: CurriculumExercise) {
  const content = exercise.content;
  const contract = parseExerciseContract(exercise);
  const vocabulary: string[] = [];
  const chunks: string[] = [];
  const language = readCurriculumLanguage(content.language, inferLanguageFromExerciseId(exercise.id));
  const locale = readString(content.locale) || CURRICULUM_SPEECH_LOCALES[language];
  const prompt = getContractPrompt(contract);
  const targetText = getContractTargetText(contract);
  const choices = getContractChoices(contract);
  const orderTokens = getContractOrderTokens(contract);
  const audioText = getContractAudioText(contract);

  return {
    language,
    locale,
    prompt,
    targetText,
    audioText,
    choices,
    orderTokens,
    vocabulary,
    chunks,
    contract,
  };
}

export function getExerciseAudioText(
  type: ExerciseType,
  sources: { listeningScript?: string; targetText?: string; targetSentence?: string; prompt?: string },
) {
  const listeningScript = sources.listeningScript?.trim() ?? '';
  const targetText = sources.targetText?.trim() ?? '';
  const targetSentence = sources.targetSentence?.trim() ?? '';
  const prompt = sources.prompt?.trim() ?? '';

  if (isListeningComprehensionExercise(type)) {
    return listeningScript || targetSentence || targetText || prompt;
  }

  if (isDictationExercise(type)) {
    return targetText || targetSentence || prompt;
  }

  if (type === 'pronunciation_repeat') {
    return targetSentence || targetText || prompt;
  }

  if (isReadingExercise(type)) {
    return targetSentence || targetText || prompt;
  }

  return targetText || targetSentence || prompt;
}

function scoreExercise(exercise: CurriculumExercise, model: ReturnType<typeof buildExerciseModel>, response: Record<string, unknown>): ExerciseResult {
  if (isChoiceExercise(exercise.type)) {
    const selected = String(response.selected ?? '');
    const correct = normalize(selected) === normalize(model.targetText);
    return result(correct ? 100 : 0, correct ? 'Correct answer.' : `Expected: ${model.targetText}`, response, exercise);
  }

  if (exercise.type === 'sentence_order') {
    const ordered = Array.isArray(response.ordered) ? response.ordered.join(' ') : '';
    const score = wordAccuracy(model.targetText, ordered);
    return result(score, score >= exercise.minScoreToPass ? 'Sentence order is strong.' : `Target order: ${model.targetText}`, response, exercise);
  }

  if (isWritingExercise(exercise.type)) {
    const text = String(response.text ?? '');
    const rubric = scoreRubricText(text, model.vocabulary, 5);
    const score = averageRubric(rubric);
    return { score, feedback: buildWritingFeedback(rubric), rubricScores: rubric, response, passed: score >= exercise.minScoreToPass };
  }

  if (isSpeakingExercise(exercise.type)) {
    const transcript = String(response.transcript ?? '');
    const selfChecks = response.selfChecks && typeof response.selfChecks === 'object' ? response.selfChecks as Record<string, boolean> : {};
    const checkedScore = Math.round((Object.values(selfChecks).filter(Boolean).length / 5) * 50);
    const transcriptScore = transcript ? Math.min(50, wordAccuracy(model.targetText, transcript) / 2 + 20) : 0;
    const score = Math.round(checkedScore + transcriptScore);
    return {
      score,
      feedback: transcript ? 'Speaking scored from transcript plus self-check.' : 'Speaking scored from structured self-check fallback.',
      rubricScores: { pronunciation: checkedScore, fluency: checkedScore, grammar: transcriptScore, vocabulary: transcriptScore, taskCompletion: score },
      response,
      passed: score >= exercise.minScoreToPass,
    };
  }

  const text = String(response.text ?? '');
  if (getScoringMode(exercise.type) === 'subjective') {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const score = words >= 12 ? 100 : words >= 6 ? 75 : words >= 3 ? 60 : 0;
    return {
      score,
      feedback: 'Completed as a self-review task. No fake AI evaluation was generated.',
      rubricScores: { ...exercise.scoringRubric, taskCompletion: score },
      response,
      passed: score >= exercise.minScoreToPass,
    };
  }
  const expected = exercise.type === 'gap_fill' || exercise.type === 'dictation_gap'
    ? model.vocabulary[0] ?? model.targetText
    : model.targetText;
  const score = wordAccuracy(expected, text);
  return result(score, score >= exercise.minScoreToPass ? 'Answer accepted.' : `Expected close to: ${expected}`, response, exercise);
}

function result(score: number, feedback: string, response: Record<string, unknown>, exercise: CurriculumExercise): ExerciseResult {
  const roundedScore = Math.max(0, Math.min(100, Math.round(score)));
  return {
    score: roundedScore,
    feedback,
    rubricScores: { ...exercise.scoringRubric, accuracy: roundedScore },
    response,
    passed: roundedScore >= exercise.minScoreToPass,
  };
}

function scoreRubricText(text: string, vocabulary: string[], minimumWords: number): ScoringRubric {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const vocabularyHits = vocabulary.filter((word) => normalize(text).includes(normalize(word))).length;
  const sentenceCount = text.split(/[.!?]+/).filter((part) => part.trim()).length;
  return {
    taskCompletion: words.length >= minimumWords ? 80 : Math.round((words.length / minimumWords) * 80),
    grammar: sentenceCount > 0 && /^[A-ZÄÖÜ]/.test(text.trim()) ? 75 : 55,
    vocabulary: Math.min(100, vocabularyHits * 25),
    coherence: sentenceCount >= 2 ? 80 : 65,
    spelling: / {2,}|[^\S\r\n]{2,}/.test(text) ? 70 : 85,
    cefrAppropriateness: words.length > 40 ? 85 : 75,
  };
}

function averageRubric(rubric: ScoringRubric) {
  const values = Object.values(rubric).filter((value): value is number => typeof value === 'number');
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

function buildWritingFeedback(rubric: ScoringRubric) {
  const weak = Object.entries(rubric).filter(([, score]) => typeof score === 'number' && score < 70).map(([key]) => key);
  return weak.length ? `Rubric feedback: improve ${weak.join(', ')}.` : 'Rubric feedback: task is complete and appropriate.';
}

function wordAccuracy(expected: string, actual: string) {
  const expectedWords = expected.split(/\s+/).map(normalize).filter(Boolean);
  const actualWords = actual.split(/\s+/).map(normalize).filter(Boolean);
  if (expectedWords.length === 0) return actualWords.length === 0 ? 100 : 0;
  let correct = 0;
  expectedWords.forEach((word, index) => {
    if (word === actualWords[index]) correct += 1;
  });
  const missing = Math.max(0, expectedWords.length - actualWords.length);
  const extra = Math.max(0, actualWords.length - expectedWords.length);
  return Math.max(0, ((correct - missing - extra) / expectedWords.length) * 100);
}

function isReadingExercise(type: ExerciseType) {
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

export function getExerciseEncouragement(score: number, minScoreToPass = 60) {
  const roundedScore = Math.max(0, Math.min(100, Math.round(score)));

  if (roundedScore === 100) {
    return {
      title: 'Perfect work',
      body: 'Brilliant. That answer is exactly where it needs to be.',
      toneClass: 'bg-primary/10 ring-1 ring-primary/15',
      iconClass: 'bg-primary text-on-primary',
      icon: Award,
    };
  }

  if (roundedScore >= 85) {
    return {
      title: 'Excellent progress',
      body: 'Strong answer. You are building real control here.',
      toneClass: 'bg-primary/10 ring-1 ring-primary/15',
      iconClass: 'bg-primary text-on-primary',
      icon: Sparkles,
    };
  }

  if (roundedScore >= minScoreToPass || roundedScore >= 60) {
    return {
      title: 'Good pass',
      body: 'Nice work. This is good enough to move forward, and the feedback shows what to polish next.',
      toneClass: 'bg-primary-container/70 ring-1 ring-primary/10',
      iconClass: 'bg-primary-container text-primary',
      icon: CheckCircle,
    };
  }

  if (roundedScore >= 40) {
    return {
      title: 'Close attempt',
      body: 'You are not far off. Fix the weak part and try once more.',
      toneClass: 'bg-surface-container-low ring-1 ring-outline-variant/15',
      iconClass: 'bg-tertiary-container text-tertiary',
      icon: Target,
    };
  }

  return {
    title: 'Try again',
    body: 'Start with the key words, then rebuild the answer slowly.',
    toneClass: 'bg-surface-container-low ring-1 ring-outline-variant/15',
    iconClass: 'bg-surface-container-high text-on-surface-variant',
    icon: RotateCcw,
  };
}

async function celebrateExerciseResult(score: number) {
  if (typeof window === 'undefined' || score < 60 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const { default: confetti } = await import('canvas-confetti');
  const particleCount = score === 100 ? 90 : score >= 85 ? 60 : 36;
  confetti({
    particleCount,
    spread: score === 100 ? 68 : 48,
    startVelocity: score === 100 ? 38 : 28,
    origin: { y: 0.78 },
    scalar: score === 100 ? 0.9 : 0.75,
  });
}

function isListeningComprehensionExercise(type: ExerciseType) {
  return type === 'audio_choice' || type === 'listen_and_select' || type === 'listen_for_detail' || type === 'listening_inference' || type === 'speaker_intention' || type === 'subtext_inference';
}

function isDictationExercise(type: ExerciseType) {
  return type === 'dictation_word' || type === 'dictation_sentence' || type === 'dictation_gap';
}

function isChoiceExercise(type: ExerciseType) {
  return [
    'vocabulary_match',
    'vocabulary_choice',
    'picture_or_context_match',
    'audio_choice',
    'listen_and_select',
    'listen_for_detail',
    'listening_inference',
    'speaker_intention',
    'grammar_choice',
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

function getPlaceholder(type: ExerciseType) {
  if (type === 'guided_writing') return 'Write your own answer. You are graded by rubric, not exact matching.';
  if (isWritingExercise(type)) return 'Write your answer. This is saved as a self-review task unless AI review is added later.';
  if (isSpeakingExercise(type)) return 'Record or type your spoken response notes.';
  if (type.includes('dictation')) return 'Type exactly what you hear.';
  if (type === 'lesson_test') return 'Write the final lesson answer here.';
  return 'Type your answer.';
}

function formatExerciseType(type: ExerciseType) {
  return type.replace(/_/g, ' ');
}

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function isWritingExercise(type: ExerciseType) {
  return [
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
  ].includes(type);
}

function isSpeakingExercise(type: ExerciseType) {
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

function readCurriculumLanguage(value: unknown, fallback: CurriculumLanguage): CurriculumLanguage {
  const language = String(value);
  if (language === 'English' || language === 'German' || language === 'Spanish' || language === 'Italian' || language === 'French') {
    return language;
  }
  return fallback;
}

function readOrderTokens(value: unknown, targetText: string): OrderToken[] {
  if (Array.isArray(value)) {
    const tokens = value
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const token = item as Record<string, unknown>;
        const id = readString(token.id);
        const word = readString(token.word);
        return id && word ? { id, word } : null;
      })
      .filter((token): token is OrderToken => Boolean(token));

    if (tokens.length > 0) {
      return tokens;
    }
  }

  return targetText.split(/\s+/).filter(Boolean).map((word, index) => ({
    id: `${index}-${normalize(word)}`,
    word,
  }));
}

function normalize(value: string) {
  return value.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}\s]/gu, '').trim();
}

function shuffleUnique(values: string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function shuffleOrderTokens(tokens: OrderToken[]) {
  return [...tokens].sort((left, right) => left.id.localeCompare(right.id));
}

function inferLanguageFromExerciseId(id: string): CurriculumLanguage {
  if (id.startsWith('german')) return 'German';
  if (id.startsWith('spanish')) return 'Spanish';
  if (id.startsWith('italian')) return 'Italian';
  if (id.startsWith('french')) return 'French';
  return 'English';
}

function InvalidExerciseState({ exercise, contract }: { exercise: CurriculumExercise; contract: Extract<ExerciseContract, { kind: 'invalid' }> }) {
  useEffect(() => {
    console.warn('Exercise content unavailable', {
      exerciseId: exercise.id,
      exerciseType: exercise.type,
      missing: contract.missing,
    });
  }, [contract.missing, exercise.id, exercise.type]);

  return (
    <div className="mt-3 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
      <p className="font-headline text-base font-black text-on-surface">Exercise content unavailable</p>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">
        This exercise needs authored content before it can be shown safely.
      </p>
      <p className="mt-3 text-xs font-semibold text-on-surface-variant">
        Type: {exercise.type} · Missing: {contract.missing.join(', ')}
      </p>
    </div>
  );
}

function getContractPrompt(contract: ExerciseContract) {
  if (contract.kind === 'invalid') return '';
  if (contract.kind === 'multiple_choice') return contract.prompt;
  if (contract.kind === 'gap_fill') return contract.template;
  if (contract.kind === 'sentence_order') return contract.correctAnswer;
  if (contract.kind === 'vocabulary_match') return 'Match each term to its meaning.';
  if (contract.kind === 'reading') return contract.sourceText;
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

function getContractChoices(contract: ExerciseContract) {
  if (contract.kind === 'multiple_choice' || contract.kind === 'reading' || contract.kind === 'listening') return contract.choices;
  if (contract.kind === 'gap_fill') return contract.choices ?? [];
  return [];
}

function getContractOrderTokens(contract: ExerciseContract): OrderToken[] {
  if (contract.kind !== 'sentence_order') return [];
  return contract.tokens.map((word, index) => ({ id: `${index}-${normalize(word)}`, word }));
}

function getContractAudioText(contract: ExerciseContract) {
  if (contract.kind === 'listening') return contract.audioText;
  if (contract.kind === 'dictation') return contract.audioText;
  if (contract.kind === 'pronunciation') return contract.audioText;
  if (contract.kind === 'speaking') return contract.prompt;
  return getContractTargetText(contract);
}


