import { useI18n } from '../i18n';

export function LanguageSwitch({ className = '' }: { className?: string }) {
  const { language, setLanguage, t } = useI18n();

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full bg-surface-container-low px-1 py-1 text-[11px] font-headline font-bold text-on-surface-variant ${className}`}
      aria-label={t('nav.language')}
    >
      {(['en', 'de'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLanguage(option)}
          className={`rounded-full px-3 py-1.5 transition ${
            language === option ? 'bg-primary text-on-primary shadow-sm' : 'hover:bg-surface-container'
          }`}
          aria-pressed={language === option}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
