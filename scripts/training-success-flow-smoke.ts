import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getTrainingFlowState } from '../src/features/training/trainingFlow';
import { TrainingCompletionPanel } from '../src/features/training/trainingCompletion';
import { scoreTrainingResponse, type TrainingExerciseModel } from '../src/features/training/exerciseAdapter';
import { getExercisesForExperience, getTrainingRoute } from '../src/features/training/registry';
import type { CurriculumExercise, CurriculumLesson } from '../src/lib/curriculumCore';

const objective = { contract: { kind: 'gap_fill', template: 'She ___ here.', acceptedAnswers: ['is'] }, questions: [] } as unknown as TrainingExerciseModel;
assert.equal(scoreTrainingResponse(objective, 'is').passed, true);
assert.equal(scoreTrainingResponse(objective, 'are').passed, false);
const vocabulary = { ...objective, contract: { kind: 'vocabulary_match', pairs: [{ term: 'city', meaning: 'town' }, { term: 'surname', meaning: 'family name' }] } } as TrainingExerciseModel;
assert.equal(scoreTrainingResponse(vocabulary, '["town","family name"]').score, 100);
assert.equal(scoreTrainingResponse(vocabulary, '["town","wrong"]').passed, false);
assert.equal(scoreTrainingResponse(vocabulary, 'bad JSON').passed, false);
const flow = (id: string, completedIds: string[]) => getTrainingFlowState({ currentExerciseId: id, completedIds, experienceExerciseIds: ['a','b','c'], lessonExerciseIds: ['a','b','c','d'] });
assert.equal(flow('a', []).nextExerciseId, 'b');
assert.equal(flow('c', []).nextExerciseId, 'a', 'Direct entry at last item wraps to unfinished earlier items');
assert.equal(flow('c', ['a','b']).experienceComplete, true);
assert.equal(flow('c', ['a','b']).lessonComplete, false);
assert.equal(flow('c', ['a','b','d']).lessonComplete, true);
assert.equal(flow('c', ['a','b','d']).nextExerciseId, null);
assert.equal(getTrainingRoute({ experience: 'review', language: 'German', levelNumber: 2, lessonId: 'lesson 1', exerciseId: flow('a', []).nextExerciseId! }), '/practice/review/German/2/lesson%201/b');
const exercises = Array.from({length: 9}, (_, i) => ({ id: String(i), skill: 'grammar', type: 'grammar_choice' } as CurriculumExercise));
const lesson = { exercises } as CurriculumLesson;
for (const experience of ['review','progress-check'] as const) {
  const initial = getExercisesForExperience(lesson, experience);
  const direct = getExercisesForExperience(lesson, experience, '8');
  assert.deepEqual(new Set(initial.map(item => item.id)), new Set(direct.map(item => item.id)), 'Route selection must not change membership');
  assert.equal(direct[0].id, '8');
}
for (const experience of ['writing','speaking'] as const) {
  const html = renderToStaticMarkup(React.createElement(TrainingCompletionPanel, { experience, objective: false, result: { score: null, passed: true, message: '' }, onContinue() {} }));
  assert.ok(!html.includes('%'), 'Subjective completion must not invent a score');
  assert.ok(html.includes('Continue'));
  assert.ok(!html.includes('saved for review'), 'Do not claim local responses were uploaded');
}
const success = renderToStaticMarkup(React.createElement(TrainingCompletionPanel, { experience: 'listening', objective: true, result: { score: 100, passed: true, message: '' }, onContinue() {} }));
assert.ok(success.includes('Excellent listening') && success.includes('Continue') && success.includes('dictation-firework'));
const wrong = renderToStaticMarkup(React.createElement(TrainingCompletionPanel, { experience: 'reading', objective: true, result: { score: 0, passed: false, message: '' }, onContinue() {} }));
assert.ok(!wrong.includes('Continue') && !wrong.includes('dictation-firework'));
const page = readFileSync('src/features/training/PracticeTrainingPage.tsx', 'utf8');
assert.ok(page.includes('!result.passed') && page.indexOf('if (saved.error)') < page.indexOf('setCompletionContext({ result'));
assert.ok(page.includes('{completed && (') && page.includes("'Hide transcript' : 'View transcript'"));
assert.ok(!page.includes('label="Target"') && page.includes('label="Model sentence"'));
assert.ok(page.includes("experience === 'speaking' || experience === 'writing'"));
assert.ok(page.includes('{position} of {models.length}') && page.includes('disabled={!isObjective || !selected}'));
assert.ok(success.includes('cursor-pointer') && success.includes('focus-visible'));
console.log('Training success flow passed: scoring, incomplete attempts, route membership, continuation, experience/lesson completion, subjective rendering, transcript gating, and button affordances.');
