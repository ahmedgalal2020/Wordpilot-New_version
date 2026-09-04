import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Eye, LoaderCircle, Mic, Pause, Play, RotateCcw, Send, Trash2, Volume2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePracticeProgress } from '../../hooks/usePracticeProgress';
import {
  CURRICULUM_LEVELS,
  SUPPORTED_CURRICULUM_LANGUAGES,
  type CurriculumExercise,
  type CurriculumLanguage,
  type CurriculumLesson,
} from '../../lib/curriculumCore';
import { CurriculumRepositoryError, loadCurriculumLevel } from '../../lib/curriculumRepository';
import { cn } from '../../lib/utils';
import { buildTrainingExerciseModel, scoreTrainingChoice, type TrainingExerciseModel } from './exerciseAdapter';
import { getExercisesForExperience, parseTrainingExperience, TRAINING_EXPERIENCE_LABELS, type TrainingExperience } from './registry';

type RecordingState = 'idle' | 'recording' | 'ready';
type CompletedResult = { score: number | null; message: string; passed: boolean };

export default function PracticeTrainingPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const experience = parseTrainingExperience(params.experience);
  const language = parseLanguage(params.language);
  const levelNumber = Number(params.levelNumber);
  const lessonId = params.lessonId ? decodeURIComponent(params.lessonId) : '';
  const exerciseId = params.exerciseId ? decodeURIComponent(params.exerciseId) : '';
  const [levelLoading, setLevelLoading] = useState(true);
  const [levelError, setLevelError] = useState<string | null>(null);
  const [lesson, setLesson] = useState<CurriculumLesson | null>(null);
  const progress = usePracticeProgress(user, language ?? undefined, lesson?.cefrLevel);

  useEffect(() => {
    let cancelled = false;

    async function loadLesson() {
      if (!experience || !language || !Number.isInteger(levelNumber) || !lessonId) {
        setLevelError('This practice link is incomplete. Go back to Practice Path and start again.');
        setLevelLoading(false);
        return;
      }

      setLevelLoading(true);
      setLevelError(null);
      try {
        const level = await loadCurriculumLevel(language, levelNumber);
        const nextLesson = level.lessons.find((item) => item.id === lessonId);
        if (!nextLesson) {
          throw new CurriculumRepositoryError('The requested lesson could not be found in the active curriculum.', 'missing_content');
        }
        if (!cancelled) setLesson(nextLesson);
      } catch (error) {
        if (!cancelled) setLevelError(error instanceof Error ? error.message : 'Could not load this training experience.');
      } finally {
        if (!cancelled) setLevelLoading(false);
      }
    }

    void loadLesson();

    return () => {
      cancelled = true;
    };
  }, [experience, exerciseId, language, lessonId, levelNumber]);

  const exercises = useMemo(() => {
    if (!lesson || !experience) return [];
    return getExercisesForExperience(lesson, experience, exerciseId);
  }, [experience, exerciseId, lesson]);

  const models = useMemo(() => {
    if (!lesson || !experience) return [];
    return exercises.map((exercise) => buildTrainingExerciseModel(lesson, exercise, experience));
  }, [exercises, experience, lesson]);

  async function completeTraining(_result: CompletedResult, completedExerciseId = exerciseId || exercises[0]?.id) {
    if (!language || !lesson || !completedExerciseId) return;
    await progress.upsertProgress({
      language,
      cefrLevel: lesson.cefrLevel,
      lessonId: lesson.id,
      exerciseId: completedExerciseId,
      status: 'completed',
    });
  }

  if (!experience || !language || !CURRICULUM_LEVELS.some((level) => level.levelNumber === levelNumber)) {
    return <TrainingShell title="Practice unavailable" subtitle="This training route is not recognized." />;
  }

  if (levelLoading) {
    return (
      <TrainingShell title={TRAINING_EXPERIENCE_LABELS[experience]} subtitle="Loading the selected lesson from the active curriculum.">
        <div className="flex min-h-80 items-center justify-center rounded-3xl bg-surface-container-lowest whisper-shadow">
          <LoaderCircle className="mr-3 h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-semibold text-on-surface-variant">Loading practice...</span>
        </div>
      </TrainingShell>
    );
  }

  if (levelError || !lesson || models.length === 0) {
    return (
      <TrainingShell title={TRAINING_EXPERIENCE_LABELS[experience]} subtitle={levelError ?? 'No matching exercise exists for this lesson yet.'}>
        <Link to="/practice-path" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary">
          <ArrowLeft className="h-4 w-4" />
          Back to Practice Path
        </Link>
      </TrainingShell>
    );
  }

  return (
    <TrainingShell title={TRAINING_EXPERIENCE_LABELS[experience]} subtitle={`${lesson.title} - ${lesson.language} ${lesson.cefrLevel}.${lesson.cefrSubLevel}`}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <section className="space-y-6">
          <LessonContext lesson={lesson} />
          {experience === 'listening' && <ListeningExperience model={models[0]} onComplete={(result) => void completeTraining(result, models[0].id)} />}
          {experience === 'reading' && <ReadingExperience model={models[0]} onComplete={(result) => void completeTraining(result, models[0].id)} />}
          {experience === 'writing' && <WritingExperience model={models[0]} onComplete={(result) => void completeTraining(result, models[0].id)} />}
          {experience === 'speaking' && <SpeakingExperience model={models[0]} onComplete={(result) => void completeTraining(result, models[0].id)} />}
          {experience === 'review' && <MixedPracticeExperience title="Review set" models={models} onComplete={(result) => void completeTraining(result)} />}
          {experience === 'progress-check' && <MixedPracticeExperience title="Progress Check Complete" models={models} assessment onComplete={(result) => void completeTraining(result)} />}
        </section>
        <aside className="rounded-3xl bg-surface-container-lowest p-5 whisper-shadow">
          <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-primary">Lesson support</p>
          <h2 className="mt-2 font-headline text-xl font-black text-on-surface">{lesson.theme}</h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">{lesson.canDo}</p>
          <div className="mt-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Useful language</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {lesson.chunks.slice(0, 8).map((chunk) => (
                <span key={chunk.phrase} className="rounded-full bg-primary-container px-3 py-1.5 text-xs font-bold text-primary">
                  {chunk.phrase}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/practice-path')}
            className="mt-6 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-surface-container-low px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container active:scale-[0.99]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to path
          </button>
        </aside>
      </div>
    </TrainingShell>
  );
}

