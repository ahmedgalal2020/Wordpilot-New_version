import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, FastForward, Languages, Pause, Play, Rewind, RotateCcw, Save, SkipBack, SkipForward, Volume2, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { hasSupabaseEnv } from '../lib/env';

const INITIAL_SOURCE =
  'Quantum mechanics describes the physical properties of nature at the scale of atoms and subatomic particles. It is the foundation of all quantum physics including quantum chemistry, quantum field theory, quantum technology, and quantum information science.';

const WORKSPACE_DRAFT_KEY = 'wordpilot-workspace-draft-v4';

type PracticeLanguage = 'en-US' | 'de-DE';

type WordRange = {
  text: string;
  start: number;
  end: number;
};

type TokenRange = WordRange & {
  normalized: string;
};

type ComparisonItem = {
  id: string;
  inputWord: string;
  targetWord?: string;
  inputIndex: number | null;
  sourceIndex: number | null;
  status: 'correct' | 'wrong' | 'extra' | 'missing';
};

type MistakeRow = {
  id: string;
  order: number;
  inputIndex: number | null;
  sourceIndex: number | null;
  writtenWord: string;
  correctWord: string;
  statusLabel: string;
};

type DictationAnalysis = {
  comparisonItems: ComparisonItem[];
  mistakes: MistakeRow[];
  accuracy: number;
};

type WorkspaceDraft = {
  sourceText?: string;
  inputText?: string;
  selectedLanguage?: PracticeLanguage;
  speechRate?: number;
  wordPause?: number;
  sentencePause?: number;
};

export default function DictationWorkspace() {
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
  const playbackCursorRef = useRef(0);
  const playbackRunIdRef = useRef(0);
  const speechRateRef = useRef(0.95);
  const wordPauseRef = useRef(0.6);
  const sentencePauseRef = useRef(0.4);
  const selectedVoiceURIRef = useRef('');
  const availableVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const languageLockedByIncomingTextRef = useRef(false);
  const manualLanguageOverrideRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
<<<<<<< ours
  const [isPaused, setIsPaused] = useState(false);
  const [sourceText, setSourceText] = useState(initialDraft?.sourceText ?? INITIAL_SOURCE);
  const [inputText, setInputText] = useState(initialDraft?.inputText ?? '');
  const [selectedLanguage, setSelectedLanguage] = useState<PracticeLanguage>(initialDraft?.selectedLanguage ?? 'en-US');
  const [speechRate, setSpeechRate] = useState(initialDraft?.speechRate ?? 0.95);
  const [wordPause, setWordPause] = useState(initialDraft?.wordPause ?? 0.6);
  const [sentencePause, setSentencePause] = useState(initialDraft?.sentencePause ?? 0.4);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saving, setSaving] = useState(false);
  const [activeInputRange, setActiveInputRange] = useState<{ start: number; end: number } | null>(null);
  const [activeSourceRange, setActiveSourceRange] = useState<{ start: number; end: number } | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const sourceWordRanges = useMemo(() => getWordRanges(sourceText), [sourceText]);
  const inputWordRanges = useMemo(() => getWordRanges(inputText), [inputText]);
  const analysis = useMemo(() => analyzeDictation(sourceWordRanges, inputWordRanges), [sourceWordRanges, inputWordRanges]);
  const comparisonItems = analysis.comparisonItems;
  const mistakeRows = analysis.mistakes;
  const accuracy = analysis.accuracy;

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

    const preferredLanguage = profile?.target_language?.toLowerCase() === 'german' ? 'de-DE' : 'en-US';
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
    if (stillValid) {
      return;
    }

    const preferredVoice =
      availableVoices.find((voice) => voice.localService && /natural|neural|premium|microsoft|google/i.test(voice.name)) ??
      availableVoices[0];

    setSelectedVoiceURI(preferredVoice.voiceURI);
  }, [availableVoices, selectedVoiceURI]);

  useEffect(() => {
    speechRateRef.current = speechRate;
  }, [speechRate]);

  useEffect(() => {
    wordPauseRef.current = wordPause;
  }, [wordPause]);
=======
  const [sourceText, setSourceText] = useState(INITIAL_SOURCE);
  const [inputText, setInputText] = useState("");
  const [speechRate, setSpeechRate] = useState(1);
  const [wordGap, setWordGap] = useState(0.5); // Base delay in seconds
  const [typingAwareMode, setTypingAwareMode] = useState(true);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  
  const isPlayingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputTextRef = useRef(inputText);
  const lastInputAtRef = useRef(Date.now());
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs

  useEffect(() => {
    sentencePauseRef.current = sentencePause;
  }, [sentencePause]);

  useEffect(() => {
    selectedVoiceURIRef.current = selectedVoiceURI;
  }, [selectedVoiceURI]);

<<<<<<< ours
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
        reviewMode?: boolean;
      }
      | null;
    if (state?.sourceText && state.sourceText !== sourceLoadedRef.current) {
      sourceLoadedRef.current = state.sourceText;
      setSourceText(state.sourceText);
      setInputText(state.inputText ?? '');
      if (state.language) {
        languageLockedByIncomingTextRef.current = true;
        setSelectedLanguage(state.language.toLowerCase().includes('german') ? 'de-DE' : 'en-US');
        manualLanguageOverrideRef.current = false;
      }
      setSaveStatus(state.reviewMode ? 'Review mode loaded from your history.' : null);
      setSaveState('idle');
      return;
    }

  }, [location.state]);
