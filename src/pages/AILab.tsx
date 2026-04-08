import React, { useState } from 'react';
import { Send, Share2, Download, Plus, Bot, User, Bolt, MoreVertical, Edit3, RefreshCw, Bookmark, Keyboard } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ChatMessage } from '@/src/types';
import { api } from '@/src/lib/api';

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: '1', role: 'assistant', content: "Hello! I'm your Academic Assistant. What kind of practice text should we create today? You can specify the topic, CEFR level, or specific vocabulary goals." },
];

export default function AILab() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [prompt, setPrompt] = useState('Generate a B2 English text about sustainability focusing on renewable energy trends.');
  const [generatedText, setGeneratedText] = useState('Your generated practice text will appear here after you send a prompt.');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitPrompt = async () => {
    if (!prompt.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: prompt.trim(),
    };

    setMessages((current) => [...current, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.generateText(prompt.trim());
      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: 'Done. I generated a new dictation text in the right panel.',
      };

      setGeneratedText(result.text);
      setMessages((current) => [...current, assistantMessage]);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to generate text.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex h-[calc(100vh-64px)] overflow-hidden pt-16">
      <aside className="w-72 bg-surface-container-low flex flex-col border-r border-surface-container">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline font-bold text-lg text-on-surface">AI Lab</h2>
            <span className="bg-primary-container text-on-primary-container text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase">Premium</span>
          </div>
          <button className="w-full py-3 px-4 rounded-xl bg-surface-container-lowest text-on-surface font-semibold flex items-center justify-center gap-2 border border-surface-container hover:bg-surface-container transition-colors text-sm whisper-shadow">
            <Plus className="w-4 h-4" />
            New Text Generation
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-2 mb-4">Past Generations</p>
          <div className="space-y-1">
            <HistoryItem title="Sustainability Trends B2" time="Now" active />
          </div>
        </div>
        <div className="p-4 bg-surface-container mt-auto">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-lowest/40">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
              <Bolt className="w-4 h-4 text-primary fill-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">Pro Account</p>
              <p className="text-[10px] text-on-surface-variant">Unlimited AI generations</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col md:flex-row bg-surface overflow-hidden">
        <section className="flex-1 flex flex-col border-r border-surface-container relative">
          <div className="p-6 border-b border-surface-container flex items-center justify-between">
            <div>
              <h1 className="font-headline font-bold text-xl text-on-surface">AI Workspace</h1>
              <p className="text-xs text-on-surface-variant">Describe your learning goals to generate custom text.</p>
            </div>
            <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
            {messages.map((msg) => (
              <div key={msg.id} className={cn('flex gap-4 max-w-[85%]', msg.role === 'user' && 'ml-auto flex-row-reverse')}>
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', msg.role === 'assistant' ? 'bg-secondary-container text-secondary' : 'bg-primary text-on-primary')}>
                  {msg.role === 'assistant' ? <Bot className="w-4 h-4 fill-secondary" /> : <User className="w-4 h-4 fill-on-primary" />}
                </div>
                <div className={cn('p-4 rounded-2xl shadow-sm leading-relaxed text-sm', msg.role === 'assistant' ? 'bg-surface-container-highest rounded-tl-none text-on-surface' : 'bg-primary-container rounded-tr-none text-on-primary-container')}>
                  {msg.content}
                </div>
              </div>
            ))}
            {error && <p className="text-sm text-error bg-error-container/30 rounded-xl p-3">{error}</p>}
          </div>

          <div className="p-6 glass-panel">
            <div className="max-w-2xl mx-auto relative">
              <textarea
                className="w-full bg-surface-container-lowest border border-surface-container rounded-2xl py-4 pl-5 pr-14 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none resize-none shadow-sm placeholder:text-on-surface-variant/50"
                placeholder="Type instructions here... (e.g. 'Make it more professional')"
                rows={2}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <button onClick={submitPrompt} disabled={isLoading} className="absolute right-2 top-2 p-3 bg-primary text-on-primary rounded-xl hover:bg-primary-dim transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-60">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        <section className="flex-1 flex flex-col bg-surface-container-lowest overflow-hidden">
          <div className="p-6 border-b border-surface-container flex items-center justify-between bg-surface-container-lowest">
            <div className="flex items-center gap-3">
              <div className={cn('w-2 h-2 rounded-full', isLoading ? 'bg-primary animate-pulse' : 'bg-outline-variant')}></div>
              <h2 className="font-headline font-bold text-lg text-on-surface">Generated Text</h2>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-10">
            <div className="max-w-prose mx-auto">
              <textarea className="w-full h-full min-h-[500px] border-none focus:ring-0 p-0 text-lg leading-loose text-on-surface font-normal" spellCheck={false} value={generatedText} onChange={(e) => setGeneratedText(e.target.value)} />
            </div>
          </div>

          <div className="p-8 border-t border-surface-container bg-surface-container-low/30">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <ControlButton icon={<Edit3 className="w-4 h-4" />} label="Refine via Chat" />
              <ControlButton icon={<RefreshCw className="w-4 h-4" />} label="Regenerate" />
              <ControlButton icon={<Bookmark className="w-4 h-4" />} label="Save to My Texts" />
              <button className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary-dim transition-all active:scale-95 shadow-md shadow-primary/10 text-sm">
                <Keyboard className="w-4 h-4" />
                Start Practice Now
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function HistoryItem({ title, time, active }: { title: string; time: string; active?: boolean }) {
  return (
    <button className={cn('w-full text-left p-3 rounded-xl transition-colors group', active ? 'bg-surface-container-highest/50 border-l-4 border-primary' : 'hover:bg-surface-container')}>
      <p className={cn('text-sm line-clamp-1', active ? 'font-semibold text-on-surface' : 'font-medium text-on-surface-variant group-hover:text-on-surface')}>
        {title}
      </p>
      <p className="text-[11px] text-on-surface-variant/60 mt-1">{time}</p>
    </button>
  );
}

function ControlButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-surface-container text-on-surface-variant font-semibold hover:bg-surface-container transition-all active:scale-95 text-sm">
      {icon}
      {label}
    </button>
  );
}
