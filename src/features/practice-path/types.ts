import type { CefrLevel, LearningLanguage, PracticeExercise, PracticeLesson } from '../../lib/learning';
import type { WeeklyReport } from '../../hooks/useWeeklyReport';
import type { CurriculumLevelSummary } from '../../lib/curriculumRepository';

export type PathCopy = {
  pageEyebrow: string;
  title: string;
  intro: string;
  lessonsTitle: string;
  lessonsSummary: string;
  syncingProgress: string;
  syncingPath: string;
  syncError: string;
  curriculum: string;
  pathCount: string;
  lessonCount: string;
  lessonLabel: string;
  selectedLesson: string;
  goal: string;
  canDo: string;
  grammar: string;
  lessonWords: string;
  overviewEyebrow: string;
  overviewTitle: string;
  overviewIntro: string;
  viewCurriculum: string;
  lessonFlow: string;
  currentLevelMap: string;
  levelMapFallback: string;
  stepLabel: string;
  fromToLabel: string;
  toLabel: string;
  withLabel: string;
  practiceStepsLabel: string;
  skillFlowLabels: string[];
  aiEyebrow: string;
  aiTitle: string;
  aiDescription: string;
  checkingAccess: string;
  generate: string;
  premiumTitle: string;
  premiumDescription: string;
  upgrade: string;
};

export type PracticePathLevelMap = CurriculumLevelSummary;

export type PracticePathLesson = PracticeLesson;
export type PracticePathExercise = PracticeExercise;

export type PracticePathState = {
  selectedLanguage: LearningLanguage;
  selectedLevel: CefrLevel;
  selectedLesson: PracticePathLesson | null;
  lessons: PracticePathLesson[];
  exercises: PracticePathExercise[];
  completedCount: number;
  totalExerciseCount: number;
  recommendation: string;
  report: WeeklyReport;
  pathCopy: PathCopy;
  phaseOneLevels: PracticePathLevelMap[];
  contentLoading: boolean;
  contentError: string | null;
  reportLoading: boolean;
  progressLoading: boolean;
  progressError: string | null;
  savingLevel: boolean;
  hasPathChanges: boolean;
  status: string | null;
  entitlements: { isPro: boolean };
  loadingEntitlements: boolean;
  chooseLevel: (level: CefrLevel) => void;
  saveLevel: () => Promise<void>;
  selectLesson: (lessonId: string) => void;
  startExercise: (exercise: PracticePathExercise) => Promise<void>;
};

