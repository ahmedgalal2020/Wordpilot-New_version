import { useMemo } from 'react';
import type { ShadowingSegment } from '../types';

type UseYouTubeEmbedOptions = {
  currentSegment: ShadowingSegment | null;
  playbackUrl: string;
  videoId: string;
};

export function useYouTubeEmbed({ currentSegment, playbackUrl, videoId }: UseYouTubeEmbedOptions) {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;

  const buildYouTubeEmbedUrl = useMemo(
    () =>
      (segment: ShadowingSegment | null, autoplay = false) => {
        if (!videoId) return '';

        const params = new URLSearchParams({
          enablejsapi: '1',
          origin,
          rel: '0',
          modestbranding: '1',
          playsinline: '1',
          controls: '1',
        });

        if (segment) {
          const start = Math.floor(Math.max(0, segment.start));
          const end = Math.max(start + 1, Math.ceil(segment.end));
          params.set('start', String(start));
          params.set('end', String(end));
        }

        if (autoplay) params.set('autoplay', '1');

        return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
      },
    [origin, videoId],
  );

  return {
    buildYouTubeEmbedUrl,
    embedUrl: playbackUrl || buildYouTubeEmbedUrl(currentSegment, false),
    thumbnailUrl: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '',
  };
}
