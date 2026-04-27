import React, { useState, useEffect, useRef } from 'react';
import { Pause, Play, Settings, CheckCircle, Volume2, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

const INITIAL_SOURCE = "Quantum mechanics describes the physical properties of nature at the scale of atoms and subatomic particles. It is the foundation of all quantum physics including quantum chemistry, quantum field theory, quantum technology, and quantum information science.";

export default function DictationWorkspace() {
  const [isPlaying, setIsPlaying] = useState(false);
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
  const currentTokenRef = useRef("");

  const sourceWords = sourceText.trim().split(/\s+/).filter(w => w.length > 0);
  const inputWords = inputText.trim().split(/\s+/).filter(w => w.length > 0);

  const normalizeWord = (word: string = "") =>
    word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsPlaying(false);
    isPlayingRef.current = false;
    setCurrentWordIndex(-1);
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
      stopSpeaking();
      return;
    }

    setCurrentWordIndex(index);
    currentTokenRef.current = normalizeWord(inputTextRef.current.trim().split(/\s+/).filter(w => w.length > 0)[index] || "");
    const word = sourceWords[index];
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = speechRate;

    utterance.onend = () => {
      if (typingAwareMode) {
        waitForWordCompletion(index);
        return;
      }

      // Calculate delay: base gap + extra if word > 4 chars
      const extraDelay = word.length > 4 ? 0.3 : 0;
      const totalDelay = (wordGap + extraDelay) * 1000;
      timeoutRef.current = setTimeout(() => speakWord(index + 1), totalDelay);
    };

    window.speechSynthesis.speak(utterance);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopSpeaking();
    } else {
      if (!sourceText) return;
      setIsPlaying(true);
      isPlayingRef.current = true;
      speakWord(0);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  useEffect(() => {
    inputTextRef.current = inputText;
  }, [inputText]);

  return (
    <main className="max-w-[1440px] mx-auto px-8 py-12 pt-28">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">English</span>
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">Level C1</span>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tighter text-on-surface font-headline">Advanced Dictation Lab</h1>
          <p className="text-on-surface-variant max-w-2xl font-medium">Precision controls for speech rate and word gaps. Perfect for mastering complex terminology.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase">Accuracy</span>
          <div className="flex items-center gap-4 bg-surface-container-high px-6 py-3 rounded-2xl whisper-shadow">
            <div className="text-2xl font-bold font-headline text-primary">
              {inputWords.length > 0 ? Math.round((inputWords.filter((w, i) => w.toLowerCase() === sourceWords[i]?.toLowerCase()).length / inputWords.length) * 100) : 0}%
            </div>
            <div className="w-32 h-2 bg-surface-container-highest rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-500" 
                style={{ width: `${inputWords.length > 0 ? (inputWords.filter((w, i) => w.toLowerCase() === sourceWords[i]?.toLowerCase()).length / inputWords.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Source Script & Advanced Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-low rounded-3xl p-8 whisper-shadow border border-outline-variant/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">1. Source Script</h3>
              <button 
                onClick={() => setSourceText("")}
                className="text-on-surface-variant hover:text-error transition-colors"
                title="Clear Script"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            <textarea 
              className="w-full h-[200px] bg-surface-container-lowest border-none rounded-2xl p-4 text-base font-medium text-on-surface placeholder:text-on-surface-variant/40 resize-none focus:ring-2 focus:ring-primary/20"
              placeholder="Paste the text you want to practice here..."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
            />
            
            <div className="mt-8 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-widest">Advanced Audio Settings</h4>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                    <span>Speech Rate (Advanced)</span>
                    <span className="text-primary font-mono">{speechRate.toFixed(1)}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="3" 
                    step="0.1"
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary" 
                  />
                  <div className="flex justify-between text-[8px] text-on-surface-variant font-bold">
                    <span>ULTRA SLOW</span>
                    <span>NORMAL</span>
                    <span>FAST</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                    <span>Word Gap Delay</span>
                    <span className="text-primary font-mono">{wordGap.toFixed(1)}s</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="3" 
                    step="0.1"
                    value={wordGap}
                    onChange={(e) => setWordGap(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary" 
                  />
                  <div className="flex justify-between text-[8px] text-on-surface-variant font-bold">
                    <span>INSTANT</span>
                    <span>LONG PAUSE</span>
                  </div>
                </div>

                <div className="bg-surface-container-highest/30 p-3 rounded-xl border border-primary/10">
                  <p className="text-[9px] text-on-surface-variant font-medium leading-relaxed">
                    <span className="text-primary font-bold">Smart Delay:</span> Words with more than 4 characters automatically trigger an additional 0.3s pause to give you more time to type.
                  </p>
                </div>

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

              <button 
                onClick={togglePlay}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all",
                  isPlaying ? "bg-error text-on-error" : "bg-primary text-on-primary shadow-lg shadow-primary/20"
                )}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                {isPlaying ? "Stop Reading" : "Start Advanced Dictation"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Dictation Workspace */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-surface-container-lowest rounded-3xl min-h-[500px] p-10 flex flex-col gap-8 whisper-shadow border border-outline-variant/10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">2. Your Dictation</h3>
              <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                <span className={cn("w-2 h-2 rounded-full", isPlaying ? "bg-primary animate-pulse" : "bg-outline-variant")}></span>
                {isPlaying ? "LISTENING MODE" : "READY"}
              </div>
            </div>
            <div className="relative flex-1">
              <textarea 
                className="w-full h-full min-h-[300px] border-none focus:ring-0 text-xl md:text-2xl font-medium leading-[1.8] text-on-surface placeholder:text-on-surface-variant/30 resize-none" 
                placeholder="Start typing what you hear..."
                value={inputText}
                onChange={(e) => {
                  lastInputAtRef.current = Date.now();
                  setInputText(e.target.value);
                }}
              />
            </div>
            
            <div className="bg-surface-container-low rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Real-time Comparison</h3>
                {currentWordIndex !== -1 && (
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    Reading word {currentWordIndex + 1} of {sourceWords.length}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-1.5 gap-y-3 text-lg md:text-xl font-medium leading-relaxed">
                {inputWords.map((word, i) => {
                  const targetWord = sourceWords[i];
                  const isCorrect = targetWord && word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"") === targetWord.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
                  const hasTarget = !!targetWord;
                  
                  return (
                    <span 
                      key={i} 
                      className={cn(
                        "transition-all px-1 rounded",
                        !hasTarget ? "bg-error-container/20 text-error border-b-2 border-error" : 
                        isCorrect ? "text-on-surface" : "bg-error-container/20 text-error border-b-2 border-error"
                      )}
                    >
                      {word}
                    </span>
                  );
                })}
                {inputWords.length === 0 && (
                  <span className="text-on-surface-variant/40 italic text-base">Analysis will appear as you type...</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button 
              onClick={() => setInputText("")}
              className="px-8 py-4 rounded-2xl font-bold text-on-surface-variant hover:bg-surface-container transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
            <button className="bg-primary text-on-primary px-12 py-4 rounded-2xl font-bold font-headline text-lg transition-all hover:bg-primary-dim hover:shadow-lg active:scale-95 flex items-center gap-3 whisper-shadow">
              Finish & Grade
              <CheckCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
