export type TrainingFlowState = {
  completedExperienceCount: number;
  completedLessonCount: number;
  experienceComplete: boolean;
  lessonComplete: boolean;
  nextExerciseId: string | null;
};

export function getTrainingFlowState(input: {
  currentExerciseId: string;
  completedIds: Iterable<string>;
  experienceExerciseIds: string[];
  lessonExerciseIds: string[];
}): TrainingFlowState {
  const completed = new Set(input.completedIds);
  completed.add(input.currentExerciseId);

  const currentIndex = input.experienceExerciseIds.indexOf(input.currentExerciseId);
  const ordered = [...input.experienceExerciseIds.slice(currentIndex + 1), ...input.experienceExerciseIds.slice(0, currentIndex)];
  const nextExerciseId = ordered.find((id) => !completed.has(id)) ?? null;
  const completedExperienceCount = input.experienceExerciseIds.filter((id) => completed.has(id)).length;
  const completedLessonCount = input.lessonExerciseIds.filter((id) => completed.has(id)).length;

  return {
    completedExperienceCount,
    completedLessonCount,
    experienceComplete: completedExperienceCount >= input.experienceExerciseIds.length,
    lessonComplete: completedLessonCount >= input.lessonExerciseIds.length,
    nextExerciseId,
  };
}

export function getContinueLabel(state: TrainingFlowState) {
  if (state.nextExerciseId) return 'Continue';
  if (state.lessonComplete) return 'Complete lesson';
  return 'Continue to next skill';
}
