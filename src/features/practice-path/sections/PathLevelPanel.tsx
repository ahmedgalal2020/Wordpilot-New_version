import { CheckCircle, LoaderCircle, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../../i18n';
import type { CefrLevel, LearningLanguage } from '../../../lib/learning';

const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function PathLevelPanel({
  language,
  selectedLevel,
  saving,
  hasChanges,
  status,
  onSelect,
  onSave,
}: {
  language: LearningLanguage;
  selectedLevel: CefrLevel;
  saving: boolean;
  hasChanges: boolean;
  status: string | null;
  onSelect: (level: CefrLevel) => void;
  onSave: () => void;
}) {
  const { language: interfaceLanguage, translateLanguageName } = useI18n();
  const copy = interfaceLanguage === 'de'
    ? {
        eyebrow: 'Aktiver Lernweg',
        title: `${translateLanguageName(language)} ${selectedLevel}`,
        body: 'Dieser Plan basiert auf deiner gewählten Lernsprache. Ändere hier nur dein Niveau.',
        levelLabel: 'Niveau wählen',
        saved: 'Gespeichert',
        save: 'Niveau speichern',
        saving: 'Speichern...',
        account: 'Sprache ändern',
      }
    : {
        eyebrow: 'Active path',
        title: `${translateLanguageName(language)} ${selectedLevel}`,
        body: 'This plan is based on the language you selected during setup. Change only the level here.',
        levelLabel: 'Choose level',
        saved: 'Saved',
        save: 'Save level',
        saving: 'Saving...',
        account: 'Change language',
      };

  return (
    <section className="rounded-[2rem] bg-surface-container-lowest p-6 whisper-shadow sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="mb-2 text-[0.6875rem] font-bold uppercase tracking-widest text-primary">{copy.eyebrow}</p>
          <h2 className="font-headline text-3xl font-black tracking-tight text-on-surface">{copy.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">{copy.body}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link to="/account" className="inline-flex items-center justify-center gap-2 rounded-full bg-surface-container-low px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container">
            <Settings className="h-4 w-4" />
            {copy.account}
          </Link>
          {hasChanges ? (
            <button type="button" onClick={onSave} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary transition hover:bg-primary-dim disabled:opacity-70">
              {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {saving ? copy.saving : copy.save}
            </button>
          ) : (
            <span className="inline-flex items-center justify-center gap-2 rounded-full bg-tertiary-container px-4 py-2 text-xs font-bold text-tertiary">
              <CheckCircle className="h-4 w-4" />
              {copy.saved}
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-surface-container-low p-4 sm:p-5">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{copy.levelLabel}</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {LEVELS.map((level) => {
            const active = selectedLevel === level;

            return (
              <button
                key={level}
                type="button"
                onClick={() => onSelect(level)}
                aria-pressed={active}
                className={`flex h-16 items-center justify-center rounded-2xl border font-headline text-xl font-black transition sm:h-20 ${
                  active
                    ? 'border-primary bg-primary text-on-primary shadow-sm'
                    : 'border-transparent bg-surface-container-lowest text-on-surface hover:border-primary/30 hover:bg-white'
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>

      {status && <div className="mt-5 rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface">{status}</div>}
    </section>
  );
}