=======
  const currentTokenRef = useRef("");
>>>>>>> theirs

  useEffect(() => {
    if (!sourceText.trim() || manualLanguageOverrideRef.current) {
      return;
    }
=======
  const currentTokenRef = useRef("");
>>>>>>> theirs

    const detectedLanguage = detectPracticeLanguage(sourceText);
    if (detectedLanguage && detectedLanguage !== selectedLanguage) {
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
    });
  }, [sourceText, inputText, selectedLanguage, speechRate, wordPause, sentencePause]);

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
=======
  const normalizeWord = (word: string = "") =>
    word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

  const normalizeWord = (word: string = "") =>
    word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

  const normalizeWord = (word: string = "") =>
    word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

  const stopSpeaking = () => {
>>>>>>> theirs
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

<<<<<<< ours
    setSaveStatus(null);
    setIsPlaying(true);
    setIsPaused(false);
    playWordSequence(safeIndex, runId);
  }

  function playWordSequence(wordIndex: number, runId: number) {
    if (runId !== playbackRunIdRef.current) {
      return;
    }

    if (wordIndex >= sourceWordRanges.length) {
=======
  const waitForWordCompletion = (index: number) => {
    const targetWord = normalizeWord(sourceWords[index]);
    const waitStartedAt = Date.now();
    const checkProgress = () => {
      if (!isPlayingRef.current) return;

      const currentInputWords = inputTextRef.current.trim().split(/\s+/).filter(w => w.length > 0);
      const typedWord = normalizeWord(currentInputWords[index] || "");
      const isCorrect = !!typedWord && typedWord === targetWord;
      const userStoppedTyping = !!typedWord && Date.now() - lastInputAtRef.current >= 1000;
      const exceededMaxWait = Date.now() - waitStartedAt >= 4500;

      if (isCorrect || userStoppedTyping || exceededMaxWait) {
        speakWord(index + 1);
        return;
      }

      timeoutRef.current = setTimeout(checkProgress, 150);
    };

    timeoutRef.current = setTimeout(checkProgress, 150);
  };

  const waitForWordCompletion = (index: number) => {
    const targetWord = normalizeWord(sourceWords[index]);
    const checkProgress = () => {
      if (!isPlayingRef.current) return;

      const currentInputText = inputTextRef.current;
      const currentInputWords = currentInputText.trim().split(/\s+/).filter(w => w.length > 0);
      const typedWord = normalizeWord(currentInputWords[index] || "");
      const isCorrect = !!typedWord && typedWord === targetWord;
      const userMovedToNextWord = currentInputWords.length > index + 1;
      const userAddedWhitespaceAfterWord = /\s$/.test(currentInputText) && !!currentInputWords[index];
      const userStoppedTyping = !!typedWord && Date.now() - lastInputAtRef.current >= 1200;
      const tokenChanged = currentTokenRef.current !== typedWord;

      if (tokenChanged) {
        currentTokenRef.current = typedWord;
      }

      if (isCorrect || userMovedToNextWord || userAddedWhitespaceAfterWord || userStoppedTyping) {
        speakWord(index + 1);
        return;
      }

      timeoutRef.current = setTimeout(checkProgress, 150);
    };

    timeoutRef.current = setTimeout(checkProgress, 150);
  };

  const waitForWordCompletion = (index: number) => {
    const targetWord = normalizeWord(sourceWords[index]);
    const checkProgress = () => {
      if (!isPlayingRef.current) return;

      const currentInputText = inputTextRef.current;
      const currentInputWords = currentInputText.trim().split(/\s+/).filter(w => w.length > 0);
      const typedWord = normalizeWord(currentInputWords[index] || "");
      const isCorrect = !!typedWord && typedWord === targetWord;
      const userMovedToNextWord = currentInputWords.length > index + 1;
      const userAddedWhitespaceAfterWord = /\s$/.test(currentInputText) && !!currentInputWords[index];
      const userStoppedTyping = !!typedWord && Date.now() - lastInputAtRef.current >= 1200;
      const tokenChanged = currentTokenRef.current !== typedWord;

      if (tokenChanged) {
        currentTokenRef.current = typedWord;
      }

      if (isCorrect || userMovedToNextWord || userAddedWhitespaceAfterWord || userStoppedTyping) {
        speakWord(index + 1);
        return;
      }

      timeoutRef.current = setTimeout(checkProgress, 150);
    };

    timeoutRef.current = setTimeout(checkProgress, 150);
  };

  const speakWord = (index: number) => {
    if (!isPlayingRef.current || index >= sourceWords.length) {
>>>>>>> theirs
      stopSpeaking();
      return;
    }

<<<<<<< ours
    const currentWord = sourceWordRanges[wordIndex];
    const spokenWord = cleanWordForSpeech(currentWord.text);
    const selectedVoice = availableVoicesRef.current.find((voice) => voice.voiceURI === selectedVoiceURIRef.current);

    playbackCursorRef.current = wordIndex;
    setCurrentWordIndex(wordIndex);

    if (!spokenWord) {
      const nextIndex = wordIndex + 1;
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
<<<<<<< ours
      if (runId !== playbackRunIdRef.current) {
        return;
      }

      const nextIndex = wordIndex + 1;
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
      setIsPlaying(false);
      setIsPaused(true);
      setSaveStatus('Playback stopped unexpectedly. Try another voice or browser.');
=======
=======
    setCurrentWordIndex(index);
    currentTokenRef.current = normalizeWord(inputTextRef.current.trim().split(/\s+/).filter(w => w.length > 0)[index] || "");
    const word = sourceWords[index];
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = speechRate;

    utterance.onend = () => {
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
      if (typingAwareMode) {
        waitForWordCompletion(index);
        return;
      }

      // Calculate delay: base gap + extra if word > 4 chars
      const extraDelay = word.length > 4 ? 0.3 : 0;
      const totalDelay = (wordGap + extraDelay) * 1000;
      timeoutRef.current = setTimeout(() => speakWord(index + 1), totalDelay);
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    };

    window.speechSynthesis.speak(utterance);
  }

  function pauseSpeaking() {
    cancelPlayback(false);
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

  function handleTextareaScroll(event: React.UIEvent<HTMLTextAreaElement>) {
    syncOverlayScroll(event.currentTarget, overlayRef.current);
  }

  function handleSourceTextareaScroll(event: React.UIEvent<HTMLTextAreaElement>) {
    syncOverlayScroll(event.currentTarget, sourceOverlayRef.current);
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

    setSaving(true);
    setSaveStatus(null);
    setSaveState('saving');

    const title = sourceText.split('.').at(0)?.slice(0, 60) || 'Dictation session';
    const languageLabel = selectedLanguage === 'de-DE' ? 'German' : 'English';

    const { error } = await supabase.from('dictation_sessions').insert({
      user_id: user.id,
      title,
      source_text: sourceText,
      input_text: inputText,
      accuracy,
      language: languageLabel,
      cefr_level: profile?.cefr_level ?? 'B1',
      status: 'completed',
    });

    setSaving(false);
    if (error) {
      setSaveStatus(error.message);
      setSaveState('error');
      return;
    }

    setSaveStatus('Session saved to Supabase.');
    setSaveState('saved');
  }

  function finishAndGrade() {
    setShowResultModal(true);

    if (accuracy >= 80) {
      confetti({
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

  useEffect(() => {
    inputTextRef.current = inputText;
  }, [inputText]);

  useEffect(() => {
    inputTextRef.current = inputText;
  }, [inputText]);

  return (
    <main className="max-w-[1440px] mx-auto px-8 py-12 pt-28">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
              {selectedLanguage === 'de-DE' ? 'German' : 'English'}
            </span>
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
              Level {profile?.cefr_level ?? 'C1'}
            </span>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tighter text-on-surface font-headline">Advanced Dictation Lab</h1>
          <p className="text-on-surface-variant max-w-2xl font-medium">
            Word-by-word dictation with real pauses, smart timing based on word length, and a more stable writing surface for long exercises.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase">Accuracy</span>
          <div className="flex items-center gap-4 bg-surface-container-high px-6 py-3 rounded-2xl whisper-shadow">
            <div className="text-2xl font-bold font-headline text-primary">{accuracy}%</div>
            <div className="w-32 h-2 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="bg-primary h-full transition-all duration-500" style={{ width: `${accuracy}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-low rounded-3xl p-8 whisper-shadow border border-outline-variant/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">1. Source Script</h3>
              <button onClick={() => setSourceText('')} className="text-on-surface-variant hover:text-error transition-colors" title="Clear Script">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="relative h-[200px] rounded-2xl bg-surface-container-lowest overflow-hidden">
              <div
                ref={sourceOverlayRef}
                className="pointer-events-none absolute inset-0 overflow-auto p-4 text-base font-medium leading-[1.8] whitespace-pre-wrap break-words text-on-surface"
                aria-hidden="true"
              >
                {sourceText.length === 0 ? (
                  <span className="text-on-surface-variant/40">Paste the text you want to practice here...</span>
                ) : (
                  <MirroredText text={sourceText} activeRange={activeSourceRange} />
                )}
              </div>
              <textarea
                ref={sourceTextareaRef}
                className="relative z-10 w-full h-[200px] overflow-auto bg-transparent border-none rounded-2xl p-4 text-base font-medium leading-[1.8] text-transparent caret-on-surface placeholder:text-transparent resize-none outline-none focus:outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="Paste the text you want to practice here..."
                value={sourceText}
                onChange={(event) => {
                  manualLanguageOverrideRef.current = false;
                  setSourceText(event.target.value);
                }}
                onScroll={handleSourceTextareaScroll}
                wrap="soft"
              />
            </div>

            <div className="mt-8 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Languages className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-widest">Voice & Language</h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    manualLanguageOverrideRef.current = true;
                    setSelectedLanguage('en-US');
                  }}
                  className={cn(
                    'rounded-2xl px-4 py-3 font-bold text-sm transition',
                    selectedLanguage === 'en-US' ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface',
                  )}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => {
                    manualLanguageOverrideRef.current = true;
                    setSelectedLanguage('de-DE');
                  }}
                  className={cn(
                    'rounded-2xl px-4 py-3 font-bold text-sm transition',
                    selectedLanguage === 'de-DE' ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface',
                  )}
                >
                  German
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Voice</label>
                <select
                  value={selectedVoiceURI}
                  onChange={(event) => setSelectedVoiceURI(event.target.value)}
                  className="w-full bg-surface-container-lowest border border-surface-container rounded-2xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
                >
                  {availableVoices.length === 0 ? (
                    <option value="">No matching voice found</option>
                  ) : (
                    availableVoices.map((voice) => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name} {voice.localService ? '- Local' : '- Remote'}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-4">
                <RangeField
                  label="Speech Rate"
                  valueLabel={`${speechRate.toFixed(2)}x`}
                  min={0.6}
                  max={1.2}
                  step={0.05}
                  value={speechRate}
                  onChange={(value) => setSpeechRate(value)}
                />

                <RangeField
                  label="Pause Between Words"
                  valueLabel={`${wordPause.toFixed(2)}s`}
                  min={0}
                  max={2}
                  step={0.05}
                  value={wordPause}
                  onChange={(value) => setWordPause(value)}
                />

                <RangeField
                  label="Extra Pause At Sentence End"
                  valueLabel={`${sentencePause.toFixed(2)}s`}
                  min={0}
                  max={1.5}
                  step={0.05}
                  value={sentencePause}
                  onChange={(value) => setSentencePause(value)}
                />
              </div>

              <div className="bg-surface-container-highest/40 p-3 rounded-xl border border-primary/10">
                <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed">
                  The system now waits after every word. If a word has more than 5 letters, each extra letter adds 0.1s automatically, with more pause after commas and sentence endings.
                </p>
              </div>

              <div className="rounded-[1.75rem] bg-surface-container-highest p-4 sm:p-5 border border-outline-variant/10">
                <div className="grid grid-cols-1 gap-3">
                  <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">

                    <PlayerButton icon={<Rewind className="w-4 h-4" />} label="-5" onClick={() => seekWords(-5)} />
                    <PlayerButton icon={<SkipBack className="w-4 h-4" />} label="-1" onClick={() => seekWords(-1)} />
                    <PlayerButton icon={<SkipForward className="w-4 h-4" />} label="+1" onClick={() => seekWords(1)} />
                    <PlayerButton icon={<FastForward className="w-4 h-4" />} label="+5" onClick={() => seekWords(5)} />
                  </div>

                  <div className="flex justify-center items-center gap-4">
                    <button
                      type="button"
                      onClick={restartSpeaking}
                      className="cursor-pointer shrink-0 h-14 w-14 sm:h-16 sm:w-16 rounded-full font-bold flex items-center justify-center transition-all bg-surface-container-lowest text-on-surface hover:bg-surface-container border border-outline-variant/10 shadow-sm"
                      title="Restart"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => (isPlaying ? pauseSpeaking() : isPaused ? resumeSpeaking() : startSpeaking())}
                      className={cn(
                        'cursor-pointer shrink-0 h-14 w-14 sm:h-16 sm:w-16 rounded-full font-bold flex items-center justify-center transition-all',
                        isPlaying ? 'bg-error text-white' : 'bg-primary text-on-primary shadow-lg shadow-primary/20',
                      )}
                      title={isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : isPaused ? <Play className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                  </div>

                </div>
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-center sm:text-left text-[11px] font-medium text-on-surface-variant">
                    Use the controls like a media player to jump through the script without losing your place.
                  </p>
                  <p className="text-center sm:text-right text-[11px] font-bold text-on-surface-variant">
                    Cursor {currentWordIndex >= 0 ? currentWordIndex + 1 : 1} / {Math.max(sourceWordRanges.length, 1)}
                  </p>
                </div>
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
                <p className="mt-2 text-center text-[11px] font-medium text-on-surface-variant">
                  {isPlaying
                    ? `Playing from word ${currentWordIndex + 1}`
                    : isPaused && currentWordIndex >= 0
                      ? `Paused at word ${currentWordIndex + 1}`
                      : 'Ready to start dictation'}
                </p>
=======
=======
=======
>>>>>>> theirs

                <label className="flex items-center justify-between gap-4 bg-surface-container-highest/30 p-3 rounded-xl border border-primary/10">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface">Typing-Aware Advance</p>
                    <p className="text-[9px] text-on-surface-variant">Speak next word when user finishes typing current word (correctly, or after a short pause if incorrect).</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={typingAwareMode}
                    onChange={(e) => setTypingAwareMode(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                </label>
              </div>
>>>>>>> theirs

                <label className="flex items-center justify-between gap-4 bg-surface-container-highest/30 p-3 rounded-xl border border-primary/10">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface">Typing-Aware Advance</p>
                    <p className="text-[9px] text-on-surface-variant">Speak next word when user finishes typing current word (correctly, or after a short pause if incorrect).</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={typingAwareMode}
                    onChange={(e) => setTypingAwareMode(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                </label>
>>>>>>> theirs
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-surface-container-lowest rounded-3xl min-h-[500px] p-10 flex flex-col gap-8 whisper-shadow border border-outline-variant/10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">2. Your Dictation</h3>
              <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                <span className={cn('w-2 h-2 rounded-full', isPlaying ? 'bg-primary animate-pulse' : 'bg-outline-variant')}></span>
                {isPlaying ? 'PLAYING' : 'READY'}
              </div>
            </div>

            <div className="relative min-h-[320px] rounded-3xl bg-surface-container-low border border-surface-container overflow-hidden">
              <div
                ref={overlayRef}
                className="pointer-events-none absolute inset-0 overflow-auto px-6 py-5 text-xl md:text-2xl font-medium leading-[1.8] whitespace-pre-wrap break-words text-on-surface"
                aria-hidden="true"
              >
                {inputText.length === 0 ? (
                  <span className="text-on-surface-variant/35">Start typing what you hear...</span>
                ) : (
                  <MirroredText text={inputText} activeRange={activeInputRange} />
                )}
              </div>
              <textarea
                ref={textareaRef}
                value={inputText}
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
                onChange={(event) => setInputText(event.target.value)}
                onScroll={handleTextareaScroll}
                className="relative z-10 w-full min-h-[320px] overflow-auto bg-transparent border-none px-6 py-5 text-xl md:text-2xl font-medium leading-[1.8] text-transparent caret-on-surface placeholder:text-transparent resize-y outline-none focus:outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="Start typing what you hear..."
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                wrap="soft"
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
                onChange={(e) => {
                  lastInputAtRef.current = Date.now();
                  setInputText(e.target.value);
                }}
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
              />
            </div>

            <div className="bg-surface-container-low rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Real-time Comparison</h3>
                {currentWordIndex !== -1 && (
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    Reading word {currentWordIndex + 1} of {sourceWordRanges.length}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-1.5 gap-y-3 text-lg md:text-xl font-medium leading-relaxed">
                {comparisonItems.length > 0 ? (
                  comparisonItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => item.status !== 'correct' && focusComparison(item.inputIndex, item.sourceIndex)}
                      className={cn(
                        'transition-all px-1 rounded text-left',
                        item.status === 'correct' && 'text-on-surface',
                        item.status === 'wrong' && 'bg-error-container/20 text-error border-b-2 border-error cursor-pointer',
                        item.status === 'extra' && 'bg-error-container/20 text-error border-b-2 border-error cursor-pointer',
                      )}
                      title={
                        item.status === 'correct'
                          ? 'Correct'
                          : item.targetWord
                            ? `Expected: ${item.targetWord}`
                            : 'Extra word'
                      }
                    >
                      {item.inputWord}
                    </button>
                  ))
                ) : (
                  <span className="text-on-surface-variant/40 italic text-base">Analysis will appear as you type...</span>
                )}
              </div>
            </div>

            <div className="bg-surface-container-low rounded-2xl p-6">
              <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                <div>
                  <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Mistake Focus Table</h3>
                  <p className="text-sm text-on-surface-variant mt-2">A clean list of the words you need to focus on, with the correct version beside each one.</p>
                </div>
                <div className="rounded-full bg-error-container/30 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-error">
                  {mistakeRows.length} {mistakeRows.length === 1 ? 'issue' : 'issues'}
                </div>
              </div>

              {mistakeRows.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest">
                  <div className="hidden md:grid grid-cols-[56px_minmax(0,1.2fr)_minmax(0,1.2fr)_120px_96px] gap-4 border-b border-outline-variant/10 px-4 lg:px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    <span>#</span>
                    <span>Your Word</span>
                    <span>Correct Word</span>
                    <span>Status</span>
                    <span className="text-right">Action</span>
                  </div>

                  <div className="hidden md:block divide-y divide-outline-variant/10">
                    {mistakeRows.map((row) => (
                      <div
                        key={row.id}
                        className="grid w-full grid-cols-[56px_minmax(0,1.2fr)_minmax(0,1.2fr)_120px_96px] items-center gap-4 px-4 lg:px-5 py-4 text-left transition hover:bg-primary/5"
                      >
                        <span className="text-sm font-bold text-on-surface">{row.order}</span>
                        <div className="min-w-0">
                          <span className="inline-flex max-w-full rounded-xl bg-error-container/25 px-3 py-1.5 text-sm font-semibold text-error">
                            <span className="truncate">{row.writtenWord}</span>
                          </span>
                        </div>
                        <div className="min-w-0">
                          <span className="inline-flex max-w-full rounded-xl bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                            <span className="truncate">{row.correctWord}</span>
                          </span>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant self-center">{row.statusLabel}</span>
                        <div className="text-right self-center">
                          <button
                            type="button"
                            onClick={() => reviewMistake(row)}
                            className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary hover:text-on-primary"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="md:hidden divide-y divide-outline-variant/10">
                    {mistakeRows.map((row) => (
                      <div key={row.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Issue #{row.order}</p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">{row.statusLabel}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => reviewMistake(row)}
                            className="shrink-0 inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-xs font-bold text-primary transition hover:bg-primary hover:text-on-primary"
                          >
                            Review
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Your Word</p>
                            <div className="rounded-xl bg-error-container/25 px-3 py-2 text-sm font-semibold text-error break-words">
                              {row.writtenWord}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Correct Word</p>
                            <div className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary break-words">
                              {row.correctWord}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest px-5 py-6 text-sm text-on-surface-variant">
                  No mistakes yet. Keep typing and any wrong or extra words will be listed here automatically.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={handleResetInput} className="px-8 py-4 rounded-2xl font-bold text-on-surface-variant hover:bg-surface-container transition-all flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
            <button
              onClick={finishAndGrade}
              className="bg-primary text-on-primary px-12 py-4 rounded-2xl font-bold font-headline text-lg transition-all hover:bg-primary-dim hover:shadow-lg active:scale-95 flex items-center gap-3 whisper-shadow"
            >
              Finish &amp; Grade
              <CheckCircle className="w-6 h-6" />
            </button>
            <button
              onClick={() => void saveSession()}
              disabled={saving}
              className={cn(
                'px-8 py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-70',
                saveState === 'saved' && !saving && 'bg-primary/10 text-primary border border-primary/20',
                saveState === 'error' && !saving && 'bg-error/10 text-error border border-error/20',
                (saveState === 'idle' || saveState === 'saving') && 'bg-surface-container-low text-on-surface hover:bg-surface-container',
              )}
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : saveState === 'saved' ? 'Saved' : saveState === 'error' ? 'Save Failed' : 'Save Session'}
            </button>
          </div>
          {saveStatus && <p className="text-center text-sm text-on-surface-variant">{saveStatus}</p>}
        </div>
      </div>

      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/10 shadow-2xl rounded-3xl p-8 max-w-sm w-full relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowResultModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full p-1 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center text-3xl font-bold font-headline shadow-[inset_0_0_20px_rgba(29,78,216,0.15)]">
                {accuracy}%
              </div>
              <div>
                <h3 className="text-2xl font-extrabold font-headline text-on-surface">
                  {accuracy >= 90 ? 'Outstanding! 🎉' : accuracy >= 80 ? 'Great Job! 🚀' : accuracy >= 60 ? 'Good Effort! 👍' : 'Keep Going! 💪'}
                </h3>
                <p className="text-on-surface-variant mt-2 text-sm font-medium leading-relaxed">
                  {accuracy >= 90
                    ? 'Near perfection! Your listening and typing skills are excellent.'
                    : accuracy >= 80
                    ? 'Very strong performance! Just a few minor things to polish.'
                    : accuracy >= 60
                    ? 'You are making progress! Review your mistakes and try again.'
                    : 'Rome wasn\'t built in a day. Don\'t give up, practice makes perfect!'}
                </p>
              </div>
              <button
                onClick={() => setShowResultModal(false)}
                className="w-full mt-6 bg-primary text-on-primary py-3 rounded-2xl font-bold font-headline transition hover:bg-primary-dim hover:shadow-lg focus:ring-4 focus:ring-primary/20"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function RangeField({
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
        <span>{label}</span>
        <span className="text-primary font-mono">{valueLabel}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(parseFloat(event.target.value))}
        className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
      />
    </div>
  );
}

function PlayerButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer h-12 min-w-12 px-3 rounded-2xl bg-surface-container-lowest text-on-surface font-bold text-xs flex items-center justify-center gap-1.5 transition hover:bg-surface-container border border-outline-variant/10"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function MirroredText({ text, activeRange }: { text: string; activeRange: { start: number; end: number } | null }) {
  const segments = useMemo(() => buildMirrorSegments(text, activeRange), [text, activeRange]);

  return (
    <>
      {segments.map((segment) =>
        segment.highlighted ? (
          <span
            key={`${segment.start}-${segment.end}`}
            className="rounded-sm bg-primary/15 px-0.5 text-on-surface underline decoration-primary decoration-2 underline-offset-4 shadow-[inset_0_-1px_0_rgba(29,78,216,0.22)]"
          >
            {segment.text}
          </span>
        ) : (
          <span key={`${segment.start}-${segment.end}`}>{segment.text}</span>
        ),
      )}
    </>
  );
}

function buildMirrorSegments(text: string, activeRange: { start: number; end: number } | null) {
  if (!activeRange) {
    return [{ text, start: 0, end: text.length, highlighted: false }];
  }

  const segments: Array<{ text: string; start: number; end: number; highlighted: boolean }> = [];
  if (activeRange.start > 0) {
    segments.push({ text: text.slice(0, activeRange.start), start: 0, end: activeRange.start, highlighted: false });
  }
  segments.push({
    text: text.slice(activeRange.start, activeRange.end),
    start: activeRange.start,
    end: activeRange.end,
    highlighted: true,
  });
  if (activeRange.end < text.length) {
    segments.push({
      text: text.slice(activeRange.end),
      start: activeRange.end,
      end: text.length,
      highlighted: false,
    });
  }

  return segments;
}

function getWordRanges(text: string): TokenRange[] {
  const ranges: TokenRange[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const normalized = normalizeComparableWord(match[0]);
    if (!normalized) {
      continue;
    }

    ranges.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
      normalized,
    });
  }

  return ranges;
}

function normalizeWord(value: string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    .replace(/[“”"']/g, '');
}

function buildComparisonItems(sourceWords: WordRange[], inputWords: WordRange[]): ComparisonItem[] {
  return inputWords.map((inputWord, index) => {
    const targetWord = sourceWords[index]?.text;
    const isCorrect = Boolean(targetWord) && normalizeWord(inputWord.text) === normalizeWord(targetWord);

    return {
      id: `legacy-${index}-${inputWord.start}`,
      inputWord: inputWord.text,
      targetWord,
      inputIndex: index,
      sourceIndex: index < sourceWords.length ? index : null,
      status: !targetWord ? 'extra' : isCorrect ? 'correct' : 'wrong',
    };
  });
}

function normalizeComparableWord(value: string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u2018\u2019\u02BC\u0060\u00B4]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/(^[^a-z0-9]+)|([^a-z0-9]+$)/g, '')
    .replace(/["']/g, '')
    .replace(/\s+/g, '');
}

function analyzeDictation(sourceWords: TokenRange[], inputWords: TokenRange[]): DictationAnalysis {
  if (sourceWords.length === 0 && inputWords.length === 0) {
    return { comparisonItems: [], mistakes: [], accuracy: 0 };
  }

  if (inputWords.length === 0) {
    return { comparisonItems: [], mistakes: [], accuracy: 0 };
  }

  const matches = alignWordSequences(sourceWords, inputWords);
  const comparisonItems: ComparisonItem[] = [];
  const mistakes: MistakeRow[] = [];
  let sourceIndex = 0;
  let inputIndex = 0;
  let matchIndex = 0;
  let correctCount = 0;

  while (sourceIndex < sourceWords.length || inputIndex < inputWords.length) {
    const nextMatch = matches[matchIndex] ?? null;

    if (nextMatch && nextMatch.sourceIndex === sourceIndex && nextMatch.inputIndex === inputIndex) {
      comparisonItems.push({
        id: `correct-${inputIndex}-${inputWords[inputIndex].start}`,
        inputWord: inputWords[inputIndex].text,
        targetWord: sourceWords[sourceIndex].text,
        inputIndex,
        sourceIndex,
        status: 'correct',
      });
      correctCount += 1;
      sourceIndex += 1;
      inputIndex += 1;
      matchIndex += 1;
      continue;
    }

    const nextSourceBoundary = nextMatch?.sourceIndex ?? sourceWords.length;
    const nextInputBoundary = nextMatch?.inputIndex ?? inputWords.length;
    const substitutionCount = Math.min(nextSourceBoundary - sourceIndex, nextInputBoundary - inputIndex);

    for (let offset = 0; offset < substitutionCount; offset += 1) {
      const sourceWord = sourceWords[sourceIndex + offset];
      const inputWord = inputWords[inputIndex + offset];

      comparisonItems.push({
        id: `wrong-${inputIndex + offset}-${inputWord.start}`,
        inputWord: inputWord.text,
        targetWord: sourceWord.text,
        inputIndex: inputIndex + offset,
        sourceIndex: sourceIndex + offset,
        status: 'wrong',
      });

      mistakes.push({
        id: `mistake-wrong-${inputIndex + offset}-${inputWord.start}`,
        order: mistakes.length + 1,
        inputIndex: inputIndex + offset,
        sourceIndex: sourceIndex + offset,
        writtenWord: inputWord.text,
        correctWord: sourceWord.text,
        statusLabel: 'Wrong word',
      });
    }

    sourceIndex += substitutionCount;
    inputIndex += substitutionCount;

    while (inputIndex < nextInputBoundary) {
      const inputWord = inputWords[inputIndex];
      const expectedWord = sourceWords[sourceIndex]?.text ?? 'No matching source word';

      comparisonItems.push({
        id: `extra-${inputIndex}-${inputWord.start}`,
        inputWord: inputWord.text,
        targetWord: expectedWord,
        inputIndex,
        sourceIndex: sourceIndex < sourceWords.length ? sourceIndex : null,
        status: 'extra',
      });

      mistakes.push({
        id: `mistake-extra-${inputIndex}-${inputWord.start}`,
        order: mistakes.length + 1,
        inputIndex,
        sourceIndex: sourceIndex < sourceWords.length ? sourceIndex : null,
        writtenWord: inputWord.text,
        correctWord: expectedWord,
        statusLabel: 'Extra word',
      });

      inputIndex += 1;
    }

    while (sourceIndex < nextSourceBoundary) {
      const sourceWord = sourceWords[sourceIndex];
      mistakes.push({
        id: `mistake-missing-${sourceIndex}-${sourceWord.start}`,
        order: mistakes.length + 1,
        inputIndex: null,
        sourceIndex,
        writtenWord: 'Missing word',
        correctWord: sourceWord.text,
        statusLabel: 'Missing word',
      });
      sourceIndex += 1;
    }
  }

  const sourceCount = Math.max(sourceWords.length, 1);
  const accuracy = Math.max(0, Math.round(((correctCount - (mistakes.length - (sourceWords.length - correctCount))) / sourceCount) * 100));

  return { comparisonItems, mistakes, accuracy: Math.min(100, accuracy) };
}

function alignWordSequences(sourceWords: TokenRange[], inputWords: TokenRange[]) {
  const matrix = Array.from({ length: sourceWords.length + 1 }, () => Array.from({ length: inputWords.length + 1 }, () => 0));

  for (let sourceIndex = sourceWords.length - 1; sourceIndex >= 0; sourceIndex -= 1) {
    for (let inputIndex = inputWords.length - 1; inputIndex >= 0; inputIndex -= 1) {
      matrix[sourceIndex][inputIndex] =
        sourceWords[sourceIndex].normalized === inputWords[inputIndex].normalized
          ? matrix[sourceIndex + 1][inputIndex + 1] + 1
          : Math.max(matrix[sourceIndex + 1][inputIndex], matrix[sourceIndex][inputIndex + 1]);
    }
  }

  const matches: Array<{ sourceIndex: number; inputIndex: number }> = [];
  let sourceIndex = 0;
  let inputIndex = 0;

  while (sourceIndex < sourceWords.length && inputIndex < inputWords.length) {
    if (sourceWords[sourceIndex].normalized === inputWords[inputIndex].normalized) {
      matches.push({ sourceIndex, inputIndex });
      sourceIndex += 1;
      inputIndex += 1;
      continue;
    }

    if (matrix[sourceIndex + 1][inputIndex] >= matrix[sourceIndex][inputIndex + 1]) {
      sourceIndex += 1;
    } else {
      inputIndex += 1;
    }
  }

  return matches;
}

function cleanWordForSpeech(word: string) {
  return word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '') || word;
}

function calculateWordDelay(word: string, basePause: number, sentencePause: number) {
  const normalizedLength = cleanWordForSpeech(word).length;
  const extraLengthPause = Math.max(0, normalizedLength - 5) * 0.1;
  const commaPause = /[,;:]$/.test(word) ? 0.2 : 0;
  const endingPause = /[.!?]$/.test(word) ? sentencePause : 0;

  return basePause + extraLengthPause + commaPause + endingPause;
}

function revealRangeInTextarea(textarea: HTMLTextAreaElement, range: { start: number; end: number }) {
  textarea.focus({ preventScroll: true });
  textarea.setSelectionRange(range.start, range.end);
  const selectionPosition = getTextareaSelectionPosition(textarea, range.start);

  if (selectionPosition) {
    textarea.scrollTop = Math.max(0, selectionPosition.top - textarea.clientHeight / 2 + selectionPosition.height);
  }
}

function syncOverlayScroll(textarea: HTMLTextAreaElement, overlay: HTMLDivElement | null) {
  if (!overlay) {
    return;
  }

  overlay.scrollTop = textarea.scrollTop;
  overlay.scrollLeft = textarea.scrollLeft;
}

function getTextareaSelectionPosition(textarea: HTMLTextAreaElement, characterIndex: number) {
  const mirror = document.createElement('div');
  const computedStyle = window.getComputedStyle(textarea);

  for (const property of [
    'boxSizing',
    'width',
    'height',
    'overflowX',
    'overflowY',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'fontStretch',
    'fontSize',
    'lineHeight',
    'fontFamily',
    'textAlign',
    'textTransform',
    'textIndent',
    'textDecoration',
    'letterSpacing',
    'wordSpacing',
    'tabSize',
    'whiteSpace',
  ] as const) {
    mirror.style[property] = computedStyle[property];
  }

  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.pointerEvents = 'none';
  mirror.style.left = '-9999px';
  mirror.style.top = '0';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordWrap = 'break-word';
  mirror.style.overflow = 'hidden';

  mirror.textContent = textarea.value.slice(0, characterIndex);

  const marker = document.createElement('span');
  marker.textContent = textarea.value.slice(characterIndex, characterIndex + 1) || ' ';
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const position = {
    top: marker.offsetTop,
    left: marker.offsetLeft,
    height: marker.offsetHeight || parseFloat(computedStyle.lineHeight) || 28,
  };

  document.body.removeChild(mirror);
  return position;
}

function readStoredWorkspaceDraft(): WorkspaceDraft | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawDraft = window.localStorage.getItem(WORKSPACE_DRAFT_KEY) ?? window.sessionStorage.getItem(WORKSPACE_DRAFT_KEY);
  if (!rawDraft) {
    return null;
  }

  try {
    return JSON.parse(rawDraft) as WorkspaceDraft;
  } catch {
    window.localStorage.removeItem(WORKSPACE_DRAFT_KEY);
    window.sessionStorage.removeItem(WORKSPACE_DRAFT_KEY);
    return null;
  }
}

function writeStoredWorkspaceDraft(draft: WorkspaceDraft) {
  if (typeof window === 'undefined') {
    return;
  }

  const serializedDraft = JSON.stringify(draft);
  window.localStorage.setItem(WORKSPACE_DRAFT_KEY, serializedDraft);
  window.sessionStorage.setItem(WORKSPACE_DRAFT_KEY, serializedDraft);
}

function detectPracticeLanguage(text: string): PracticeLanguage | null {
  const normalized = text.toLowerCase();

  if (!normalized.trim()) {
    return null;
  }

  const germanMarkers = [
    ' der ', ' die ', ' das ', ' und ', ' ist ', ' nicht ', ' mit ', ' auf ', ' ein ', ' eine ', ' ich ', ' wir ',
    ' sie ', ' zu ', ' von ', ' fuer ', ' zum ', ' zur ', ' ueber ', 'sch', 'ei', 'ie',
  ];
  const englishMarkers = [
    ' the ', ' and ', ' is ', ' are ', ' with ', ' for ', ' this ', ' that ', ' our ', ' you ', ' we ', ' they ',
    ' have ', ' has ', ' will ', ' about ', ' from ', ' to ',
  ];

  const germanDiacritics = (normalized.match(/[äöüß]/g) ?? []).length;
  const germanScore = germanMarkers.reduce((score, marker) => score + (normalized.includes(marker) ? 1 : 0), germanDiacritics * 2);
  const englishScore = englishMarkers.reduce((score, marker) => score + (normalized.includes(marker) ? 1 : 0), 0);

  if (germanScore === englishScore) {
    return null;
  }

  return germanScore > englishScore ? 'de-DE' : 'en-US';
}
