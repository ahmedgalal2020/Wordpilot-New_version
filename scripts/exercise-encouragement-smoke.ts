import { getExerciseEncouragement } from '../src/components/ExerciseRenderer';

expect(getExerciseEncouragement(100).title === 'Perfect work', '100% should produce a perfect-work encouragement.');
expect(getExerciseEncouragement(92).title === 'Excellent progress', 'High scores should feel excellent, not neutral.');
expect(getExerciseEncouragement(60).title === 'Good pass', 'A 60% passing attempt should receive positive encouragement.');
expect(getExerciseEncouragement(55, 70).title === 'Close attempt', 'Below pass but near the target should encourage a retry.');
expect(getExerciseEncouragement(20).title === 'Try again', 'Low scores should give a retry message.');

console.log('Exercise encouragement smoke passed: score bands produce learner-friendly feedback.');

function expect(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
