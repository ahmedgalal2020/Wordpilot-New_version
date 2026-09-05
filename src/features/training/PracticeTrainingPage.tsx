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
import { buildTrainingExerciseModel, scoreTrainingResponse, type TrainingExerciseModel } from './exerciseAdapter';
import { getExercisesForExperience, getTrainingRoute, parseTrainingExperience, TRAINING_EXPERIENCE_LABELS, type TrainingExperience } from './registry';
import { getContinueLabel, getTrainingFlowState, type TrainingFlowState } from './trainingFlow';
import { TrainingCompletionPanel, type TrainingCompletionResult } from './trainingCompletion';

type RecordingState = 'idle' | 'recording' | 'ready';
type CompletedResult = TrainingCompletionResult;
type CompletionContext = {
  result: CompletedResult;
  exerciseId: string;
  flow: TrainingFlowState;
};

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
  const [levelLessons, setLevelLessons] = useState<CurriculumLesson[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [completionContext, setCompletionContext] = useState<CompletionContext | null>(null);
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
        if (!cancelled) {
          setLevelLessons(level.lessons);
          setLesson(nextLesson);
          setCompletionContext(null);
        }
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

  const syncedCompletedIds = useMemo(() => {
    const ids = new Set(completedIds);
    progress.rows.forEach((row) => {
      if (row.status === 'completed' || row.completed_at) ids.add(row.exercise_id);
    });
    return ids;
  }, [completedIds, progress.rows]);

  async function completeTraining(result: CompletedResult, completedExerciseId = exerciseId || exercises[0]?.id) {
    if (!language || !lesson || !experience || !completedExerciseId || !result.passed || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await progress.upsertProgress({ language, cefrLevel: lesson.cefrLevel, lessonId: lesson.id, exerciseId: completedExerciseId, status: 'completed' });
      if (saved.error) { setSaveError('Your progress could not be saved. Please submit again.'); return; }
    } catch {
      setSaveError('Your progress could not be saved. Please submit again.');
      return;
    } finally { savingRef.current = false; setSaving(false); }
    const flow = getTrainingFlowState({
      currentExerciseId: completedExerciseId,
      completedIds: syncedCompletedIds,
      experienceExerciseIds: getExercisesForExperience(lesson, experience).map((exercise) => exercise.id),
      lessonExerciseIds: lesson.exercises.map((exercise) => exercise.id),
    });
    setCompletedIds((current) => new Set([...current, completedExerciseId]));
    setCompletionContext({ result, exerciseId: completedExerciseId, flow });

  }

  function continueAfterCompletion() {
    if (!completionContext || !experience || !language || !lesson) return;
    if (completionContext.flow.nextExerciseId) {
      setCompletionContext(null);
      navigate(getTrainingRoute({
        experience,
        language,
        levelNumber,
        lessonId: lesson.id,
        exerciseId: completionContext.flow.nextExerciseId,
      }));
      return;
    }

    if (completionContext.flow.lessonComplete) {
      const nextLesson = findNextLesson(levelLessons, lesson);
      setCompletionContext(null);
      if (nextLesson) {
        navigate(getTrainingRoute({
          experience: 'listening',
          language,
          levelNumber: nextLesson.levelNumber,
          lessonId: nextLesson.id,
          exerciseId: getExercisesForExperience(nextLesson, 'listening')[0]?.id ?? '',
        }));
        return;
      }
      navigate('/practice-path');
      return;
    }

    const nextSkill = getNextSkillRoute(lesson, experience, new Set([...syncedCompletedIds, completionContext.exerciseId]));
    setCompletionContext(null);
    if (nextSkill) {
      navigate(getTrainingRoute({
        experience: nextSkill.experience,
        language,
        levelNumber,
        lessonId: lesson.id,
        exerciseId: nextSkill.exerciseId,
      }));
      return;
    }
    navigate('/practice-path');
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
        <section key={`${user?.id}:${experience}:${lesson.id}:${exerciseId}`} className="space-y-6 [&_button]:focus-visible:outline [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-primary">
          {saveError && <p role="alert" className="text-sm text-error">{saveError}</p>}
          <fieldset disabled={saving} className="min-w-0 space-y-6 border-0 p-0">
          {saving && <p role="status">Saving progress...</p>}
          <LessonContext lesson={lesson} experience={experience} />
          {completionContext && completionContext.flow.experienceComplete && (
            <ExperienceCompletionPanel
              title={completionContext.flow.lessonComplete ? 'Lesson complete' : `${TRAINING_EXPERIENCE_LABELS[experience]} complete`}
              result={completionContext.result}
              experience={experience}
              flow={completionContext.flow}
              totalExperience={exercises.length}
              totalLesson={lesson.exercises.length}
              onContinue={continueAfterCompletion}
            />
          )}
          {experience === 'listening' && <ListeningExperience model={models[0]} onComplete={(result) => void completeTraining(result, models[0].id)} onContinue={continueAfterCompletion} completion={completionContext?.exerciseId === models[0].id ? completionContext : null} />}
          {experience === 'reading' && <ReadingExperience model={models[0]} onComplete={(result) => void completeTraining(result, models[0].id)} onContinue={continueAfterCompletion} completion={completionContext?.exerciseId === models[0].id ? completionContext : null} />}
          {experience === 'writing' && <WritingExperience model={models[0]} onComplete={(result) => void completeTraining(result, models[0].id)} onContinue={continueAfterCompletion} completion={completionContext?.exerciseId === models[0].id ? completionContext : null} />}
          {experience === 'speaking' && <SpeakingExperience model={models[0]} onComplete={(result) => void completeTraining(result, models[0].id)} onContinue={continueAfterCompletion} completion={completionContext?.exerciseId === models[0].id ? completionContext : null} />}
          {experience === 'review' && <MixedPracticeExperience title="Review" models={models} onComplete={(result, id) => void completeTraining(result, id)} onContinue={continueAfterCompletion} completion={completionContext} position={getExercisesForExperience(lesson, experience).findIndex((item) => item.id === models[0].id) + 1} />}
          {experience === 'progress-check' && <MixedPracticeExperience title="Progress Check" models={models} assessment onComplete={(result, id) => void completeTraining(result, id)} onContinue={continueAfterCompletion} completion={completionContext} position={getExercisesForExperience(lesson, experience).findIndex((item) => item.id === models[0].id) + 1} />}
          </fieldset>
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

function LessonContext({ lesson, experience }: { lesson: CurriculumLesson; experience: TrainingExperience }) {
  const showModelSentence = experience === 'speaking' || experience === 'writing';

  return (
    <div className="rounded-3xl bg-surface-container-lowest p-5 whisper-shadow sm:p-6">
      <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-primary">Learning goal</p>
      <h2 className="mt-2 font-headline text-2xl font-black text-on-surface">{lesson.objective}</h2>
      <div className={cn('mt-5 grid gap-3', showModelSentence ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
        <InfoCard label="Can do" value={lesson.canDo} />
        <InfoCard label="Grammar" value={lesson.grammarFocus} />
        {showModelSentence && <InfoCard label="Model sentence" value={lesson.targetSentence} subtle />}
      </div>
    </div>
  );
}

function ListeningExperience({
  model,
  completion,
  onComplete,
  onContinue,
}: {
  model: TrainingExerciseModel;
  completion: CompletionContext | null;
  onComplete: (result: CompletedResult) => void;
  onContinue: () => void;
}) {
  const [selected, setSelected] = useState('');
  const [result, setResult] = useState<CompletedResult | null>(null);
  const [transcriptVisible, setTranscriptVisible] = useState(false);
  const question = model.questions[0];

  function submit() {
    const scored = scoreTrainingResponse(model, selected);
    const nextResult = { score: scored.score, passed: scored.passed, message: scored.feedback };
    setResult(nextResult);
    if (scored.passed) onComplete(nextResult);
  }

  const completed = completion?.result ?? null;

  return (
    <TrainingCard eyebrow="Listening first" title={model.title} instruction={model.instruction}>
      {model.contract.kind === 'invalid' ? (
        <InvalidTrainingState model={model} />
      ) : (
      <>
      <AudioControls text={model.audioText} locale={model.locale} />
      {question && <ChoiceBlock question={question.prompt} choices={question.choices} selected={selected} setSelected={setSelected} />}
      {!completed && <ActionRow onSubmit={submit} disabled={!selected} result={result} label="Submit answer" />}
      {result && !result.passed && <InlineFeedback result={result} />}
      {completed && !completion.flow.experienceComplete && (
        <TrainingCompletionPanel
          result={completed}
          experience="listening"
          objective
          continueLabel={getContinueLabel(completion.flow)}
          onContinue={onContinue}
        />
      )}
      {completed && (
        <button type="button" onClick={() => setTranscriptVisible((visible) => !visible)} className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-container">
          <Eye className="h-4 w-4" />
          {transcriptVisible ? 'Hide transcript' : 'View transcript'}
        </button>
      )}
      {transcriptVisible && <SourceText title="Transcript" text={model.transcript} />}
      </>
      )}
    </TrainingCard>
  );
}

function ReadingExperience({
  model,
  completion,
  onComplete,
  onContinue,
}: {
  model: TrainingExerciseModel;
  completion: CompletionContext | null;
  onComplete: (result: CompletedResult) => void;
  onContinue: () => void;
}) {
  const [selected, setSelected] = useState('');
  const [result, setResult] = useState<CompletedResult | null>(null);
  const question = model.questions[0];

  function submit() {
    const scored = scoreTrainingResponse(model, selected);
    const nextResult = { score: scored.score, passed: scored.passed, message: scored.feedback };
    setResult(nextResult);
    if (scored.passed) onComplete(nextResult);
  }

  const completed = completion?.result ?? null;

  return (
    <TrainingCard eyebrow="Read, then answer" title={model.title} instruction={model.instruction}>
      {model.contract.kind === 'invalid' ? (
        <InvalidTrainingState model={model} />
      ) : (
      <>
      <SourceText title="Reading text" text={model.readingText} />
      {question && <ChoiceBlock question={question.prompt} choices={question.choices} selected={selected} setSelected={setSelected} />}
      {!completed && <ActionRow onSubmit={submit} disabled={!selected} result={result} label="Check reading" />}
      {result && !result.passed && <InlineFeedback result={result} />}
      {completed && !completion.flow.experienceComplete && (
        <TrainingCompletionPanel
          result={completed}
          experience="reading"
          objective
          continueLabel={getContinueLabel(completion.flow)}
          onContinue={onContinue}
        />
      )}
      </>
      )}
    </TrainingCard>
  );
}

function WritingExperience({
  model,
  completion,
  onComplete,
  onContinue,
}: {
  model: TrainingExerciseModel;
  completion: CompletionContext | null;
  onComplete: (result: CompletedResult) => void;
  onContinue: () => void;
}) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<CompletedResult | null>(null);
  const task = model.writingTask;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  function complete() {
    const nextResult = { score: null, passed: true, message: 'Completed and ready for review. No AI score was generated.' };
    setResult(nextResult);
    onComplete(nextResult);
  }

  const completed = completion?.result ?? null;

  return (
    <TrainingCard eyebrow="Original writing" title={model.title} instruction={model.instruction}>
      {model.contract.kind === 'invalid' ? (
        <InvalidTrainingState model={model} />
      ) : (
      <>
      <div className="grid gap-3 md:grid-cols-2">
        <InfoCard label="Task" value={model.prompt || task?.prompt || model.instruction} />
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
      {!completed && <ActionRow onSubmit={complete} disabled={wordCount < 3} result={result} label="Complete writing" />}
      {completed && !completion.flow.experienceComplete && (
        <TrainingCompletionPanel
          result={completed}
          experience="writing"
          objective={false}
          continueLabel={getContinueLabel(completion.flow)}
          onContinue={onContinue}
        />
      )}
      </>
      )}
    </TrainingCard>
  );
}

function SpeakingExperience({
  model,
  completion,
  onComplete,
  onContinue,
}: {
  model: TrainingExerciseModel;
  completion: CompletionContext | null;
  onComplete: (result: CompletedResult) => void;
  onContinue: () => void;
}) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [result, setResult] = useState<CompletedResult | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const roleplay = model.roleplay;
  const [recordingError, setRecordingError] = useState<string | null>(null);
  useEffect(() => () => {
    const recorder = recorderRef.current;
    if (recorder) { recorder.onstop = null; if (recorder.state !== 'inactive') recorder.stop(); }
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return;
    setRecordingError(null);
    window.speechSynthesis?.cancel();
    let stream: MediaStream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { setRecordingError('Microphone access failed. Check your browser permission and try again.'); return; }
    streamRef.current = stream;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
      setAudioUrl(URL.createObjectURL(blob));
      setRecordingState('ready');
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecordingState('recording');
  }

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }

  function complete() {
    const nextResult = { score: null, passed: true, message: 'Speaking practice completed. Recording is available for replay.' };
    setResult(nextResult);
    onComplete(nextResult);
  }

  const completed = completion?.result ?? null;

  return (
    <TrainingCard eyebrow="Produce speech" title={model.title} instruction={model.instruction}>
      {model.contract.kind === 'invalid' ? (
        <InvalidTrainingState model={model} />
      ) : (
      <>
      <div className="grid gap-3 md:grid-cols-2">
        <InfoCard label="Scenario" value={model.prompt || roleplay?.scenario || model.speakingTask?.prompt} />
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
      {recordingError && <p role="alert" className="mt-3 text-sm text-error">{recordingError}</p>}
      {audioUrl && <audio controls src={audioUrl} className="mt-5 w-full" />}
      {!completed && <ActionRow onSubmit={complete} disabled={!audioUrl || recordingState === 'recording'} result={result} label="Complete speaking" />}
      {completed && !completion.flow.experienceComplete && (
        <TrainingCompletionPanel
          result={completed}
          experience="speaking"
          objective={false}
          continueLabel={getContinueLabel(completion.flow)}
          onContinue={onContinue}
        />
      )}
      </>
      )}
    </TrainingCard>
  );
}

function MixedPracticeExperience({
  position,
  title,
  models,
  assessment = false,
  completion,
  onComplete,
  onContinue,
}: {
  title: string;
  position: number;
  models: TrainingExerciseModel[];
  assessment?: boolean;
  completion: CompletionContext | null;
  onComplete: (result: CompletedResult, exerciseId: string) => void;
  onContinue: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CompletedResult | null>(null);
  const activeIndex = 0;
  const activeModel = models[Math.min(activeIndex, models.length - 1)];
  const selected = activeModel ? answers[activeModel.id] ?? '' : '';
  const isObjective = Boolean(activeModel && !['invalid', 'writing', 'speaking', 'pronunciation'].includes(activeModel.contract.kind));



  function submit() {
    if (!activeModel || !isObjective) return;
    const scored = isObjective ? scoreTrainingResponse(activeModel, selected) : { score: null, passed: true, feedback: 'Practice completed. This activity is ready for review.' };
    const nextResult = { score: scored.score, passed: scored.passed, message: scored.feedback };
    setResult(nextResult);
    if (nextResult.passed) onComplete(nextResult, activeModel.id);
  }

  const continueMixed = onContinue;

  if (!activeModel) return null;
  if (activeModel.contract.kind === 'writing') return <WritingExperience model={activeModel} completion={completion} onComplete={(value) => onComplete(value, activeModel.id)} onContinue={onContinue} />;
  if (activeModel.contract.kind === 'speaking' || activeModel.contract.kind === 'pronunciation') return <SpeakingExperience model={activeModel} completion={completion} onComplete={(value) => onComplete(value, activeModel.id)} onContinue={onContinue} />;

  return (
    <TrainingCard eyebrow={assessment ? 'Mini assessment' : 'Mixed review'} title={title} instruction={assessment ? 'Answer a compact mix of objective and production tasks.' : 'Review the lesson with a compact mix of learned material.'}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="rounded-full bg-primary-container px-4 py-2 text-xs font-black uppercase tracking-widest text-primary">
          {position} of {models.length}
        </p>
        <p className="text-sm font-semibold text-on-surface-variant">
          {assessment ? 'Progress Check item' : 'Review item'}
        </p>
      </div>
      <div className="rounded-2xl bg-surface-container-low p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{activeModel.experience}</p>
        <h3 className="mt-1 font-headline text-lg font-black text-on-surface">{activeModel.title}</h3>
        <NativeContractPreview
          model={activeModel}
          selected={selected}
          setSelected={(value) => setAnswers((current) => ({ ...current, [activeModel.id]: value }))}
        />
      </div>
      {!completion && <ActionRow onSubmit={submit} disabled={!isObjective || !selected} result={result} label={assessment ? 'Submit check item' : 'Submit review item'} />}
      {result && !result.passed && <InlineFeedback result={result} />}
      {completion && !completion.flow.experienceComplete && (
        <TrainingCompletionPanel
          result={completion.result}
          experience={assessment ? 'progress-check' : 'review'}
          objective={isObjective}
          continueLabel={getContinueLabel(completion.flow)}
          meta={`${completion.flow.completedExperienceCount} of ${models.length} completed`}
          onContinue={continueMixed}
        />
      )}
    </TrainingCard>
  );
}

function ExperienceCompletionPanel({
  title,
  result,
  experience,
  flow,
  totalExperience,
  totalLesson,
  onContinue,
}: {
  title: string;
  result: CompletedResult;
  experience: TrainingExperience;
  flow: TrainingFlowState;
  totalExperience: number;
  totalLesson: number;
  onContinue: () => void;
}) {
  return (
    <TrainingCard
      eyebrow={flow.lessonComplete ? 'Lesson complete' : 'Experience complete'}
      title={title}
      instruction={flow.lessonComplete ? 'Every required activity in this lesson is complete.' : 'This skill is complete for the current lesson.'}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoCard label="Skill progress" value={`${flow.completedExperienceCount} of ${totalExperience} activities completed`} />
        <InfoCard label="Lesson progress" value={`${flow.completedLessonCount} of ${totalLesson} activities completed`} />
      </div>
      <TrainingCompletionPanel
        result={result}
        experience={experience}
        objective={result.score !== null}
        continueLabel={flow.lessonComplete ? 'Next lesson' : getContinueLabel(flow)}
        meta={flow.lessonComplete ? 'Ready for the next lesson' : 'Ready for the next skill'}
        onContinue={onContinue}
      />
    </TrainingCard>
  );
}

function NativeContractPreview({
  model,
  selected,
  setSelected,
}: {
  model: TrainingExerciseModel;
  selected: string;
  setSelected: (value: string) => void;
}) {
  const contract = model.contract;

  if (contract.kind === 'invalid') return <InvalidTrainingState model={model} />;

  if (contract.kind === 'listening') {
    return (
      <>
        <AudioControls text={contract.audioText} locale={model.locale} compact />
        <ChoiceBlock question={contract.question} choices={contract.choices} selected={selected} setSelected={setSelected} />
      </>
    );
  }

  if (contract.kind === 'reading') {
    return (
      <>
        <SourceText title="Reading text" text={contract.sourceText} compact />
        <ChoiceBlock question={contract.question} choices={contract.choices} selected={selected} setSelected={setSelected} />
      </>
    );
  }

  if (contract.kind === 'multiple_choice') {
    return <ChoiceBlock question={contract.prompt} choices={contract.choices} selected={selected} setSelected={setSelected} />;
  }

  if (contract.kind === 'gap_fill') {
    return (
      <div className="mt-4">
        <p className="rounded-2xl bg-surface-container-lowest px-4 py-3 text-base font-semibold text-on-surface">{contract.template}</p>
        {contract.choices ? (
          <ChoiceBlock question="Choose the missing answer." choices={contract.choices} selected={selected} setSelected={setSelected} />
        ) : (
          <input
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            className="mt-3 w-full rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            placeholder="Type the missing word or phrase."
          />
        )}
      </div>
    );
  }

  if (contract.kind === 'sentence_order') {
    return (
      <div className="mt-4">
        <p className="text-sm font-semibold text-on-surface-variant">Order these segments:</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {contract.tokens.map((token, index) => (
            <button
              key={`${token}-${index}`}
              type="button"
              onClick={() => setSelected([selected, token].filter(Boolean).join(' '))}
              className="cursor-pointer rounded-full bg-surface-container-lowest px-3 py-2 text-xs font-bold text-on-surface transition hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary active:scale-[0.98]"
            >
              {token}
            </button>
          ))}
          <button type="button" onClick={() => setSelected('')} className="cursor-pointer rounded-full bg-surface-container px-3 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high">
            Reset
          </button>
        </div>
        <p className="mt-3 min-h-10 rounded-2xl bg-surface-container-lowest px-4 py-3 text-sm text-on-surface">
          {selected || 'Your ordered sentence appears here.'}
        </p>
      </div>
    );
  }

  if (contract.kind === 'vocabulary_match') {
    let answers: string[] = [];
    try { answers = JSON.parse(selected || '[]'); } catch { answers = []; }
    const meanings = [...new Set(contract.pairs.map((pair) => pair.meaning))].sort();
    return (
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {contract.pairs.map((pair, index) => (
          <div key={`${pair.term}-${pair.meaning}`} className="rounded-2xl bg-surface-container-lowest p-3">
            <p className="font-headline text-sm font-black text-on-surface">{pair.term}</p>
            <select aria-label={pair.term} value={answers[index] || ''} className="mt-2 w-full cursor-pointer rounded-lg p-2 text-sm" onChange={(event) => {
              const next = [...answers]; next[index] = event.target.value; setSelected(JSON.stringify(next));
            }}>
              <option value="">Choose a meaning</option>
              {meanings.map((meaning) => <option key={meaning} value={meaning}>{meaning}</option>)}
            </select>
          </div>
        ))}
      </div>
    );
  }

  if (contract.kind === 'dictation') {
    return <><AudioControls text={contract.audioText} locale={model.locale} compact /><textarea aria-label="Your dictation" value={selected} onChange={(event) => setSelected(event.target.value)} className="mt-4 min-h-28 w-full rounded-lg border p-3" /></>;
  }
  if (contract.kind === 'pronunciation') {
    return <AudioControls text={contract.audioText} locale={model.locale} compact />;
  }

  return <p className="mt-3 text-sm leading-6 text-on-surface-variant">{model.prompt}</p>;
}

function InlineFeedback({ result }: { result: CompletedResult }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'mt-5 rounded-2xl px-4 py-3 text-sm font-semibold',
        result.passed ? 'bg-primary-container text-primary' : 'bg-surface-container-low text-on-surface-variant',
      )}
    >
      {result.passed ? result.message : 'Not quite - try again.'}
    </div>
  );
}

