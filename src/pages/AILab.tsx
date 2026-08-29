import React, { startTransition, useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  Bot,
  Download,
  Edit3,
  Keyboard,
  LoaderCircle,
  Plus,
  RefreshCw,
  Send,
  Share2,
  Sparkles,
  User,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { ChatMessage } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { hasGeminiEnv, hasSupabaseEnv } from '../lib/env';
import { formatMonthlyResetDate, formatUsage, isLimitReached } from '../lib/entitlements';
import { useEntitlements } from '../hooks/useEntitlements';
import { fetchApi } from '../lib/api';
import { useI18n } from '../i18n';

type GenerationRecord = {
  id: string;
  title: string;
  prompt: string;
  content: string;
  level: string;
  category: string;
  language: string;
  createdAtLabel: string;
  createdAtValue: string;
};

type LabSettings = {
  level: string;
  language: string;
  skillType: string;
  category: string;
  tone: string;
  length: string;
};

type GenerationMode = 'generate' | 'refine' | 'regenerate';

type AiGenerationRequest = {
  mode: GenerationMode;
  settings: LabSettings;
  userPrompt: string;
  currentText: string;
};

const LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LANGUAGE_OPTIONS = ['English', 'German', 'Spanish', 'Italian', 'French'];
const SKILL_OPTIONS = ['Dictation', 'Reading', 'Listening', 'Writing'];
const CATEGORY_OPTIONS = ['Academic', 'Business', 'History', 'Literature', 'Science', 'Technology'];
const TONE_OPTIONS = ['Academic', 'Professional', 'Neutral', 'Journalistic'];
const LENGTH_OPTIONS = ['Short', 'Medium', 'Long'];
const WORD_RANGE_BY_LENGTH: Record<string, { min: number; max: number }> = {
  Short: { min: 10, max: 15 },
  Medium: { min: 20, max: 25 },
  Long: { min: 30, max: 35 },
};

const FALLBACK_SETTINGS: LabSettings = {
  level: 'B2',
  language: 'English',
  skillType: 'Dictation',
  category: 'Academic',
  tone: 'Academic',
  length: 'Medium',
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'assistant-intro',
    role: 'assistant',
    content:
      "Describe the exact kind of dictation text you want. You can mention topic, CEFR level, language, tone, or vocabulary focus, and I'll build a clean practice text for you.",
  },
];

const FALLBACK_GENERATION: GenerationRecord = {
  id: 'fallback-generation',
  title: 'Sustainability Trends',
  prompt: 'Generate a B2 English text about sustainability with renewable energy vocabulary.',
  content: `Title: Sustainability Trends in Renewable Energy

Renewable energy has become one of the most important topics in modern environmental discussions. In recent years, governments and private companies have invested heavily in solar panels, wind farms, and energy storage systems. These investments are designed to reduce carbon emissions and create more stable sources of clean electricity.

At a B2 level, learners can focus on vocabulary such as "emissions", "efficiency", "infrastructure", and "renewable sources". Understanding these terms makes it easier to follow articles, lectures, and public debates about climate policy and green technology.

Although the transition to sustainable energy still faces economic and political challenges, it continues to shape the future of global industry and education.`,
  level: 'B2',
  category: 'Academic',
  language: 'English',
  createdAtLabel: 'Sample',
  createdAtValue: new Date('2026-04-23T12:00:00Z').toISOString(),
};

