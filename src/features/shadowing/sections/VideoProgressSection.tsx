import type React from 'react';
import { ExternalLink, Play, Video } from 'lucide-react';
import { Metric } from '../components';
import type { ShadowingSegment } from '../types';

type VideoProgressSectionProps = {
  averageScore: number;
  completedCount: number;
  currentIndex: number;
  currentSegment: ShadowingSegment | null;
  embedUrl: string;
  isAnalyzingAudio: boolean;
  isShadowRecording: boolean;
  lessonProgress: number;
  onPlayCurrentSegment: () => void;
  playerActivated: boolean;
  playbackNonce: number;
  remainingCount: number;
  segmentsCount: number;
  thumbnailUrl: string;
  videoId: string;
  youtubeFrameRef: React.RefObject<HTMLIFrameElement | null>;
};

export function VideoProgressSection({
  averageScore,
  completedCount,
  currentIndex,
  currentSegment,
  embedUrl,
  isAnalyzingAudio,
  isShadowRecording,
  lessonProgress,
  onPlayCurrentSegment,
  playerActivated,
  playbackNonce,
  remainingCount,
  segmentsCount,
  thumbnailUrl,
  videoId,
  youtubeFrameRef,
}: VideoProgressSectionProps) {
  return (
    <div className="xl:col-span-7 space-y-6">
      <section className="bg-surface-container-low rounded-[2rem] p-5 sm:p-6 whisper-shadow">
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-surface-container-high border border-outline-variant/10">
          {embedUrl ? (
            <>
              <iframe
                key={`${videoId}-${playbackNonce}-${currentIndex}`}
                ref={youtubeFrameRef}
                title="Shadowing YouTube video"
                src={embedUrl}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              {!playerActivated && (
                <button
                  type="button"
                  onClick={onPlayCurrentSegment}
                  disabled={!currentSegment || isShadowRecording || isAnalyzingAudio}
                  className="group absolute inset-0 h-full w-full overflow-hidden text-left disabled:cursor-not-allowed"
                >
                  <img src={thumbnailUrl} alt="YouTube lesson preview" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-black/25" />
                  <span className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-lg transition group-hover:bg-primary-dim">
                    <Play className="h-4 w-4" />
                    Play current segment
                  </span>
                </button>
              )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-on-surface-variant">
              <Video className="h-10 w-10 text-primary" />
              <p className="mt-3 text-sm font-semibold">Paste a YouTube URL to embed the lesson.</p>
            </div>
          )}
        </div>
        {videoId && (
          <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-surface-container-lowest px-4 py-3 text-xs font-semibold text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
            <p>YouTube preview is ready. If the player is blocked in your browser, open the video in a new tab and keep practising here.</p>
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-surface-container-low px-4 py-2 text-on-surface transition hover:bg-surface-container"
            >
              Open video
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-container-high">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${lessonProgress}%` }} />
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric label="Completed" value={`${completedCount}/${segmentsCount || 0}`} />
        <Metric label="Remaining" value={String(remainingCount)} />
        <Metric label="Average" value={`${averageScore}%`} />
        <Metric label="Progress" value={`${lessonProgress}%`} />
      </section>
    </div>
  );
}
