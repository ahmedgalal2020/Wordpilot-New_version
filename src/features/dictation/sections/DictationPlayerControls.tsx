import { FastForward, Pause, Play, Rewind, RotateCcw, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { PlayerButton } from '../components';
import type { DictationWorkspaceController } from '../useDictationWorkspace';

export function DictationPlayerControls({ workspace }: { workspace: DictationWorkspaceController }) {
  const {
    isPlaying,
    isPaused,
    currentWordIndex,
    sourceWordRanges,
    seekWords,
    restartSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    startSpeaking,
    advanceOnSpace,
    handleAdvanceOnSpaceChange,
  } = workspace;

  return (
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
      <p className="mt-2 text-center text-[11px] font-medium text-on-surface-variant">
        {isPlaying
          ? `Playing from word ${currentWordIndex + 1}`
          : isPaused && currentWordIndex >= 0
            ? `Paused at word ${currentWordIndex + 1}`
            : 'Ready to start dictation'}
      </p>

      <label className="flex items-center justify-between gap-4 bg-surface-container-highest/30 p-3 rounded-xl border border-primary/10">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface">Advance On Space</p>
          <p className="text-[9px] text-on-surface-variant">Space immediately starts the next word and turns off timed pauses.</p>
        </div>
        <input
          type="checkbox"
          checked={advanceOnSpace}
          onChange={(e) => handleAdvanceOnSpaceChange(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
      </label>
    </div>
  );
}
