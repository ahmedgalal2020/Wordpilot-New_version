import React, { useEffect, useState } from 'react';
import { BookOpen, History } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SavedText } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { hasSupabaseEnv } from '../lib/env';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

const FALLBACK_SAVED_TEXTS: SavedText[] = [
  { id: '1', title: 'The Great Gatsby - Ch 1', level: 'C1', category: 'Literary Narrative', icon: 'book', body: 'In my younger and more vulnerable years my father gave me some advice...' },
  { id: '2', title: 'World War II Overview', level: 'B2', category: 'Historical Non-fiction', icon: 'history', body: 'World War II was a global conflict that lasted from 1939 to 1945...' },
];

export default function LibraryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [savedTexts, setSavedTexts] = useState<SavedText[]>(FALLBACK_SAVED_TEXTS);

  useEffect(() => {
    if (!user || !hasSupabaseEnv()) {
      return;
    }

    async function loadSavedTexts() {
      const { data, error } = await supabase
        .from('saved_texts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setSavedTexts(
          data.map((text, index) => ({
            id: text.id,
            title: text.title,
            level: text.level ?? 'B1',
            category: text.category ?? 'General',
            icon: index % 2 === 0 ? 'book' : 'history',
            body: text.body ?? '',
            source: text.source ?? '',
            createdAt: text.created_at,
          })),
        );
      }
    }

    void loadSavedTexts();
  }, [user]);

  function startPractice(text: SavedText) {
    navigate('/workspace', {
      state: {
        sourceText: text.body || text.source || text.title,
        title: text.title,
      },
    });
  }

  return (
    <main className="max-w-[1440px] mx-auto px-8 py-12 pt-28">
      <header className="mb-12">
        <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary mb-3">Library</p>
        <h1 className="font-headline font-extrabold text-4xl tracking-tight text-on-surface">Saved Texts</h1>
        <p className="text-on-surface-variant mt-3 max-w-2xl">
          A clean reading shelf for all texts you saved from AI Lab and future exercises, kept in the same visual language as the rest of the product.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {savedTexts.map((text) => (
          <div key={text.id} className="bg-surface-container-lowest rounded-[2rem] p-6 whisper-shadow flex items-start gap-5">
            <div
              className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0',
                text.icon === 'book' ? 'bg-tertiary-container text-tertiary' : 'bg-primary-container text-primary',
              )}
            >
              {text.icon === 'book' ? <BookOpen className="w-7 h-7" /> : <History className="w-7 h-7" />}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-headline font-bold text-2xl text-on-surface">{text.title}</h2>
                  <p className="text-sm text-on-surface-variant mt-2">
                    {text.level} Level • {text.category}
                  </p>
                </div>
                {text.createdAt && (
                  <span className="text-xs text-on-surface-variant">
                    {new Date(text.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>

              <p className="text-sm text-on-surface-variant leading-relaxed mt-4 line-clamp-4">
                {text.body || text.source || 'Open this text to start a new practice session from your library.'}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => startPractice(text)}
                  className="primary-gradient text-on-primary px-6 py-3 rounded-full text-sm font-bold"
                >
                  Practice Now
                </button>
                <Link to="/ai-lab" className="bg-surface-container text-on-surface px-6 py-3 rounded-full text-sm font-bold hover:bg-surface-container-high">
                  Open AI Lab
                </Link>
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
