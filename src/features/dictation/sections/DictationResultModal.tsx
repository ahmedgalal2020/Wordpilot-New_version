import { X } from 'lucide-react';
import { ResultMetric } from '../components';
import type { DictationWorkspaceController } from '../useDictationWorkspace';

export function DictationResultModal({ workspace }: { workspace: DictationWorkspaceController }) {
  const {
    showResultModal,
    setShowResultModal,
    resultLevel,
    sessionLanguageLabel,
    sessionLevel,
    practiceCategory,
    accuracy,
    sourceWordRanges,
    mistakeRows,
    resultBreakdown,
    reviewMistake,
    handleResetInput,
    saveSession,
    saving,
    savedSessionLimitReached,
  } = workspace;

  if (!showResultModal) return null;
  const shouldCelebrate = accuracy >= 60;

  return (
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/10 shadow-2xl rounded-3xl p-6 sm:p-8 max-w-2xl w-full relative overflow-hidden animate-in zoom-in-95 duration-200">
            {shouldCelebrate && (
              <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
                <span className="dictation-firework dictation-firework-left" />
                <span className="dictation-firework dictation-firework-right" />
                <span className="dictation-spark dictation-spark-1" />
                <span className="dictation-spark dictation-spark-2" />
                <span className="dictation-spark dictation-spark-3" />
                <span className="dictation-spark dictation-spark-4" />
                <span className="dictation-spark dictation-spark-5" />
                <span className="dictation-spark dictation-spark-6" />
              </div>
            )}
            <button
              onClick={() => setShowResultModal(false)}
              className="absolute top-4 right-4 z-10 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full p-1 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative z-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary mb-2">Session Report</p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold font-headline text-on-surface">{resultLevel} finish</h3>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    {sessionLanguageLabel} {sessionLevel} - {practiceCategory}
                  </p>
                </div>
                <div className="w-24 h-24 bg-primary/10 text-primary rounded-3xl flex flex-col items-center justify-center font-headline shadow-[inset_0_0_20px_rgba(29,78,216,0.12)]">
                  <span className="text-3xl font-black">{accuracy}%</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">accuracy</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <ResultMetric label="Words" value={String(sourceWordRanges.length)} />
                <ResultMetric label="Issues" value={String(mistakeRows.length)} />
                <ResultMetric label="Missing" value={String(resultBreakdown.missing)} />
                <ResultMetric label="Extra" value={String(resultBreakdown.extra)} />
              </div>

              <div className="rounded-2xl bg-surface-container-low p-5">
                <p className="font-headline font-bold text-on-surface">Next step</p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  {mistakeRows.length === 0
                    ? 'Clean run. Move to the next card in your path or try a harder text.'
                    : resultBreakdown.missing > 0
                    ? 'Replay the sentence endings first. Missing words usually come from weak phrase boundaries.'
                    : resultBreakdown.extra > 0
                    ? 'Slow down and type only confirmed words. Extra words usually appear when guessing ahead.'
                    : 'Review the highlighted wrong words, then retry the same text once.'}
                </p>
              </div>

              {mistakeRows.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">First issues</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {mistakeRows.slice(0, 4).map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => {
                          setShowResultModal(false);
                          reviewMistake(row);
                        }}
                        className="text-left rounded-2xl border border-outline-variant/10 bg-surface-container-low px-4 py-3 hover:border-primary/30 transition"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{row.statusLabel}</p>
                        <p className="mt-1 text-sm font-semibold text-on-surface">{row.writtenWord} {'->'} {row.correctWord}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setShowResultModal(false);
                    handleResetInput();
                  }}
                  className="rounded-2xl bg-surface-container px-5 py-3 font-bold text-on-surface hover:bg-surface-container-high transition"
                >
                  Retry
                </button>
                <button
                  onClick={() => void saveSession()}
                  disabled={saving || savedSessionLimitReached}
                  className="rounded-2xl bg-surface-container px-5 py-3 font-bold text-on-surface hover:bg-surface-container-high transition disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setShowResultModal(false)}
                  className="rounded-2xl bg-primary text-on-primary px-5 py-3 font-bold font-headline transition hover:bg-primary-dim"
                >
                  Continue
                </button>
              </div>
            </div>
            <div className="hidden">
              <div className="mx-auto w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center text-3xl font-bold font-headline shadow-[inset_0_0_20px_rgba(29,78,216,0.15)]">
                {accuracy}%
              </div>
              <div>
                <h3 className="text-2xl font-extrabold font-headline text-on-surface">
                  {accuracy >= 90 ? 'Outstanding! 🎉' : accuracy >= 80 ? 'Great Job! 🚀' : accuracy >= 60 ? 'Good Effort! 👍' : 'Keep Going! 💪'}
                </h3>
                <p className="text-on-surface-variant mt-2 text-sm font-medium leading-relaxed">
                  {accuracy >= 90
                    ? 'Near perfection! Your listening and typing skills are excellent.'
                    : accuracy >= 80
                    ? 'Very strong performance! Just a few minor things to polish.'
                    : accuracy >= 60
                    ? 'You are making progress! Review your mistakes and try again.'
                    : 'Rome wasn\'t built in a day. Don\'t give up, practice makes perfect!'}
                </p>
              </div>
              <button
                onClick={() => setShowResultModal(false)}
                className="w-full mt-6 bg-primary text-on-primary py-3 rounded-2xl font-bold font-headline transition hover:bg-primary-dim hover:shadow-lg focus:ring-4 focus:ring-primary/20"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
  );
}
