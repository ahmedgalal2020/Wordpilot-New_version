import { cn } from '../../lib/utils';
import { LessonSetupSection } from './sections/LessonSetupSection';
import { PracticeSection } from './sections/PracticeSection';
import { PracticeSidebar } from './sections/PracticeSidebar';
import { ProgressReviewSection } from './sections/ProgressReviewSection';
import { VideoProgressSection } from './sections/VideoProgressSection';
import type { ShadowingPracticeController } from './useShadowingPractice';

export function ShadowingPracticeView({ workspace }: { workspace: ShadowingPracticeController }) {
  const {
    activeWordIndex,
    averageScore,
    bestScore,
    buildSegments,
    completedCount,
    currentIndex,
    currentSegment,
    estimatedSegments,
    embedUrl,
    feedback,
    fileInputRef,
    handleTranscriptUpload,
    isAnalyzingAudio,
    isFetchingTranscript,
    isPlayingSegment,
    isRecording,
    isShadowRecording,
    justCompletedSegmentId,
    lessonProgress,
    loadSampleTranscript,
    playCurrentSegment,
    playerActivated,
    playbackNonce,
    recordingSupported,
    recordingUrl,
    remainingCount,
    resumeSession,
    report,
    restoreSegmentPractice,
    savedSessions,
    segments,
    setFetchedCues,
    setSpokenText,
    setTranscript,
    setTranscriptLanguageCode,
    setTranscriptNotice,
    setTranscriptSource,
    setVideoUrl,
    spokenText,
    startRecording,
    status,
    stopRecording,
    thumbnailUrl,
    transcript,
    transcriptLanguageCode,
    transcriptNotice,
    transcriptSource,
    transcriptWordCount,
    videoId,
    videoUrl,
    youtubeFrameRef,
    evaluateAttempt,
  } = workspace;

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 pt-24 sm:pt-28 min-h-screen">
      <header className="mb-10 sm:mb-12">
        <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary mb-3">Shadowing Practice</p>
        <h1 className="font-headline font-extrabold text-3xl sm:text-4xl tracking-tight text-on-surface">Listen, repeat, level up</h1>
        <p className="text-on-surface-variant mt-3 max-w-2xl">
          Turn any YouTube lesson into sentence-by-sentence speaking practice with progress, retries, and a complete performance report.
        </p>
      </header>

      {status && (
        <div role="status" aria-live="polite" className={cn('mb-6 rounded-2xl border px-5 py-4 text-sm font-medium', transcriptNotice === 'needsManual' ? 'border-error/20 bg-error/5 text-on-surface' : 'border-primary/10 bg-primary/5 text-on-surface')}>
          {status}
        </div>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:items-start mb-8">
        <LessonSetupSection
          estimatedSegments={estimatedSegments}
          fileInputRef={fileInputRef}
          isFetchingTranscript={isFetchingTranscript}
          onBuildSegments={buildSegments}
          onLoadSampleTranscript={loadSampleTranscript}
          onTranscriptChange={(value) => {
            setTranscript(value);
            setFetchedCues(null);
            setTranscriptNotice(value.trim() ? 'ready' : 'idle');
            setTranscriptSource(value.trim() ? 'Manual transcript' : null);
            setTranscriptLanguageCode(null);
          }}
          onTranscriptUpload={(event) => void handleTranscriptUpload(event)}
          onVideoUrlChange={setVideoUrl}
          transcript={transcript}
          transcriptNotice={transcriptNotice}
          transcriptSource={transcriptSource}
          transcriptWordCount={transcriptWordCount}
          videoId={videoId}
          videoUrl={videoUrl}
        />

        <VideoProgressSection
          averageScore={averageScore}
          completedCount={completedCount}
          currentIndex={currentIndex}
          currentSegment={currentSegment}
          embedUrl={embedUrl}
          isAnalyzingAudio={isAnalyzingAudio}
          isShadowRecording={isShadowRecording}
          lessonProgress={lessonProgress}
          onPlayCurrentSegment={playCurrentSegment}
          playerActivated={playerActivated}
          playbackNonce={playbackNonce}
          remainingCount={remainingCount}
          segmentsCount={segments.length}
          thumbnailUrl={thumbnailUrl}
          videoId={videoId}
          youtubeFrameRef={youtubeFrameRef}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:items-start mb-8">
        <PracticeSection
          activeWordIndex={activeWordIndex}
          currentIndex={currentIndex}
          currentSegment={currentSegment}
          feedback={feedback}
          isAnalyzingAudio={isAnalyzingAudio}
          isPlayingSegment={isPlayingSegment}
          isRecording={isRecording}
          isShadowRecording={isShadowRecording}
          onCheckAttempt={() => evaluateAttempt()}
          onPlayCurrentSegment={playCurrentSegment}
          onStartRecording={(withReferenceAudio) => void startRecording(withReferenceAudio)}
          onStopRecording={stopRecording}
          onSpokenTextChange={setSpokenText}
          recordingSupported={recordingSupported}
          recordingUrl={recordingUrl}
          segmentsCount={segments.length}
          spokenText={spokenText}
        />

        <PracticeSidebar
          averageScore={averageScore}
          bestScore={bestScore}
          completedCount={completedCount}
          currentIndex={currentIndex}
          justCompletedSegmentId={justCompletedSegmentId}
          onRestoreSegmentPractice={restoreSegmentPractice}
          report={report}
          segments={segments}
        />
      </section>

      <ProgressReviewSection
        onResumeSession={(savedSession) => void resumeSession(savedSession)}
        report={report}
        savedSessions={savedSessions}
      />
    </main>
  );
}

