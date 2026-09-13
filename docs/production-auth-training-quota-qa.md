# Auth, exercise feedback and Shadowing quota QA

## Release status

Repository: ahmedgalal2020/Wordpilot-New_version, branch main.
Scope: the two requested production-fix/auth-abuse tasks only.

**Code validated; hosted activation is NOT complete.** Do not release this
revision before the quota migration is approved and applied. Missing RPCs fail
closed, so the new Shadowing build/play/record/evaluation gates cannot operate
against the current hosted database yet.

No public deployment command was run. The repository workflow performs CI only;
external hosting auto-deploy hooks were not inspected.

## Authentication audit and changes

The app already used Supabase Auth password login, Google redirect OAuth,
persistent sessions, profile initialization and idle/session-health protection.
These remain in place. No custom password endpoint, token store, IP log or
login-attempt database table was added.

The Google handler previously cleared its loading flag only on an error return.
It lacked bounded waits, robust exception/finally handling and a callback
recovery boundary. Cancellation, browser Back and callback errors could leave a
stale loading state or race protected-route navigation.

Changes:
- Explicit idle/pending/recovered states, synchronous duplicate-submit guards.
- OAuth uses the existing Google provider, with skipBrowserRedirect and a
  bounded request; only the current request may navigate to its returned URL.
- Callback query/hash errors are consumed and replaced with a clean login URL
  and friendly EN/DE messages; provider descriptions are never displayed.
- The OAuthReturn wrapper runs before protected routes. A callback with no
  session or an unavailable provider returns to a usable login page.
- BFCache pageshow/Back and unmount invalidate pending Google attempts.
- Supabase auth network calls abort after 12 seconds; page-level operations
  have bounded waits and finally cleanup. Existing session ownership stays in
  Supabase.
- Password errors are generic. Signup, reset and resend messages avoid exposing
  whether an email is registered. Rate-limit responses use friendly copy.
- Forms have immediate request guards, disabled pending controls, associated
  input labels, accessible status/countdown messages and automatic unlock.
- Password failures: 5 within 60 seconds trigger 60 seconds of cooldown;
  repeated thresholds escalate to 300 then 900 seconds. Success resets the
  guard. Only credential errors count; Google, CAPTCHA and network failures do
  not. HTTP 429 imposes a temporary pause without automatic login retries.
- Signup/reset/resend have duplicate-submit protection and local cooldowns.
- No passwords, tokens or email identities are persisted by the new guard.
  Its bounded in-memory state is UX-only and resets on reload.

## Server-side boundary and CAPTCHA

Supabase remains the actual authentication/rate-limit authority. Bypassing the
local countdown does not change the Supabase endpoint. The local guard is NOT a
brute-force security boundary, and no hosted rate-limit load test was performed.

Official Turnstile integration passes captchaToken to Supabase sign-in, signup,
reset and resend methods. Tokens live only in component memory and reset after
an attempt. Expiry clears the token. Script failure is retryable; required but
missing/failed CAPTCHA blocks submission. CSP allows the official Turnstile
script/frame origin without adding wildcard access.

**Actual hosted Auth settings were not accessible.** The CLI config inspection
returned an authentication-required error: no management token/CLI login was
available. No hosted CAPTCHA-enabled claim or exact active rate limits can be
made. No public site key is configured in the local environment inspected.

The LOCAL config contains email_sent=2, sms_sent=30, anonymous_users=30,
token_refresh=150, sign_in_sign_ups=30, token_verifications=30 and web3=30.
Its CAPTCHA section is commented out. These are local configuration values,
NOT evidence of the hosted project's active settings.

### Required dashboard steps

1. Create a managed Cloudflare Turnstile widget with the intended production
   hostname and a separate approved local/staging hostname as appropriate.
2. Configure the PUBLIC site key as VITE_TURNSTILE_SITE_KEY and set
   VITE_AUTH_CAPTCHA_REQUIRED=true for the corresponding frontend build.
3. In Supabase Authentication / Bot and Abuse Protection, enable CAPTCHA,
   choose Turnstile and store its SECRET there only. Never use a VITE variable
   for that secret. Coordinate activation with the configured frontend so
   existing users are not locked out.
4. Inspect Authentication rate limits and email/SMTP settings in the actual
   project. Record the active values; verify real login/signup/reset 429
   behavior in an approved staging test, not a production brute-force test.
