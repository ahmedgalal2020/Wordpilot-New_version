import { CurrentLevelCard, PracticeRecommendationCard } from '../../components/LearningComponents';
import { usePracticePath } from './usePracticePath';
import { AiPracticeSection } from './sections/AiPracticeSection';
import { PathLevelPanel } from './sections/PathLevelPanel';
import { PathOverviewSection } from './sections/PathOverviewSection';
import { TrainingPlanSection } from './sections/TrainingPlanSection';

export function PracticePath() {
  const path = usePracticePath();

  return (
    <main className="mx-auto min-h-screen max-w-[1440px] px-4 py-10 pt-24 sm:px-6 sm:py-12 sm:pt-28 lg:px-8">
      <header className="mb-10 sm:mb-12">
        <p className="mb-3 text-[0.6875rem] font-bold uppercase tracking-widest text-primary">{path.pathCopy.pageEyebrow}</p>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">{path.pathCopy.title}</h1>
        <p className="mt-3 max-w-2xl text-on-surface-variant">{path.pathCopy.intro}</p>
      </header>

      <div className="space-y-8">
        <PathLevelPanel
          language={path.selectedLanguage}
          selectedLevel={path.selectedLevel}
          saving={path.savingLevel}
          hasChanges={path.hasPathChanges}
          status={path.status}
          onSelect={path.chooseLevel}
          onSave={() => void path.saveLevel()}
        />

        <CurrentLevelCard
          language={path.selectedLanguage}
          level={path.selectedLevel}
          completedCount={path.completedCount}
          totalCount={path.totalExerciseCount}
          recommendation={path.recommendation}
          showRecommendation={false}
        />

        <PathOverviewSection copy={path.pathCopy} phaseOneLevels={path.phaseOneLevels} />

        <TrainingPlanSection
          copy={path.pathCopy}
          lessons={path.lessons}
          selectedLesson={path.selectedLesson}
          exercises={path.exercises}
          reportLoading={path.reportLoading}
          progressLoading={path.progressLoading}
          progressError={path.progressError}
          onSelectLesson={path.selectLesson}
          onStartExercise={(exercise) => void path.startExercise(exercise)}
        />

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <PracticeRecommendationCard
              level={path.selectedLevel}
              report={path.report}
              language={path.selectedLanguage}
              isPro={path.entitlements.isPro}
            />
          </div>
          <AiPracticeSection
            copy={path.pathCopy}
            language={path.selectedLanguage}
            level={path.selectedLevel}
            isPro={path.entitlements.isPro}
            loadingEntitlements={path.loadingEntitlements}
          />
        </section>
      </div>
    </main>
  );
}