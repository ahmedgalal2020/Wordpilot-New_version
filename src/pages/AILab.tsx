import React, { useState } from 'react';
import { Send, Bookmark } from 'lucide-react';
import { apiFetch } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';

export default function AILab() {
  const { token } = useAuth();
  const [prompt, setPrompt] = useState('Generate a B2 English text about sustainability.');
  const [generatedText, setGeneratedText] = useState('');
  const [status, setStatus] = useState('');

  const generate = async () => {
    if (!token) return;
    setStatus('Generating...');
    try {
      const res = await apiFetch<{ generatedText: string }>('/ai/generate', { method: 'POST', body: JSON.stringify({ prompt, level: 'B2', topic: 'Sustainability' }) }, token);
      setGeneratedText(res.generatedText);
      setStatus('Generated successfully');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Failed to generate');
    }
  };

  const save = async () => {
    if (!token || !generatedText) return;
    await apiFetch('/texts', { method: 'POST', body: JSON.stringify({ title: 'AI Generated Text', content: generatedText, level: 'B2', category: 'AI Lab' }) }, token);
    setStatus('Saved to library');
  };

  return (
    <main className="pt-24 px-8 pb-12 max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-headline font-bold">AI Lab</h1>
      <div className="bg-surface-container-lowest rounded-2xl p-6 whisper-shadow space-y-4">
        <textarea className="w-full min-h-28 p-4 rounded-xl bg-surface-container-low" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <button onClick={generate} className="px-6 py-3 rounded-xl bg-primary text-on-primary font-semibold inline-flex items-center gap-2"><Send className="w-4 h-4" /> Generate</button>
        {status && <p className="text-sm text-on-surface-variant">{status}</p>}
      </div>
      <div className="bg-surface-container-lowest rounded-2xl p-6 whisper-shadow space-y-4">
        <h2 className="font-semibold">Generated Text</h2>
        <textarea className="w-full min-h-64 p-4 rounded-xl bg-surface-container-low" value={generatedText} onChange={(e) => setGeneratedText(e.target.value)} />
        <button onClick={save} className="px-6 py-3 rounded-xl border border-surface-container inline-flex items-center gap-2"><Bookmark className="w-4 h-4" /> Save to My Texts</button>
      </div>
    </main>
  );
}