function TrainingShell({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return (
    <main className="wp-shell min-h-screen py-10 pt-24 sm:py-12 sm:pt-28">
      <header className="mb-7">
        <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-primary">Practice</p>
        <h1 className="mt-2 font-headline text-3xl font-black text-on-surface sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant sm:text-base">{subtitle}</p>
      </header>
      {children}
    </main>
  );
}

function LessonContext({ lesson }: { lesson: CurriculumLesson }) {
  return (
    <div className="rounded-3xl bg-surface-container-lowest p-5 whisper-shadow sm:p-6">
      <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-primary">Learning goal</p>
      <h2 className="mt-2 font-headline text-2xl font-black text-on-surface">{lesson.objective}</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <InfoCard label="Can do" value={lesson.canDo} />
        <InfoCard label="Grammar" value={lesson.grammarFocus} />
        <InfoCard label="Target" value={lesson.targetSentence} />
      </div>
    </div>
  );
}

function ListeningExperience({ model, onComplete }: { model: TrainingExerciseModel; onComplete: (result: CompletedResult) => void }) {
  const [selected, setSelected] = useState('');
  const [result, setResult] = useState<CompletedResult | null>(null);
  const [transcriptVisible, setTranscriptVisible] = useState(false);
  const question = model.questions[0];

  function submit() {
    const scored = scoreTrainingChoice(model, selected);
    const nextResult = { score: scored.score, passed: scored.passed, message: scored.feedback };
    setResult(nextResult);
    if (scored.passed) onComplete(nextResult);
  }

  return (
    <TrainingCard eyebrow="Listening first" title={model.title} instruction={model.instruction}>
      <AudioControls text={model.audioText} locale={model.locale} />
      {question && <ChoiceBlock question={question.prompt} choices={question.choices} selected={selected} setSelected={setSelected} />}
      <ActionRow onSubmit={submit} disabled={!selected} result={result} label="Submit answer" />
      {result && (
        <button type="button" onClick={() => setTranscriptVisible((visible) => !visible)} className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-container">
          <Eye className="h-4 w-4" />
          {transcriptVisible ? 'Hide transcript' : 'View transcript'}
        </button>
      )}
      {transcriptVisible && <SourceText title="Transcript" text={model.transcript} />}
    </TrainingCard>
  );
}

function ReadingExperience({ model, onComplete }: { model: TrainingExerciseModel; onComplete: (result: CompletedResult) => void }) {
  const [selected, setSelected] = useState('');
  const [result, setResult] = useState<CompletedResult | null>(null);
  const question = model.questions[0];

  function submit() {
    const scored = scoreTrainingChoice(model, selected);
    const nextResult = { score: scored.score, passed: scored.passed, message: scored.feedback };
    setResult(nextResult);
    if (scored.passed) onComplete(nextResult);
  }

  return (
    <TrainingCard eyebrow="Read, then answer" title={model.title} instruction={model.instruction}>
      <SourceText title="Reading text" text={model.readingText} />
      {question && <ChoiceBlock question={question.prompt} choices={question.choices} selected={selected} setSelected={setSelected} />}
      <ActionRow onSubmit={submit} disabled={!selected} result={result} label="Check reading" />
    </TrainingCard>
  );
}

function WritingExperience({ model, onComplete }: { model: TrainingExerciseModel; onComplete: (result: CompletedResult) => void }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<CompletedResult | null>(null);
  const task = model.writingTask;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  function complete() {
    const nextResult = { score: null, passed: true, message: 'Completed and ready for review. No AI score was generated.' };
    setResult(nextResult);
    onComplete(nextResult);
  }

  return (
    <TrainingCard eyebrow="Original writing" title={model.title} instruction={model.instruction}>
      <div className="grid gap-3 md:grid-cols-2">
        <InfoCard label="Task" value={task?.prompt || model.prompt} />
        <InfoCard label="Purpose" value={task?.purpose || 'Produce your own answer using the lesson focus.'} />
        <InfoCard label="Audience" value={task?.audience || 'General reader'} />
        <InfoCard label="Length" value={task?.approximateLength || task?.expectedOutput || 'Write enough to complete the task.'} />
      </div>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={9}
        className="mt-5 w-full rounded-3xl border border-outline-variant/20 bg-surface-container-low px-5 py-4 text-base leading-7 text-on-surface outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
        placeholder="Write your answer here."
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-on-surface-variant">
        <span>{wordCount} words</span>
        <button type="button" onClick={() => setText('')} className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 hover:bg-surface-container">
          <RotateCcw className="h-4 w-4" />
          Clear
        </button>
      </div>
      <ActionRow onSubmit={complete} disabled={wordCount < 3} result={result} label="Complete writing" />
    </TrainingCard>
  );
}

function SpeakingExperience({ model, onComplete }: { model: TrainingExerciseModel; onComplete: (result: CompletedResult) => void }) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [result, setResult] = useState<CompletedResult | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const roleplay = model.roleplay;

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      setAudioUrl(URL.createObjectURL(blob));
      setRecordingState('ready');
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecordingState('recording');
  }

  function stopRecording() {
    recorderRef.current?.stop();
  }

  function complete() {
    const nextResult = { score: null, passed: true, message: 'Speaking practice completed. Recording is available for replay.' };
    setResult(nextResult);
    onComplete(nextResult);
  }

  return (
    <TrainingCard eyebrow="Produce speech" title={model.title} instruction={model.instruction}>
      <div className="grid gap-3 md:grid-cols-2">
        <InfoCard label="Scenario" value={roleplay?.scenario || model.speakingTask?.prompt || model.prompt} />
        <InfoCard label="Goal" value={roleplay?.goal || model.speakingTask?.focus?.join(', ') || 'Answer naturally.'} />
        <InfoCard label="Your role" value={roleplay?.learnerRole || 'Learner'} />
        <InfoCard label="Partner role" value={roleplay?.partnerRole || 'Practice partner'} />
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={() => void startRecording()} disabled={recordingState === 'recording'} className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary transition hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-60">
          <Mic className="h-4 w-4" />
          Start recording
        </button>
        <button type="button" onClick={stopRecording} disabled={recordingState !== 'recording'} className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-surface-container-low px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60">
          <Pause className="h-4 w-4" />
          Stop
        </button>
        {audioUrl && (
          <button type="button" onClick={() => setAudioUrl(null)} className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-surface-container-low px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container">
            <Trash2 className="h-4 w-4" />
            Re-record
          </button>
        )}
      </div>
      {audioUrl && <audio controls src={audioUrl} className="mt-5 w-full" />}
      <ActionRow onSubmit={complete} disabled={!audioUrl} result={result} label="Complete speaking" />
    </TrainingCard>
  );
}

