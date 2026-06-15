import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  FileText,
  LoaderCircle,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  Upload,
  Video,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { normalizeCefrLevel, normalizeLearningLanguage } from '../lib/learning';

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type ShadowingSegment = {
  id: string;
  text: string;
  start: number;
  end: number;
  status: 'locked' | 'current' | 'completed' | 'retry';
  attempts: ShadowingAttempt[];
};

type ShadowingAttempt = {
  score: number;
  transcript: string;
  missingWords: string[];
  incorrectWords: string[];
  passed: boolean;
  createdAt: string;
};

type ShadowingSession = {
  id: string;
  title: string;
  videoUrl: string;
  videoId: string;
  language: string;
  level: string;
  completed: number;
  total: number;
  averageScore: number;
  bestScore: number;
  difficultSentences: string[];
  missedWords: string[];
  updatedAt: string;
  status: 'in_progress' | 'completed';
};

const STORAGE_KEY = 'wordpilot-shadowing-sessions-v1';
const PASS_SCORE = 60;
const SAMPLE_TRANSCRIPT =
  'Shadowing practice helps you connect listening with speaking. Listen to one sentence carefully, then repeat it with the same rhythm. Short focused repetitions build confidence and make pronunciation feel more natural.';

export default function ShadowingPracticePage() {
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const playbackTimersRef = useRef<number[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [segments, setSegments] = useState<ShadowingSegment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spokenText, setSpokenText] = useState('');
  const [feedback, setFeedback] = useState<ShadowingAttempt | null>(null);
  const [isPlayingSegment, setIsPlayingSegment] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [savedSessions, setSavedSessions] = useState<ShadowingSession[]>([]);
  const [iframeNonce, setIframeNonce] = useState(0);

  const videoId = useMemo(() => getYouTubeId(videoUrl), [videoUrl]);
  const currentSegment = segments[currentIndex] ?? null;
  const completedCount = segments.filter((segment) => segment.status === 'completed').length;
  const remainingCount = Math.max(segments.length - completedCount, 0);
  const lessonProgress = segments.length === 0 ? 0 : Math.round((completedCount / segments.length) * 100);
  const allAttempts = segments.flatMap((segment) => segment.attempts);
  const averageScore = allAttempts.length === 0 ? 0 : Math.round(allAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / allAttempts.length);
  const bestScore = allAttempts.reduce((best, attempt) => Math.max(best, attempt.score), 0);
  const language = normalizeLearningLanguage(profile?.target_language);
  const level = normalizeCefrLevel(profile?.cefr_level);
  const recognitionSupported = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  const report = useMemo(() => buildReport(segments), [segments]);

  useEffect(() => {
    setSavedSessions(readSavedSessions());
    return () => clearPlaybackTimers(playbackTimersRef.current);
  }, []);

  useEffect(() => {
    if (segments.length === 0 || !videoId) {
      return;
    }

    persistCurrentSession();
  }, [averageScore, bestScore, completedCount, segments, videoId, videoUrl]);

  function buildSegments() {
    const cleaned = transcript.trim();
    if (!videoId) {
      setStatus('Paste a valid YouTube URL first.');
      return;
    }

    if (!cleaned) {
      setStatus('Add or upload a transcript before building the lesson.');
      return;
    }

    const nextSegments = splitTranscript(cleaned).map((text, index, list) => ({
      id: `segment-${index + 1}`,
      text,
      start: index * 8,
      end: Math.max(index * 8 + estimateSegmentDuration(text), index * 8 + 5),
      status: index === 0 ? 'current' as const : 'locked' as const,
      attempts: [],
    }));

    setSegments(nextSegments);
    setCurrentIndex(0);
    setFeedback(null);
    setSpokenText('');
    setStatus(`${nextSegments.length} practice segments ready.`);
  }

  function loadSampleTranscript() {
    setTranscript(SAMPLE_TRANSCRIPT);
    setStatus('Sample transcript added. Paste your video URL, then build the lesson.');
  }

  async function handleTranscriptUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setTranscript(text);
    setStatus(`${file.name} loaded.`);
  }

  function playCurrentSegment() {
    if (!currentSegment || !videoId) {
      setStatus('Build a lesson first.');
      return;
    }

    clearPlaybackTimers(playbackTimersRef.current);
    setIsPlayingSegment(true);
    setStatus('Playing the sentence twice. Listen for rhythm and endings.');
    setIframeNonce((value) => value + 1);

    const segmentMs = Math.max((currentSegment.end - currentSegment.start) * 1000, 5000);
    playbackTimersRef.current = [
      window.setTimeout(() => setIframeNonce((value) => value + 1), segmentMs + 400),
      window.setTimeout(() => {
        setIsPlayingSegment(false);
        setStatus('Now repeat the sentence with your microphone or type what you said.');
      }, segmentMs * 2 + 900),
    ];
  }

  function startRecording() {
    if (!currentSegment) return;

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setStatus('Speech recognition is not available in this browser. Type your spoken response instead.');
      return;
    }

    const recognition = new Recognition();
    recognition.lang = getSpeechLanguage(language);
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcriptText = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .trim();
      setSpokenText(transcriptText);
      evaluateAttempt(transcriptText);
    };
    recognition.onerror = () => {
      setIsRecording(false);
      setStatus('Recording stopped. You can try again or type your response.');
    };
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    setIsRecording(true);
    setStatus('Listening...');
    recognition.start();
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }

  function evaluateAttempt(response = spokenText) {
    if (!currentSegment) return;

    const attempt = compareSpeech(currentSegment.text, response);
    setFeedback(attempt);
    setSegments((current) =>
      current.map((segment, index) => {
        if (index === currentIndex) {
          return {
            ...segment,
            status: attempt.passed ? 'completed' : 'retry',
            attempts: [...segment.attempts, attempt],
          };
        }

        if (attempt.passed && index === currentIndex + 1) {
          return { ...segment, status: 'current' };
        }

        return segment;
      }),
    );

    if (attempt.passed) {
      setStatus('Passed. Moving to the next sentence.');
      const nextIndex = currentIndex + 1;
      if (nextIndex < segments.length) {
        window.setTimeout(() => {
          setCurrentIndex(nextIndex);
          setSpokenText('');
          setFeedback(null);
        }, 650);
      } else {
        setStatus('Lesson complete. Your practice report is ready.');
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.75 } });
      }
      return;
    }

    setStatus('Retry this sentence. Listen again, then repeat with a slower pace.');
  }

  function resumeSession(session: ShadowingSession) {
    setVideoUrl(session.videoUrl);
    setStatus('Previous session loaded. Add the transcript again to rebuild editable segments.');
  }

  function persistCurrentSession() {
    if (!videoId || segments.length === 0) return;

    const nextSession: ShadowingSession = {
      id: `shadow-${videoId}`,
      title: `Shadowing lesson ${videoId}`,
      videoUrl,
      videoId,
      language,
      level,
      completed: completedCount,
      total: segments.length,
      averageScore,
      bestScore,
      difficultSentences: report.difficultSentences,
      missedWords: report.frequentlyMissedWords,
      updatedAt: new Date().toISOString(),
      status: completedCount === segments.length ? 'completed' : 'in_progress',
    };
    const existing = readSavedSessions().filter((session) => session.id !== nextSession.id);
    const next = [nextSession, ...existing].slice(0, 12);
    writeSavedSessions(next);
    setSavedSessions(next);
  }

  const embedUrl = videoId && currentSegment
    ? `https://www.youtube.com/embed/${videoId}?start=${Math.floor(currentSegment.start)}&end=${Math.ceil(currentSegment.end)}&autoplay=${isPlayingSegment ? 1 : 0}&rel=0&modestbranding=1`
    : videoId
      ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`
      : '';

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
        <div className="mb-6 rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-sm font-medium text-on-surface">
          {status}
        </div>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:items-start mb-8">
        <div className="xl:col-span-5 bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 whisper-shadow">
          <div className="flex items-center gap-2 text-primary text-[0.6875rem] font-bold tracking-widest uppercase">
            <Video className="h-4 w-4" />
            Lesson setup
          </div>
          <label className="mt-5 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">YouTube URL</label>
          <input
            value={videoUrl}
            onChange={(event) => setVideoUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="mt-2 w-full rounded-2xl border border-surface-container bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          <label className="mt-5 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Transcript or subtitles</label>
          <textarea
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            placeholder="Paste the transcript here. WordPilot will split it into short speaking segments."
            className="mt-2 min-h-[220px] w-full resize-y rounded-2xl border border-surface-container bg-surface-container-lowest px-4 py-3 text-sm leading-6 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          <input ref={fileInputRef} type="file" accept=".txt,.srt,.vtt" className="hidden" onChange={(event) => void handleTranscriptUpload(event)} />
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button type="button" onClick={buildSegments} className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary transition hover:bg-primary-dim">
              Build lesson
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-full bg-surface-container-low px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container">
              <Upload className="h-4 w-4" />
              Upload
            </button>
            <button type="button" onClick={loadSampleTranscript} className="inline-flex items-center justify-center rounded-full bg-surface-container-low px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container">
              Sample
            </button>
          </div>
        </div>

        <div className="xl:col-span-7 space-y-6">
          <section className="bg-surface-container-low rounded-[2rem] p-5 sm:p-6 whisper-shadow">
            <div className="aspect-video overflow-hidden rounded-2xl bg-surface-container-high border border-outline-variant/10">
              {embedUrl ? (
                <iframe
                  key={`${iframeNonce}-${currentSegment?.id ?? 'full'}`}
                  title="Shadowing YouTube video"
                  src={embedUrl}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-on-surface-variant">
                  <Video className="h-10 w-10 text-primary" />
                  <p className="mt-3 text-sm font-semibold">Paste a YouTube URL to embed the lesson.</p>
                </div>
              )}
            </div>
          </section>

          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Metric label="Completed" value={`${completedCount}/${segments.length || 0}`} />
            <Metric label="Remaining" value={String(remainingCount)} />
            <Metric label="Average" value={`${averageScore}%`} />
            <Metric label="Progress" value={`${lessonProgress}%`} />
          </section>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:items-start mb-8">
        <div className="xl:col-span-8 bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 whisper-shadow">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary">Practice mode</p>
              <h2 className="mt-2 font-headline font-black text-2xl text-on-surface">
                {currentSegment ? `Sentence ${currentIndex + 1} of ${segments.length}` : 'Build a lesson to begin'}
              </h2>
            </div>
            <span className="inline-flex rounded-full bg-primary-container px-4 py-2 text-xs font-bold text-primary">
              Pass score {PASS_SCORE}%+
            </span>
          </div>

          <div className="mt-6 rounded-2xl bg-surface-container-low p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Current sentence</p>
            <p className="mt-3 text-xl sm:text-2xl font-headline font-black leading-snug text-on-surface">
              {currentSegment?.text ?? 'Your highlighted sentence will appear here.'}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={playCurrentSegment}
              disabled={!currentSegment || isPlayingSegment}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary transition hover:bg-primary-dim disabled:opacity-60"
            >
              {isPlayingSegment ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlayingSegment ? 'Playing twice' : 'Play twice'}
            </button>
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!currentSegment}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition disabled:opacity-60',
                isRecording ? 'bg-error text-white' : 'bg-surface-container-low text-on-surface hover:bg-surface-container',
              )}
            >
              <Mic className="h-4 w-4" />
              {isRecording ? 'Stop' : recognitionSupported ? 'Record' : 'Mic unavailable'}
            </button>
            <button
              type="button"
              onClick={() => evaluateAttempt()}
              disabled={!currentSegment || !spokenText.trim()}
              className="inline-flex items-center justify-center rounded-full bg-surface-container-low px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container disabled:opacity-60"
            >
              Check attempt
            </button>
          </div>

          <label className="mt-5 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Your spoken response</label>
          <textarea
            value={spokenText}
            onChange={(event) => setSpokenText(event.target.value)}
            placeholder="Speech recognition result appears here. You can edit it or type your attempt."
            className="mt-2 min-h-[110px] w-full resize-y rounded-2xl border border-surface-container bg-surface-container-lowest px-4 py-3 text-sm leading-6 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />

          {feedback && (
            <div className="mt-5 rounded-2xl bg-surface-container-low p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  {feedback.passed ? <CheckCircle className="h-6 w-6 text-primary" /> : <AlertCircle className="h-6 w-6 text-error" />}
                  <div>
                    <p className="font-headline font-black text-xl text-on-surface">{feedback.score}% - {feedback.passed ? 'Pass' : 'Retry'}</p>
                    <p className="text-sm text-on-surface-variant">{buildSuggestion(feedback)}</p>
                  </div>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-surface-container-high sm:w-44">
                  <div className={cn('h-full rounded-full transition-all', feedback.passed ? 'bg-primary' : 'bg-error')} style={{ width: `${feedback.score}%` }} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <WordList title="Missing words" words={feedback.missingWords} />
                <WordList title="Incorrect words" words={feedback.incorrectWords} />
              </div>
            </div>
          )}
        </div>

        <aside className="xl:col-span-4 space-y-6">
          <section className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 whisper-shadow">
            <div className="flex items-center gap-2 text-primary text-[0.6875rem] font-bold tracking-widest uppercase">
              <FileText className="h-4 w-4" />
              Segments
            </div>
            <div className="mt-4 max-h-[460px] space-y-3 overflow-y-auto pr-1">
              {segments.length === 0 ? (
                <p className="text-sm text-on-surface-variant">Transcript segments will appear after lesson setup.</p>
              ) : (
                segments.map((segment, index) => (
                  <button
                    key={segment.id}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(index);
                      setFeedback(null);
                      setSpokenText('');
                    }}
                    className={cn(
                      'w-full rounded-2xl border p-4 text-left transition',
                      index === currentIndex
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-outline-variant/10 bg-surface-container-low hover:border-primary/40',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-widest">Sentence {index + 1}</p>
                      <SegmentStatus status={segment.status} />
                    </div>
                    <p className={cn('mt-2 line-clamp-2 text-sm leading-6', index === currentIndex ? 'text-on-primary/85' : 'text-on-surface-variant')}>
                      {segment.text}
                    </p>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="bg-primary text-on-primary rounded-[2rem] p-5 sm:p-6 whisper-shadow">
            <div className="flex items-center gap-2 text-primary-container text-[0.6875rem] font-bold tracking-widest uppercase">
              <Trophy className="h-4 w-4" />
              Session report
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <ReportBox label="Average" value={`${averageScore}%`} />
              <ReportBox label="Best" value={`${bestScore}%`} />
              <ReportBox label="Rating" value={report.rating} wide />
              <ReportBox label="Completed" value={`${completedCount}/${segments.length || 0}`} />
            </div>
            <p className="mt-5 text-sm leading-6 text-on-primary/85">{report.recommendation}</p>
          </section>
        </aside>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 whisper-shadow">
          <div className="flex items-center gap-2 text-primary text-[0.6875rem] font-bold tracking-widest uppercase">
            <BarChart3 className="h-4 w-4" />
            Historical progress
          </div>
          <div className="mt-5 space-y-3">
            {savedSessions.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Previous shadowing sessions will appear here after you start practising.</p>
            ) : (
              savedSessions.map((session) => (
                <article key={session.id} className="rounded-2xl bg-surface-container-low p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-headline font-bold text-on-surface">{session.title}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        {formatDate(session.updatedAt)} - {session.language} {session.level} - {session.completed}/{session.total} completed
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-xl bg-primary-container px-3 py-2 text-sm font-black text-primary">{session.averageScore}%</span>
                      <button type="button" onClick={() => resumeSession(session)} className="inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2 text-xs font-bold text-on-surface">
                        <RotateCcw className="h-3.5 w-3.5" />
                        Resume
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container-high">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((session.completed / Math.max(session.total, 1)) * 100)}%` }} />
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-5 bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 whisper-shadow">
          <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary">Review focus</p>
          <h2 className="mt-2 font-headline font-black text-2xl text-on-surface">Difficult sentences and missed words</h2>
          <div className="mt-5 space-y-4">
            <WordList title="Frequently missed words" words={report.frequentlyMissedWords} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Most difficult sentences</p>
              <div className="mt-2 space-y-2">
                {report.difficultSentences.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">Difficult sentences appear after retry attempts.</p>
                ) : (
                  report.difficultSentences.map((sentence) => (
                    <p key={sentence} className="rounded-xl bg-surface-container-low px-4 py-3 text-sm leading-6 text-on-surface">{sentence}</p>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest p-5 whisper-shadow border border-outline-variant/10">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="mt-2 font-headline font-black text-3xl text-on-surface">{value}</p>
    </div>
  );
}

function ReportBox({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={cn('rounded-2xl bg-white/10 p-4', wide && 'col-span-2')}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-primary-container">{label}</p>
      <p className="mt-1 font-headline font-black text-xl">{value}</p>
    </div>
  );
}

function SegmentStatus({ status }: { status: ShadowingSegment['status'] }) {
  const label = status === 'completed' ? 'Done' : status === 'retry' ? 'Retry' : status === 'current' ? 'Current' : 'Queued';
  return <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">{label}</span>;
}

function WordList({ title, words }: { title: string; words: string[] }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {words.length === 0 ? (
          <span className="text-sm text-on-surface-variant">None yet</span>
        ) : (
          words.slice(0, 10).map((word) => (
            <span key={word} className="rounded-full bg-secondary-container px-3 py-1.5 text-xs font-bold text-on-secondary-container">
              {word}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function getYouTubeId(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match?.[1] ?? '';
}

function splitTranscript(value: string) {
  return value
    .replace(/\d{1,2}:\d{2}(?::\d{2})?(?:[,.]\d{1,3})?/g, ' ')
    .replace(/-->/g, ' ')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter((part) => part.length > 0)
    .flatMap((part) => (part.split(' ').length > 18 ? chunkPhrase(part) : [part]))
    .slice(0, 40);
}

function chunkPhrase(value: string) {
  const words = value.split(' ');
  const chunks: string[] = [];
  for (let index = 0; index < words.length; index += 12) {
    chunks.push(words.slice(index, index + 12).join(' '));
  }
  return chunks;
}

function estimateSegmentDuration(text: string) {
  return Math.max(5, Math.ceil(text.split(/\s+/).length * 0.55) + 2);
}

function compareSpeech(target: string, response: string): ShadowingAttempt {
  const targetWords = tokenize(target);
  const responseWords = tokenize(response);
  const usedResponse = new Set<number>();
  const missingWords: string[] = [];
  const incorrectWords: string[] = [];
  let correct = 0;

  targetWords.forEach((word, index) => {
    if (responseWords[index] === word) {
      usedResponse.add(index);
      correct += 1;
      return;
    }

    const nearbyIndex = responseWords.findIndex((candidate, responseIndex) => !usedResponse.has(responseIndex) && Math.abs(responseIndex - index) <= 2 && candidate === word);
    if (nearbyIndex >= 0) {
      usedResponse.add(nearbyIndex);
      correct += 1;
      return;
    }

    missingWords.push(word);
    if (responseWords[index]) incorrectWords.push(responseWords[index]);
  });

  responseWords.forEach((word, index) => {
    if (!usedResponse.has(index) && !targetWords.includes(word)) incorrectWords.push(word);
  });

  const score = targetWords.length === 0 ? 0 : Math.max(0, Math.min(100, Math.round((correct / targetWords.length) * 100)));
  return {
    score,
    transcript: response,
    missingWords: uniqueWords(missingWords),
    incorrectWords: uniqueWords(incorrectWords),
    passed: score >= PASS_SCORE,
    createdAt: new Date().toISOString(),
  };
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}' ]+/gu, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function uniqueWords(words: string[]) {
  return Array.from(new Set(words)).slice(0, 12);
}

function buildReport(segments: ShadowingSegment[]) {
  const attempts = segments.flatMap((segment) => segment.attempts);
  const average = attempts.length === 0 ? 0 : Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length);
  const difficultSentences = segments
    .filter((segment) => segment.attempts.some((attempt) => !attempt.passed))
    .sort((left, right) => left.attempts[0]?.score - right.attempts[0]?.score)
    .map((segment) => segment.text)
    .slice(0, 3);
  const missedCounts = attempts.flatMap((attempt) => attempt.missingWords).reduce<Record<string, number>>((counts, word) => {
    counts[word] = (counts[word] ?? 0) + 1;
    return counts;
  }, {});
  const frequentlyMissedWords = Object.entries(missedCounts)
    .sort((left, right) => right[1] - left[1])
    .map(([word]) => word)
    .slice(0, 10);
  const rating = average >= 90 ? 'Excellent' : average >= 75 ? 'Strong' : average >= 60 ? 'Developing' : attempts.length > 0 ? 'Needs reps' : 'Not started';
  const recommendation =
    attempts.length === 0
      ? 'Start with one short sentence and focus on matching rhythm before speed.'
      : average >= 75
        ? 'Increase difficulty with longer clips or faster native speech next session.'
        : 'Repeat difficult sentences slowly, then record again after listening twice.';

  return { difficultSentences, frequentlyMissedWords, rating, recommendation };
}

function buildSuggestion(attempt: ShadowingAttempt) {
  if (attempt.passed) return 'Good match. Keep the same rhythm and move forward.';
  if (attempt.missingWords.length > attempt.incorrectWords.length) return 'Focus on sentence endings and small function words.';
  if (attempt.incorrectWords.length > 0) return 'Slow down and copy the vowel sounds before repeating the full sentence.';
  return 'Listen once for meaning, once for rhythm, then repeat.';
}

function getSpeechLanguage(language: string) {
  const map: Record<string, string> = {
    English: 'en-US',
    German: 'de-DE',
    Spanish: 'es-ES',
    Italian: 'it-IT',
    French: 'fr-FR',
  };
  return map[language] ?? 'en-US';
}

function readSavedSessions(): ShadowingSession[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as ShadowingSession[];
  } catch {
    return [];
  }
}

function writeSavedSessions(sessions: ShadowingSession[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function clearPlaybackTimers(timers: number[]) {
  timers.forEach((timer) => window.clearTimeout(timer));
  timers.length = 0;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