5. Verify the redirect allowlist accepts the existing dashboard callback with
   oauth=callback. Exercise a real Google login/cancel and password reset email.
6. Test a live valid/expired CAPTCHA token server-side. Browser tests below use
   a simulated widget and do not prove the hosted CAPTCHA is enabled.

References:
- [Supabase Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha)
- [Supabase rate limits](https://supabase.com/docs/guides/auth/rate-limits)
- [Turnstile rendering](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/)

## Objective scoring and feedback

The training adapter and legacy ExerciseRenderer now share the same contract
scorer. Bugs removed include arbitrary-answer normalization for choices,
invalid choice answers, a token-order fallback that manufactured an answer,
partial ordering passes, premature expected-answer disclosure, a vocabulary
fallback for gap answers and fabricated writing/speaking grades.

Choice correctness is exact membership plus exact equality, so "its" cannot
silently match "it's". Gaps use explicitly authored accepted forms and preserve
case/apostrophes, normalizing Unicode and spacing. Dictation and ordering ignore
case/punctuation but preserve accents and word boundaries. Ordering must match
the complete ordered response. Vocabulary matching checks every pair and the
exact pair count. Invalid contracts return unavailable, never a guessed answer.
These objective items use 100/0; no incorrect item receives a passing score.

Automated taxonomy coverage iterates all 21 choice-like objective entries:
vocabulary_choice, picture_or_context_match, grammar_choice, listen_and_select,
listen_for_detail, reading_main_idea, reading_detail, vocabulary_in_context,
collocation_choice, paraphrase_choice, listening_inference, speaker_intention,
reading_inference, reference_tracking, contextual_grammar, stance_detection,
hidden_assumption, rhetorical_effect and other matching entries in the current
EXERCISE_TAXONOMY. Separate cases cover vocabulary_match, sentence_order,
grammar_gap/accepted gap answers, dictation_sentence and invalid contracts.
The executable taxonomy loop, rather than this descriptive list, is canonical.

Selected wrong choices receive red treatment plus an error icon/text; selected
correct choices receive green treatment plus success text. Changing an answer
clears stale feedback. Correct answers use the existing encouragement and
Continue behavior. Wrong attempts never pass; the legacy page can still record
an unsuccessful attempt, which is different from completion. Duplicate correct
submit/Continue calls are guarded. Subjective tasks return no invented numeric
grade; the legacy renderer does not claim those responses were saved or graded.

## Shadowing quota

Prepared migration:
supabase/migrations/20260912231422_shadowing_account_video_quota.sql

No second subscription model or quota table was created. The design reuses
usage_events and the existing is_wordpilot_pro entitlement function:
- Free account: three DISTINCT video IDs for the lifetime of the account.
- A successfully built nonempty lesson is an intentional video unlock.
  Starting/resuming, recording and server AI evaluation also enforce access.
- Rendering a thumbnail or fetching a transcript does not consume a slot.
- Replaying an unlocked ID does not consume again; deleting a session does not
  restore the lifetime allowance.
- Paid users follow the existing entitlement model, without a free cap.
- The fourth new ID returns a real /pricing Upgrade link; unlocked IDs remain
  available.
- The user-authenticated RPC determines usage; React/localStorage do not.
- A per-user transaction advisory lock serializes different-video attempts.
  A unique user/video index prevents duplicate usage rows.
- A private, empty-search-path definer function checks auth.uid and blocked
  profiles; an auth-only public invoker wrapper exposes the narrow operation.
- A session-write trigger closes direct client session insert/update bypasses.
  Existing trusted server maintenance remains privileged.
- The AI evaluation endpoint checks the same RPC before spending AI credits.

### Hosted database evidence

The production application attempt was rejected by the approval gate.
It was NOT retried through another SQL/CLI path. Explicit authorization for the
historical-video backfill and global session trigger is still required.

Final read-only verification:
- quota_rpc_installed: false
- migration_recorded: false
- usage_events RLS: true
- shadowing_sessions RLS: true
- shadowing_attempts RLS: true
- usage_events client grants: authenticated SELECT only; no anon access/write
- QA fixture users remaining: 0

Before that approval rejection, SQL integration tests used BEGIN/ROLLBACK with
the migration and synthetic users: first/second/third allowed, fourth blocked,
replay stable, client usage deletion rejected, cross-user isolation and paid
bypass passed. All fixtures and DDL were rolled back. A reusable SQL fixture
test is included for an approved isolated database with the migration installed.

A real simultaneous multi-connection database stress test has NOT run.
Atomicity was reviewed through the advisory lock and unique-index design, not
misrepresented as a completed concurrent load test. After approval, apply via
migration history, rerun isolation/concurrency tests and Supabase advisors, and
verify the backfill before making the code available to users.

The existing paid entitlement function can consider historical paid invoices
sufficient for access. Its subscription policy was deliberately not redefined
in this task; expiry policy needs separate billing-owner confirmation.

## Validation evidence

- npm test: PASS, including API routes, curriculum structure/quality/
  naturalness/diversity/coherence/repository, dictation, celebration, audio,
  encouragement, architecture, contracts, success flow and production fixes.
- npm run lint: PASS (the script runs TypeScript tsc --noEmit).
- npm run build: PASS, 2,123 modules; final build completed in 17.57 seconds.
- npm run test:production-fixes: PASS, behavioral OAuth deadline/error,
  objective scoring, cooldown escalation, rate-limit mapping, abort and
  server quota fail-closed/identity-forwarding tests.
- scripts/training-browser-smoke.cjs: PASS, listening/retry/save/Continue,
  native/mixed exercises and subjective behavior.
- scripts/production-fixes-browser.cjs: PASS at 390/768/1366/1920 widths;
  login retry, double-submit, cooldown expiry, 429, OAuth cancel/callback/
  Back/refresh, signup/reset, reading/review/check feedback, legacy duplicate
  completion and quota 0/1/2/3/fourth/replay/refresh/account switching.
- QA_CAPTCHA=true with production-fixes-browser.cjs: PASS for script failure,
  retry, token-required direct submit, success, expiry and widget reset.
- Browser screenshots were captured for login sizes and wrong/correct
  training/quota states. No page errors or horizontal overflow detected.
- Browser provider/auth/progress boundaries are mocked. Quota UI uses a
  persistent test HTTP service; it is NOT the production database. Database
  isolation was tested separately as described above.
- Real Google credentials, hosted email delivery, live CAPTCHA challenges and
  full live YouTube/media use remain deployment/staging acceptance checks.

No curriculum sync ran. No persistent user, profile, progress, curriculum,
subscription or invoice data was changed. RLS was not weakened. No credentials
were rotated. No secret values, actual .env files, screenshots or build output
are intended for the commit.

## Changed files

Auth:
- src/lib/oauthRecovery.ts
- src/components/OAuthReturn.tsx
- src/lib/authProtection.ts
- src/lib/authFetch.ts
- src/lib/supabase.ts
- src/hooks/useLoginCooldown.ts
- src/hooks/useDeadlineCountdown.ts
- src/components/AuthCaptcha.tsx
- src/contexts/AuthContext.tsx
- src/pages/AuthPage.tsx
- src/pages/ForgotPasswordPage.tsx
- src/App.tsx
- server/middleware/security.ts
- .env.example

Exercises:
- src/features/training/objectiveScoring.ts
- src/features/training/exerciseContracts.ts
- src/features/training/exerciseAdapter.ts
- src/features/training/PracticeTrainingPage.tsx
- src/components/ExerciseRenderer.tsx
- src/pages/CurriculumPage.tsx

Quota:
- server.ts
- server/shadowingQuota.ts
- src/features/shadowing/hooks/useShadowingQuota.ts
- src/features/shadowing/sections/ShadowingQuotaNotice.tsx
- src/features/shadowing/ShadowingPracticeView.tsx
- src/features/shadowing/useShadowingPractice.ts
- supabase/migrations/20260912231422_shadowing_account_video_quota.sql

Verification:
- package.json
- scripts/production-fixes-smoke.ts
- scripts/production-fixes-browser.cjs
- scripts/training-browser-smoke.cjs
- scripts/shadowing-quota-db-test.sql
- docs/production-auth-training-quota-qa.md

Intentionally excluded and untouched: src/lib/learning.ts, nav-laptop.png,
public/wordpilot-canva-source.png.

The final chat delivery records the commit SHA and push outcome; this report
travels inside that commit and does not embed a self-referential SHA.
