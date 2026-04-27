import React, { startTransition, useEffect, useMemo, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import {
  Bookmark,
  Bot,
  Download,
  Edit3,
  Keyboard,
  LoaderCircle,
  MoreVertical,
  Plus,
  RefreshCw,
  Send,
  Share2,
  Sparkles,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { ChatMessage } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { clientEnv, hasGeminiEnv, hasSupabaseEnv } from '../lib/env';

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
  category: string;
  tone: string;
  length: string;
};

type GenerationMode = 'generate' | 'refine' | 'regenerate';

const LEVEL_OPTIONS = ['A2', 'B1', 'B2', 'C1', 'C2'];
const LANGUAGE_OPTIONS = ['English', 'German'];
const CATEGORY_OPTIONS = ['Academic', 'Business', 'History', 'Literature', 'Science', 'Technology'];
const TONE_OPTIONS = ['Academic', 'Professional', 'Neutral', 'Journalistic'];
const LENGTH_OPTIONS = ['Short', 'Medium', 'Long'];

const FALLBACK_SETTINGS: LabSettings = {
  level: 'B2',
  language: 'English',
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
  const { user, profile } = useAuth();
  const [settings, setSettings] = useState<LabSettings>({
    ...FALLBACK_SETTINGS,
    language: profile?.target_language === 'German' ? 'German' : FALLBACK_SETTINGS.language,
    level: profile?.cefr_level ?? FALLBACK_SETTINGS.level,
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
  const canGenerate = draftPrompt.trim().length > 0 && !generating;
  const activeGeneration = useMemo(
    () => history.find((item) => item.id === activeGenerationId) ?? history[0] ?? FALLBACK_GENERATION,
    [activeGenerationId, history],
  );

  useEffect(() => {
    startTransition(() => {
      setSettings((current) => ({
        ...current,
        language: profile?.target_language === 'German' ? 'German' : current.language,
        level: profile?.cefr_level ?? current.level,
      }));
    });
  }, [profile?.cefr_level, profile?.target_language]);

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
        createdAtLabel: formatRelativeTime(item.created_at),
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
    }));
    setMessages([
      INITIAL_MESSAGES[0],
      { id: `user-${generation.id}`, role: 'user', content: generation.prompt || 'Open previous generation' },
      { id: `assistant-${generation.id}`, role: 'assistant', content: `Ready. "${generation.title}" has been loaded into the editor.` },
    ]);
    setStatus(`Loaded "${generation.title}" from your generation history.`);
  }

  function resetComposer() {
    setDraftPrompt('');
    setMessages(INITIAL_MESSAGES);
    setGeneratedTitle(FALLBACK_GENERATION.title);
    setGeneratedText(FALLBACK_GENERATION.content);
    setActiveGenerationId(FALLBACK_GENERATION.id);
    setStatus('New AI draft started. Describe the exact text you want to generate.');
  }

  async function startNewTextGeneration() {
    if (generating) {
      return;
    }

    const prompt = buildPromptFromSettings(settings);
    setDraftPrompt(prompt);
    setMessages(INITIAL_MESSAGES);
    await generateText('generate', prompt);
  }

  function updateSetting(key: keyof LabSettings, value: string) {
    setSettings((current) => ({ ...current, [key]: value }));
    setStatus(`${toTitleCase(key)} set to ${value}. The next generation will use this setting.`);
  }

  async function generateText(mode: GenerationMode, promptOverride?: string) {
    const basePrompt =
      mode === 'regenerate'
        ? activeGeneration?.prompt || draftPrompt.trim()
        : (promptOverride ?? draftPrompt).trim();

    if (!basePrompt) {
      setStatus('Describe the text you want to generate first.');
      return;
    }

    const userMessage =
      mode === 'refine'
        ? `Refine the current draft with this instruction: ${basePrompt}`
        : basePrompt;

    const nextMessages: ChatMessage[] =
      mode === 'regenerate'
        ? [...messages, { id: crypto.randomUUID(), role: 'assistant', content: 'Regenerating the text with the same request and current settings...' }]
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
          ? 'Refining the draft with Gemini...'
          : 'Generating a fresh text with Gemini...'
        : 'Cloud AI is not configured, so I am creating a local practice draft instead.',
    );

    try {
      const prompt = buildGeminiPrompt({
        mode,
        settings,
        userPrompt: basePrompt,
        currentText: generatedText,
      });

      const generation = geminiReady
        ? await generateWithGemini(prompt)
        : {
            content: createLocalPracticeText({ mode, settings, userPrompt: basePrompt, currentText: generatedText }),
            usedFallback: true,
            fallbackReason: 'Gemini API key is missing.',
          };

      const content = sanitizeGeneratedText(generation.content);
      if (!content) {
        throw new Error('The generator returned an empty response.');
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
          ? `Done. I created "${title}" with the local draft engine because the cloud generator was not available. You can edit it, save it, or start practice now.`
          : mode === 'refine'
            ? `Done. I refined "${title}" and updated the editor.`
            : `Done. I created "${title}" and saved it to your generation history.`,
      };

      setMessages((current) => [...current, assistantMessage]);
      setGeneratedTitle(title);
      setGeneratedText(content);
      setDraftPrompt(basePrompt);
      setStatus(
        generation.usedFallback
          ? `"${title}" is ready. ${generation.fallbackReason ? formatGeneratorError(generation.fallbackReason) : 'Local fallback was used.'}`
          : `"${title}" is ready.`,
      );

      if (record) {
        setHistory((current) => [record, ...current.filter((item) => item.id !== record.id)]);
        setActiveGenerationId(record.id);
      }
    } catch (error) {
      const message = formatGeneratorError(error);
      setStatus(message);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `I could not complete that request. ${message}`,
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
      createdAtLabel: 'Just now',
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
      setStatus(error?.message ?? 'The text was generated, but history could not be saved.');
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
      createdAtLabel: formatRelativeTime(data.created_at),
      createdAtValue: data.created_at,
    };
  }

  async function saveToLibrary() {
    if (!user) {
      setStatus('You need to sign in before saving texts to your library.');
      return;
    }

    if (!supabaseReady) {
      setStatus('Add Supabase env values before saving to your library.');
      return;
    }

    setSavingToLibrary(true);

    const { error } = await supabase.from('saved_texts').insert({
      user_id: user.id,
      title: generatedTitle,
      level: settings.level,
      category: settings.category,
      source: 'AI Lab',
      body: generatedText,
    });

    setSavingToLibrary(false);
    setStatus(error ? error.message : `"${generatedTitle}" was saved to your library.`);
  }

  async function saveGeneratedSnapshot() {
    if (!draftPrompt.trim()) {
      setStatus('Generate or load a text first.');
      return;
    }

    setSaving(true);
    const result = await persistGeneration({
      title: generatedTitle,
      prompt: draftPrompt.trim(),
      content: generatedText,
      level: settings.level,
      language: settings.language,
      category: settings.category,
    });
    setSaving(false);

    if (result) {
      setHistory((current) => [result, ...current.filter((item) => item.id !== result.id)]);
      setActiveGenerationId(result.id);
      setStatus('Current AI draft snapshot saved.');
    }
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(generatedText);
      setStatus('Generated text copied to clipboard.');
    } catch {
      setStatus('Clipboard access is not available in this browser.');
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
    setStatus('Text file downloaded.');
  }

  function startPracticeNow() {
    navigate('/workspace', {
      state: {
        sourceText: stripTitleFromPracticeText(generatedText),
        title: generatedTitle,
        language: settings.language,
        cefrLevel: settings.level,
      },
    });
  }

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 pt-24 sm:pt-28">
      <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-6 lg:gap-8">
        <aside className="bg-surface-container-low rounded-[2rem] border border-outline-variant/10 whisper-shadow flex flex-col overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-surface-container">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="font-headline font-bold text-lg text-on-surface">AI Lab</h2>
                <p className="text-xs text-on-surface-variant mt-1">Custom generation workspace</p>
              </div>
              <span className="bg-primary-container text-on-primary-container text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider uppercase">
                Pro
              </span>
            </div>

            <button
              type="button"
              onClick={() => void startNewTextGeneration()}
              disabled={generating}
              className="w-full py-3 px-4 rounded-2xl bg-surface-container-lowest text-on-surface font-semibold flex items-center justify-center gap-2 border border-surface-container hover:bg-surface-container transition-colors text-sm whisper-shadow disabled:opacity-60"
            >
              {generating ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {generating ? 'Generating...' : 'New Text Generation'}
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-4 border-b border-surface-container">
            <SidebarSelect label="Level" value={settings.level} options={LEVEL_OPTIONS} onChange={(value) => updateSetting('level', value)} />
            <SidebarSelect label="Language" value={settings.language} options={LANGUAGE_OPTIONS} onChange={(value) => updateSetting('language', value)} />
            <SidebarSelect label="Category" value={settings.category} options={CATEGORY_OPTIONS} onChange={(value) => updateSetting('category', value)} />
            <SidebarSelect label="Tone" value={settings.tone} options={TONE_OPTIONS} onChange={(value) => updateSetting('tone', value)} />
            <SidebarSelect label="Length" value={settings.length} options={LENGTH_OPTIONS} onChange={(value) => updateSetting('length', value)} />
            <button
              type="button"
              onClick={resetComposer}
              className="w-full text-xs font-bold text-primary hover:underline disabled:opacity-60"
              disabled={generating}
            >
              Clear current draft
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-6 pt-5">
            <div className="flex items-center justify-between gap-3 mb-4 px-2">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Past Generations</p>
              {loadingHistory && <LoaderCircle className="w-4 h-4 animate-spin text-primary" />}
            </div>
            <div className="space-y-2">
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
                <h1 className="font-headline font-bold text-xl text-on-surface">AI Workspace</h1>
                <p className="text-sm text-on-surface-variant mt-1">Talk to the generator, refine prompts, and keep your history attached to your account.</p>
              </div>
              <button type="button" className="p-2 text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
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
                placeholder="Describe the text you want. Example: Generate a C1 German text about cybersecurity policy with formal tone and practical vocabulary for interviews."
              />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-xs text-on-surface-variant">
                  {geminiReady
                    ? 'Gemini is ready. Your prompts will use the selected level, language, category, tone, and length.'
                    : 'Cloud AI is not configured. The local draft engine will keep generation, editing, and practice flow available.'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void generateText('generate')}
                    disabled={!canGenerate}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary text-on-primary font-bold hover:bg-primary-dim transition-all disabled:opacity-60"
                  >
                    {generating ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Generate
                  </button>
                  <button
                    type="button"
                    onClick={() => void generateText('refine')}
                    disabled={!draftPrompt.trim() || !generatedText.trim() || generating}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-surface-container bg-surface-container-lowest text-on-surface font-semibold hover:bg-surface-container transition-all disabled:opacity-60"
                  >
                    <Edit3 className="w-4 h-4" />
                    Refine via Chat
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
                  <h2 className="font-headline font-bold text-lg text-on-surface">Generated Text</h2>
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
                <InfoPill icon={<Sparkles className="w-3.5 h-3.5" />} label={`${settings.level} level`} />
                <InfoPill icon={<Bot className="w-3.5 h-3.5" />} label={settings.language} />
                <InfoPill icon={<Edit3 className="w-3.5 h-3.5" />} label={settings.tone} />
                <InfoPill icon={<Bookmark className="w-3.5 h-3.5" />} label={settings.category} />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <ControlButton
                  icon={<Edit3 className="w-4 h-4" />}
                  label="Refine via Chat"
                  onClick={() => void generateText('refine')}
                  disabled={!draftPrompt.trim() || !generatedText.trim() || generating}
                />
                <ControlButton
                  icon={generating ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  label="Regenerate"
                  onClick={() => void generateText('regenerate')}
                  disabled={!(activeGeneration?.prompt || draftPrompt.trim()) || generating}
                />
                <ControlButton
                  icon={<Bookmark className="w-4 h-4" />}
                  label={savingToLibrary ? 'Saving...' : 'Save to My Texts'}
                  onClick={() => void saveToLibrary()}
                  disabled={savingToLibrary || !supabaseReady || !user}
                />
                <button
                  type="button"
                  onClick={startPracticeNow}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-primary text-on-primary font-bold hover:bg-primary-dim transition-all active:scale-95 shadow-md shadow-primary/10 text-sm"
                >
                  <Keyboard className="w-4 h-4" />
                  Start Practice Now
                </button>
              </div>

              <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <button
                  type="button"
                  onClick={() => void saveGeneratedSnapshot()}
                  disabled={saving || !draftPrompt.trim()}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline disabled:opacity-60"
                >
                  {saving ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Bookmark className="w-4 h-4" />}
                  Save current draft snapshot
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
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
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
            {option}
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
      className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-surface-container text-on-surface-variant font-semibold hover:bg-surface-container transition-all active:scale-95 text-sm disabled:opacity-60"
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
  return `Generate a ${settings.level} ${settings.language} dictation text about ${settings.category.toLowerCase()} with a ${settings.tone.toLowerCase()} tone and ${settings.length.toLowerCase()} length. Include useful vocabulary, clear paragraphs, and natural sentence rhythm for listening practice.`;
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
  const sharedInstruction = `You are Scholar Script's AI writing assistant.
Generate clean dictation practice text only.
Keep the output polished, grammatically correct, and aligned to the requested CEFR level.
Language: ${settings.language}
CEFR level: ${settings.level}
Category: ${settings.category}
Tone: ${settings.tone}
Length: ${settings.length}

Return the result in this structure:
Title: <short title>

<main text in polished paragraphs>`;

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

Create a new practice text for Scholar Script.`;
}

async function generateWithGemini(prompt: string) {
  const ai = new GoogleGenAI({ apiKey: clientEnv.geminiApiKey.trim() });
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return {
        content: response.text ?? '',
        usedFallback: false,
        fallbackReason: '',
      };
    } catch (error) {
      lastError = error;
      if (!isRetryableGeneratorError(error) || attempt === maxAttempts) {
        break;
      }
      await wait(700 * attempt);
    }
  }

  return {
    content: createLocalPracticeTextFromPrompt(prompt),
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
  const topic = cleanTopic(userPrompt);
  const title = `${settings.category} Dictation: ${topic}`;
  const paragraphCount = settings.length === 'Short' ? 2 : settings.length === 'Long' ? 5 : 3;
  const sentenceSet =
    settings.language === 'German'
      ? [
          `Dieses Diktat behandelt ${topic} in einem ${settings.tone.toLowerCase()}en Stil.`,
          `Lernende auf dem Niveau ${settings.level} koennen zentrale Begriffe, genaue Formulierungen und klare Satzstrukturen ueben.`,
          `Der Text verbindet alltagsnahe Beispiele mit fachlichem Wortschatz aus dem Bereich ${settings.category.toLowerCase()}.`,
          `Beim Hoeren sollte man besonders auf Verben, Satzenden und wichtige Nomen achten.`,
          `So entsteht eine ruhige Uebung, die Konzentration, Rechtschreibung und Sprachgefuehl staerkt.`,
        ]
      : [
          `This dictation text explores ${topic} in a ${settings.tone.toLowerCase()} tone.`,
          `Learners at ${settings.level} level can practise precise vocabulary, clear sentence rhythm, and accurate spelling.`,
          `The text connects practical examples with useful language from the field of ${settings.category.toLowerCase()}.`,
          `While listening, students should pay close attention to verbs, endings, and key nouns.`,
          `The result is a focused practice task that supports fluency, concentration, and confident writing.`,
        ];

  if (mode === 'refine' && currentText.trim()) {
    return `Title: ${title}

${sentenceSet.slice(0, paragraphCount).join('\n\n')}

Revision note: ${settings.language === 'German' ? 'Der vorhandene Entwurf wurde anhand deiner Anweisung neu ausgerichtet.' : 'The existing draft has been adjusted according to your instruction.'}`;
  }

  return `Title: ${title}

${sentenceSet.slice(0, paragraphCount).join('\n\n')}`;
}

function createLocalPracticeTextFromPrompt(prompt: string) {
  const settings: LabSettings = {
    level: prompt.match(/CEFR level:\s*(.+)/i)?.[1]?.trim() || FALLBACK_SETTINGS.level,
    language: prompt.match(/Language:\s*(.+)/i)?.[1]?.trim() || FALLBACK_SETTINGS.language,
    category: prompt.match(/Category:\s*(.+)/i)?.[1]?.trim() || FALLBACK_SETTINGS.category,
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
  const text = getErrorText(error).toLowerCase();
  return text.includes('503') || text.includes('unavailable') || text.includes('overloaded') || text.includes('rate');
}

function formatGeneratorError(error: unknown) {
  const text = getErrorText(error);
  const lowerText = text.toLowerCase();

  if (lowerText.includes('503') || lowerText.includes('unavailable') || lowerText.includes('high demand')) {
    return 'The cloud generator is busy right now, so I used the local draft engine instead.';
  }

  if (lowerText.includes('api key')) {
    return 'The Gemini API key is missing or invalid, so I used the local draft engine instead.';
  }

  if (lowerText.includes('quota') || lowerText.includes('rate')) {
    return 'The cloud generator hit a temporary usage limit, so I used the local draft engine instead.';
  }

  return text || 'The generator could not finish the request.';
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

function cleanTopic(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/^(generate|create|write|refine|improve)\s+/i, '')
    .trim()
    .slice(0, 72) || 'focused practice';
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

function sanitizeGeneratedText(content: string) {
  return content.replace(/\r\n/g, '\n').trim();
}

function stripTitleFromPracticeText(content: string) {
  return content.replace(/^title:\s*.+\n*/i, '').trim();
}

function formatRelativeTime(value: string) {
  const now = Date.now();
  const date = new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.round((now - date) / 60000));

  if (diffMinutes < 1) {
    return 'Just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} mins ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return new Date(value).toLocaleDateString('en-US', {
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
  if (lowerPrompt.includes('english')) {
    return 'English';
  }
  return fallbackLanguage;
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
