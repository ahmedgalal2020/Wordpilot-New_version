import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, Pause, RotateCcw, SlidersHorizontal, Volume2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { apiFetch } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';

const INITIAL_SOURCE = 'Quantum mechanics describes the physical properties of nature at the scale of atoms and subatomic particles.';

export default function DictationWorkspace() {
  const { token } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [sourceText, setSourceText] = useState(INITIAL_SOURCE);
  const [inputText, setInputText] = useState('');
  const [speechRate, setSpeechRate] = useState(1);
  const [wordGap, setWordGap] = useState(0.5);
  const [saveMessage, setSaveMessage] = useState('');

  const isPlayingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sourceWords = sourceText.trim().split(/\s+/).filter(Boolean);
  const inputWords = inputText.trim().split(/\s+/).filter(Boolean);

  const accuracy = inputWords.length
    ? Math.round((inputWords.filter((w, i) => w.toLowerCase() === sourceWords[i]?.toLowerCase()).length / inputWords.length) * 100)
    : 0;

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsPlaying(false);
    isPlayingRef.current = false;
  };

  const speakWord = (index: number) => {
    if (!isPlayingRef.current || index >= sourceWords.length) return stopSpeaking();
    const word = sourceWords[index];
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = speechRate;
    utterance.onend = () => {
      timeoutRef.current = setTimeout(() => speakWord(index + 1), (wordGap + (word.length > 4 ? 0.3 : 0)) * 1000);
    };
    window.speechSynthesis.speak(utterance);
  };

  const togglePlay = () => {
    if (isPlaying) return stopSpeaking();
    setIsPlaying(true);
    isPlayingRef.current = true;
    speakWord(0);
  };

  useEffect(() => {
    if (!token) return;
    void apiFetch<{ speechRate: number; wordGap: number }>('/settings', {}, token)
      .then((cfg) => {
        if (cfg?.speechRate) setSpeechRate(cfg.speechRate);
        if (cfg?.wordGap !== undefined) setWordGap(cfg.wordGap);
      })
      .catch(() => undefined);
  }, [token]);

  useEffect(() => () => stopSpeaking(), []);

  const finishSession = async () => {
    if (!token) return;
    try {
      await apiFetch('/sessions', { method: 'POST', body: JSON.stringify({ title: 'Dictation Practice', sourceText, userInput: inputText, language: 'English', score: accuracy }) }, token);
      await apiFetch('/settings', { method: 'PUT', body: JSON.stringify({ speechRate, wordGap }) }, token);
      setSaveMessage('Session saved successfully.');
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Failed to save session');
    }
  };

  return (
    <main className="max-w-[1440px] mx-auto px-8 py-12 pt-28">
      <h1 className="text-4xl font-headline font-bold mb-6">Advanced Dictation Lab</h1>
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-surface-container-low rounded-3xl p-8">
          <h3 className="text-sm font-bold mb-4">Source Script</h3>
          <textarea className="w-full h-52 bg-surface-container-lowest rounded-xl p-4" value={sourceText} onChange={(e) => setSourceText(e.target.value)} />
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-xs"><span>Speech Rate</span><span>{speechRate.toFixed(1)}x</span></div>
            <input type="range" min="0.1" max="3" step="0.1" value={speechRate} onChange={(e) => setSpeechRate(parseFloat(e.target.value))} className="w-full" />
            <div className="flex items-center justify-between text-xs"><span>Word Gap</span><span>{wordGap.toFixed(1)}s</span></div>
            <input type="range" min="0" max="3" step="0.1" value={wordGap} onChange={(e) => setWordGap(parseFloat(e.target.value))} className="w-full" />
          </div>
          <button onClick={togglePlay} className={cn('mt-6 w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2', isPlaying ? 'bg-error text-white' : 'bg-primary text-on-primary')}>
            {isPlaying ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />} {isPlaying ? 'Stop' : 'Start'}
          </button>
        </div>

        <div className="lg:col-span-8 bg-surface-container-lowest rounded-3xl p-8 space-y-6">
          <div className="flex justify-between"><h3 className="font-bold">Your Dictation</h3><span className="text-primary font-bold">{accuracy}%</span></div>
          <textarea className="w-full min-h-72 text-xl bg-transparent" placeholder="Start typing what you hear..." value={inputText} onChange={(e) => setInputText(e.target.value)} />
          <div className="flex gap-3">
            <button onClick={() => setInputText('')} className="px-5 py-3 rounded-xl border inline-flex items-center gap-2"><RotateCcw className="w-4 h-4" />Reset</button>
            <button onClick={finishSession} className="px-6 py-3 rounded-xl bg-primary text-on-primary inline-flex items-center gap-2">Finish & Grade <CheckCircle className="w-4 h-4" /></button>
          </div>
          {saveMessage && <p className="text-sm text-on-surface-variant">{saveMessage}</p>}
          <div className="text-sm text-on-surface-variant inline-flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" />Settings are saved to your account.</div>
        </div>
      </div>
    </main>
  );
}