export default function AILab() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, user, profile } = useAuth();
  const { language: interfaceLanguage, translateLanguageName } = useI18n();
  const copy = aiLabCopy[interfaceLanguage];
  const incomingState = location.state as { language?: string; level?: string; skillType?: string; fromPracticePath?: boolean } | null;
  const [settings, setSettings] = useState<LabSettings>({
    ...FALLBACK_SETTINGS,
    language: incomingState?.language ?? normalizeLabLanguage(profile?.target_language),
    level: incomingState?.level ?? profile?.cefr_level ?? FALLBACK_SETTINGS.level,
    skillType: incomingState?.skillType ?? FALLBACK_SETTINGS.skillType,
  });
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [draftPrompt, setDraftPrompt] = useState('');
  const [generatedText, setGeneratedText] = useState(FALLBACK_GENERATION.content);
  const [generatedTitle, setGeneratedTitle] = useState(FALLBACK_GENERATION.title);
  const [history, setHistory] = useState<GenerationRecord[]>([FALLBACK_GENERATION]);
  const [activeGenerationId, setActiveGenerationId] = useState(FALLBACK_GENERATION.id);
  const [status, setStatus] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingToLibrary, setSavingToLibrary] = useState(false);

  const geminiReady = hasGeminiEnv();
  const supabaseReady = hasSupabaseEnv();
  const { entitlements, loadingEntitlements, refreshEntitlements } = useEntitlements(user);
  const entitlementsReady = entitlements.resolved && !loadingEntitlements;
  const generationLimitReached = entitlementsReady && isLimitReached(entitlements.usage.aiGenerationsThisMonth, entitlements.limits.aiGenerationsMonthly);
  const savedTextLimitReached = entitlementsReady && isLimitReached(entitlements.usage.savedTexts, entitlements.limits.savedTexts);
  const canGenerate = draftPrompt.trim().length > 0 && !generating && entitlementsReady && Boolean(session?.access_token) && !generationLimitReached;
  const monthlyResetLabel = formatMonthlyResetDate(entitlements.currentPeriodEnd);
  const activeGeneration = useMemo(
    () => history.find((item) => item.id === activeGenerationId) ?? history[0] ?? FALLBACK_GENERATION,
    [activeGenerationId, history],
  );

  useEffect(() => {
    startTransition(() => {
      setSettings((current) => ({
        ...current,
        language: incomingState?.language ?? normalizeLabLanguage(profile?.target_language),
        level: incomingState?.level ?? profile?.cefr_level ?? current.level,
        skillType: incomingState?.skillType ?? current.skillType,
      }));
    });
  }, [incomingState?.language, incomingState?.level, incomingState?.skillType, profile?.cefr_level, profile?.target_language]);

  useEffect(() => {
    if (!user || !supabaseReady) {
      return;
    }

    setLoadingHistory(true);

    async function loadHistory() {
      const { data, error } = await supabase
        .from('generated_texts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(12);

      setLoadingHistory(false);

      if (error || !data || data.length === 0) {
        return;
      }

      const loadedHistory = data.map<GenerationRecord>((item) => ({
        id: item.id,
        title: item.title,
        prompt: item.prompt ?? '',
        content: item.content,
        level: item.level ?? profile?.cefr_level ?? FALLBACK_SETTINGS.level,
        category: inferCategoryFromPrompt(item.prompt ?? ''),
        language: inferLanguageFromPrompt(item.prompt ?? '', profile?.target_language ?? FALLBACK_SETTINGS.language),
        createdAtLabel: formatRelativeTime(item.created_at, interfaceLanguage),
        createdAtValue: item.created_at,
      }));

      setHistory(loadedHistory);
      hydrateGeneration(loadedHistory[0]);
    }

    void loadHistory();
  }, [profile?.cefr_level, profile?.target_language, supabaseReady, user]);

  function hydrateGeneration(generation: GenerationRecord) {
    setGeneratedText(generation.content);
    setGeneratedTitle(generation.title);
    setActiveGenerationId(generation.id);
    setDraftPrompt(generation.prompt);
    setSettings((current) => ({
      ...current,
      level: generation.level || current.level,
      category: generation.category || current.category,
      language: generation.language || current.language,
      skillType: inferSkillFromPrompt(generation.prompt || generation.category),
    }));
    setMessages([
      INITIAL_MESSAGES[0],
      { id: `user-${generation.id}`, role: 'user', content: generation.prompt || copy.openPreviousGeneration },
      { id: `assistant-${generation.id}`, role: 'assistant', content: copy.loadedIntoEditor(generation.title) },
    ]);
    setStatus(copy.loadedStatus(generation.title));
  }

  function resetComposer() {
    setDraftPrompt('');
    setMessages(INITIAL_MESSAGES);
    setGeneratedTitle(FALLBACK_GENERATION.title);
    setGeneratedText(FALLBACK_GENERATION.content);
    setActiveGenerationId(FALLBACK_GENERATION.id);
    setStatus(copy.newDraftStarted);
  }

  async function startNewTextGeneration() {
    if (generating) {
      return;
    }

    if (!entitlementsReady) {
      setStatus(copy.checkingAllowance);
      return;
    }

    if (generationLimitReached) {
      setStatus(copy.limitReached(formatUsage(entitlements.usage.aiGenerationsThisMonth, entitlements.limits.aiGenerationsMonthly), monthlyResetLabel));
      return;
    }

    const prompt = buildPromptFromSettings(settings);
    setDraftPrompt(prompt);
    setMessages(INITIAL_MESSAGES);
    await generateText('generate', prompt);
  }

  function updateSetting(key: keyof LabSettings, value: string) {
    setSettings((current) => ({ ...current, [key]: value }));
    setStatus(copy.settingUpdated(labelLabOption(key, interfaceLanguage), labelLabOption(value, interfaceLanguage)));
  }

  async function generateText(mode: GenerationMode, promptOverride?: string) {
    const basePrompt =
      mode === 'regenerate'
        ? activeGeneration?.prompt || draftPrompt.trim()
        : (promptOverride ?? draftPrompt).trim();

    if (!basePrompt) {
      setStatus(copy.describeFirst);
      return;
    }

    if (!entitlementsReady) {
      setStatus(copy.checkingAllowance);
      return;
    }

    if (!session?.access_token) {
      setStatus(copy.signInAgain);
      return;
    }

    if (generationLimitReached) {
      setStatus(copy.limitReached(formatUsage(entitlements.usage.aiGenerationsThisMonth, entitlements.limits.aiGenerationsMonthly), monthlyResetLabel));
      return;
    }

    const userMessage =
      mode === 'refine'
        ? copy.refineUserMessage(basePrompt)
        : basePrompt;

    const nextMessages: ChatMessage[] =
      mode === 'regenerate'
        ? [...messages, { id: crypto.randomUUID(), role: 'assistant', content: copy.regeneratingMessage }]
        : [...messages, { id: crypto.randomUUID(), role: 'user', content: userMessage }];

    if (mode !== 'regenerate') {
      setMessages(nextMessages);
    } else {
      setMessages(nextMessages);
    }

    setGenerating(true);
    setStatus(
      geminiReady
        ? mode === 'refine'
          ? copy.refining
          : copy.generating
        : copy.localDraft,
    );

    try {
      const aiRequest: AiGenerationRequest = {
        mode,
        settings,
        userPrompt: basePrompt,
        currentText: generatedText,
      };

      const generation = geminiReady
        ? await generateWithGemini(aiRequest, session.access_token)
        : {
            content: createLocalPracticeText(aiRequest),
            usedFallback: true,
            fallbackReason: copy.cloudDisabledReason,
          };

      const content = sanitizeGeneratedText(generation.content, settings);
      if (!content) {
        throw new Error(copy.emptyResponse);
      }

      const title = extractTitle(content, settings.category);
      const record = await persistGeneration({
        title,
        prompt: basePrompt,
        content,
        level: settings.level,
        language: settings.language,
        category: settings.category,
      });

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: generation.usedFallback
          ? copy.createdWithFallback(title)
          : mode === 'refine'
            ? copy.refinedMessage(title)
            : copy.createdMessage(title),
      };

      setMessages((current) => [...current, assistantMessage]);
      setGeneratedTitle(title);
      setGeneratedText(content);
      setDraftPrompt(basePrompt);
      setStatus(
        generation.usedFallback
          ? copy.readyWithReason(title, generation.fallbackReason ? formatGeneratorError(generation.fallbackReason, interfaceLanguage) : copy.localFallbackUsed)
          : copy.ready(title),
      );

      if (record) {
        setHistory((current) => [record, ...current.filter((item) => item.id !== record.id)]);
        setActiveGenerationId(record.id);
        void refreshEntitlements();
      }
    } catch (error) {
      const message = formatGeneratorError(error, interfaceLanguage);
      setStatus(message);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: copy.couldNotComplete(message),
        },
      ]);
    } finally {
      setGenerating(false);
    }
  }

  async function persistGeneration(input: {
    title: string;
    prompt: string;
    content: string;
    level: string;
    language: string;
    category: string;
  }) {
    const fallbackRecord: GenerationRecord = {
      id: crypto.randomUUID(),
      title: input.title,
      prompt: input.prompt,
      content: input.content,
      level: input.level,
      category: input.category,
      language: input.language,
      createdAtLabel: copy.justNow,
      createdAtValue: new Date().toISOString(),
    };

    if (!user || !supabaseReady) {
      return fallbackRecord;
    }

    const { data, error } = await supabase
      .from('generated_texts')
      .insert({
        user_id: user.id,
        title: input.title,
        prompt: input.prompt,
        content: input.content,
        level: input.level,
      })
      .select()
      .single();

    if (error || !data) {
      setStatus(error?.message ?? copy.historyNotSaved);
      return fallbackRecord;
    }

    return {
      id: data.id,
      title: data.title,
      prompt: data.prompt ?? '',
      content: data.content,
      level: data.level ?? input.level,
      category: input.category,
      language: input.language,
      createdAtLabel: formatRelativeTime(data.created_at, interfaceLanguage),
      createdAtValue: data.created_at,
    };
  }

  async function saveToLibrary() {
    if (!user) {
      setStatus(copy.signInToSave);
      return;
    }

    if (!supabaseReady) {
      setStatus(copy.supabaseBeforeSave);
      return;
    }

    if (savedTextLimitReached) {
      setStatus(copy.libraryLimitFull);
      return;
    }

    setSavingToLibrary(true);

    const { error } = await supabase.from('saved_texts').insert({
      user_id: user.id,
      title: generatedTitle,
      level: settings.level,
      category: `${settings.skillType} - ${settings.category}`,
      source: 'AI Lab',
      body: generatedText,
    });

    setSavingToLibrary(false);
    setStatus(error ? error.message : copy.savedToLibrary(generatedTitle));
    if (!error) {
      void refreshEntitlements();
    }
  }

  async function saveGeneratedSnapshot() {
    if (!draftPrompt.trim()) {
      setStatus(copy.generateOrLoadFirst);
      return;
    }

    if (generationLimitReached) {
      setStatus(copy.saveLimitReached(formatUsage(entitlements.usage.aiGenerationsThisMonth, entitlements.limits.aiGenerationsMonthly), monthlyResetLabel));
      return;
    }

    setSaving(true);
    const result = await persistGeneration({
      title: generatedTitle,
      prompt: draftPrompt.trim(),
      content: generatedText,
      level: settings.level,
      language: settings.language,
      category: `${settings.skillType} - ${settings.category}`,
    });
    setSaving(false);

    if (result) {
      setHistory((current) => [result, ...current.filter((item) => item.id !== result.id)]);
      setActiveGenerationId(result.id);
      setStatus(copy.snapshotSaved);
      void refreshEntitlements();
    }
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(generatedText);
      setStatus(copy.copied);
    } catch {
      setStatus(copy.clipboardUnavailable);
    }
  }

  function handleDownload() {
    const blob = new Blob([generatedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${slugify(generatedTitle || 'ai-lab-text')}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus(copy.downloaded);
  }

  function startPracticeNow() {
    if (!generatedText.trim()) {
      setStatus(copy.generateBeforePractice);
      return;
    }

    navigate('/workspace', {
      state: {
        sourceText: stripTitleFromPracticeText(generatedText),
        title: generatedTitle,
        language: settings.language,
        cefrLevel: settings.level,
        practiceCategory: settings.skillType,
        entryPoint: 'ai-lab',
      },
    });
  }

  return (
    <main className="wp-shell py-8 pt-24 sm:py-10 sm:pt-28 lg:py-12">
      {entitlementsReady && generationLimitReached && !entitlements.isPro && (
        <section className="mb-6 rounded-[1.5rem] border border-error/20 bg-error-container/25 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-error">{copy.limitTitle}</p>
              <h1 className="mt-2 font-headline text-2xl font-black text-on-surface">{copy.limitHeading}</h1>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-on-surface-variant">
                {copy.limitBody(formatUsage(entitlements.usage.aiGenerationsThisMonth, entitlements.limits.aiGenerationsMonthly), monthlyResetLabel)}
              </p>
            </div>
            <Link
              to="/pricing"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-on-primary transition hover:bg-primary-dim"
            >
              {copy.upgradePro}
            </Link>
          </div>
        </section>
      )}
      <div className="grid grid-cols-1 items-start xl:grid-cols-[280px_minmax(0,1fr)] gap-6 lg:gap-8">
        <aside className="bg-surface-container-low rounded-[2rem] border border-outline-variant/10 whisper-shadow flex flex-col overflow-hidden self-start xl:sticky xl:top-24">
          <div className="p-5 sm:p-6 border-b border-surface-container">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                 <h2 className="font-headline font-bold text-lg text-on-surface">{copy.labTitle}</h2>
                 <p className="text-xs text-on-surface-variant mt-1">{copy.labSubtitle}</p>
              </div>
              <span className="bg-primary-container text-on-primary-container text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider uppercase">
                 {loadingEntitlements ? copy.checking : entitlements.isPro ? 'Pro' : copy.free}
              </span>
            </div>

            <button
              type="button"
              onClick={() => void startNewTextGeneration()}
              disabled={generating || generationLimitReached}
              className="w-full py-3 px-4 rounded-2xl bg-surface-container-lowest text-on-surface font-semibold flex items-center justify-center gap-2 border border-surface-container hover:bg-surface-container transition-colors text-sm whisper-shadow disabled:opacity-60"
            >
              {generating ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
               {generating ? copy.generatingShort : copy.newGeneration}
            </button>
            <div className="mt-4 rounded-2xl bg-surface-container-lowest border border-surface-container p-4 text-xs">
              <div className="flex items-center justify-between gap-3">
                 <span className="font-bold text-on-surface">{copy.aiGenerations}</span>
                <span className="font-mono text-primary">
                  {loadingEntitlements
                     ? copy.checkingLower
                    : formatUsage(entitlements.usage.aiGenerationsThisMonth, entitlements.limits.aiGenerationsMonthly)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                 <span className="font-bold text-on-surface">{copy.savedTexts}</span>
                <span className="font-mono text-primary">
                   {loadingEntitlements ? copy.checkingLower : formatUsage(entitlements.usage.savedTexts, entitlements.limits.savedTexts)}
                </span>
              </div>
              {!entitlements.isPro && (
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] font-medium leading-5 text-on-surface-variant">
                     {copy.monthlyReset(monthlyResetLabel)}
                  </p>
                  <Link to="/pricing" className="inline-flex text-primary font-bold hover:underline">
                     {copy.upgradeUnlimited}
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-4 border-b border-surface-container">
             <SidebarSelect label={copy.level} value={settings.level} options={LEVEL_OPTIONS} onChange={(value) => updateSetting('level', value)} />
             <SidebarSelect label={copy.language} value={settings.language} options={LANGUAGE_OPTIONS} optionLabel={translateLanguageName} onChange={(value) => updateSetting('language', value)} />
             <SidebarSelect label={copy.skillType} value={settings.skillType} options={SKILL_OPTIONS} optionLabel={(value) => labelLabOption(value, interfaceLanguage)} onChange={(value) => updateSetting('skillType', value)} />
             <SidebarSelect label={copy.category} value={settings.category} options={CATEGORY_OPTIONS} optionLabel={(value) => labelLabOption(value, interfaceLanguage)} onChange={(value) => updateSetting('category', value)} />
             <SidebarSelect label={copy.tone} value={settings.tone} options={TONE_OPTIONS} optionLabel={(value) => labelLabOption(value, interfaceLanguage)} onChange={(value) => updateSetting('tone', value)} />
             <SidebarSelect label={copy.length} value={settings.length} options={LENGTH_OPTIONS} optionLabel={(value) => labelLabOption(value, interfaceLanguage)} onChange={(value) => updateSetting('length', value)} />
            <button
              type="button"
              onClick={resetComposer}
              className="w-full text-xs font-bold text-primary hover:underline disabled:opacity-60"
              disabled={generating}
            >
               {copy.clearDraft}
            </button>
          </div>

          <div className="mx-4 mb-5 mt-5 rounded-2xl border border-surface-container bg-surface-container-lowest px-3 py-4 sm:mx-5">
            <div className="flex items-center justify-between gap-3 mb-4 px-2">
               <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{copy.pastGenerations}</p>
              {loadingHistory && <LoaderCircle className="w-4 h-4 animate-spin text-primary" />}
            </div>
            <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
              {history.map((item) => (
                <div key={item.id}>
                  <HistoryItem
                    title={item.title}
                    time={item.createdAtLabel}
                    active={item.id === activeGenerationId}
                    onClick={() => hydrateGeneration(item)}
                  />
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-6 lg:gap-8">
          <section className="bg-surface-container-lowest rounded-[2rem] border border-outline-variant/10 whisper-shadow overflow-hidden flex flex-col min-h-[720px]">
            <div className="p-5 sm:p-6 border-b border-surface-container flex items-start justify-between gap-4">
              <div>
                 <h1 className="font-headline font-bold text-xl text-on-surface">{copy.workspaceTitle}</h1>
                 <p className="text-sm text-on-surface-variant mt-1">{copy.workspaceSubtitle}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {messages.map((message) => (
                <div key={message.id} className={cn('flex gap-3 max-w-[92%]', message.role === 'user' && 'ml-auto flex-row-reverse')}>
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                      message.role === 'assistant' ? 'bg-secondary-container text-secondary' : 'bg-primary text-on-primary',
                    )}
                  >
                    {message.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div
                    className={cn(
                      'p-4 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap',
                      message.role === 'assistant'
                        ? 'bg-surface-container-highest rounded-tl-none text-on-surface'
                        : 'bg-primary-container rounded-tr-none text-on-primary-container',
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 sm:p-6 border-t border-surface-container bg-surface-container-low/40 space-y-4">
              <textarea
                value={draftPrompt}
                onChange={(event) => setDraftPrompt(event.target.value)}
                className="w-full min-h-[120px] bg-surface-container-lowest border border-surface-container rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none resize-y shadow-sm placeholder:text-on-surface-variant/50"
                 placeholder={copy.promptPlaceholder}
              />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-xs text-on-surface-variant">
                  {geminiReady
                     ? copy.geminiReady
                     : copy.geminiMissing}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void generateText('generate')}
                    disabled={!canGenerate}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary text-on-primary font-bold hover:bg-primary-dim transition-all disabled:opacity-60"
                  >
                    {generating ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                     {copy.generate}
                  </button>
                  <button
                    type="button"
                    onClick={() => void generateText('refine')}
                    disabled={!draftPrompt.trim() || !generatedText.trim() || generating || !entitlementsReady || generationLimitReached}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-surface-container bg-surface-container-lowest text-on-surface font-semibold hover:bg-surface-container transition-all disabled:opacity-60"
                  >
                    <Edit3 className="w-4 h-4" />
                     {copy.refine}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-[2rem] border border-outline-variant/10 whisper-shadow overflow-hidden flex flex-col min-h-[720px]">
            <div className="p-5 sm:p-6 border-b border-surface-container flex items-start justify-between gap-4 bg-surface-container-lowest">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                   <h2 className="font-headline font-bold text-lg text-on-surface">{copy.generatedText}</h2>
                </div>
                <p className="text-sm text-on-surface-variant mt-2">{generatedTitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => void handleShare()} className="p-2 hover:bg-surface-container rounded-xl text-on-surface-variant transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
                <button type="button" onClick={handleDownload} className="p-2 hover:bg-surface-container rounded-xl text-on-surface-variant transition-colors">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-4 border-b border-surface-container bg-surface-container-low/40">
              <div className="flex flex-wrap gap-2">
                 <InfoPill icon={<Sparkles className="w-3.5 h-3.5" />} label={copy.levelPill(settings.level)} />
                 <InfoPill icon={<Bot className="w-3.5 h-3.5" />} label={translateLanguageName(settings.language)} />
                 <InfoPill icon={<Keyboard className="w-3.5 h-3.5" />} label={labelLabOption(settings.skillType, interfaceLanguage)} />
                 <InfoPill icon={<Edit3 className="w-3.5 h-3.5" />} label={labelLabOption(settings.tone, interfaceLanguage)} />
                 <InfoPill icon={<Bookmark className="w-3.5 h-3.5" />} label={labelLabOption(settings.category, interfaceLanguage)} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8">
              <textarea
                value={generatedText}
                onChange={(event) => setGeneratedText(event.target.value)}
                className="w-full min-h-[440px] bg-transparent border-none p-0 text-base sm:text-lg leading-8 text-on-surface font-normal outline-none resize-y"
                spellCheck={false}
              />
            </div>

            <div className="p-5 sm:p-6 border-t border-surface-container bg-surface-container-low/30">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <ControlButton
                  icon={<Edit3 className="w-4 h-4" />}
                   label={copy.refine}
                  onClick={() => void generateText('refine')}
                  disabled={!draftPrompt.trim() || !generatedText.trim() || generating || !entitlementsReady || generationLimitReached}
                />
                <ControlButton
                  icon={generating ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                   label={copy.regenerate}
                  onClick={() => void generateText('regenerate')}
                  disabled={!(activeGeneration?.prompt || draftPrompt.trim()) || generating || !entitlementsReady || generationLimitReached}
                />
                <ControlButton
                  icon={<Bookmark className="w-4 h-4" />}
                   label={savingToLibrary ? copy.saving : copy.saveToTexts}
                  onClick={() => void saveToLibrary()}
                  disabled={savingToLibrary || !supabaseReady || !user || savedTextLimitReached}
                />
                <button
                  type="button"
                  onClick={startPracticeNow}
                  disabled={!generatedText.trim()}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-4 text-sm font-bold text-on-primary shadow-sm shadow-primary/10 transition-all hover:bg-primary-dim active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Keyboard className="w-4 h-4" />
                   {copy.startPractice}
                </button>
              </div>

              <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <button
                  type="button"
                  onClick={() => void saveGeneratedSnapshot()}
                  disabled={saving || !draftPrompt.trim() || !entitlementsReady || generationLimitReached}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline disabled:opacity-60"
                >
                  {saving ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Bookmark className="w-4 h-4" />}
                   {copy.saveSnapshot}
                </button>
                {status && <p className="text-sm text-on-surface-variant">{status}</p>}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function SidebarSelect({
  label,
  value,
  options,
  optionLabel,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  optionLabel?: (value: string) => string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-surface-container-lowest border border-surface-container rounded-2xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabel ? optionLabel(option) : option}
          </option>
        ))}
      </select>
    </div>
  );
}

function HistoryItem({
  title,
  time,
  active,
  onClick,
}: {
  title: string;
  time: string;
  active?: boolean;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-2xl transition-colors group',
        active ? 'bg-surface-container-highest/70 border-l-4 border-primary' : 'hover:bg-surface-container',
      )}
    >
      <p
        className={cn(
          'text-sm line-clamp-1',
          active ? 'font-semibold text-on-surface' : 'font-medium text-on-surface-variant group-hover:text-on-surface',
        )}
      >
        {title}
      </p>
      <p className="text-[11px] text-on-surface-variant/70 mt-1">{time}</p>
    </button>
  );
}

function ControlButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-surface-container bg-surface-container-lowest px-4 text-sm font-semibold text-on-surface-variant transition-all hover:border-outline-variant hover:bg-surface-container active:scale-95 disabled:opacity-60"
    >
      {icon}
      {label}
    </button>
  );
}

function InfoPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-1.5 text-xs font-semibold text-on-surface-variant">
      {icon}
      {label}
    </span>
  );
}

function buildPromptFromSettings(settings: LabSettings) {
  const categoryTopic = getDefaultTopic(settings.category, settings.language);
  const wordRange = getWordRangeForLength(settings.length);
  return `Create a ${settings.length.toLowerCase()} ${settings.level} ${settings.language} ${settings.skillType.toLowerCase()} practice text about ${categoryTopic}. Use a ${settings.tone.toLowerCase()} tone with precise vocabulary and natural sentence rhythm. The main text must be between ${wordRange.min} and ${wordRange.max} words.`;
}

function buildGeminiPrompt({
  mode,
  settings,
  userPrompt,
  currentText,
}: {
  mode: 'generate' | 'refine' | 'regenerate';
  settings: LabSettings;
  userPrompt: string;
  currentText: string;
}) {
  const sharedInstruction = `You are WordPilot's AI writing assistant.
Generate clean dictation practice text only.
Keep the output polished, grammatically correct, and aligned to the requested CEFR level.
Language: ${settings.language}
CEFR level: ${settings.level}
Skill type: ${settings.skillType}
Category: ${settings.category}
Tone: ${settings.tone}
Length: ${settings.length}
Main text word range, excluding the title: ${formatWordRange(settings.length)}

Return the result in this structure:
Title: <short title>

<main text in polished paragraphs>

The main text must stay inside the requested word range.`;

  if (mode === 'refine') {
    return `${sharedInstruction}

Current text:
${currentText}

Refinement request:
${userPrompt}

Update the text accordingly and return a fresh final version.`;
  }

  return `${sharedInstruction}

User request:
${userPrompt}

Create a new practice text for WordPilot.`;
}

async function generateWithGemini(request: AiGenerationRequest, accessToken: string) {

  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchApi('/api/ai/generate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(payload.error ?? 'Unable to generate text.') as Error & { status?: number };
        error.status = response.status;
        throw error;
      }

      return {
        content: payload.text ?? '',
        usedFallback: false,
        fallbackReason: '',
      };
    } catch (error) {
      lastError = error;
      if (!isRetryableGeneratorError(error)) {
        throw error;
      }
      if (attempt === maxAttempts) {
        break;
      }
      await wait(700 * attempt);
    }
  }

  return {
    content: createLocalPracticeText(request),
    usedFallback: true,
    fallbackReason: formatGeneratorError(lastError),
  };
}

function createLocalPracticeText({
  mode,
  settings,
  userPrompt,
  currentText,
}: {
  mode: GenerationMode;
  settings: LabSettings;
  userPrompt: string;
  currentText: string;
}) {
  const topic = cleanTopic(userPrompt, settings);
  const title =
    settings.language === 'German'
      ? `${settings.level} ${settings.skillType}: ${toTitleCase(topic)}`
      : `${settings.level} ${settings.skillType}: ${toTitleCase(topic)}`;
  const sentenceSet = buildLocalParagraphs(settings, topic);
  const draft = `Title: ${title}

${sentenceSet.join(' ')}`;

  return limitPracticeTextWords(draft, settings);
}

function createLocalPracticeTextFromPrompt(prompt: string) {
  const settings: LabSettings = {
    level: prompt.match(/CEFR level:\s*(.+)/i)?.[1]?.trim() || FALLBACK_SETTINGS.level,
    language: prompt.match(/Language:\s*(.+)/i)?.[1]?.trim() || FALLBACK_SETTINGS.language,
    category: prompt.match(/Category:\s*(.+)/i)?.[1]?.trim() || FALLBACK_SETTINGS.category,
    skillType: prompt.match(/Skill type:\s*(.+)/i)?.[1]?.trim() || FALLBACK_SETTINGS.skillType,
    tone: prompt.match(/Tone:\s*(.+)/i)?.[1]?.trim() || FALLBACK_SETTINGS.tone,
    length: prompt.match(/Length:\s*(.+)/i)?.[1]?.trim() || FALLBACK_SETTINGS.length,
  };
  const userPrompt = prompt.match(/User request:\s*([\s\S]+?)\n\nCreate a new practice text/i)?.[1]?.trim()
    || prompt.match(/Refinement request:\s*([\s\S]+?)\n\nUpdate the text/i)?.[1]?.trim()
    || 'focused language practice';

  return createLocalPracticeText({
    mode: prompt.includes('Refinement request:') ? 'refine' : 'generate',
    settings,
    userPrompt,
    currentText: prompt.match(/Current text:\s*([\s\S]+?)\n\nRefinement request:/i)?.[1]?.trim() || '',
  });
}

function isRetryableGeneratorError(error: unknown) {
  const status = typeof error === 'object' && error !== null && 'status' in error ? Number((error as { status?: number }).status) : 0;
  if ([400, 401, 402, 403, 413].includes(status)) {
    return false;
  }

  const text = getErrorText(error).toLowerCase();
  if (text.includes('usage') || text.includes('limit') || text.includes('authentication') || text.includes('sign in')) {
    return false;
  }

  return status === 429 || status >= 500 || text.includes('503') || text.includes('unavailable') || text.includes('overloaded') || text.includes('rate');
}

function formatGeneratorError(error: unknown, interfaceLanguage: 'en' | 'de' = 'en') {
  const text = getErrorText(error);
  const lowerText = text.toLowerCase();
  const copy = aiLabCopy[interfaceLanguage];

  if (lowerText.includes('503') || lowerText.includes('unavailable') || lowerText.includes('high demand')) {
    return copy.generatorBusy;
  }

  if (lowerText.includes('api key')) {
    return copy.apiKeyProblem;
  }

  if (lowerText.includes('quota') || lowerText.includes('rate')) {
    return copy.quotaProblem;
  }

  return text || copy.generatorFailed;
}

function getErrorText(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return '';
  }
}

function buildLocalParagraphs(settings: LabSettings, topic: string) {
  if (settings.language === 'German') {
    return [
      `Digitale Transformation veraendert professionelle Arbeit, weil ${topic} Entscheidungen schneller, messbarer und transparenter macht.`,
      `Fuehrungskraefte muessen Datenschutz, Verantwortung und menschliche Kontrolle konsequent sichern.`,
      `So entsteht Innovation, die Vertrauen foerdert und Prozesse nachhaltig verbessert.`,
    ];
  }

  return [
    `Digital transformation changes professional work because ${topic} makes decisions faster, clearer, and easier to evaluate.`,
    `Leaders must protect privacy, responsibility, and meaningful human control.`,
    `This creates innovation that builds trust and improves daily processes.`,
  ];
}

function getDefaultTopic(category: string, language: string) {
  const topics: Record<string, { English: string; German: string }> = {
    Academic: {
      English: 'research methods and evidence-based learning',
      German: 'Forschungsmethoden und evidenzbasiertes Lernen',
    },
    Business: {
      English: 'responsible management and organisational change',
      German: 'verantwortungsvolle Unternehmensfuehrung und organisatorischen Wandel',
    },
    History: {
      English: 'social change in modern history',
      German: 'gesellschaftlichen Wandel in der modernen Geschichte',
    },
    Literature: {
      English: 'narrative perspective and character development',
      German: 'Erzaehlperspektive und Figurenentwicklung',
    },
    Science: {
      English: 'scientific evidence and climate research',
      German: 'wissenschaftliche Evidenz und Klimaforschung',
    },
    Technology: {
      English: 'digital transformation and responsible innovation',
      German: 'digitale Transformation und verantwortungsvolle Innovation',
    },
  };

  return topics[category]?.[language === 'German' ? 'German' : 'English'] ?? 'focused language practice';
}

function translateCategory(category: string) {
  const categories: Record<string, string> = {
    Academic: 'Akademisches',
    Business: 'Business',
    History: 'Geschichts',
    Literature: 'Literatur',
    Science: 'Wissenschafts',
    Technology: 'Technologie',
  };

  return categories[category] ?? category;
}

function cleanTopic(value: string, settings: LabSettings) {
  const normalizedValue = value
    .replace(/\s+/g, ' ')
    .replace(/^(generate|create|write|refine|improve)\s+/i, '')
    .replace(/^(a|an)\s+/i, '')
    .replace(new RegExp(`^${settings.level}\\s+`, 'i'), '')
    .replace(new RegExp(`^${settings.language}\\s+`, 'i'), '')
    .replace(new RegExp(`^${settings.skillType}\\s+`, 'i'), '')
    .replace(/^(dictation|practice)\s+text\s+about\s+/i, '')
    .replace(/^text\s+about\s+/i, '')
    .replace(/\bwith\s+(an?\s+)?(academic|professional|neutral|journalistic)\s+tone\b.*$/i, '')
    .replace(/\buse\s+(an?\s+)?(academic|professional|neutral|journalistic)\s+tone\b.*$/i, '')
    .replace(/\binclude useful vocabulary.*$/i, '')
    .replace(/\.$/, '')
    .trim();

  const extractedTopic = normalizedValue.match(/\babout\s+(.+?)(?:\s+with\b|\s+in\b|\.|$)/i)?.[1]?.trim();
  const topic = extractedTopic || normalizedValue;
  const categoryOnly = topic.toLowerCase() === settings.category.toLowerCase();

  return (categoryOnly ? getDefaultTopic(settings.category, settings.language) : topic).slice(0, 72) || getDefaultTopic(settings.category, settings.language);
}

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function extractTitle(content: string, fallbackCategory: string) {
  const titleMatch = content.match(/^title:\s*(.+)$/im);
  return titleMatch?.[1]?.trim() || `${fallbackCategory} Practice Text`;
}

function sanitizeGeneratedText(content: string, settings: LabSettings) {
  return limitPracticeTextWords(content.replace(/\r\n/g, '\n').trim(), settings);
}

function stripTitleFromPracticeText(content: string) {
  return content.replace(/^title:\s*.+\n*/i, '').trim();
}

function limitPracticeTextWords(content: string, settings: LabSettings) {
  const cleanContent = content.replace(/\r\n/g, '\n').trim();
  const titleMatch = cleanContent.match(/^title:\s*(.+)$/im);
  const title = titleMatch?.[0]?.trim();
  const body = stripTitleFromPracticeText(cleanContent);
  const rangedBody = fitWordsToRange(body, settings);

  if (!title) {
    return rangedBody;
  }

  return `Title: ${title.replace(/^title:\s*/i, '')}

${rangedBody}`.trim();
}

function fitWordsToRange(value: string, settings: LabSettings) {
  const range = getWordRangeForLength(settings.length);
  const bodyWithMinimum = ensureMinimumWords(value, settings, range.min);
  return limitWords(bodyWithMinimum, range.max);
}

function ensureMinimumWords(value: string, settings: LabSettings, minWords: number) {
  const fillerWords = getMinimumWordFiller(settings).split(' ');
  const words = value.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);

  for (let index = 0; words.length < minWords; index += 1) {
    words.push(fillerWords[index % fillerWords.length]);
  }

  return words.join(' ');
}

