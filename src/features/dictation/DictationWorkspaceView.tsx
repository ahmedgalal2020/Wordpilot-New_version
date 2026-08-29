import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { DictationWorkspaceController } from './useDictationWorkspace';
import { DictationPracticePanel } from './sections/DictationPracticePanel';
import { DictationResultModal } from './sections/DictationResultModal';
import { DictationSourcePanel } from './sections/DictationSourcePanel';
import { useI18n } from '../../i18n';

export function DictationWorkspaceView({ workspace }: { workspace: DictationWorkspaceController }) {
  const location = useLocation();
  const { language, translateLanguageName } = useI18n();
  const copy = dictationViewCopy[language];
  const {
    sessionLanguageLabel,
    selectedLanguage,
    sessionLevel,
    profile,
    practiceCategory,
    skillMode,
    accuracy,
  } = workspace;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    const settleTimer = window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, 0);

    return () => window.clearTimeout(settleTimer);
  }, [location.key]);

  return (
    <main className="wp-shell py-10 pt-24 sm:py-12 sm:pt-28">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
              {sessionLanguageLabel ? translateLanguageName(sessionLanguageLabel) : translateLanguageName(selectedLanguage === 'de-DE' ? 'German' : 'English')}
            </span>
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
              {copy.level(sessionLevel || profile?.cefr_level || 'B1')}
            </span>
            <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
              {practiceCategory}
            </span>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tighter text-on-surface font-headline">{copy.exerciseTitle(skillMode.shortTitle)}</h1>
          <p className="text-on-surface-variant max-w-2xl font-medium">
            {skillMode.instruction}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase">{copy.accuracy}</span>
          <div className="flex items-center gap-4 bg-surface-container-high px-6 py-3 rounded-2xl whisper-shadow">
            <div className="text-2xl font-bold font-headline text-primary">{accuracy}%</div>
            <div className="w-32 h-2 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="bg-primary h-full transition-all duration-500" style={{ width: `${accuracy}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <DictationSourcePanel workspace={workspace} />
        <DictationPracticePanel workspace={workspace} />
      </div>

      <DictationResultModal workspace={workspace} />

    </main>
  );
}

const dictationViewCopy = {
  en: {
    level: (level: string) => `Level ${level}`,
    exerciseTitle: (title: string) => `${title} Exercise`,
    accuracy: 'Accuracy',
  },
  de: {
    level: (level: string) => `Niveau ${level}`,
    exerciseTitle: (title: string) => `${title}-Übung`,
    accuracy: 'Genauigkeit',
  },
};
