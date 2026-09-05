# Training completion verification

Scope: frontend training UX. No curriculum sync, Supabase content/schema/RLS changes, progress resets, or public deployment.

## Implemented behavior

- Reuses Dictation's celebration burst configuration and firework/spark styles.
- Shared TrainingCompletionPanel provides encouragement, score where objective, and the primary Continue action.
- trainingFlow resolves unfinished activities in canonical order, including earlier unfinished activities after direct entry.
- Review and Progress Check retain stable membership when the route changes and show one active item.
- Experience completion reports completed/total activities; full lesson completion offers Next lesson.
- The next skill retains language, level and lesson context. The learning path is the fallback at the last lesson in a level.
- Existing usePracticeProgress persists completion only after passing or explicit production completion. Failed saves show a retry message.
- Vocabulary matching and native gap/order/dictation interactions require correct answers.
- Writing and speaking use explicit completion and never invent objective scores.
- Listening transcripts are hidden until completion, including on the final listening activity.
- Model sentence replaces Target and appears only on writing/speaking pages.
- Recording tracks and playback are stopped on unmount; audio object URLs are released.

## Checks

- npm test: passed, including the new training-success-flow suite and existing curriculum, API, Dictation celebration, training, and exercise-contract suites.
- npm run lint: passed (TypeScript).
- npm run build: passed. The initial restricted-sandbox attempt was unable to read the Vite config; the authorized rerun succeeded.
- Browser interaction checks passed at 390, 768, 1366 and 1920 pixels: wrong answers, failed-save retry, continuation, transcript disclosure, final listening activity, Back/refresh, Review/Progress Check progression, and writing completion without a score.
- No horizontal overflow or page JavaScript errors in those browser checks. Mobile and laptop screenshots were inspected.

Browser checks run the actual training page against isolated auth, curriculum and progress fixtures. They do not verify live account permissions or write to Supabase. Run scripts/training-browser-smoke.cjs with Playwright installed; PLAYWRIGHT_MODULE may point to an external Playwright installation and PLAYWRIGHT_CHANNEL selects the browser (default msedge). Screenshots are written to a temporary directory.

## Files

- src/features/training/PracticeTrainingPage.tsx
- src/features/training/exerciseAdapter.ts
- src/features/training/registry.ts
- src/features/training/trainingFlow.ts
- src/features/training/trainingCompletion.tsx
- scripts/training-success-flow-smoke.ts
- scripts/training-browser-smoke.cjs
- package.json
- This report

## Limits

- Incomplete/invalid authored exercise payloads remain unavailable and cannot be marked successful. Content authoring is a separate task.
- Progress completion is persisted by the existing hook. Written responses and audio recordings remain local to the current activity; this change does not add durable response/audio storage or AI assessment.
- Existing Dictation/Shadowing contracts were regression-checked; live microphone and real-account end-to-end sessions were not tested.