function getMinimumWordFiller(settings: LabSettings) {
  if (settings.language === 'German') {
    return 'klare Regeln staerken Vertrauen Verantwortung und professionelle digitale Entscheidungen';
  }

  return 'clear rules strengthen trust responsibility and professional digital decisions';
}

function limitWords(value: string, maxWords: number) {
  const words = value.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const limited = words.slice(0, maxWords).join(' ');

  if (!limited || /[.!?]$/.test(limited)) {
    return limited;
  }

  return `${limited}.`;
}

function getWordRangeForLength(length: string) {
  return WORD_RANGE_BY_LENGTH[length] ?? WORD_RANGE_BY_LENGTH.Medium;
}

function formatWordRange(length: string) {
  const range = getWordRangeForLength(length);
  return `${range.min}-${range.max} words`;
}

function formatRelativeTime(value: string, interfaceLanguage: 'en' | 'de' = 'en') {
  const now = Date.now();
  const date = new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.round((now - date) / 60000));
  const copy = aiLabCopy[interfaceLanguage];

  if (diffMinutes < 1) {
    return copy.justNow;
  }

  if (diffMinutes < 60) {
    return copy.minutesAgo(diffMinutes);
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return copy.hoursAgo(diffHours);
  }

  return new Date(value).toLocaleDateString(interfaceLanguage === 'de' ? 'de-DE' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function inferLanguageFromPrompt(prompt: string, fallbackLanguage: string) {
  const lowerPrompt = prompt.toLowerCase();
  if (lowerPrompt.includes('german')) {
    return 'German';
  }
  if (lowerPrompt.includes('spanish')) {
    return 'Spanish';
  }
  if (lowerPrompt.includes('italian')) {
    return 'Italian';
  }
  if (lowerPrompt.includes('french')) {
    return 'French';
  }
  if (lowerPrompt.includes('english')) {
    return 'English';
  }
  return normalizeLabLanguage(fallbackLanguage);
}

function normalizeLabLanguage(value?: string | null) {
  return LANGUAGE_OPTIONS.includes(value ?? '') ? value as string : FALLBACK_SETTINGS.language;
}

function inferCategoryFromPrompt(prompt: string) {
  const lowerPrompt = prompt.toLowerCase();
  if (lowerPrompt.includes('history')) return 'History';
  if (lowerPrompt.includes('science')) return 'Science';
  if (lowerPrompt.includes('technology') || lowerPrompt.includes('cyber')) return 'Technology';
  if (lowerPrompt.includes('literature') || lowerPrompt.includes('novel')) return 'Literature';
  if (lowerPrompt.includes('business')) return 'Business';
  return 'Academic';
}

function inferSkillFromPrompt(prompt: string) {
  const lowerPrompt = prompt.toLowerCase();
  if (lowerPrompt.includes('reading')) return 'Reading';
  if (lowerPrompt.includes('listening')) return 'Listening';
  if (lowerPrompt.includes('writing')) return 'Writing';
  return 'Dictation';
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function labelLabOption(value: string, interfaceLanguage: 'en' | 'de') {
  if (interfaceLanguage === 'en') return value;

  const labels: Record<string, string> = {
    Dictation: 'Diktat',
    Reading: 'Lesen',
    Listening: 'Hören',
    Writing: 'Schreiben',
    Academic: 'Akademisch',
    Business: 'Business',
    History: 'Geschichte',
    Literature: 'Literatur',
    Science: 'Wissenschaft',
    Technology: 'Technologie',
    Professional: 'Professionell',
    Neutral: 'Neutral',
    Journalistic: 'Journalistisch',
    Short: 'Kurz',
    Medium: 'Mittel',
    Long: 'Lang',
    level: 'Niveau',
    language: 'Sprache',
    skillType: 'Fertigkeit',
    category: 'Kategorie',
    tone: 'Ton',
    length: 'Länge',
  };

  return labels[value] ?? value;
}

const aiLabCopy = {
  en: {
    limitTitle: 'Monthly limit reached',
    limitHeading: 'Your free AI Lab generations are used up.',
    limitBody: (usage: string, reset: string) => `You have used ${usage} AI generations for this month. Your free allowance resets on ${reset}. WordPilot Pro unlocks unlimited generation immediately.`,
    upgradePro: 'Upgrade to WordPilot Pro',
    labTitle: 'AI Lab',
    labSubtitle: 'Custom generation workspace',
    checking: 'Checking',
    checkingLower: 'checking',
    free: 'Free',
    generatingShort: 'Generating...',
    newGeneration: 'New Text Generation',
    aiGenerations: 'AI generations',
    savedTexts: 'Saved texts',
    monthlyReset: (date: string) => `Monthly reset: ${date}`,
    upgradeUnlimited: 'Upgrade for unlimited access',
    level: 'Level',
    language: 'Language',
    skillType: 'Skill Type',
    category: 'Category',
    tone: 'Tone',
    length: 'Length',
    clearDraft: 'Clear current draft',
    pastGenerations: 'Past Generations',
    workspaceTitle: 'AI Workspace',
    workspaceSubtitle: 'Talk to the generator, refine prompts, and keep your history attached to your account.',
    promptPlaceholder: 'Describe the text you want. Example: Generate a C1 German text about cybersecurity policy with formal tone and practical vocabulary for interviews.',
    geminiReady: 'Gemini is ready. Your prompts will use the selected level, language, category, tone, and length.',
    geminiMissing: 'Cloud AI is not configured. The local draft engine will keep generation, editing, and practice flow available.',
    generate: 'Generate',
    refine: 'Refine via Chat',
    generatedText: 'Generated Text',
    levelPill: (level: string) => `${level} level`,
    regenerate: 'Regenerate',
    saving: 'Saving...',
    saveToTexts: 'Save to My Texts',
    startPractice: 'Start Practice Now',
    saveSnapshot: 'Save current draft snapshot',
    openPreviousGeneration: 'Open previous generation',
    loadedIntoEditor: (title: string) => `Ready. "${title}" has been loaded into the editor.`,
    loadedStatus: (title: string) => `Loaded "${title}" from your generation history.`,
    newDraftStarted: 'New AI draft started. Describe the exact text you want to generate.',
    checkingAllowance: 'Checking your AI usage allowance. Try again in a moment.',
    limitReached: (_usage: string, reset: string) => `You used all free AI generations for this month. Upgrade to WordPilot Pro or wait until ${reset}.`,
    settingUpdated: (key: string, value: string) => `${key} set to ${value}. The next generation will use this setting.`,
    describeFirst: 'Describe the text you want to generate first.',
    signInAgain: 'Sign in again before using AI generation.',
    refineUserMessage: (prompt: string) => `Refine the current draft with this instruction: ${prompt}`,
    regeneratingMessage: 'Regenerating the text with the same request and current settings...',
    refining: 'Refining the draft with Gemini...',
    generating: 'Generating a fresh text with Gemini...',
    localDraft: 'Cloud AI is not configured, so I am creating a local practice draft instead.',
    cloudDisabledReason: 'Cloud AI is disabled for this environment; this local draft still follows your account limits.',
    emptyResponse: 'The generator returned an empty response.',
    createdWithFallback: (title: string) => `Done. I created "${title}" with the local draft engine because the cloud generator was not available. You can edit it, save it, or start practice now.`,
    refinedMessage: (title: string) => `Done. I refined "${title}" and updated the editor.`,
    createdMessage: (title: string) => `Done. I created "${title}" and saved it to your generation history.`,
    readyWithReason: (title: string, reason: string) => `"${title}" is ready. ${reason}`,
    ready: (title: string) => `"${title}" is ready.`,
    localFallbackUsed: 'Local fallback was used.',
    couldNotComplete: (message: string) => `I could not complete that request. ${message}`,
    justNow: 'Just now',
    historyNotSaved: 'The text was generated, but history could not be saved.',
    signInToSave: 'You need to sign in before saving texts to your library.',
    supabaseBeforeSave: 'Add Supabase env values before saving to your library.',
    libraryLimitFull: 'Your free library limit is full. Upgrade to WordPilot Pro for unlimited saved texts.',
    savedToLibrary: (title: string) => `"${title}" was saved to your library.`,
    generateOrLoadFirst: 'Generate or load a text first.',
    saveLimitReached: (_usage: string, reset: string) => `You used all free AI generation saves for this month. Upgrade to WordPilot Pro or wait until ${reset}.`,
    snapshotSaved: 'Current AI draft snapshot saved.',
    copied: 'Generated text copied to clipboard.',
    clipboardUnavailable: 'Clipboard access is not available in this browser.',
    downloaded: 'Text file downloaded.',
    generateBeforePractice: 'Generate or paste a practice text before starting.',
    generatorBusy: 'The cloud generator is busy right now, so I used the local draft engine instead.',
    apiKeyProblem: 'The Gemini API key is missing or invalid, so I used the local draft engine instead.',
    quotaProblem: 'The cloud generator hit a temporary usage limit, so I used the local draft engine instead.',
    generatorFailed: 'The generator could not finish the request.',
    minutesAgo: (value: number) => `${value} mins ago`,
    hoursAgo: (value: number) => `${value}h ago`,
  },
  de: {
    limitTitle: 'Monatslimit erreicht',
    limitHeading: 'Deine kostenlosen KI-Lab-Generierungen sind aufgebraucht.',
    limitBody: (usage: string, reset: string) => `Du hast diesen Monat ${usage} KI-Generierungen genutzt. Dein kostenloses Kontingent wird am ${reset} zurückgesetzt. WordPilot Pro schaltet sofort unbegrenzte Generierung frei.`,
    upgradePro: 'Auf WordPilot Pro upgraden',
    labTitle: 'KI-Lab',
    labSubtitle: 'Arbeitsbereich für eigene Übungstexte',
    checking: 'Prüfung',
    checkingLower: 'prüfen',
    free: 'Free',
    generatingShort: 'Generierung...',
    newGeneration: 'Neuen Text erstellen',
    aiGenerations: 'KI-Generierungen',
    savedTexts: 'Gespeicherte Texte',
    monthlyReset: (date: string) => `Monatsreset: ${date}`,
    upgradeUnlimited: 'Unbegrenzten Zugriff freischalten',
    level: 'Niveau',
    language: 'Sprache',
    skillType: 'Fertigkeit',
    category: 'Kategorie',
    tone: 'Ton',
    length: 'Länge',
    clearDraft: 'Aktuellen Entwurf leeren',
    pastGenerations: 'Frühere Generierungen',
    workspaceTitle: 'KI-Arbeitsbereich',
    workspaceSubtitle: 'Sprich mit dem Generator, verfeinere Prompts und behalte deinen Verlauf im Konto.',
    promptPlaceholder: 'Beschreibe den gewünschten Text. Beispiel: Erstelle einen C1-Text auf Deutsch über Cybersicherheitspolitik mit formellem Ton und praktischem Wortschatz für Interviews.',
    geminiReady: 'Gemini ist bereit. Prompts nutzen Niveau, Sprache, Kategorie, Ton und Länge.',
    geminiMissing: 'Cloud-KI ist nicht konfiguriert. Der lokale Entwurfsgenerator hält Generierung, Bearbeitung und Übungsfluss verfügbar.',
    generate: 'Generieren',
    refine: 'Per Chat verfeinern',
    generatedText: 'Generierter Text',
    levelPill: (level: string) => `${level}-Niveau`,
    regenerate: 'Neu generieren',
    saving: 'Speichern...',
    saveToTexts: 'In meine Texte speichern',
    startPractice: 'Jetzt üben',
    saveSnapshot: 'Aktuellen Entwurf speichern',
    openPreviousGeneration: 'Frühere Generierung öffnen',
    loadedIntoEditor: (title: string) => `Bereit. "${title}" wurde in den Editor geladen.`,
    loadedStatus: (title: string) => `"${title}" wurde aus deinem Verlauf geladen.`,
    newDraftStarted: 'Neuer KI-Entwurf gestartet. Beschreibe genau, welchen Text du generieren möchtest.',
    checkingAllowance: 'Dein KI-Kontingent wird geprüft. Versuche es gleich erneut.',
    limitReached: (_usage: string, reset: string) => `Du hast alle kostenlosen KI-Generierungen für diesen Monat genutzt. Upgrade auf WordPilot Pro oder warte bis ${reset}.`,
    settingUpdated: (key: string, value: string) => `${key} wurde auf ${value} gesetzt. Die nächste Generierung nutzt diese Einstellung.`,
    describeFirst: 'Beschreibe zuerst, welchen Text du generieren möchtest.',
    signInAgain: 'Melde dich erneut an, bevor du KI-Generierung nutzt.',
    refineUserMessage: (prompt: string) => `Aktuellen Entwurf mit dieser Anweisung verfeinern: ${prompt}`,
    regeneratingMessage: 'Der Text wird mit derselben Anfrage und den aktuellen Einstellungen neu generiert...',
    refining: 'Der Entwurf wird mit Gemini verfeinert...',
    generating: 'Ein neuer Text wird mit Gemini generiert...',
    localDraft: 'Cloud-KI ist nicht konfiguriert, deshalb erstelle ich einen lokalen Übungsentwurf.',
    cloudDisabledReason: 'Cloud-KI ist in dieser Umgebung deaktiviert; dieser lokale Entwurf folgt trotzdem deinen Kontolimits.',
    emptyResponse: 'Der Generator hat eine leere Antwort geliefert.',
    createdWithFallback: (title: string) => `Fertig. Ich habe "${title}" lokal erstellt, weil der Cloud-Generator nicht verfügbar war. Du kannst ihn bearbeiten, speichern oder direkt üben.`,
    refinedMessage: (title: string) => `Fertig. Ich habe "${title}" verfeinert und den Editor aktualisiert.`,
    createdMessage: (title: string) => `Fertig. Ich habe "${title}" erstellt und im Verlauf gespeichert.`,
    readyWithReason: (title: string, reason: string) => `"${title}" ist bereit. ${reason}`,
    ready: (title: string) => `"${title}" ist bereit.`,
    localFallbackUsed: 'Lokaler Fallback wurde genutzt.',
    couldNotComplete: (message: string) => `Die Anfrage konnte nicht abgeschlossen werden. ${message}`,
    justNow: 'Gerade eben',
    historyNotSaved: 'Der Text wurde generiert, aber der Verlauf konnte nicht gespeichert werden.',
    signInToSave: 'Melde dich an, bevor du Texte in deiner Bibliothek speicherst.',
    supabaseBeforeSave: 'Füge Supabase-Umgebungswerte hinzu, bevor du in die Bibliothek speicherst.',
    libraryLimitFull: 'Dein kostenloses Bibliothekslimit ist voll. WordPilot Pro schaltet unbegrenzt gespeicherte Texte frei.',
    savedToLibrary: (title: string) => `"${title}" wurde in deiner Bibliothek gespeichert.`,
    generateOrLoadFirst: 'Generiere oder lade zuerst einen Text.',
    saveLimitReached: (_usage: string, reset: string) => `Du hast alle kostenlosen KI-Speicherungen für diesen Monat genutzt. Upgrade auf WordPilot Pro oder warte bis ${reset}.`,
    snapshotSaved: 'Aktueller KI-Entwurf wurde gespeichert.',
    copied: 'Generierter Text wurde in die Zwischenablage kopiert.',
    clipboardUnavailable: 'Zwischenablage ist in diesem Browser nicht verfügbar.',
    downloaded: 'Textdatei wurde heruntergeladen.',
    generateBeforePractice: 'Generiere oder füge einen Übungstext ein, bevor du startest.',
    generatorBusy: 'Der Cloud-Generator ist gerade ausgelastet, deshalb wurde der lokale Entwurfsgenerator genutzt.',
    apiKeyProblem: 'Der Gemini-API-Schlüssel fehlt oder ist ungültig, deshalb wurde der lokale Entwurfsgenerator genutzt.',
    quotaProblem: 'Der Cloud-Generator hat ein temporäres Nutzungslimit erreicht, deshalb wurde der lokale Entwurfsgenerator genutzt.',
    generatorFailed: 'Der Generator konnte die Anfrage nicht abschließen.',
    minutesAgo: (value: number) => `vor ${value} Min.`,
    hoursAgo: (value: number) => `vor ${value} Std.`,
  },
};



