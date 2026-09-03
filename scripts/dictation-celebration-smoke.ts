import { getDictationCelebrationBursts } from '../src/features/dictation/celebration';

expect(getDictationCelebrationBursts(59).length === 0, 'Scores below 60 should not trigger dictation celebration.');
expect(getDictationCelebrationBursts(60).length === 1, 'Passing scores from 60 should trigger a celebration burst.');
expect(getDictationCelebrationBursts(80)[0]?.particleCount === 105, 'Strong scores should trigger a larger celebration.');
expect(getDictationCelebrationBursts(100).length === 2, 'Excellent scores should trigger two firework-style bursts.');
expect(getDictationCelebrationBursts(100).every((burst) => burst.origin?.x), 'Excellent bursts should launch from both sides.');
expect(getDictationCelebrationBursts(90).every((burst) => burst.zIndex && burst.zIndex > 50), 'Celebration bursts should render above the result modal.');

console.log('Dictation celebration smoke passed: Grade Dictation rewards passing and excellent scores.');

function expect(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
