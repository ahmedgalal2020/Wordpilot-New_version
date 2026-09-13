import assert from 'node:assert/strict';
import { authorizeShadowingVideo } from '../server/shadowingQuota';
import { createPasswordAttemptGuard, isAuthRateLimited, isCredentialFailure } from '../src/lib/authProtection';
import { authFetch } from '../src/lib/authFetch';
import { readOAuthFailure, withAuthDeadline } from '../src/lib/oauthRecovery';
import { parseExerciseContract } from '../src/features/training/exerciseContracts';
import { scoreObjectiveContract } from '../src/features/training/objectiveScoring';
import { EXERCISE_TAXONOMY } from '../src/features/training/exerciseTaxonomy';
import type { CurriculumExercise } from '../src/lib/curriculumCore';

assert.equal(readOAuthFailure('?error=access_denied', ''), 'cancelled');
assert.equal(readOAuthFailure('', '#error=access_denied&error_description=private'), 'cancelled');
assert.equal(readOAuthFailure('?error_description=private', ''), 'error');
assert.equal(readOAuthFailure('?code=test', ''), null);
assert.equal(await withAuthDeadline(Promise.resolve('ok'), 10), 'ok');
await assert.rejects(withAuthDeadline(Promise.reject(new Error('offline')), 10));
await assert.rejects(withAuthDeadline(new Promise(() => {}), 5));

const base = {id:'test',skill:'grammar',title:'Test',instruction:'Choose.',minScoreToPass:60,scoringRubric:{}} as const;
const fixture = (type: CurriculumExercise['type'], content: Record<string, unknown>, correctAnswer?: string): CurriculumExercise =>
  ({...base,type,content,correctAnswer});
let audited = 0;
for (const entry of EXERCISE_TAXONOMY.filter(item => item.scoringMode === 'objective' && item.type !== 'vocabulary_match')) {
  const valid = parseExerciseContract(fixture(entry.type, {
    prompt:'Where is Mia?',question:'Where is Mia?',choices:['At school','At home'],
    sourceText:'Mia is at school.',readingText:'Mia is at school.',audioText:'Mia is at school.',
  }, 'At school'));
  assert.notEqual(valid.kind,'invalid', entry.type);
  assert.equal(scoreObjectiveContract(valid,'At school').passed,true,entry.type);
  assert.equal(scoreObjectiveContract(valid,'At home').passed,false,entry.type);
  assert.equal(scoreObjectiveContract(valid,'My name is Mia.').passed,false,entry.type);
  const bad = parseExerciseContract(fixture(entry.type,{prompt:'Choose.',choices:['A','B']},'C'));
  assert.equal(bad.kind,'invalid',entry.type);
  audited++;
}
const order = parseExerciseContract(fixture('sentence_order',{tokens:['here','She','is'],targetText:'WRONG'},'She is here'));
assert.equal(scoreObjectiveContract(order,'She   is here.').passed,true);
assert.equal(scoreObjectiveContract(order,'here She is').passed,false);
assert.equal(parseExerciseContract(fixture('sentence_order',{tokens:['here','She','is']})).kind,'invalid');
assert.equal(parseExerciseContract(fixture('sentence_order',{tokens:['She','is']},'She is here')).kind,'invalid');
const gap = fixture('grammar_gap',{template:'She ___ here.'},'is');
gap.acceptableAnswers = ['was'];
assert.equal(scoreObjectiveContract(parseExerciseContract(gap),'was').passed,true);
assert.equal(scoreObjectiveContract(parseExerciseContract(gap),'are').passed,false);
assert.equal(parseExerciseContract(fixture('grammar_gap',{template:'She ___ here.',choices:['are','were']},'is')).kind,'invalid');
const dictation = parseExerciseContract(fixture('dictation_sentence',{audioText:'Él está aquí.'},'Él está aquí.'));
assert.equal(scoreObjectiveContract(dictation,'él   está aquí').passed,true);
assert.equal(scoreObjectiveContract(dictation,'el esta aqui').passed,false);
const match = parseExerciseContract(fixture('vocabulary_match',{pairs:[{term:'surname',meaning:'family name'},{term:'city',meaning:'large town'}]}));
assert.equal(scoreObjectiveContract(match,JSON.stringify(['family name','large town'])).passed,true);
assert.equal(scoreObjectiveContract(match,JSON.stringify(['family name','large town','extra'])).passed,false);
assert.equal(scoreObjectiveContract(match,'bad-json').passed,false);
for (const type of ['guided_writing','guided_speaking'] as const) {
 const value = scoreObjectiveContract(parseExerciseContract(fixture(type,{prompt:'Introduce yourself.',goal:'Exchange names.'})),'A long and polished response.');
 assert.equal(value.score,null);
 assert.equal(value.passed,false);
}
const distinction = parseExerciseContract(fixture('grammar_choice',{prompt:'Choose.',choices:["its","it's"]},"it's"));
assert.equal(scoreObjectiveContract(distinction,'its').passed,false);
assert.equal(scoreObjectiveContract(distinction,"it's").passed,true);
console.log('PASS: OAuth error/deadline recovery; '+audited+' objective taxonomy entries; order, gaps, dictation, matches, invalid contracts and ungraded production tasks.');

