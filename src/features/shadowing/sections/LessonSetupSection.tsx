import type React from 'react';
import { LoaderCircle, Upload, Video } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { SetupStat } from '../components';

type TranscriptNotice = 'idle' | 'loading' | 'ready' | 'needsManual' | 'error';

type LessonSetupSectionProps = {
  estimatedSegments: number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isFetchingTranscript: boolean;
  onBuildSegments: () => void;
  onLoadSampleTranscript: () => void;
  onTranscriptChange: (value: string) => void;
  onTranscriptUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onVideoUrlChange: (value: string) => void;
  transcript: string;
  transcriptNotice: TranscriptNotice;
  transcriptSource: string | null;
  transcriptWordCount: number;
  videoId: string;
  videoUrl: string;
};

export function LessonSetupSection({
  estimatedSegments,
  fileInputRef,
  isFetchingTranscript,
  onBuildSegments,
  onLoadSampleTranscript,
  onTranscriptChange,
  onTranscriptUpload,
  onVideoUrlChange,
  transcript,
  transcriptNotice,
  transcriptSource,
  transcriptWordCount,
  videoId,
  videoUrl,
}: LessonSetupSectionProps) {
  return (
    <div className="xl:col-span-5 bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 whisper-shadow">
      <div className="flex items-center gap-2 text-primary text-[0.6875rem] font-bold tracking-widest uppercase">
        <Video className="h-4 w-4" />
        Lesson setup
      </div>
      <label htmlFor="shadowing-youtube-url" className="mt-5 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">YouTube URL</label>
      <input
        id="shadowing-youtube-url"
        value={videoUrl}
        onChange={(event) => onVideoUrlChange(event.target.value)}
        placeholder="https://www.youtube.com/watch?v=..."
        className="mt-2 w-full rounded-2xl border border-surface-container bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
      {videoUrl && !videoId && (
        <p className="mt-2 text-xs font-semibold text-error">Use a valid YouTube watch, shorts, embed, or youtu.be link.</p>
      )}
      <label htmlFor="shadowing-transcript" className="mt-5 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Transcript or subtitles</label>
      <textarea
        id="shadowing-transcript"
        value={transcript}
        onChange={(event) => onTranscriptChange(event.target.value)}
        placeholder="Paste the transcript here. WordPilot will split it into short speaking segments."
        className="mt-2 min-h-[220px] w-full resize-y rounded-2xl border border-surface-container bg-surface-container-lowest px-4 py-3 text-sm leading-6 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
      <input ref={fileInputRef} type="file" accept=".txt,.srt,.vtt" className="hidden" onChange={(event) => onTranscriptUpload(event)} />
      <div className="mt-4 grid grid-cols-3 gap-3 rounded-2xl bg-surface-container-low p-3 text-center">
        <SetupStat label="Words" value={String(transcriptWordCount)} />
        <SetupStat label="Segments" value={String(estimatedSegments)} />
        <SetupStat label="Source" value={isFetchingTranscript ? 'Fetching' : transcriptSource ? 'Ready' : 'Auto'} />
      </div>
      <div className={cn('mt-3 rounded-2xl px-4 py-3 text-xs font-semibold', transcriptNotice === 'needsManual' ? 'bg-error/5 text-on-surface' : 'bg-surface-container-low text-on-surface-variant')}>
        <div className="flex items-start gap-2">
          {isFetchingTranscript && <LoaderCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-primary" />}
          <p>
            {isFetchingTranscript
              ? 'Fetching captions automatically...'
              : transcriptSource
                ? `Transcript source: ${transcriptSource}`
                : transcriptNotice === 'needsManual'
                  ? 'Captions are not available automatically for this video right now. Paste the transcript here or upload a subtitle file to keep practising.'
                  : 'Paste a YouTube link and WordPilot will try to add the transcript automatically.'}
          </p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <button type="button" onClick={onBuildSegments} className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary transition hover:bg-primary-dim">
          Build lesson
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-full bg-surface-container-low px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container">
          <Upload className="h-4 w-4" />
          Upload file
        </button>
        <button type="button" onClick={onLoadSampleTranscript} className="inline-flex items-center justify-center rounded-full bg-surface-container-low px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container">
          Use sample
        </button>
      </div>
    </div>
  );
}
