import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, UIEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { hasSupabaseEnv } from '../../lib/env';
import { isLimitReached } from '../../lib/entitlements';
import { useEntitlements } from '../../hooks/useEntitlements';
import { LearningLanguage, normalizeCefrLevel, normalizeLearningLanguage } from '../../lib/learning';
import { INITIAL_SOURCE } from './constants';
import { getSkillMode } from './components';
import { analyzeDictation, calculateWordDelay, detectPracticeLanguage, getLearningLanguageFromCode, getMistakeStatus, getNextSourceIndexFromCaret, getPracticeLanguageCode, getPreferredVoice, getSpokenToken, getWordRanges, readStoredWorkspaceDraft, revealRangeInTextarea, syncOverlayScroll, writeStoredWorkspaceDraft } from './text';
import type { MistakeRow, PracticeLanguage, PracticePathContext, SkillMode } from './types';

async function fireConfetti(options: import('canvas-confetti').Options) {
  const { default: confetti } = await import('canvas-confetti');
  confetti(options);
}

export function useDictationWorkspace() {
  const location = useLocation();
  const { user, profile } = useAuth();
  const initialDraft = readStoredWorkspaceDraft();
  const sourceTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const sourceOverlayRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const playbackTimeoutRef = useRef<number | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);
  const sourceLoadedRef = useRef<string | null>(null);
  const playbackActiveRef = useRef(false);
  const awaitingSpaceAdvanceRef = useRef(false);
  const spaceAdvanceRequestedRef = useRef(false);
  const pendingSpaceAdvanceIndexRef = useRef<number | null>(null);
  const playbackCursorRef = useRef(0);
  const playbackRunIdRef = useRef(0);
  const advanceOnSpaceRef = useRef(initialDraft?.advanceOnSpace ?? true);
  const speechRateRef = useRef(0.95);
  const wordPauseRef = useRef(0.6);
  const sentencePauseRef = useRef(0.4);
  const selectedVoiceURIRef = useRef('');
  const availableVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const languageLockedByIncomingTextRef = useRef(false);
  const manualLanguageOverrideRef = useRef(false);
  const manualVoiceOverrideRef = useRef(false);
  const inputTextRef = useRef(initialDraft?.inputText ?? '');

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sourceText, setSourceText] = useState(initialDraft?.sourceText ?? INITIAL_SOURCE);
  const [inputText, setInputText] = useState(initialDraft?.inputText ?? '');
  const [selectedLanguage, setSelectedLanguage] = useState<PracticeLanguage>(initialDraft?.selectedLanguage ?? getPracticeLanguageCode(profile?.target_language));
  const [sessionLanguageLabel, setSessionLanguageLabel] = useState<LearningLanguage>(normalizeLearningLanguage(profile?.target_language));
  const [sessionLevel, setSessionLevel] = useState(normalizeCefrLevel(profile?.cefr_level));
  const [practiceCategory, setPracticeCategory] = useState<SkillMode>('Dictation');
  const [sourceHidden, setSourceHidden] = useState(true);
  const [speechRate, setSpeechRate] = useState(initialDraft?.speechRate ?? 0.95);
  const [wordPause, setWordPause] = useState(initialDraft?.wordPause ?? 0.6);
  const [sentencePause, setSentencePause] = useState(initialDraft?.sentencePause ?? 0.4);
  const [advanceOnSpace, setAdvanceOnSpace] = useState(initialDraft?.advanceOnSpace ?? true);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saving, setSaving] = useState(false);
  const [activeInputRange, setActiveInputRange] = useState<{ start: number; end: number } | null>(null);
  const [activeSourceRange, setActiveSourceRange] = useState<{ start: number; end: number } | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [practicePathContext, setPracticePathContext] = useState<PracticePathContext | null>(null);
  const { entitlements, refreshEntitlements } = useEntitlements(user);
  const savedSessionLimitReached = isLimitReached(entitlements.usage.savedSessions, entitlements.limits.savedSessions);

  const sourceWordRanges = useMemo(() => getWordRanges(sourceText, selectedLanguage), [sourceText, selectedLanguage]);
  const inputWordRanges = useMemo(() => getWordRanges(inputText, selectedLanguage), [inputText, selectedLanguage]);
  const analysis = useMemo(() => analyzeDictation(sourceWordRanges, inputWordRanges), [sourceWordRanges, inputWordRanges]);
  const comparisonItems = analysis.comparisonItems;
  const mistakeRows = analysis.mistakes;
  const accuracy = analysis.accuracy;
  const resultBreakdown = useMemo(
    () => ({
      wrong: mistakeRows.filter((row) => row.statusLabel === 'Wrong word').length,
      missing: mistakeRows.filter((row) => row.statusLabel === 'Missing word').length,
      extra: mistakeRows.filter((row) => row.statusLabel === 'Extra word').length,
    }),
    [mistakeRows],
  );
  const resultLevel = accuracy >= 90 ? 'Excellent' : accuracy >= 80 ? 'Strong' : accuracy >= 60 ? 'Developing' : 'Needs review';
  const skillMode = useMemo(() => getSkillMode(practiceCategory), [practiceCategory]);
  const availableVoices = useMemo(
    () => voices.filter((voice) => voice.lang.toLowerCase().startsWith(selectedLanguage.slice(0, 2).toLowerCase())),
    [selectedLanguage, voices],
  );

  useEffect(() => {
    if (languageLockedByIncomingTextRef.current) {
      return;
    }

    if (initialDraft?.selectedLanguage) {
      return;
    }

    const preferredLanguage = getPracticeLanguageCode(profile?.target_language);
    setSessionLanguageLabel(normalizeLearningLanguage(profile?.target_language));
    setSelectedLanguage(preferredLanguage);
  }, [initialDraft?.selectedLanguage, profile?.target_language]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  useEffect(() => {
    if (availableVoices.length === 0) {
      setSelectedVoiceURI('');
      return;
    }

    const stillValid = availableVoices.some((voice) => voice.voiceURI === selectedVoiceURI);
    if (manualVoiceOverrideRef.current && stillValid) {
      return;
    }

    const preferredVoice = getPreferredVoice(availableVoices, selectedLanguage);

    if (preferredVoice.voiceURI === selectedVoiceURI) {
      return;
    }

    setSelectedVoiceURI(preferredVoice.voiceURI);
  }, [availableVoices, selectedLanguage, selectedVoiceURI]);

  useEffect(() => {
    speechRateRef.current = speechRate;
  }, [speechRate]);

  useEffect(() => {
    wordPauseRef.current = wordPause;
  }, [wordPause]);

  useEffect(() => {
    advanceOnSpaceRef.current = advanceOnSpace;
  }, [advanceOnSpace]);

  useEffect(() => {
    sentencePauseRef.current = sentencePause;
  }, [sentencePause]);

  useEffect(() => {
    selectedVoiceURIRef.current = selectedVoiceURI;
  }, [selectedVoiceURI]);

  useEffect(() => {
    availableVoicesRef.current = availableVoices;
  }, [availableVoices]);

  useEffect(() => {
    const state = location.state as
      | {
        sourceText?: string;
        inputText?: string;
        language?: string;
        cefrLevel?: string;
        practiceCategory?: string;
        practicePath?: boolean;
        practiceExerciseId?: string;
        practiceLessonId?: string | null;
        reviewMode?: boolean;
      }
      | null;
    if (state?.sourceText && state.sourceText !== sourceLoadedRef.current) {
      sourceLoadedRef.current = state.sourceText;
      setSourceText(state.sourceText);
      setInputText(state.inputText ?? '');
      if (state.language) {
        languageLockedByIncomingTextRef.current = true;
        setSessionLanguageLabel(normalizeLearningLanguage(state.language));
        setSelectedLanguage(getPracticeLanguageCode(state.language));
        manualLanguageOverrideRef.current = false;
      }
      setSessionLevel(normalizeCefrLevel(state.cefrLevel ?? profile?.cefr_level));
      const nextSkill = getSkillMode(state.practiceCategory).id;
      setPracticeCategory(nextSkill);
      setSourceHidden(getSkillMode(nextSkill).sourceHiddenByDefault);
      setPracticePathContext(
        state.practicePath && state.practiceExerciseId
          ? {
              exerciseId: state.practiceExerciseId,
              lessonId: state.practiceLessonId ?? null,
              language: normalizeLearningLanguage(state.language),
              cefrLevel: normalizeCefrLevel(state.cefrLevel ?? profile?.cefr_level),
            }
          : null,
      );
      setSaveStatus(state.reviewMode ? 'Review mode loaded from your history.' : null);
      setSaveState('idle');
      return;
    }

  }, [location.state, profile?.cefr_level]);

  useEffect(() => {
    if (!sourceText.trim() || manualLanguageOverrideRef.current || languageLockedByIncomingTextRef.current) {
      return;
    }

    const detectedLanguage = detectPracticeLanguage(sourceText);
    if (detectedLanguage && detectedLanguage !== selectedLanguage) {
      setSessionLanguageLabel(getLearningLanguageFromCode(detectedLanguage));
      setSelectedLanguage(detectedLanguage);
    }
  }, [selectedLanguage, sourceText]);

  useEffect(() => {
    writeStoredWorkspaceDraft({
      sourceText,
      inputText,
      selectedLanguage,
      speechRate,
      wordPause,
      sentencePause,
      advanceOnSpace,
    });
  }, [sourceText, inputText, selectedLanguage, speechRate, wordPause, sentencePause, advanceOnSpace]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  function cancelPlayback(resetCursor: boolean) {
    playbackRunIdRef.current += 1;
    awaitingSpaceAdvanceRef.current = false;
    spaceAdvanceRequestedRef.current = false;
    pendingSpaceAdvanceIndexRef.current = null;
    window.speechSynthesis.cancel();
    if (playbackTimeoutRef.current) {
      window.clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }

    if (resetCursor) {
      playbackCursorRef.current = 0;
      setCurrentWordIndex(-1);
    }
  }

  function stopSpeaking() {
    cancelPlayback(true);
    playbackActiveRef.current = false;
    setIsPlaying(false);
    setIsPaused(false);
  }

  function setPlaybackCursor(targetIndex: number) {
    const boundedIndex = Math.min(Math.max(targetIndex, 0), Math.max(sourceWordRanges.length - 1, 0));
    playbackCursorRef.current = boundedIndex;
    setCurrentWordIndex(sourceWordRanges.length === 0 ? -1 : boundedIndex);
    return boundedIndex;
  }

  function startSpeaking(fromIndex = 0) {
    if (!sourceText.trim()) {
      setSaveStatus('Add source text first to start the exercise.');
      return;
    }

    if (!('speechSynthesis' in window)) {
      setSaveStatus('Speech synthesis is not available in this browser.');
      return;
    }

    const safeIndex = setPlaybackCursor(fromIndex);
    cancelPlayback(false);
    const runId = playbackRunIdRef.current;

    setSaveStatus(null);
    playbackActiveRef.current = true;
    setIsPlaying(true);
    setIsPaused(false);
    playWordSequence(safeIndex, runId);
  }

  function playWordSequence(wordIndex: number, runId: number) {
    if (runId !== playbackRunIdRef.current) {
      return;
    }

    awaitingSpaceAdvanceRef.current = false;
    spaceAdvanceRequestedRef.current = false;
    pendingSpaceAdvanceIndexRef.current = null;
    if (wordIndex >= sourceWordRanges.length) {
      stopSpeaking();
      return;
    }

    const currentWord = sourceWordRanges[wordIndex];
    const spokenWord = getSpokenToken(currentWord.text, selectedLanguage);
    const selectedVoice = availableVoicesRef.current.find((voice) => voice.voiceURI === selectedVoiceURIRef.current);

    playbackCursorRef.current = wordIndex;
    setCurrentWordIndex(wordIndex);

    if (!spokenWord) {
      const nextIndex = wordIndex + 1;
      if (advanceOnSpaceRef.current) {
        if (spaceAdvanceRequestedRef.current) {
          const requestedIndex = pendingSpaceAdvanceIndexRef.current ?? nextIndex;
          spaceAdvanceRequestedRef.current = false;
          pendingSpaceAdvanceIndexRef.current = null;
          playWordSequence(requestedIndex, runId);
          return;
        }

        awaitingSpaceAdvanceRef.current = true;
        return;
      }

      playbackCursorRef.current = nextIndex;
      playbackTimeoutRef.current = window.setTimeout(() => {
        playWordSequence(nextIndex, runId);
      }, calculateWordDelay(currentWord.text, wordPauseRef.current, sentencePauseRef.current) * 1000);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(spokenWord);
    utterance.lang = selectedLanguage;
    utterance.rate = speechRateRef.current;
    utterance.pitch = 1;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => {
      if (runId !== playbackRunIdRef.current) {
        return;
      }

      const nextIndex = wordIndex + 1;
      if (advanceOnSpaceRef.current) {
        if (spaceAdvanceRequestedRef.current) {
          const requestedIndex = pendingSpaceAdvanceIndexRef.current ?? nextIndex;
          spaceAdvanceRequestedRef.current = false;
          pendingSpaceAdvanceIndexRef.current = null;
          playWordSequence(requestedIndex, runId);
          return;
        }

        awaitingSpaceAdvanceRef.current = true;
        return;
      }

      playbackCursorRef.current = nextIndex;
      const delayInSeconds = calculateWordDelay(currentWord.text, wordPauseRef.current, sentencePauseRef.current);
      playbackTimeoutRef.current = window.setTimeout(() => {
        playWordSequence(nextIndex, runId);
      }, delayInSeconds * 1000);
    };

    utterance.onerror = () => {
      if (runId !== playbackRunIdRef.current) {
        return;
      }

      cancelPlayback(false);
      playbackActiveRef.current = false;
      setIsPlaying(false);
      setIsPaused(true);
      setSaveStatus('Playback stopped unexpectedly. Try another voice or browser.');
    };

    window.speechSynthesis.speak(utterance);
  }

  function advancePlaybackImmediately(nextIndex: number) {
    if (!advanceOnSpaceRef.current || !playbackActiveRef.current) {
      return;
    }

    if (!awaitingSpaceAdvanceRef.current) {
      spaceAdvanceRequestedRef.current = true;
      pendingSpaceAdvanceIndexRef.current = nextIndex;
      return;
    }

    awaitingSpaceAdvanceRef.current = false;
    spaceAdvanceRequestedRef.current = false;
    pendingSpaceAdvanceIndexRef.current = null;
    if (nextIndex >= sourceWordRanges.length) {
      stopSpeaking();
      return;
    }

    cancelPlayback(false);
    const runId = playbackRunIdRef.current;
    playbackActiveRef.current = true;
    setIsPlaying(true);
    setIsPaused(false);
    playWordSequence(nextIndex, runId);
  }

  function pauseSpeaking() {
    cancelPlayback(false);
    playbackActiveRef.current = false;
    setIsPlaying(false);
    setIsPaused(true);
  }

  function resumeSpeaking() {
    const resumeIndex = setPlaybackCursor(playbackCursorRef.current);
    startSpeaking(resumeIndex);
  }

  function restartSpeaking() {
    startSpeaking(0);
  }

  function seekWords(delta: number) {
    const baseIndex = isPlaying || isPaused ? playbackCursorRef.current : Math.max(currentWordIndex, 0);
    const nextIndex = setPlaybackCursor(baseIndex + delta);

    if (isPlaying) {
      startSpeaking(nextIndex);
      return;
    }

    setIsPaused(true);
  }

  function handleResetInput() {
    setInputText('');
    setActiveInputRange(null);
    setSaveStatus(null);
    setSaveState('idle');
  }

  function handleTextareaScroll(event: UIEvent<HTMLTextAreaElement>) {
    syncOverlayScroll(event.currentTarget, overlayRef.current);
  }

  function handleSourceTextareaScroll(event: UIEvent<HTMLTextAreaElement>) {
    syncOverlayScroll(event.currentTarget, sourceOverlayRef.current);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === ' ' && advanceOnSpaceRef.current && !event.repeat) {
      advancePlaybackImmediately(getNextSourceIndexFromCaret(event.currentTarget.value, event.currentTarget.selectionStart));
    }
  }

  function handleAdvanceOnSpaceChange(enabled: boolean) {
    setAdvanceOnSpace(enabled);
    advanceOnSpaceRef.current = enabled;

    if (!enabled && playbackActiveRef.current && awaitingSpaceAdvanceRef.current && currentWordIndex >= 0) {
      awaitingSpaceAdvanceRef.current = false;
      const nextIndex = currentWordIndex + 1;
      playbackCursorRef.current = nextIndex;
      playbackTimeoutRef.current = window.setTimeout(() => {
        playWordSequence(nextIndex, playbackRunIdRef.current);
      }, calculateWordDelay(sourceWordRanges[currentWordIndex]?.text ?? '', wordPauseRef.current, sentencePauseRef.current) * 1000);
      return;
    }

    if (!enabled || !playbackTimeoutRef.current) {
      return;
    }

    window.clearTimeout(playbackTimeoutRef.current);
    playbackTimeoutRef.current = null;
    if (currentWordIndex >= 0) {
      playbackCursorRef.current = currentWordIndex;
    }
  }

  function handleExerciseLanguageChange(language: LearningLanguage) {
    manualLanguageOverrideRef.current = true;
    manualVoiceOverrideRef.current = false;
    setSessionLanguageLabel(language);
    setSelectedLanguage(getPracticeLanguageCode(language));
    setSaveStatus(`${language} is selected for this exercise.`);
  }

  function handleSkillModeChange(skill: SkillMode) {
    const nextMode = getSkillMode(skill);
    setPracticeCategory(nextMode.id);
    setSourceHidden(nextMode.sourceHiddenByDefault);
    setSaveStatus(`${nextMode.shortTitle} mode selected. ${nextMode.instruction}`);
  }

  function focusComparison(inputIndex: number | null, sourceIndex: number | null) {
    const inputRange = inputIndex !== null ? inputWordRanges[inputIndex] : null;
    const sourceRange = sourceIndex !== null ? sourceWordRanges[sourceIndex] : null;

    if (!inputRange && !sourceRange) {
      return;
    }

    if (inputRange && textareaRef.current) {
      revealRangeInTextarea(textareaRef.current, inputRange);
      setActiveInputRange({ start: inputRange.start, end: inputRange.end });
    } else {
      setActiveInputRange(null);
    }

    if (sourceRange && sourceTextareaRef.current) {
      revealRangeInTextarea(sourceTextareaRef.current, sourceRange);
      setActiveSourceRange({ start: sourceRange.start, end: sourceRange.end });
    } else {
      setActiveSourceRange(null);
    }

    if (inputRange && textareaRef.current) {
      textareaRef.current.focus({ preventScroll: true });
      textareaRef.current.setSelectionRange(inputRange.start, inputRange.end);
    } else if (sourceRange && sourceTextareaRef.current) {
      sourceTextareaRef.current.focus({ preventScroll: true });
      sourceTextareaRef.current.setSelectionRange(sourceRange.start, sourceRange.end);
    }

    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }

    highlightTimeoutRef.current = window.setTimeout(() => {
      setActiveInputRange(null);
      setActiveSourceRange(null);
    }, 1800);
  }

  function reviewMistake(row: MistakeRow) {
    focusComparison(row.inputIndex, row.sourceIndex);
    const issueLabel = row.statusLabel.toLowerCase();
    const writtenLabel = row.writtenWord === 'Missing word' ? 'Nothing was typed here' : `"${row.writtenWord}"`;
    setSaveStatus(`Reviewing this ${issueLabel}. Written: ${writtenLabel}. Expected: "${row.correctWord}".`);
  }

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    if (playbackTimeoutRef.current) {
      window.clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
      playbackTimeoutRef.current = window.setTimeout(() => {
        playWordSequence(playbackCursorRef.current, playbackRunIdRef.current);
      }, 0);
    }
  }, [wordPause, sentencePause]);

  useEffect(() => {
    if (!isPlaying || playbackCursorRef.current < 0 || playbackCursorRef.current >= sourceWordRanges.length) {
      return;
    }

    cancelPlayback(false);
    const runId = playbackRunIdRef.current;
    playbackActiveRef.current = true;
    setIsPlaying(true);
    playWordSequence(playbackCursorRef.current, runId);
  }, [speechRate, selectedVoiceURI, selectedLanguage, sourceWordRanges.length]);

  useEffect(() => {
    if (textareaRef.current) {
      syncOverlayScroll(textareaRef.current, overlayRef.current);
    }
  }, [inputText, activeInputRange]);

  useEffect(() => {
    if (sourceTextareaRef.current) {
      syncOverlayScroll(sourceTextareaRef.current, sourceOverlayRef.current);
    }
  }, [sourceText, activeSourceRange]);

  async function saveSession() {
    if (!user) {
      setSaveStatus('You need to be signed in to save a session.');
      setSaveState('error');
      return;
    }

    if (!hasSupabaseEnv()) {
      setSaveStatus('Add Supabase env values before saving sessions.');
      setSaveState('error');
      return;
    }

    if (savedSessionLimitReached) {
      setSaveStatus('Your free saved-session limit is full. Upgrade to WordPilot Pro for unlimited saved practice history.');
      setSaveState('error');
      return;
    }

    setSaving(true);
    setSaveStatus(null);
    setSaveState('saving');

    const title = sourceText.split('.').at(0)?.slice(0, 60) || 'Dictation session';
    const languageLabel = sessionLanguageLabel || (selectedLanguage === 'de-DE' ? 'German' : 'English');

    const cefrLevel = sessionLevel || profile?.cefr_level || 'B1';
    const { data: savedSession, error } = await supabase
      .from('dictation_sessions')
      .insert({
        user_id: user.id,
        title,
        source_text: sourceText,
        input_text: inputText,
        accuracy,
        language: languageLabel,
        cefr_level: cefrLevel,
        status: 'completed',
      })
      .select('id, created_at')
      .single();

    if (error) {
      setSaving(false);
      setSaveStatus(error.message);
      setSaveState('error');
      return;
    }

    const progressError = await markPracticePathCompleted(languageLabel, cefrLevel);

    if (savedSession && mistakeRows.length > 0) {
      const mistakePayload = mistakeRows.map((row) => ({
        user_id: user.id,
        session_id: savedSession.id,
        written_word: row.statusLabel === 'Missing word' ? null : row.writtenWord,
        correct_word: row.correctWord,
        status: getMistakeStatus(row),
        source_index: row.sourceIndex,
        input_index: row.inputIndex,
        language: languageLabel,
        cefr_level: cefrLevel,
        created_at: savedSession.created_at,
      }));

      const { error: mistakesError } = await supabase.from('dictation_mistakes').insert(mistakePayload);
      if (mistakesError) {
        setSaving(false);
        setSaveStatus(
          progressError
            ? `${progressError} Mistake insights also could not sync yet: ${mistakesError.message}`
            : `Session saved, but mistake insights could not sync yet: ${mistakesError.message}`,
        );
        setSaveState('saved');
        void refreshEntitlements();
        return;
      }
    }

    setSaving(false);
    setSaveStatus(
      progressError ??
        (mistakeRows.length > 0 ? 'Session and mistake insights saved to your account.' : 'Session saved to your account.'),
    );
    setSaveState('saved');
    void refreshEntitlements();
  }

  async function markPracticePathCompleted(language: string, cefrLevel: string) {
    if (!user || !practicePathContext || !hasSupabaseEnv() || !inputText.trim()) {
      return null;
    }

    const now = new Date().toISOString();
    const { error } = await supabase.from('practice_progress').upsert(
      {
        user_id: user.id,
        language,
        cefr_level: cefrLevel,
        lesson_id: practicePathContext.lessonId ?? null,
        exercise_id: practicePathContext.exerciseId,
        status: 'completed',
        started_at: now,
        completed_at: now,
        updated_at: now,
      },
      { onConflict: 'user_id,exercise_id' },
    );

    if (error) {
      return `Session saved, but practice path progress could not sync: ${error.message}`;
    }

    return null;
  }

  function finishAndGrade() {
    setShowResultModal(true);
    void markPracticePathCompleted(sessionLanguageLabel, sessionLevel);

    if (accuracy >= 80) {
      void fireConfetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'],
      });
    }

    const firstIssue = mistakeRows[0];
    if (firstIssue) {
      focusComparison(firstIssue.inputIndex, firstIssue.sourceIndex);
      setSaveStatus(`Grading complete: ${accuracy}% accuracy. The first issue has been highlighted for review.`);
      return;
    }

    setSaveStatus(`Excellent work. Grading complete with ${accuracy}% accuracy.`);
  }

  useEffect(() => {
    inputTextRef.current = inputText;
  }, [inputText]);


  return {
    sessionLanguageLabel,
    selectedLanguage,
    sessionLevel,
    profile,
    practiceCategory,
    skillMode,
    accuracy,
    sourceHidden,
    setSourceHidden,
    setSourceText,
    sourceText,
    activeSourceRange,
    sourceOverlayRef,
    sourceTextareaRef,
    manualLanguageOverrideRef,
    handleSourceTextareaScroll,
    availableVoices,
    handleExerciseLanguageChange,
    selectedVoiceURI,
    manualVoiceOverrideRef,
    setSelectedVoiceURI,
    speechRate,
    setSpeechRate,
    advanceOnSpace,
    wordPause,
    setWordPause,
    sentencePause,
    setSentencePause,
    setSessionLevel,
    setSaveStatus,
    handleSkillModeChange,
    isPlaying,
    isPaused,
    currentWordIndex,
    sourceWordRanges,
    seekWords,
    restartSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    startSpeaking,
    handleAdvanceOnSpaceChange,
    inputText,
    activeInputRange,
    overlayRef,
    textareaRef,
    setInputText,
    handleInputKeyDown,
    handleTextareaScroll,
    comparisonItems,
    focusComparison,
    mistakeRows,
    reviewMistake,
    handleResetInput,
    finishAndGrade,
    saveSession,
    saving,
    savedSessionLimitReached,
    saveState,
    entitlements,
    saveStatus,
    showResultModal,
    setShowResultModal,
    resultLevel,
    resultBreakdown,
  };
}

export type DictationWorkspaceController = ReturnType<typeof useDictationWorkspace>;

