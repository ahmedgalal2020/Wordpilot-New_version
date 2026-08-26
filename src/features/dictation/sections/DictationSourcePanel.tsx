import { Eye, EyeOff, Languages, RotateCcw } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { CEFR_LEVELS, LEARNING_LANGUAGES, normalizeCefrLevel } from '../../../lib/learning';
import { SKILL_MODES } from '../constants';
import { MirroredText, RangeField, SkillModeIcon } from '../components';
import { getPracticeLanguageCode } from '../text';
import type { DictationWorkspaceController } from '../useDictationWorkspace';

export function DictationSourcePanel({ workspace }: { workspace: DictationWorkspaceController }) {
  const {
    skillMode,
    sourceHidden,
    setSourceHidden,
    setSourceText,
    sourceText,
    activeSourceRange,
    sourceOverlayRef,
    sourceTextareaRef,
    manualLanguageOverrideRef,
    handleSourceTextareaScroll,
    practiceCategory,
    availableVoices,
    handleExerciseLanguageChange,
    sessionLanguageLabel,
    sessionLevel,
    selectedVoiceURI,
    manualVoiceOverrideRef,
    setSelectedVoiceURI,
    speechRate,
    setSpeechRate,
    advanceOnSpace,
    wordPause,
    setWordPause,
    sentencePause,
    setSentencePause,
    setSessionLevel,
    setSaveStatus,
    handleSkillModeChange,
  } = workspace;

  return (
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-low rounded-3xl p-8 whisper-shadow border border-outline-variant/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">1. {skillMode.sourceLabel}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSourceHidden((current) => !current)}
                  className="text-on-surface-variant hover:text-primary transition-colors"
                  title={sourceHidden ? 'Show source' : 'Hide source'}
                >
                  {sourceHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => setSourceText('')} className="text-on-surface-variant hover:text-error transition-colors" title="Clear Script">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative h-[200px] rounded-2xl bg-surface-container-lowest overflow-hidden">
              {sourceHidden ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center">
                  <EyeOff className="h-7 w-7 text-primary" />
                  <p className="mt-3 font-headline font-bold text-on-surface">Source is hidden</p>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    {practiceCategory === 'Reading' ? 'Try rebuilding it from memory.' : practiceCategory === 'Writing' ? 'Write your own version without copying.' : 'Listen first, then type what you hear.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSourceHidden(false)}
                    className="mt-4 rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary"
                  >
                    Show source
                  </button>
                </div>
              ) : (
                <>
                  <div
                    ref={sourceOverlayRef}
                    className="pointer-events-none absolute inset-0 overflow-auto p-4 text-base font-medium leading-[1.8] whitespace-pre-wrap break-words text-on-surface"
                    aria-hidden="true"
                  >
                    {sourceText.length === 0 ? (
                      <span className="text-on-surface-variant/40">Paste the text you want to practice here...</span>
                    ) : (
                      <MirroredText text={sourceText} activeRange={activeSourceRange} />
                    )}
                  </div>
                  <textarea
                    ref={sourceTextareaRef}
                    className="relative z-10 w-full h-[200px] overflow-auto bg-transparent border-none rounded-2xl p-4 text-base font-medium leading-[1.8] text-transparent caret-on-surface placeholder:text-transparent resize-none outline-none focus:outline-none focus:ring-2 focus:ring-primary/15"
                    placeholder="Paste the text you want to practice here..."
                    value={sourceText}
                    onChange={(event) => {
                      manualLanguageOverrideRef.current = false;
                      setSourceText(event.target.value);
                    }}
                    onScroll={handleSourceTextareaScroll}
                    wrap="soft"
                  />
                </>
              )}
            </div>

            <div className="mt-8 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Languages className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-widest">Voice & Language</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LEARNING_LANGUAGES.map((item) => {
                  const active = item.language === sessionLanguageLabel;
                  return (
                    <button
                      key={item.language}
                      type="button"
                      onClick={() => handleExerciseLanguageChange(item.language)}
                      className={cn(
                        'rounded-2xl px-4 py-3 text-left transition border',
                        active
                          ? 'bg-primary text-on-primary border-primary'
                          : 'bg-surface-container-highest text-on-surface border-transparent hover:border-outline-variant',
                      )}
                    >
                      <span className="block font-bold text-sm">{item.language}</span>
                      <span className={cn('mt-1 block text-[10px] font-semibold', active ? 'text-on-primary/75' : 'text-on-surface-variant')}>
                        {getPracticeLanguageCode(item.language)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">CEFR Level</label>
                  <select
                    value={sessionLevel}
                    onChange={(event) => {
                      const nextLevel = normalizeCefrLevel(event.target.value);
                      setSessionLevel(nextLevel);
                      setSaveStatus(`${sessionLanguageLabel} ${nextLevel} selected for this exercise.`);
                    }}
                    className="w-full bg-surface-container-lowest border border-surface-container rounded-2xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
                  >
                    {CEFR_LEVELS.map((item) => (
                      <option key={item.level} value={item.level}>
                        {item.level} - {item.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Training Mode</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SKILL_MODES.map((mode) => {
                    const active = mode.id === practiceCategory;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => handleSkillModeChange(mode.id)}
                        className={cn(
                          'rounded-2xl border p-4 text-left transition',
                          active
                            ? 'border-primary bg-primary text-on-primary'
                            : 'border-transparent bg-surface-container-highest text-on-surface hover:border-outline-variant',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <SkillModeIcon skill={mode.id} active={active} />
                          <span className="font-headline font-bold text-sm">{mode.shortTitle}</span>
                        </div>
                        <p className={cn('mt-2 text-xs leading-5', active ? 'text-on-primary/80' : 'text-on-surface-variant')}>
                          {mode.title}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Voice</label>
                <select
                  value={selectedVoiceURI}
                  onChange={(event) => {
                    manualVoiceOverrideRef.current = true;
                    setSelectedVoiceURI(event.target.value);
                  }}
                  className="w-full bg-surface-container-lowest border border-surface-container rounded-2xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
                >
                  {availableVoices.length === 0 ? (
                    <option value="">No {sessionLanguageLabel} voice found</option>
                  ) : (
                    availableVoices.map((voice) => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name} {voice.localService ? '- Local' : '- Remote'}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-4">
                <RangeField
                  label="Speech Rate"
                  valueLabel={`${speechRate.toFixed(2)}x`}
                  min={0.6}
                  max={1.2}
                  step={0.05}
                  value={speechRate}
                  onChange={(value) => setSpeechRate(value)}
                />

                <RangeField
                  label="Pause Between Words"
                  valueLabel={advanceOnSpace ? 'Off' : `${wordPause.toFixed(2)}s`}
                  min={0}
                  max={2}
                  step={0.05}
                  value={wordPause}
                  onChange={(value) => setWordPause(value)}
                  disabled={advanceOnSpace}
                />

                <RangeField
                  label="Extra Pause At Sentence End"
                  valueLabel={advanceOnSpace ? 'Off' : `${sentencePause.toFixed(2)}s`}
                  min={0}
                  max={1.5}
                  step={0.05}
                  value={sentencePause}
                  onChange={(value) => setSentencePause(value)}
                  disabled={advanceOnSpace}
                />
              </div>

              <div className="bg-surface-container-highest/40 p-3 rounded-xl border border-primary/10">
                <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed">
                  {availableVoices.length === 0
                    ? `${sessionLanguageLabel} is selected for tracking and saving. Add a browser/system voice for spoken playback.`
                    : advanceOnSpace
                    ? `${sessionLanguageLabel} ${sessionLevel} is active. Space starts the next word immediately.`
                    : `${sessionLanguageLabel} ${sessionLevel} timed mode uses pauses, word length, punctuation, and sentence endings.`}
                </p>
              </div>

            </div>
          </div>
        </div>
  );
}