function MixedPracticeExperience({
  title,
  models,
  assessment = false,
  onComplete,
}: {
  title: string;
  models: TrainingExerciseModel[];
  assessment?: boolean;
  onComplete: (result: CompletedResult) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CompletedResult | null>(null);
  const objectiveModels = models.filter((model) => model.questions[0]);

  function submit() {
    const scored = objectiveModels.map((model) => scoreTrainingChoice(model, answers[model.id] ?? ''));
    const score = scored.length ? Math.round(scored.reduce((sum, item) => sum + item.score, 0) / scored.length) : null;
    const passed = score === null ? true : score >= 60;
    const nextResult = {
      score,
      passed,
      message: score === null ? 'Completed. This set is ready for review.' : `${scored.filter((item) => item.passed).length}/${scored.length} objective items correct.`,
    };
    setResult(nextResult);
    if (passed) onComplete(nextResult);
  }

  return (
    <TrainingCard eyebrow={assessment ? 'Mini assessment' : 'Mixed review'} title={title} instruction={assessment ? 'Answer a compact mix of objective and production tasks.' : 'Review the lesson with a compact mix of learned material.'}>
      <div className="space-y-4">
        {models.slice(0, 6).map((model) => (
          <div key={model.id} className="rounded-2xl bg-surface-container-low p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{model.experience}</p>
            <h3 className="mt-1 font-headline text-lg font-black text-on-surface">{model.title}</h3>
            {model.experience === 'listening' && <AudioControls text={model.audioText} locale={model.locale} compact />}
            {model.experience === 'reading' && <SourceText title="Reading text" text={model.readingText} compact />}
            {model.questions[0] ? (
              <ChoiceBlock
                question={model.questions[0].prompt}
                choices={model.questions[0].choices}
                selected={answers[model.id] ?? ''}
                setSelected={(value) => setAnswers((current) => ({ ...current, [model.id]: value }))}
              />
            ) : (
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">{model.prompt}</p>
            )}
          </div>
        ))}
      </div>
      <ActionRow onSubmit={submit} disabled={objectiveModels.some((model) => !answers[model.id])} result={result} label={assessment ? 'Finish check' : 'Finish review'} />
    </TrainingCard>
  );
}

function TrainingCard({ eyebrow, title, instruction, children }: { eyebrow: string; title: string; instruction: string; children: React.ReactNode }) {
  return (
    <article className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-5 whisper-shadow sm:p-6">
      <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-primary">{eyebrow}</p>
      <h2 className="mt-2 font-headline text-2xl font-black text-on-surface">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">{instruction}</p>
      <div className="mt-6">{children}</div>
    </article>
  );
}

function AudioControls({ text, locale, compact = false }: { text: string; locale: string; compact?: boolean }) {
  const [playing, setPlaying] = useState(false);

  function speak() {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    utterance.rate = 0.9;
    utterance.onend = () => setPlaying(false);
    setPlaying(true);
    window.speechSynthesis.speak(utterance);
  }

  function stop() {
    window.speechSynthesis.cancel();
    setPlaying(false);
  }

  return (
    <div className={cn('rounded-3xl bg-surface-container-low p-4', compact && 'mt-3 rounded-2xl p-3')}>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={playing ? stop : speak} className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary transition hover:bg-primary-dim active:scale-[0.99]">
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {playing ? 'Pause audio' : 'Play audio'}
        </button>
        <button type="button" onClick={speak} className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-surface-container-lowest px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container">
          <Volume2 className="h-4 w-4" />
          Replay
        </button>
      </div>
    </div>
  );
}

function ChoiceBlock({ question, choices, selected, setSelected }: { question: string; choices: string[]; selected: string; setSelected: (value: string) => void }) {
  return (
    <div className="mt-5">
      <p className="font-headline text-lg font-black text-on-surface">{question}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {choices.map((choice) => (
          <button
            key={choice}
            type="button"
            onClick={() => setSelected(choice)}
            className={cn(
              'cursor-pointer rounded-2xl border px-4 py-3 text-left text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.99]',
              selected === choice ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant/20 bg-surface-container-low text-on-surface hover:border-primary/40',
            )}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}

function ActionRow({ onSubmit, disabled, result, label }: { onSubmit: () => void; disabled: boolean; result: CompletedResult | null; label: string }) {
  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button type="button" onClick={onSubmit} disabled={disabled} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-on-primary transition hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-55">
        <Send className="h-4 w-4" />
        {label}
      </button>
      {result && (
        <div className={cn('rounded-2xl px-4 py-3 text-sm font-semibold', result.passed ? 'bg-primary-container text-primary' : 'bg-surface-container-low text-on-surface-variant')}>
          {result.score === null ? 'Completed' : `${result.score}%`} - {result.message}
        </div>
      )}
    </div>
  );
}

function SourceText({ title, text, compact = false }: { title: string; text: string; compact?: boolean }) {
  return (
    <div className={cn('rounded-3xl bg-surface-container-low p-5', compact && 'mt-3 rounded-2xl p-4')}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{title}</p>
      <p className="mt-3 whitespace-pre-wrap text-base leading-8 text-on-surface">{text}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="mt-2 text-sm leading-6 text-on-surface">{value}</p>
    </div>
  );
}

function parseLanguage(value?: string): CurriculumLanguage | null {
  const decoded = value ? decodeURIComponent(value) : '';
  return SUPPORTED_CURRICULUM_LANGUAGES.includes(decoded as CurriculumLanguage) ? (decoded as CurriculumLanguage) : null;
}
