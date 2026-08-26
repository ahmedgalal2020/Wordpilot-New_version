import { Bot, LoaderCircle, LockKeyhole, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CefrLevel, LearningLanguage } from '../../../lib/learning';
import type { PathCopy } from '../types';

export function AiPracticeSection({
  copy,
  language,
  level,
  isPro,
  loadingEntitlements,
}: {
  copy: PathCopy;
  language: LearningLanguage;
  level: CefrLevel;
  isPro: boolean;
  loadingEntitlements: boolean;
}) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest p-6 whisper-shadow sm:p-8 lg:col-span-5">
      <div className="flex items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-widest text-primary">
        <Bot className="h-4 w-4" />
        {copy.aiEyebrow}
      </div>
      <h2 className="mt-3 font-headline text-2xl font-black text-on-surface">{copy.aiTitle}</h2>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">{copy.aiDescription}</p>
      {loadingEntitlements ? (
        <div className="mt-6 inline-flex items-center gap-2 text-sm text-on-surface-variant">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          {copy.checkingAccess}
        </div>
      ) : isPro ? (
        <Link
          to="/ai-lab"
          state={{ language, level, skillType: 'Dictation', fromPracticePath: true }}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary"
        >
          <Sparkles className="h-4 w-4" />
          {copy.generate}
        </Link>
      ) : (
        <div className="mt-6 rounded-2xl border border-primary/10 bg-primary/5 p-5">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-bold text-on-surface">{copy.premiumTitle}</p>
              <p className="mt-1 text-sm text-on-surface-variant">{copy.premiumDescription}</p>
              <Link to="/pricing" className="mt-4 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary">
                {copy.upgrade}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}