const guard = createPasswordAttemptGuard();
const time = 100000000;
for (let index = 0; index < 4; index++) guard.failed(time + index);
assert.equal(guard.remaining(time + 4), 0);
guard.failed(time + 4);
assert.equal(guard.remaining(time + 4), 60);
assert.equal(guard.remaining(time + 1004), 59);
assert.equal(guard.remaining(time + 60004), 0);
for (let index = 0; index < 5; index++) guard.failed(time + 61000 + index);
assert.equal(guard.remaining(time + 61004), 300);
for (let index = 0; index < 5; index++) guard.failed(time + 362000 + index);
assert.equal(guard.remaining(time + 362004), 900);
guard.succeeded();
assert.equal(guard.remaining(time + 362004), 0);
guard.rateLimited(time);
assert.equal(guard.remaining(time), 60);
assert.equal(isAuthRateLimited({status:429}), true);
assert.equal(isAuthRateLimited({code:'over_email_send_rate_limit'}), true);
assert.equal(isCredentialFailure({code:'invalid_credentials'}), true);
assert.equal(isCredentialFailure({code:'access_denied'}), false);
assert.equal(isCredentialFailure({code:'captcha_failed'}), false);
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async (_input, options) => new Promise((_resolve, reject) => {
    options?.signal?.addEventListener('abort', () => reject(new Error('cancelled')), {once:true});
  });
  const controller = new AbortController();
  const pending = authFetch('https://example.supabase.co/auth/v1/token', {signal:controller.signal});
  controller.abort();
  await assert.rejects(pending, /cancelled/);
} finally {
  globalThis.fetch = originalFetch;
}
console.log('PASS: 5-in-60 password UX, 60/300/900 cooldown escalation, countdown, success reset, 429 mapping, OAuth isolation and auth fetch cancellation.');

const savedConfig = { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_ANON_KEY };
try {
  process.env.SUPABASE_URL = 'https://quota.example.invalid';
  process.env.SUPABASE_ANON_KEY = 'qa-public-key';
  let calls = 0;
  globalThis.fetch = async (_input, options) => {
    calls++;
    assert.equal((options?.headers as Record<string, string>).Authorization, 'Bearer qa-user-token');
    assert.deepEqual(JSON.parse(String(options?.body)), { p_video_id: 'QA_video001', p_consume: true });
    return new Response(JSON.stringify({ allowed: true }), { status: 200 });
  };
  assert.equal((await authorizeShadowingVideo('qa-user-token', 'invalid')).status, 400);
  assert.equal(calls, 0);
  assert.equal((await authorizeShadowingVideo('qa-user-token', 'QA_video001')).ok, true);
  globalThis.fetch = async () => new Response(JSON.stringify({ allowed: false }), { status: 200 });
  assert.equal((await authorizeShadowingVideo('qa-user-token', 'QA_video001')).status, 403);
  globalThis.fetch = async () => new Response(JSON.stringify({ allowed: true }), { status: 500 });
  assert.equal((await authorizeShadowingVideo('qa-user-token', 'QA_video001')).status, 503);
  globalThis.fetch = async () => new Response(JSON.stringify({}), { status: 200 });
  assert.equal((await authorizeShadowingVideo('qa-user-token', 'QA_video001')).status, 503);
  globalThis.fetch = async () => { throw new Error('offline'); };
  assert.equal((await authorizeShadowingVideo('qa-user-token', 'QA_video001')).status, 503);
} finally {
  globalThis.fetch = originalFetch;
  if (savedConfig.url === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = savedConfig.url;
  if (savedConfig.key === undefined) delete process.env.SUPABASE_ANON_KEY; else process.env.SUPABASE_ANON_KEY = savedConfig.key;
}
console.log('PASS: server quota gate validates IDs, forwards user identity, allows authorized access and fails closed for denial, missing RPC, invalid response or network failure.');
