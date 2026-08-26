import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { normalizeCefrLevel, normalizeLearningLanguage } from '../../lib/learning';
import { fetchApi } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { RECORDING_BUCKET, SAMPLE_TRANSCRIPT } from './constants';
import { blobToBase64, getAudioExtension, getFriendlyEvaluationError } from './media';
import { clearPlaybackTimers, mapRemoteAttempt, mapRemoteSession, mergeSessions, readSavedSessions, stripTemporaryRecordingUrls, writeSavedSessions } from './storage';
import { buildPracticeSegments, buildReport, compareSpeech, getFriendlyTranscriptError, getSegmentShadowWords, getSpeechLanguage, getYouTubeId, repairCaptionArtifacts, splitTranscript } from './transcript';
import { useYouTubeEmbed } from './hooks/useYouTubeEmbed';
import type { RecordingContext, ShadowingAttempt, ShadowingSegment, ShadowingSession, YouTubeTranscriptCue, YouTubeTranscriptResponse } from './types';

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

async function fireConfetti(options: import('canvas-confetti').Options) {
  const { default: confetti } = await import('canvas-confetti');
  confetti(options);
}

export function useShadowingPractice() {
  const { profile, user, session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<BlobPart[]>([]);
  const youtubeFrameRef = useRef<HTMLIFrameElement | null>(null);
  const playbackTimersRef = useRef<number[]>([]);
  const lastAutoFetchVideoIdRef = useRef('');
  const lastEvaluationKeyRef = useRef('');
  const browserTranscriptRef = useRef('');
  const currentIndexRef = useRef(0);
  const [videoUrl, setVideoUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [segments, setSegments] = useState<ShadowingSegment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spokenText, setSpokenText] = useState('');
  const [feedback, setFeedback] = useState<ShadowingAttempt | null>(null);
  const [isPlayingSegment, setIsPlayingSegment] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [isRecording, setIsRecording] = useState(false);
  const [isShadowRecording, setIsShadowRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingMimeType, setRecordingMimeType] = useState<string | null>(null);
  const [playerActivated, setPlayerActivated] = useState(false);
  const [playbackUrl, setPlaybackUrl] = useState('');
  const [playbackNonce, setPlaybackNonce] = useState(0);
  const [justCompletedSegmentId, setJustCompletedSegmentId] = useState<string | null>(null);
  const [isAnalyzingAudio, setIsAnalyzingAudio] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [transcriptNotice, setTranscriptNotice] = useState<'idle' | 'loading' | 'ready' | 'needsManual' | 'error'>('idle');
  const [savedSessions, setSavedSessions] = useState<ShadowingSession[]>([]);
  const [isFetchingTranscript, setIsFetchingTranscript] = useState(false);
  const [transcriptSource, setTranscriptSource] = useState<string | null>(null);
  const [transcriptLanguageCode, setTranscriptLanguageCode] = useState<string | null>(null);
  const [fetchedCues, setFetchedCues] = useState<YouTubeTranscriptCue[] | null>(null);
  const [remoteSessionId, setRemoteSessionId] = useState<string | null>(null);

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
  const recordingSupported = typeof window !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== 'undefined';
  const report = useMemo(() => buildReport(segments), [segments]);
  const transcriptWordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const estimatedSegments = transcript.trim() ? splitTranscript(transcript).length : 0;

  useEffect(() => {
    setSavedSessions(readSavedSessions());
    return () => clearPlaybackTimers(playbackTimersRef.current);
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadRemoteSessions();
  }, [user?.id]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);


  useEffect(() => {
    if (segments.length === 0 || !videoId) {
      return;
    }

    void persistCurrentSession();
  }, [averageScore, bestScore, completedCount, segments, videoId, videoUrl]);

  useEffect(() => {
    if (!videoId) {
      lastAutoFetchVideoIdRef.current = '';
      setPlayerActivated(false);
      setPlaybackUrl('');
      return;
    }

    if (lastAutoFetchVideoIdRef.current === videoId) return;

    clearPlaybackTimers(playbackTimersRef.current);
    setIsPlayingSegment(false);
    setPlayerActivated(false);
    setPlaybackUrl('');

    const timeout = window.setTimeout(() => {
      lastAutoFetchVideoIdRef.current = videoId;
      void fetchTranscriptFromYouTube(videoId);
    }, 650);

    return () => window.clearTimeout(timeout);
  }, [videoId]);


  async function fetchTranscriptFromYouTube(targetVideoId = videoId) {
    if (!targetVideoId) {
      setStatus('Paste a valid YouTube URL before fetching captions.');
      return;
    }

    setIsFetchingTranscript(true);
    setTranscriptNotice('loading');
    setStatus('Looking for captions and transcript timing...');

    try {
      const response = await fetchApi(`/api/youtube/transcript?videoId=${encodeURIComponent(targetVideoId)}`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.code ?? payload.error ?? 'Could not fetch captions for this video.');
      }

      const data = payload as YouTubeTranscriptResponse;
      const repairedCues = data.cues?.map((cue) => ({ ...cue, text: repairCaptionArtifacts(cue.text) })) ?? [];
      setTranscript(repairCaptionArtifacts(data.text));
      setFetchedCues(repairedCues.length ? repairedCues : null);
      setTranscriptLanguageCode(data.language);
      setTranscriptSource(`${data.languageName}${data.isAutoGenerated ? ' auto captions' : ' captions'}${data.source === 'cache' ? ' from cache' : ''}`);
      setTranscriptNotice('ready');
      setStatus(`Transcript ready from ${data.languageName}${data.source === 'cache' ? ' cache' : ''}. Review it, then build the lesson.`);
    } catch (error) {
      setFetchedCues(null);
      setTranscriptSource(null);
      setTranscriptLanguageCode(null);
      setTranscriptNotice('needsManual');
      setStatus(getFriendlyTranscriptError(error));
    } finally {
      setIsFetchingTranscript(false);
    }
  }
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

    const nextSegments = buildPracticeSegments(cleaned, fetchedCues);

    setSegments(nextSegments);
    setCurrentIndex(0);
    setFeedback(null);
    setSpokenText('');
    lastEvaluationKeyRef.current = '';
    browserTranscriptRef.current = '';
    setJustCompletedSegmentId(null);
    clearRecording();
    setPlayerActivated(false);
    setPlaybackUrl('');
    setRemoteSessionId(null);
    setStatus(`${nextSegments.length} practice segments ready${fetchedCues?.length ? ' with YouTube timing' : ''}.`);
  }

  function loadSampleTranscript() {
    setTranscript(SAMPLE_TRANSCRIPT);
    setFetchedCues(null);
    setTranscriptNotice('ready');
    setTranscriptSource('WordPilot sample');
    setTranscriptLanguageCode(null);
    setStatus('Sample transcript added. Paste your video URL, then build the lesson.');
  }

  async function handleTranscriptUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setTranscript(text);
    setFetchedCues(null);
    setTranscriptNotice('ready');
    setTranscriptSource(file.name);
    setTranscriptLanguageCode(null);
    setStatus(`${file.name} loaded.`);
  }

  function playCurrentSegment() {
    if (!currentSegment) {
      setStatus('Build a lesson first.');
      return;
    }

    if (isPlayingSegment) {
      stopSegmentPlayback('Playback stopped. Record when you are ready.');
      return;
    }

    playSegment(currentSegment);
  }

  function playSegment(segment: ShadowingSegment) {
    if (!videoId) {
      setStatus('Paste a valid YouTube URL first.');
      return;
    }

    clearPlaybackTimers(playbackTimersRef.current);
    setPlayerActivated(true);
    setIsPlayingSegment(true);
    setPlaybackNonce((value) => value + 1);
    setPlaybackUrl(buildYouTubeEmbedUrl(segment, true));
    setActiveWordIndex(-1);
    setStatus('Playing this sentence once. Follow the word shadow, then record when you are ready.');

    const words = getSegmentShadowWords(segment);
    const wordTimers = words.map((word, index) =>
      window.setTimeout(() => {
        setActiveWordIndex(index);
      }, Math.max(0, (word.start - segment.start) * 1000)),
    );
    const segmentMs = Math.max((segment.end - segment.start) * 1000 + 350, 900);

    playbackTimersRef.current = [
      ...wordTimers,
      window.setTimeout(() => {
        pauseYouTubeVideo();
        setIsPlayingSegment(false);
        setActiveWordIndex(-1);
        setStatus('Now record your attempt, or play this sentence again if you want another listen.');
      }, segmentMs + 900),
    ];
  }

  async function startRecording(withReferenceAudio = false) {
    if (!currentSegment) return;

    const recordingContext: RecordingContext = {
      segmentId: currentSegment.id,
      segmentIndex: currentIndex,
      targetText: currentSegment.text,
    };

    if (!withReferenceAudio) {
      stopSegmentPlayback('Recording without reference audio. The video is muted/stopped so we only capture your voice.');
    }

    clearRecording();
    setFeedback(null);
    setSpokenText('');
    lastEvaluationKeyRef.current = '';
    browserTranscriptRef.current = '';
    setJustCompletedSegmentId(null);

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setIsShadowRecording(false);
      setStatus('Microphone recording is not available in this browser. Type your response and check it manually.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(recordingChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size > 0) {
          const nextRecordingUrl = window.URL.createObjectURL(blob);
          setRecordingUrl(nextRecordingUrl);
          const mimeType = blob.type || recorder.mimeType || 'audio/webm';
          setRecordingMimeType(mimeType);
          saveSegmentRecording(recordingContext.segmentId, nextRecordingUrl, mimeType);
          void handleCompletedRecording(blob, browserTranscriptRef.current, recordingContext, mimeType);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      if (withReferenceAudio) {
        setIsShadowRecording(true);
        playSegment(currentSegment);
      }
    } catch {
      setIsShadowRecording(false);
      setStatus('WordPilot could not access your microphone. Allow microphone access and try again.');
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setIsRecording(true);
      setStatus(withReferenceAudio ? 'Recording with the sentence audio. Press Stop shadow when you finish.' : 'Recording your voice only. Press Stop when you finish.');
      return;
    }

    const recognition = new Recognition();
    recognition.lang = getSpeechLanguage(transcriptLanguageCode ?? language);
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcriptText = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .trim();
      browserTranscriptRef.current = transcriptText;
      setSpokenText(transcriptText);
    };
    recognition.onerror = () => {
      setStatus('Speech recognition stopped. Your audio is still saved, and you can type your response if needed.');
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      if (mediaRecorderRef.current?.state === 'recording') {
        setStatus(withReferenceAudio ? 'Still recording. Press Stop shadow when you finish.' : 'Still recording. Press Stop when you finish.');
      }
    };
    recognitionRef.current = recognition;
    setIsRecording(true);
    setStatus(withReferenceAudio ? 'Recording with the sentence audio. Press Stop shadow when you finish.' : 'Recording your voice only. Press Stop when you finish.');
    recognition.start();
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setIsShadowRecording(false);
    stopSegmentPlayback();
    setStatus('Recording saved. Analyzing pronunciation with AI...');
  }

  function clearRecording() {
    setRecordingUrl(null);
    setRecordingMimeType(null);
    recordingChunksRef.current = [];
  }


  function saveSegmentRecording(segmentId: string, url: string, mimeType: string) {
    setSegments((current) =>
      current.map((segment) =>
        segment.id === segmentId
          ? { ...segment, lastRecordingUrl: url, lastRecordingMimeType: mimeType }
          : segment,
      ),
    );
  }

  async function handleCompletedRecording(audioBlob: Blob, fallbackTranscript: string, context: RecordingContext, mimeType: string) {
    const audioPath = await uploadSegmentRecording(audioBlob, context, mimeType);
    await evaluateRecordingWithAi(audioBlob, fallbackTranscript, context, audioPath, mimeType);
  }

  async function uploadSegmentRecording(audioBlob: Blob, context: RecordingContext, mimeType: string) {
    if (!user || !videoId) return null;

    const extension = getAudioExtension(mimeType);
    const path = `${user.id}/${videoId}/${context.segmentId}-${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from(RECORDING_BUCKET).upload(path, audioBlob, {
      contentType: mimeType || 'audio/webm',
      upsert: false,
    });

    if (error) {
      console.warn('Shadowing recording upload failed', error);
      return null;
    }

    return path;
  }

  function restoreSegmentPractice(segment: ShadowingSegment, index: number) {
    const lastAttempt = segment.attempts.at(-1) ?? null;
    pauseYouTubeVideo();
    clearPlaybackTimers(playbackTimersRef.current);
    setIsPlayingSegment(false);
    setCurrentIndex(index);
    setFeedback(lastAttempt);
    setSpokenText(lastAttempt?.transcript ?? '');
    lastEvaluationKeyRef.current = '';
    browserTranscriptRef.current = lastAttempt?.transcript ?? '';
    setRecordingUrl(segment.lastRecordingUrl ?? null);
    setRecordingMimeType(segment.lastRecordingMimeType ?? null);
    setJustCompletedSegmentId(null);
  }
  function stopSegmentPlayback(nextStatus?: string) {
    clearPlaybackTimers(playbackTimersRef.current);
    pauseYouTubeVideo();
    setIsPlayingSegment(false);
    if (nextStatus) setStatus(nextStatus);
  }
  function pauseYouTubeVideo() {
    postYouTubeCommand('pauseVideo');
  }

  function postYouTubeCommand(func: string, args: unknown[] = []) {
    youtubeFrameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), 'https://www.youtube.com');
  }

  async function evaluateRecordingWithAi(audioBlob: Blob, fallbackTranscript: string, context: RecordingContext, audioPath: string | null = null, audioMimeType: string | null = null) {

    setIsAnalyzingAudio(true);
    setStatus('Analyzing your recording with AI...');

    try {
      const audioBase64 = await blobToBase64(audioBlob);
      const response = await fetchApi('/api/shadowing/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          targetText: context.targetText,
          audioBase64,
          mimeType: audioBlob.type || 'audio/webm',
          language: transcriptLanguageCode ?? language,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.code ?? payload.error ?? 'AI evaluation failed.');
      }

      const attempt = payload as ShadowingAttempt;
      if (currentIndexRef.current === context.segmentIndex) setSpokenText(attempt.transcript);
      applyAttempt({ ...attempt, engine: attempt.engine ?? 'gemini-audio', audioPath, audioMimeType }, context);
    } catch (error) {
      if (fallbackTranscript.trim()) {
        setStatus('AI audio analysis is not configured yet, so WordPilot used browser speech recognition for this attempt.');
        evaluateAttempt(fallbackTranscript, 'browser', context, audioPath, audioMimeType);
      } else {
        setFeedback(null);
        setStatus(getFriendlyEvaluationError(error));
      }
    } finally {
      setIsAnalyzingAudio(false);
    }
  }

  function evaluateAttempt(response = spokenText, engine: ShadowingAttempt['engine'] = 'browser', context?: RecordingContext, audioPath: string | null = null, audioMimeType: string | null = null) {
    const activeContext = context ?? (currentSegment ? { segmentId: currentSegment.id, segmentIndex: currentIndex, targetText: currentSegment.text } : null);
    if (!activeContext) return;

    const responseText = response.trim();
    if (!responseText) {
      setFeedback(null);
      setStatus('No spoken words were detected yet. Record again, speak clearly, or type what you said before checking.');
      return;
    }

    const attempt = { ...compareSpeech(activeContext.targetText, responseText), engine, audioPath, audioMimeType };
    applyAttempt(attempt, activeContext);
  }

  function applyAttempt(attempt: ShadowingAttempt, context: RecordingContext) {
    const isVisibleSegment = currentIndexRef.current === context.segmentIndex;
    const evaluationKey = `${context.segmentId}:${attempt.transcript.toLowerCase()}:${attempt.engine ?? 'browser'}`;
    if (lastEvaluationKeyRef.current === evaluationKey) return;
    lastEvaluationKeyRef.current = evaluationKey;
    void persistRemoteAttempt(attempt, context);

    if (isVisibleSegment) setFeedback(attempt);
    setSegments((current) =>
      current.map((segment, index) => {
        if (segment.id === context.segmentId) {
          return {
            ...segment,
            status: attempt.passed ? 'completed' : 'retry',
            attempts: [...segment.attempts, attempt],
            lastRecordingUrl: segment.lastRecordingUrl ?? recordingUrl ?? null,
            lastRecordingMimeType: segment.lastRecordingMimeType ?? recordingMimeType ?? null,
          };
        }

        if (attempt.passed && isVisibleSegment && index === context.segmentIndex + 1) {
          return { ...segment, status: 'current' };
        }

        return segment;
      }),
    );

    if (!isVisibleSegment) return;

    if (attempt.passed) {
      setJustCompletedSegmentId(context.segmentId);
      setStatus(`${attempt.score}% success. Great repetition - moving to the next sentence.`);
      void fireConfetti({ particleCount: 34, spread: 45, origin: { y: 0.68 } });
      const nextIndex = context.segmentIndex + 1;
      if (nextIndex < segments.length) {
        window.setTimeout(() => {
          const nextAttempt = segments[nextIndex]?.attempts.at(-1) ?? null;
          setCurrentIndex(nextIndex);
          setSpokenText(nextAttempt?.transcript ?? '');
          lastEvaluationKeyRef.current = '';
          browserTranscriptRef.current = nextAttempt?.transcript ?? '';
          setRecordingUrl(segments[nextIndex]?.lastRecordingUrl ?? null);
          setRecordingMimeType(segments[nextIndex]?.lastRecordingMimeType ?? null);
          setFeedback(nextAttempt);
          setJustCompletedSegmentId(null);
        }, 1300);
      } else {
        setStatus('Lesson complete. Your practice report is ready.');
        void fireConfetti({ particleCount: 90, spread: 70, origin: { y: 0.75 } });
      }
      return;
    }

    setJustCompletedSegmentId(null);
    setStatus(`${attempt.score}% retry. Review the highlighted words, then press Play once if you want to listen again.`);
  }
  async function resumeSession(session: ShadowingSession) {
    const restoredSegments = await hydrateRemoteSessionSegments(session);
    const safeIndex = Math.min(session.currentIndex ?? 0, Math.max((restoredSegments.length || 1) - 1, 0));
    const activeSegment = restoredSegments[safeIndex] ?? null;
    const lastAttempt = activeSegment?.attempts.at(-1) ?? null;

    setVideoUrl(session.videoUrl);
    setTranscript(session.transcript ?? '');
    setTranscriptSource(session.transcriptSource ?? 'Saved session');
    setFetchedCues(null);
    setSegments(restoredSegments);
    setCurrentIndex(safeIndex);
    setRemoteSessionId(session.remoteId ?? null);
    setFeedback(lastAttempt);
    setSpokenText(lastAttempt?.transcript ?? '');
    lastEvaluationKeyRef.current = '';
    browserTranscriptRef.current = lastAttempt?.transcript ?? '';
    setJustCompletedSegmentId(null);
    clearRecording();
    setRecordingUrl(activeSegment?.lastRecordingUrl ?? null);
    setRecordingMimeType(activeSegment?.lastRecordingMimeType ?? null);
    setPlayerActivated(false);
    setPlaybackUrl('');
    setStatus(restoredSegments.length ? 'Previous session restored with your last recording and score.' : 'Previous video loaded. Fetch or add the transcript to rebuild practice.');
  }

  function buildCurrentSessionSnapshot(): ShadowingSession | null {
    if (!videoId || segments.length === 0) return null;

    return {
      id: `shadow-${videoId}`,
      remoteId: remoteSessionId ?? undefined,
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
      transcript,
      segments: stripTemporaryRecordingUrls(segments),
      currentIndex,
      transcriptSource,
      updatedAt: new Date().toISOString(),
      status: completedCount === segments.length ? 'completed' : 'in_progress',
    };
  }

  async function persistCurrentSession() {
    const nextSession = buildCurrentSessionSnapshot();
    if (!nextSession) return;

    const existing = readSavedSessions().filter((session) => session.id !== nextSession.id);
    const next = [nextSession, ...existing].slice(0, 12);
    writeSavedSessions(next);
    setSavedSessions(next);
    await persistRemoteSession(nextSession);
  }

  async function loadRemoteSessions() {
    if (!user) return;

    const { data, error } = await supabase
      .from('shadowing_sessions')
      .select('id, video_id, video_url, title, language, cefr_level, transcript_source, transcript_text, segments, current_segment_index, total_segments, completed_segments, average_score, best_score, difficult_sentences, missed_words, status, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(12);

    if (error) {
      console.warn('Shadowing sessions could not be loaded from Supabase', error);
      return;
    }

    const remoteSessions = (data ?? []).map(mapRemoteSession);
    setSavedSessions(mergeSessions(remoteSessions, readSavedSessions()));
  }

  async function persistRemoteSession(session: ShadowingSession) {
    if (!user) return null;

    const { data, error } = await supabase
      .from('shadowing_sessions')
      .upsert(
        {
          user_id: user.id,
          video_id: session.videoId,
          video_url: session.videoUrl,
          title: session.title,
          language: session.language,
          cefr_level: session.level,
          transcript_source: session.transcriptSource,
          transcript_text: session.transcript ?? '',
          segments: session.segments ?? [],
          current_segment_index: session.currentIndex ?? 0,
          total_segments: session.total,
          completed_segments: session.completed,
          average_score: session.averageScore,
          best_score: session.bestScore,
          difficult_sentences: session.difficultSentences,
          missed_words: session.missedWords,
          status: session.status,
          updated_at: session.updatedAt,
        },
        { onConflict: 'user_id,video_id' },
      )
      .select('id')
      .single();

    if (error) {
      console.warn('Shadowing session could not be saved to Supabase', error);
      return null;
    }

    if (data?.id) setRemoteSessionId(data.id);
    return data?.id ?? null;
  }

  async function persistRemoteAttempt(attempt: ShadowingAttempt, context: RecordingContext) {
    if (!user) return;

    const sessionId = remoteSessionId ?? await persistRemoteSession(buildCurrentSessionSnapshot() ?? {
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
      transcript,
      segments: stripTemporaryRecordingUrls(segments),
      currentIndex,
      transcriptSource,
      updatedAt: new Date().toISOString(),
      status: completedCount === segments.length ? 'completed' : 'in_progress',
    });
    if (!sessionId) return;

    const { error } = await supabase.from('shadowing_attempts').insert({
      user_id: user.id,
      session_id: sessionId,
      segment_id: context.segmentId,
      segment_index: context.segmentIndex,
      target_text: context.targetText,
      transcript: attempt.transcript,
      score: attempt.score,
      passed: attempt.passed,
      missing_words: attempt.missingWords,
      incorrect_words: attempt.incorrectWords,
      engine: attempt.engine ?? 'browser',
      model: attempt.model ?? null,
      audio_path: attempt.audioPath ?? null,
      audio_mime_type: attempt.audioMimeType ?? null,
    });

    if (error) console.warn('Shadowing attempt could not be saved to Supabase', error);
  }

  async function hydrateRemoteSessionSegments(session: ShadowingSession) {
    const baseSegments = session.segments ?? [];
    if (!session.remoteId) return baseSegments;

    const { data, error } = await supabase
      .from('shadowing_attempts')
      .select('segment_id, segment_index, target_text, transcript, score, passed, missing_words, incorrect_words, engine, model, audio_path, audio_mime_type, created_at')
      .eq('session_id', session.remoteId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Shadowing attempts could not be loaded from Supabase', error);
      return baseSegments;
    }

    return Promise.all(baseSegments.map(async (segment) => {
      const remoteAttempts = (data ?? []).filter((row) => row.segment_id === segment.id).map(mapRemoteAttempt);
      const latestAttempt = remoteAttempts.at(-1) ?? null;
      const latestAudioPath = latestAttempt?.audioPath ?? null;
      const signedUrl = latestAudioPath ? await getRecordingSignedUrl(latestAudioPath) : null;

      return {
        ...segment,
        attempts: remoteAttempts.length ? remoteAttempts : segment.attempts,
        status: latestAttempt?.passed ? 'completed' as const : latestAttempt ? 'retry' as const : segment.status,
        lastRecordingUrl: signedUrl ?? segment.lastRecordingUrl ?? null,
        lastRecordingMimeType: latestAttempt?.audioMimeType ?? segment.lastRecordingMimeType ?? null,
      };
    }));
  }

  async function getRecordingSignedUrl(path: string) {
    const { data, error } = await supabase.storage.from(RECORDING_BUCKET).createSignedUrl(path, 60 * 60);
    if (error) {
      console.warn('Shadowing recording signed URL failed', error);
      return null;
    }
    return data?.signedUrl ?? null;
  }

  const { buildYouTubeEmbedUrl, embedUrl, thumbnailUrl } = useYouTubeEmbed({ currentSegment, playbackUrl, videoId });


  return {
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
  };
}

export type ShadowingPracticeController = ReturnType<typeof useShadowingPractice>;