function InvalidTrainingState({ model }: { model: TrainingExerciseModel }) {
  if (model.contract.kind !== 'invalid') return null;

  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
      <p className="font-headline text-base font-black text-on-surface">Exercise content unavailable</p>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">
        This exercise needs authored content before WordPilot can show it safely.
      </p>
      <p className="mt-3 text-xs font-semibold text-on-surface-variant">
        Missing: {model.contract.missing.join(', ')}
      </p>
    </div>
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
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, [text]);

  function speak() {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    utterance.rate = 0.9;
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
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
      <button type="button" onClick={onSubmit} disabled={disabled} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-on-primary transition hover:bg-primary-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55">
        <Send className="h-4 w-4" />
        {result && !result.passed ? 'Try again' : label}
      </button>
      {result?.passed && <span className="text-sm font-bold text-primary">Ready to continue</span>}
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

function InfoCard({ label, value, subtle = false }: { label: string; value: string; subtle?: boolean }) {
  return (
    <div className={cn('rounded-2xl bg-surface-container-low p-4', subtle && 'bg-surface-container-low/70')}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className={cn('mt-2 leading-6 text-on-surface', subtle ? 'text-xs sm:text-sm' : 'text-sm')}>{value}</p>
    </div>
  );
}

function parseLanguage(value?: string): CurriculumLanguage | null {
  const decoded = value ? decodeURIComponent(value) : '';
  return SUPPORTED_CURRICULUM_LANGUAGES.includes(decoded as CurriculumLanguage) ? (decoded as CurriculumLanguage) : null;
}

function getNextSkillRoute(lesson: CurriculumLesson, currentExperience: TrainingExperience, completedIds: Set<string>) {
  const order: TrainingExperience[] = ['listening', 'reading', 'speaking', 'writing', 'review', 'progress-check'];
  const currentIndex = order.indexOf(currentExperience);
  const nextExperiences = [...order.slice(currentIndex + 1), ...order.slice(0, currentIndex)];

  for (const nextExperience of nextExperiences) {
    const nextExercise = getExercisesForExperience(lesson, nextExperience).find((exercise) => !completedIds.has(exercise.id));
    if (nextExercise) return { experience: nextExperience, exerciseId: nextExercise.id };
  }

  return null;
}

function findNextLesson(levelLessons: CurriculumLesson[], currentLesson: CurriculumLesson) {
  const currentIndex = levelLessons.findIndex((lesson) => lesson.id === currentLesson.id);
  return currentIndex >= 0 ? levelLessons[currentIndex + 1] ?? null : null;
}
