import { CheckCircle, RotateCcw, Save } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { formatUsage } from '../../../lib/entitlements';
import { MirroredText } from '../components';
import type { DictationWorkspaceController } from '../useDictationWorkspace';
import { DictationPlayerControls } from './DictationPlayerControls';

export function DictationPracticePanel({ workspace }: { workspace: DictationWorkspaceController }) {
  const {
    skillMode,
    isPlaying,
    isAwaitingManualAdvance,
    inputText,
    activeInputRange,
    overlayRef,
    textareaRef,
    setInputText,
    handleInputKeyDown,
    handleTextareaScroll,
    selectedLanguage,
    comparisonItems,
    focusComparison,
    currentWordIndex,
    sourceWordRanges,
    mistakeRows,
    reviewMistake,
    handleResetInput,
    finishAndGrade,
    saveSession,
    saving,
    savedSessionLimitReached,
    saveState,
    entitlements,
    saveStatus,
  } = workspace;
  const hasTypedAttempt = inputText.trim().length > 0;

  return (
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-surface-container-lowest rounded-3xl min-h-[500px] p-10 flex flex-col gap-8 whisper-shadow border border-outline-variant/10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">2. {skillMode.inputLabel}</h3>
              <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                <span className={cn('w-2 h-2 rounded-full', isPlaying ? 'bg-primary animate-pulse' : 'bg-outline-variant')}></span>
                {isAwaitingManualAdvance ? 'WAITING' : isPlaying ? 'PLAYING' : 'READY'}
              </div>
            </div>

            <DictationPlayerControls workspace={workspace} />

            <div className="relative min-h-[320px] rounded-3xl bg-surface-container-low border border-surface-container overflow-hidden">
              <div
                ref={overlayRef}
                className="pointer-events-none absolute inset-0 overflow-auto px-6 py-5 text-xl md:text-2xl font-medium leading-[1.8] whitespace-pre-wrap break-words text-on-surface"
                aria-hidden="true"
              >
                {inputText.length === 0 ? (
                  <span className="text-on-surface-variant/35">{skillMode.placeholder}</span>
                ) : (
                  <MirroredText text={inputText} activeRange={activeInputRange} />
                )}
              </div>
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                onKeyDown={handleInputKeyDown}
                onScroll={handleTextareaScroll}
                className="relative z-10 w-full min-h-[320px] overflow-auto bg-transparent border-none px-6 py-5 text-xl md:text-2xl font-medium leading-[1.8] text-transparent caret-on-surface placeholder:text-transparent resize-y outline-none focus:outline-none focus:ring-2 focus:ring-primary/15"
                placeholder={skillMode.placeholder}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize={selectedLanguage === 'en-US' ? 'off' : 'sentences'}
                wrap="soft"
              />
            </div>

            <div className="bg-surface-container-low rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Real-time Comparison</h3>
                {currentWordIndex !== -1 && (
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    Reading word {currentWordIndex + 1} of {sourceWordRanges.length}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-1.5 gap-y-3 text-lg md:text-xl font-medium leading-relaxed">
                {hasTypedAttempt && comparisonItems.length > 0 ? (
                  comparisonItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => item.status !== 'correct' && focusComparison(item.inputIndex, item.sourceIndex)}
                      className={cn(
                        'transition-all px-1 rounded text-left',
                        item.status === 'correct' && 'text-on-surface',
                        item.status === 'wrong' && 'bg-error-container/20 text-error border-b-2 border-error cursor-pointer',
                        item.status === 'extra' && 'bg-error-container/20 text-error border-b-2 border-error cursor-pointer',
                        item.status === 'missing' && 'bg-error-container/25 text-error border border-error/25 border-dashed cursor-pointer opacity-80',
                      )}
                      title={
                        item.status === 'correct'
                          ? 'Correct'
                          : item.targetWord
                            ? `Expected: ${item.targetWord}`
                            : item.status === 'missing'
                              ? 'Missing word'
                              : 'Extra word'
                      }
                    >
                      {item.status === 'missing' ? '[' + item.inputWord + ']' : item.inputWord}
                    </button>
                  ))
                ) : (
                  <span className="text-on-surface-variant/40 italic text-base">Analysis will appear as you type...</span>
                )}
              </div>
            </div>

            <div className="bg-surface-container-low rounded-2xl p-6">
              <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                <div>
                  <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Mistake Focus Table</h3>
                  <p className="text-sm text-on-surface-variant mt-2">A clean list of the words you need to focus on, with the correct version beside each one.</p>
                </div>
                <div className="rounded-full bg-error-container/30 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-error">
                  {mistakeRows.length} {mistakeRows.length === 1 ? 'issue' : 'issues'}
                </div>
              </div>

              {hasTypedAttempt && mistakeRows.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest">
                  <div className="hidden md:grid grid-cols-[56px_minmax(0,1.2fr)_minmax(0,1.2fr)_120px_96px] gap-4 border-b border-outline-variant/10 px-4 lg:px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    <span>#</span>
                    <span>Your Word</span>
                    <span>Correct Word</span>
                    <span>Status</span>
                    <span className="text-right">Action</span>
                  </div>

                  <div className="hidden md:block divide-y divide-outline-variant/10">
                    {mistakeRows.map((row) => (
                      <div
                        key={row.id}
                        className="grid w-full grid-cols-[56px_minmax(0,1.2fr)_minmax(0,1.2fr)_120px_96px] items-center gap-4 px-4 lg:px-5 py-4 text-left transition hover:bg-primary/5"
                      >
                        <span className="text-sm font-bold text-on-surface">{row.order}</span>
                        <div className="min-w-0">
                          <span className="inline-flex max-w-full rounded-xl bg-error-container/25 px-3 py-1.5 text-sm font-semibold text-error">
                            <span className="truncate">{row.writtenWord}</span>
                          </span>
                        </div>
                        <div className="min-w-0">
                          <span className="inline-flex max-w-full rounded-xl bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                            <span className="truncate">{row.correctWord}</span>
                          </span>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant self-center">{row.statusLabel}</span>
                        <div className="text-right self-center">
                          <button
                            type="button"
                            onClick={() => reviewMistake(row)}
                            className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary hover:text-on-primary"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="md:hidden divide-y divide-outline-variant/10">
                    {mistakeRows.map((row) => (
                      <div key={row.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Issue #{row.order}</p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">{row.statusLabel}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => reviewMistake(row)}
                            className="shrink-0 inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-xs font-bold text-primary transition hover:bg-primary hover:text-on-primary"
                          >
                            Review
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Your Word</p>
                            <div className="rounded-xl bg-error-container/25 px-3 py-2 text-sm font-semibold text-error break-words">
                              {row.writtenWord}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Correct Word</p>
                            <div className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary break-words">
                              {row.correctWord}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest px-5 py-6 text-sm text-on-surface-variant">
                  No mistakes yet. Start typing and WordPilot will list wrong, missing, and extra words without exposing the hidden source too early.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={handleResetInput} className="px-8 py-4 rounded-2xl font-bold text-on-surface-variant hover:bg-surface-container transition-all flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
            <button
              onClick={finishAndGrade}
              className="bg-primary text-on-primary px-12 py-4 rounded-2xl font-bold font-headline text-lg transition-all hover:bg-primary-dim hover:shadow-lg active:scale-95 flex items-center gap-3 whisper-shadow"
            >
              {skillMode.finishLabel}
              <CheckCircle className="w-6 h-6" />
            </button>
            <button
              onClick={() => void saveSession()}
              disabled={saving || savedSessionLimitReached}
              className={cn(
                'px-8 py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-70',
                saveState === 'saved' && !saving && 'bg-primary/10 text-primary border border-primary/20',
                saveState === 'error' && !saving && 'bg-error/10 text-error border border-error/20',
                (saveState === 'idle' || saveState === 'saving') && 'bg-surface-container-low text-on-surface hover:bg-surface-container',
              )}
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : saveState === 'saved' ? 'Saved' : saveState === 'error' ? 'Save Failed' : 'Save Session'}
            </button>
          </div>
          <p className="text-center text-xs font-semibold text-on-surface-variant">
            Saved sessions: {formatUsage(entitlements.usage.savedSessions, entitlements.limits.savedSessions)}
            {!entitlements.isPro && ' - WordPilot Pro unlocks unlimited practice history.'}
          </p>
          {saveStatus && <p className="text-center text-sm text-on-surface-variant">{saveStatus}</p>}
        </div>
  );
}
