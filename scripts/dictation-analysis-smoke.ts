import { analyzeDictation, getWordRanges } from '../src/features/dictation/text';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function analyze(source: string, input: string) {
  return analyzeDictation(getWordRanges(source, 'en-US'), getWordRanges(input, 'en-US'));
}

const perfect = analyze('Hello brave learner', 'Hello brave learner');
assert(perfect.accuracy === 100, `Expected perfect accuracy, got ${perfect.accuracy}`);
assert(perfect.mistakes.length === 0, 'Perfect input should have no mistakes');

const missing = analyze('Hello brave learner', 'Hello learner');
assert(missing.accuracy < 100, 'Missing word should reduce accuracy');
assert(missing.mistakes.some((item) => item.statusLabel === 'Missing word' && item.correctWord === 'brave'), 'Missing word should be reported');
assert(missing.comparisonItems.some((item) => item.status === 'missing'), 'Missing word should appear in real-time comparison');

const extra = analyze('Hello learner', 'Hello very learner');
assert(extra.accuracy < 100, 'Extra word should reduce accuracy');
assert(extra.mistakes.some((item) => item.statusLabel === 'Extra word' && item.writtenWord === 'very'), 'Extra word should be reported');

const empty = analyze('Hello learner', '');
assert(empty.accuracy === 0, `Empty input should score 0, got ${empty.accuracy}`);
assert(empty.mistakes.length === 2, `Empty input should report every missing word, got ${empty.mistakes.length}`);
assert(empty.comparisonItems.every((item) => item.status === 'missing'), 'Empty input should show missing comparison items');

console.log('Dictation analysis smoke tests passed');