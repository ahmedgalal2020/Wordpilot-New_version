import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlements } from '../../hooks/useEntitlements';
import { usePracticeProgress } from '../../hooks/usePracticeProgress';
import { useWeeklyReport } from '../../hooks/useWeeklyReport';
import { useI18n } from '../../i18n';
import {
  buildPracticeRecommendation,
  type CefrLevel,
  getCurriculumLessons,
  normalizeCefrLevel,
  normalizeLearningLanguage,
  type PracticeExercise,
  type LearningLanguage,
} from '../../lib/learning';
import { getCurriculumLevel, type CurriculumLanguage } from '../../lib/curriculum';
import { buildPracticePathCopy } from './copy';
import type { PracticePathLevelMap, PracticePathState } from './types';

export function usePracticePath(): PracticePathState {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const { language: interfaceLanguage, translateLanguageName } = useI18n();
  const { entitlements, loadingEntitlements } = useEntitlements(user);
  const [selectedLanguage, setSelectedLanguage] = useState<LearningLanguage>(normalizeLearningLanguage(profile?.target_language));
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>(normalizeCefrLevel(profile?.cefr_level));
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [savingLevel, setSavingLevel] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const { report, loading: reportLoading } = useWeeklyReport(user, selectedLanguage);
  const practiceProgress = usePracticeProgress(user, selectedLanguage, selectedLevel);

  useEffect(() => {
    setSelectedLanguage(normalizeLearningLanguage(profile?.target_language));
    setSelectedLevel(normalizeCefrLevel(profile?.cefr_level));
  }, [profile?.cefr_level, profile?.target_language]);

  useEffect(() => {
    setSelectedLessonId(null);
  }, [selectedLanguage, selectedLevel]);

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
  const savedLevel = normalizeCefrLevel(profile?.cefr_level);
  const structuredLanguage = getStructuredLanguage(selectedLanguage);
  const phaseOneLevels = useMemo(() => getPhaseOneLevels(structuredLanguage), [structuredLanguage]);
  const displayLanguage = translateLanguageName(selectedLanguage);
  const pathCopy = useMemo(
    () => buildPracticePathCopy(selectedLanguage, selectedLevel, interfaceLanguage, displayLanguage),
    [displayLanguage, interfaceLanguage, selectedLanguage, selectedLevel],
  );

  async function saveLevel() {
    setSavingLevel(true);
    setStatus(null);
    const result = await updateProfile({ cefr_level: selectedLevel });
    setSavingLevel(false);
    setStatus(result.error ?? formatSavedMessage(displayLanguage, selectedLevel, interfaceLanguage));
  }

  function chooseLevel(level: CefrLevel) {
    setSelectedLevel(level);
    setStatus(formatPreviewMessage(displayLanguage, level, interfaceLanguage));
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

  return {
    selectedLanguage,
    selectedLevel,
    selectedLesson,
    lessons,
    exercises,
    completedCount,
    totalExerciseCount: allExercises.length,
    recommendation: buildPracticeRecommendation(selectedLevel, report, selectedLanguage),
    report,
    pathCopy,
    phaseOneLevels,
    reportLoading,
    progressLoading: practiceProgress.loading,
    progressError: practiceProgress.error,
    savingLevel,
    hasPathChanges: selectedLevel !== savedLevel,
    status,
    entitlements,
    loadingEntitlements,
    chooseLevel,
    saveLevel,
    selectLesson: setSelectedLessonId,
    startExercise,
  };
}

function getStructuredLanguage(language: LearningLanguage): CurriculumLanguage | null {
  return language === 'English' || language === 'German' ? language : null;
}

function getPhaseOneLevels(language: CurriculumLanguage | null): PracticePathLevelMap[] {
  if (!language) {
    return [];
  }

  return [getCurriculumLevel(language, 1), getCurriculumLevel(language, 2)].filter(
    (level): level is PracticePathLevelMap => Boolean(level),
  );
}

function formatSavedMessage(language: string, level: CefrLevel, interfaceLanguage: 'en' | 'de') {
  return interfaceLanguage === 'de'
    ? `${language} ${level} ist jetzt dein aktiver Lernweg.`
    : `${language} ${level} is now your active training path.`;
}

function formatPreviewMessage(language: string, level: CefrLevel, interfaceLanguage: 'en' | 'de') {
  return interfaceLanguage === 'de'
    ? `Vorschau: ${language} ${level}. Speichere das Niveau, um den Lernweg zu aktualisieren.`
    : `Previewing ${language} ${level}. Save the level to update your path.`;
}
