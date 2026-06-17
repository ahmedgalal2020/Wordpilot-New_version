import React, { useEffect, useMemo, useState } from 'react';
import { Bot, LoaderCircle, LockKeyhole, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CurrentLevelCard, LevelSelectionPanel, PracticeExerciseCard, PracticeRecommendationCard } from '../components/LearningComponents';
import { useAuth } from '../contexts/AuthContext';
import { useEntitlements } from '../hooks/useEntitlements';
import { usePracticeProgress } from '../hooks/usePracticeProgress';
import { useWeeklyReport } from '../hooks/useWeeklyReport';
import {
  buildPracticeRecommendation,
  CefrLevel,
  getCurriculumLessons,
  LearningLanguage,
  normalizeCefrLevel,
  normalizeLearningLanguage,
  PracticeExercise,
} from '../lib/learning';

export default function PracticePathPage() {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const { entitlements, loadingEntitlements } = useEntitlements(user);
  const [selectedLanguage, setSelectedLanguage] = useState<LearningLanguage>(normalizeLearningLanguage(profile?.target_language));
  const { report, loading: reportLoading } = useWeeklyReport(user, selectedLanguage);
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>(normalizeCefrLevel(profile?.cefr_level));
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [savingLevel, setSavingLevel] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const practiceProgress = usePracticeProgress(user, selectedLanguage, selectedLevel);

  useEffect(() => {
    setSelectedLanguage(normalizeLearningLanguage(profile?.target_language));
    setSelectedLevel(normalizeCefrLevel(profile?.cefr_level));
  }, [profile?.cefr_level, profile?.target_language]);

  const lessons = useMemo(
    () =>
      getCurriculumLessons(selectedLevel, selectedLanguage).map((lesson) => ({
        ...lesson,
        exercises: practiceProgress.applyProgress(lesson.exercises),
      })),
    [practiceProgress.applyProgress, selectedLanguage, selectedLevel],
  );
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? lessons[0];
  const exercises = selectedLesson?.exercises ?? [];
  const allExercises = lessons.flatMap((lesson) => lesson.exercises);
  const completedCount = allExercises.filter((exercise) => exercise.status === 'completed').length;
  const recommendation = buildPracticeRecommendation(selectedLevel, report, selectedLanguage);
  const savedLanguage = normalizeLearningLanguage(profile?.target_language);
  const savedLevel = normalizeCefrLevel(profile?.cefr_level);
  const hasPathChanges = selectedLanguage !== savedLanguage || selectedLevel !== savedLevel;

  useEffect(() => {
    setSelectedLessonId(null);
  }, [selectedLanguage, selectedLevel]);

  async function saveLevel() {
    setSavingLevel(true);
    setStatus(null);
    const result = await updateProfile({ cefr_level: selectedLevel, target_language: selectedLanguage });
    setSavingLevel(false);
    setStatus(result.error ?? `${selectedLanguage} ${selectedLevel} is now your active training path.`);
  }

  function chooseLanguage(language: LearningLanguage) {
    setSelectedLanguage(language);
    setStatus(`Previewing ${language} ${selectedLevel}. Save path to keep it in your profile.`);
  }

  function chooseLevel(level: CefrLevel) {
    setSelectedLevel(level);
    setStatus(`Previewing ${selectedLanguage} ${level}. Save path to keep it in your profile.`);
  }

  async function startExercise(exercise: PracticeExercise) {
    if (exercise.status === 'not_started') {
      const result = await practiceProgress.upsertProgress({
        language: selectedLanguage,
        cefrLevel: selectedLevel,
        lessonId: exercise.lessonId,
        exerciseId: exercise.id,
        status: 'in_progress',
      });

      if (result.error) {
        setStatus(result.error);
        return;
      }
    }

    navigate('/workspace', {
      state: {
          sourceText: exercise.sourceText,
          title: exercise.title,
          language: exercise.language,
          cefrLevel: exercise.level,
          practiceCategory: exercise.skill,
          lessonTitle: exercise.lessonTitle,
          practicePath: true,
          practiceExerciseId: exercise.id,
          practiceLessonId: exercise.lessonId,
      },
    });
  }

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 pt-24 sm:pt-28 min-h-screen">
      <header className="mb-10 sm:mb-12">
        <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary mb-3">Practice Path</p>
        <h1 className="font-headline font-extrabold text-3xl sm:text-4xl tracking-tight text-on-surface">My Learning Path</h1>
        <p className="text-on-surface-variant mt-3 max-w-2xl">
          Choose a language and CEFR level, then follow a structured weekly plan across dictation, reading, listening, and writing.
        </p>
      </header>

      <div className="space-y-8">
        <LevelSelectionPanel
          selectedLanguage={selectedLanguage}
          selectedLevel={selectedLevel}
          saving={savingLevel}
          hasChanges={hasPathChanges}
          status={status}
          onLanguageSelect={chooseLanguage}
          onSelect={chooseLevel}
          onSave={() => void saveLevel()}
        />

        <CurrentLevelCard
          language={selectedLanguage}
          level={selectedLevel}
          completedCount={completedCount}
          totalCount={allExercises.length}
          recommendation={recommendation}
          showRecommendation={false}
        />

        <section id="training-plan" className="scroll-mt-24">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="font-headline font-black text-2xl text-on-surface">{selectedLanguage} {selectedLevel} Lessons</h2>
              <p className="mt-1 text-sm text-on-surface-variant">12 lessons. Each lesson has dictation, reading, listening, and writing.</p>
            </div>
            {reportLoading && (
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Syncing progress
              </span>
            )}
            {!reportLoading && practiceProgress.loading && (
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Syncing path status
              </span>
            )}
          </div>
          {practiceProgress.error && (
            <div className="mb-5 rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-sm text-on-surface">
              Practice progress could not sync: {practiceProgress.error}
            </div>
          )}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:items-start">
            <div className="xl:col-span-5 bg-surface-container-lowest rounded-2xl p-5 sm:p-6 whisper-shadow">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary">Curriculum</p>
                  <h3 className="mt-1 font-headline font-black text-xl text-on-surface">12 lesson path</h3>
                </div>
                <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-bold text-primary">{lessons.length} lessons</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lessons.map((lesson) => {
                  const active = lesson.id === selectedLesson.id;
                  const done = lesson.exercises.filter((exercise) => exercise.status === 'completed').length;
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => setSelectedLessonId(lesson.id)}
                      className={`text-left rounded-2xl border p-3.5 transition ${
                        active
                          ? 'border-primary bg-primary text-on-primary'
                          : 'border-outline-variant/20 bg-surface-container-low hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-on-primary/75' : 'text-primary'}`}>
                            Lesson {lesson.number}
                          </p>
                          <h4 className="mt-1 font-headline font-bold text-sm leading-5">{lesson.theme}</h4>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${active ? 'bg-white/15' : 'bg-surface-container'}`}>
                          {done}/4
                        </span>
                      </div>
                      <p className={`mt-2 line-clamp-2 text-xs leading-5 ${active ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>
                        {lesson.canDo}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {lesson.vocabulary.slice(0, 3).map((word) => (
                          <span key={word} className={`rounded-full px-2 py-1 text-[10px] font-bold ${active ? 'bg-white/15' : 'bg-primary-container text-primary'}`}>
                            {word}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="xl:col-span-7 space-y-5">
              {selectedLesson && (
                <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 whisper-shadow border border-outline-variant/10">
                  <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary">Selected lesson</p>
                  <h3 className="mt-2 font-headline font-black text-2xl text-on-surface">{selectedLesson.title}</h3>
                  <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-surface-container-low p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Goal</p>
                      <p className="mt-2 text-sm leading-6 text-on-surface">{selectedLesson.objective}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-container-low p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Can do</p>
                      <p className="mt-2 text-sm leading-6 text-on-surface">{selectedLesson.canDo}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-container-low p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Grammar</p>
                      <p className="mt-2 text-sm leading-6 text-on-surface">{selectedLesson.grammarFocus}</p>
                    </div>
                  </div>
                  <div className="mt-5">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Lesson words</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedLesson.vocabulary.map((word) => (
                        <span key={word} className="rounded-full bg-primary-container px-3 py-1.5 text-xs font-bold text-primary">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {exercises.map((exercise) => (
                  <PracticeExerciseCard key={exercise.id} exercise={exercise} onStart={startExercise} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <PracticeRecommendationCard
              level={selectedLevel}
              report={report}
              language={selectedLanguage}
              isPro={entitlements.isPro}
            />
          </div>
          <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-6 sm:p-8 whisper-shadow">
            <div className="flex items-center gap-2 text-primary text-[0.6875rem] font-bold tracking-widest uppercase">
              <Bot className="h-4 w-4" />
              AI practice
            </div>
            <h2 className="mt-3 font-headline font-black text-2xl text-on-surface">Generate practice text for {selectedLanguage} {selectedLevel}</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Create level-aligned dictation, listening, reading, or writing material and add it to your current path.
            </p>
            {loadingEntitlements ? (
              <div className="mt-6 inline-flex items-center gap-2 text-sm text-on-surface-variant">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Checking AI access
              </div>
            ) : entitlements.isPro ? (
              <Link
                to="/ai-lab"
                state={{ language: selectedLanguage, level: selectedLevel, skillType: 'Dictation', fromPracticePath: true }}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary"
              >
                <Sparkles className="h-4 w-4" />
                Generate for my level
              </Link>
            ) : (
              <div className="mt-6 rounded-2xl bg-primary/5 border border-primary/10 p-5">
                <div className="flex items-start gap-3">
                  <LockKeyhole className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-bold text-on-surface">Premium AI practice is locked</p>
                    <p className="mt-1 text-sm text-on-surface-variant">Free users can follow the practice path. Pro unlocks AI-generated texts for each level and skill.</p>
                    <Link to="/pricing" className="mt-4 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary">
                      Upgrade
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
