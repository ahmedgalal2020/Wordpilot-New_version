import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, Mic, Play, RotateCcw, Volume2 } from 'lucide-react';
import { CURRICULUM_SPEECH_LOCALES, type CurriculumExercise, type CurriculumLanguage, type ExerciseType, type ScoringRubric } from '../lib/curriculumCore';
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
  const isWriting = exercise.type === 'guided_writing';
  const isSpeaking = exercise.type === 'pronunciation_repeat' || exercise.type === 'guided_speaking' || exercise.type === 'roleplay';
  const isDictation = exercise.type === 'dictation_word' || exercise.type === 'dictation_sentence' || exercise.type === 'dictation_gap';
  const needsTextInput = isWriting || isSpeaking || isDictation || exercise.type === 'gap_fill' || exercise.type === 'lesson_test';
  const needsChoices = isChoiceExercise(exercise.type);
  const needsOrdering = exercise.type === 'sentence_order';

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
        <p className="mt-2 text-base leading-7 text-on-surface">{model.prompt}</p>
        {(exercise.type.includes('audio') || exercise.type.includes('listen') || isDictation || isSpeaking) && (
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

      {needsChoices && (
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

      {needsOrdering && (
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

      {isSpeaking && (
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

      {needsTextInput && (
        <textarea
          value={textResponse}
          onChange={(event) => setTextResponse(event.target.value)}
          rows={isWriting || exercise.type === 'lesson_test' ? 6 : 3}
          className="mt-5 w-full rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm leading-6 text-on-surface outline-none focus:border-primary"
          placeholder={getPlaceholder(exercise.type)}
        />
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={submit} className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary hover:bg-primary-dim">
          Grade exercise
        </button>
        {lastResult && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className={cn(
              'inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm text-on-surface',
              lastResult.passed ? 'bg-primary/10' : 'bg-surface-container-low',
            )}>
              {lastResult.passed && <CheckCircle className="h-4 w-4 text-primary" />}
              <span><span className="font-headline font-black text-primary">{lastResult.score}%</span> {lastResult.feedback}</span>
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
  const vocabulary = readStringArray(content.vocabulary);
  const chunks = readStringArray(content.chunks);
  const theme = String(content.theme ?? 'practice');
  const language = readCurriculumLanguage(content.language, inferLanguageFromExerciseId(exercise.id));
  const locale = readString(content.locale) || CURRICULUM_SPEECH_LOCALES[language];
  const targetSentence = readString(content.targetSentence);
  const readingText = readString(content.readingText);
  const basePrompt = readString(content.prompt) || `Complete the ${theme} task.`;
  const prompt = isReadingExercise(exercise.type) && readingText ? readingText : basePrompt;
  const targetText = Array.isArray(exercise.correctAnswer)
    ? String(exercise.correctAnswer[0] ?? targetSentence ?? chunks[0] ?? vocabulary[0] ?? prompt)
    : typeof exercise.correctAnswer === 'string'
      ? exercise.correctAnswer
      : String(targetSentence || chunks[0] || vocabulary[0] || prompt);
  const contentChoices = readStringArray(content.choices);
  const distractors = vocabulary.filter((word) => normalize(word) !== normalize(targetText)).slice(0, 3);
  const choices = contentChoices.length > 0 ? contentChoices : shuffleUnique([targetText, ...distractors, basePrompt].filter(Boolean)).slice(0, 4);
  const orderTokens = shuffleOrderTokens(readOrderTokens(content.orderTokens, targetSentence || targetText));
  const audioText = isReadingExercise(exercise.type) ? targetSentence || targetText : targetText || targetSentence || prompt;

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
  };
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

  if (exercise.type === 'guided_writing') {
    const text = String(response.text ?? '');
    const rubric = scoreRubricText(text, model.vocabulary, 5);
    const score = averageRubric(rubric);
    return { score, feedback: buildWritingFeedback(rubric), rubricScores: rubric, response, passed: score >= exercise.minScoreToPass };
  }

  if (exercise.type === 'pronunciation_repeat' || exercise.type === 'guided_speaking' || exercise.type === 'roleplay') {
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
  return type === 'reading_main_idea' || type === 'reading_detail' || type === 'reading_true_false';
}

function isChoiceExercise(type: ExerciseType) {
  return [
    'vocabulary_match',
    'audio_choice',
    'listen_and_select',
    'listen_for_detail',
    'grammar_choice',
    'reading_main_idea',
    'reading_detail',
    'reading_true_false',
  ].includes(type);
}

function getPlaceholder(type: ExerciseType) {
  if (type === 'guided_writing') return 'Write your own answer. You are graded by rubric, not exact matching.';
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


