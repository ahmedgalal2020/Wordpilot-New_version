import { AlertCircle, CheckCircle, Mic, Pause, Play } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { PASS_SCORE } from '../constants';
import { ShadowedSentence, TargetWordAnalysis, WordList } from '../components';
import { buildSuggestion } from '../transcript';
import type { ShadowingAttempt, ShadowingSegment } from '../types';

type PracticeSectionProps = {
  activeWordIndex: number;
  currentIndex: number;
  currentSegment: ShadowingSegment | null;
  feedback: ShadowingAttempt | null;
  isAnalyzingAudio: boolean;
  isPlayingSegment: boolean;
  isRecording: boolean;
  isShadowRecording: boolean;
  onCheckAttempt: () => void;
  onPlayCurrentSegment: () => void;
  onStartRecording: (withReferenceAudio?: boolean) => void;
  onStopRecording: () => void;
  onSpokenTextChange: (value: string) => void;
  recordingSupported: boolean;
  recordingUrl: string | null;
  segmentsCount: number;
  spokenText: string;
};

export function PracticeSection({
  activeWordIndex,
  currentIndex,
  currentSegment,
  feedback,
  isAnalyzingAudio,
  isPlayingSegment,
  isRecording,
  isShadowRecording,
  onCheckAttempt,
  onPlayCurrentSegment,
  onStartRecording,
  onStopRecording,
  onSpokenTextChange,
  recordingSupported,
  recordingUrl,
  segmentsCount,
  spokenText,
}: PracticeSectionProps) {
  return (
    <div className="xl:col-span-8 bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 whisper-shadow">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary">Practice mode</p>
          <h2 className="mt-2 font-headline font-black text-2xl text-on-surface">
            {currentSegment ? `Sentence ${currentIndex + 1} of ${segmentsCount}` : 'Build a lesson to begin'}
          </h2>
        </div>
        <span className="inline-flex rounded-full bg-primary-container px-4 py-2 text-xs font-bold text-primary">
          Pass score {PASS_SCORE}%+
        </span>
      </div>

      <div className="mt-6 rounded-2xl bg-surface-container-low p-5 sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Current sentence</p>
        {currentSegment ? (
          <ShadowedSentence segment={currentSegment} activeWordIndex={activeWordIndex} isPlaying={isPlayingSegment} />
        ) : (
          <p className="mt-3 text-xl sm:text-2xl font-headline font-black leading-snug text-on-surface">
            Your highlighted sentence will appear here.
          </p>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={onPlayCurrentSegment}
          disabled={!currentSegment || isAnalyzingAudio}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary transition hover:bg-primary-dim disabled:opacity-60"
        >
          {isPlayingSegment ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isPlayingSegment ? 'Stop audio' : 'Play once'}
        </button>
        <button
          type="button"
          onClick={() => { if (isRecording) onStopRecording(); else onStartRecording(false); }}
          disabled={!currentSegment || isShadowRecording || isAnalyzingAudio}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition disabled:opacity-60',
            isRecording ? 'bg-error text-white' : 'bg-surface-container-low text-on-surface hover:bg-surface-container',
          )}
        >
          <Mic className="h-4 w-4" />
          {isRecording && !isShadowRecording ? 'Stop' : recordingSupported ? 'Record' : 'Mic unavailable'}
        </button>
        <button
          type="button"
          onClick={() => { if (isRecording) onStopRecording(); else onStartRecording(true); }}
          disabled={!currentSegment || isAnalyzingAudio || (isPlayingSegment && !isShadowRecording) || (isRecording && !isShadowRecording)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-surface-container-low px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container disabled:opacity-60"
        >
          <Mic className="h-4 w-4" />
          {isRecording && isShadowRecording ? 'Stop shadow' : 'Record with audio'}
        </button>
        <button
          type="button"
          onClick={onCheckAttempt}
          disabled={!currentSegment || !spokenText.trim() || isAnalyzingAudio}
          className="inline-flex items-center justify-center rounded-full bg-surface-container-low px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container disabled:opacity-60"
        >
          {isAnalyzingAudio ? 'Analyzing...' : 'Check attempt'}
        </button>
      </div>

      {isAnalyzingAudio && (
        <div className="mt-5 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm font-bold text-primary">
          AI is listening to your recording and checking it against the sentence...
        </div>
      )}

      {recordingUrl && (
        <div className="mt-5 rounded-2xl bg-surface-container-low p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Your recording</p>
          <audio controls src={recordingUrl} className="mt-3 w-full" />
        </div>
      )}

      <label htmlFor="shadowing-spoken-response" className="mt-5 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Your spoken response</label>
      <textarea
        id="shadowing-spoken-response"
        value={spokenText}
        onChange={(event) => onSpokenTextChange(event.target.value)}
        placeholder="Speech recognition result appears here. You can edit it or type your attempt."
        className="mt-2 min-h-[110px] w-full resize-y rounded-2xl border border-surface-container bg-surface-container-lowest px-4 py-3 text-sm leading-6 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
      />

      {feedback && (
        <div className={cn('mt-5 rounded-2xl border p-5 transition-all duration-500', feedback.passed ? 'border-primary/20 bg-primary/5 shadow-[0_18px_45px_rgba(20,184,116,0.18)]' : 'border-error/20 bg-error/5')}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className={cn('inline-flex h-12 w-12 items-center justify-center rounded-full', feedback.passed ? 'bg-primary text-on-primary animate-pulse' : 'bg-error/10 text-error')}>
                {feedback.passed ? <CheckCircle className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
              </span>
              <div>
                <p className="font-headline font-black text-xl text-on-surface">{feedback.score}% - {feedback.passed ? 'Passed' : 'Retry'}</p>
                <p className="text-sm text-on-surface-variant">{buildSuggestion(feedback)}</p>
                {currentSegment && (
                  <p className="mt-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    Last attempt · {currentSegment.attempts.length} {currentSegment.attempts.length === 1 ? 'try' : 'tries'}
                  </p>
                )}
              </div>
            </div>
            <div className="w-full sm:w-52">
              <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                <span>Score</span>
                <span>{PASS_SCORE}% to pass</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-surface-container-high">
                <div className={cn('h-full rounded-full transition-all duration-700', feedback.passed ? 'bg-primary' : 'bg-error')} style={{ width: `${feedback.score}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-surface-container-lowest p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Detected speech</p>
            <p className="mt-2 text-sm leading-6 text-on-surface">{feedback.transcript}</p>
          </div>

          {currentSegment && <TargetWordAnalysis target={currentSegment.text} attempt={feedback} />}

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <WordList title="Missing words" words={feedback.missingWords} />
            <WordList title="Incorrect words" words={feedback.incorrectWords} />
          </div>
        </div>
      )}
    </div>
  );
}
