import type { ExerciseContract } from './exerciseContracts';

// Intentional dictation/order policy: punctuation and case are optional; accents are not.
export function normalizeWrittenAnswer(value: string) {
  return value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
}

export function scoreObjectiveContract(contract: ExerciseContract, response: string) {
  let correct = false;
  if (contract.kind === 'invalid') return { score: null, passed: false, feedback: 'Exercise content unavailable.' };
  if (['writing', 'speaking', 'pronunciation'].includes(contract.kind)) {
    return { score: null, passed: false, feedback: 'Ready for self-review. This response has not been graded.' };
  }
  if (contract.kind === 'multiple_choice' || contract.kind === 'reading' || contract.kind === 'listening') {
    correct = contract.choices.includes(response) && response === contract.correctAnswer;
  } else if (contract.kind === 'sentence_order') {
    correct = Boolean(response.trim()) && normalizeWrittenAnswer(response) === normalizeWrittenAnswer(contract.correctAnswer);
  } else if (contract.kind === 'gap_fill') {
    // Grammar forms retain case and apostrophes; accepted variants are authored explicitly.
    const form = (value: string) => value.normalize('NFKC').replace(/\s+/g, ' ').trim();
    correct = Boolean(response.trim()) && (!contract.choices || contract.choices.includes(response)) &&
      contract.acceptedAnswers.some(answer => form(response) === form(answer));
  } else if (contract.kind === 'dictation') {
    correct = Boolean(response.trim()) && contract.acceptedAnswers.some(answer =>
      normalizeWrittenAnswer(response) === normalizeWrittenAnswer(answer));
  } else if (contract.kind === 'vocabulary_match') {
    let values: unknown;
    try { values = JSON.parse(response); } catch { values = null; }
    correct = Array.isArray(values) && values.length === contract.pairs.length &&
      contract.pairs.every((pair, index) => values[index] === pair.meaning);
  }
  return { score: correct ? 100 : 0, passed: correct, feedback: correct ? 'Great job.' : 'Not quite - try again.' };
}
