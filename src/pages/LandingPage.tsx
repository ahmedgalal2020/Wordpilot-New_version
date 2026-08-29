import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  CheckCircle,
  Headphones,
  Keyboard,
  LineChart,
  Mic2,
  PlayCircle,
  Sparkles,
  Target,
  Trophy,
  Video,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n';

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDvP-Y4L4_Ivh3NL_B9rVLzERpgA5dKN7agCr8KMVg_aVI8g6FxMCNMy3dg7rldeA78jXrhbBTVffOSsqv2M6YLoft-2BMqaW_JfHLIGNxCJrSf0UwgwnmmieYa1JPzUnc5ktpAVwQG9Byvn13YEut3s9dPjmnaYvK9JXTViEbZrEZywzmHnnJePi9hcuXlrFLD-YbHEhKVSu6LzLoOhKS1Jbk8nj9J1EsKQBZ02rJMoq8oZf4ELfv0PyPDIgTvNXNoMqx9eKcW8xs';

const proofMetrics = [
  { icon: Target, label: 'Practice modes', value: '4', detail: 'AI, dictation, shadowing, exercises' },
  { icon: Trophy, label: 'CEFR levels', value: 'A1-C2', detail: 'From first words to fluent control' },
  { icon: Headphones, label: 'Core languages', value: 'EN + DE', detail: 'English and German workflows' },
];

const productPillars = [
  {
    icon: Bot,
    title: 'AI Lab',
    description: 'Generate clean practice texts around the topics, level, tone, and vocabulary your learner actually needs.',
    to: '/ai-lab',
    color: 'primary',
  },
  {
    icon: Keyboard,
    title: 'Dictation',
    description: 'Listen, type, compare, and review mistakes with a practice flow that stays focused on accuracy and recall.',
    to: '/workspace',
    color: 'secondary',
  },
  {
    icon: Mic2,
    title: 'Shadowing',
    description: 'Turn real video into sentence-by-sentence speaking practice with recording, scoring, and saved feedback.',
    to: '/shadowing',
    color: 'tertiary',
  },
  {
    icon: Target,
    title: 'Practice Path',
    description: 'Follow a personal route by language, current level, and target level instead of guessing what to study next.',
    to: '/practice-path',
    color: 'primary',
  },
];

const learningSteps = [
  { number: '01', title: 'Choose your route', body: 'Set your native language, target language, current level, and goal level.' },
  { number: '02', title: 'Practice with context', body: 'Move between AI texts, dictation, video shadowing, and structured exercises.' },
  { number: '03', title: 'Review what matters', body: 'Track scores, missed words, difficult sentences, and progress over time.' },
];

const outcomes = ['Speak with more confidence', 'Catch real sentence rhythm', 'Build accurate spelling recall', 'Keep every session in one progress history'];

const landingCopy = {
  en: {
    eyebrow: 'AI language practice workspace',
    headline: 'WordPilot',
    intro:
      'Build a personal language routine from AI-generated lessons, dictation, video shadowing, and level-based practice paths. One workspace for listening, speaking, writing, and measurable progress.',
    openDashboard: 'Open your dashboard',
    startLearning: 'Start learning free',
    viewPath: 'View practice path',
    seePlans: 'See plans',
    proofMetrics,
    productPillars,
    workflowEyebrow: 'Complete workflow',
    workflowTitle: 'Everything a learner needs after signing in',
    workflowBody:
      'WordPilot connects the pieces that usually live in separate tools: lesson generation, guided practice, speech work, saved history, and progress review.',
    pathEyebrow: 'Learning path',
    pathTitle: 'From first setup to daily momentum',
    pathBody:
      "The product starts with the learner's language goal, then keeps the next useful action visible across the dashboard and practice pages.",
    learningSteps,
    outcomes,
    stayEyebrow: 'Why learners stay with it',
    stayTitle: 'Practice feels lighter when the system remembers the hard parts.',
    progressEyebrow: 'Progress review',
    progressTitle: 'Scores, misses, and next steps',
    progressBody: 'Every practice session can feed the dashboard, so learners see what improved, what still needs work, and where to go next.',
    ctaEyebrow: 'Ready for real practice',
    ctaTitle: 'Give learners a reason to come back tomorrow.',
    ctaBody: 'Start with a clear path, generate the right material, practice with feedback, then keep the progress visible.',
    continueLearning: 'Continue learning',
    createAccount: 'Create free account',
    comparePlans: 'Compare plans',
    livePractice: 'Live practice',
    today: 'Today',
    sprint: 'Speaking sprint',
    previewPlay: 'Play preview',
    score: 'Score',
    streak: 'Streak',
    level: 'Level',
    explore: 'Explore workflow',
    routeEyebrow: 'Personal route',
    routeTitle: 'German from A1 to B2',
    complete: '41% complete',
    nextFocus: 'Next focus',
    nextFocusTitle: 'Daily routine shadowing',
    nextFocusBody: 'Practice short natural sentences, compare pronunciation, then review the words that kept lowering the score.',
  },
  de: {
    eyebrow: 'KI-Arbeitsbereich für Sprachtraining',
    headline: 'WordPilot',
    intro:
      'Baue eine persönliche Lernroutine aus KI-Lektionen, Diktat, Video-Shadowing und niveaubasierten Übungspfaden. Ein Arbeitsbereich für Hören, Sprechen, Schreiben und messbaren Fortschritt.',
    openDashboard: 'Dashboard öffnen',
    startLearning: 'Kostenlos lernen',
    viewPath: 'Übungspfad ansehen',
    seePlans: 'Preise ansehen',
    proofMetrics: [
      { icon: Target, label: 'Übungsmodi', value: '4', detail: 'KI, Diktat, Shadowing, Übungen' },
      { icon: Trophy, label: 'CEFR-Niveaus', value: 'A1-C2', detail: 'Von ersten Wörtern bis sicherer Kontrolle' },
      { icon: Headphones, label: 'Kernsprachen', value: 'EN + DE', detail: 'Englische und deutsche Workflows' },
    ],
    productPillars: [
      {
        icon: Bot,
        title: 'KI-Lab',
        description: 'Erstelle saubere Übungstexte passend zu Thema, Niveau, Ton und Wortschatz.',
        to: '/ai-lab',
        color: 'primary',
      },
      {
        icon: Keyboard,
        title: 'Diktat',
        description: 'Hören, tippen, vergleichen und Fehler in einem konzentrierten Trainingsfluss prüfen.',
        to: '/workspace',
        color: 'secondary',
      },
      {
        icon: Mic2,
        title: 'Shadowing',
        description: 'Verwandle echte Videos in Satz-für-Satz-Sprechtraining mit Aufnahme, Score und Feedback.',
        to: '/shadowing',
        color: 'tertiary',
      },
      {
        icon: Target,
        title: 'Übungspfad',
        description: 'Folge einer persönlichen Route nach Sprache, aktuellem Niveau und Zielniveau.',
        to: '/practice-path',
        color: 'primary',
      },
    ],
    workflowEyebrow: 'Kompletter Workflow',
    workflowTitle: 'Alles, was Lernende nach dem Login brauchen',
    workflowBody:
      'WordPilot verbindet Dinge, die sonst in getrennten Tools liegen: Lektionen erstellen, geführt üben, sprechen, Verlauf speichern und Fortschritt prüfen.',
    pathEyebrow: 'Lernpfad',
    pathTitle: 'Von der ersten Einrichtung bis zur täglichen Routine',
    pathBody: 'Das Produkt startet mit dem Sprachziel und hält danach die nächste sinnvolle Aktion im Dashboard und in den Übungsseiten sichtbar.',
    learningSteps: [
      { number: '01', title: 'Route wählen', body: 'Lege Muttersprache, Zielsprache, aktuelles Niveau und Zielniveau fest.' },
      { number: '02', title: 'Mit Kontext üben', body: 'Wechsle zwischen KI-Texten, Diktat, Video-Shadowing und strukturierten Übungen.' },
      { number: '03', title: 'Wichtiges wiederholen', body: 'Verfolge Scores, fehlende Wörter, schwierige Sätze und Fortschritt über Zeit.' },
    ],
    outcomes: ['Sicherer sprechen', 'Echten Satzrhythmus hören', 'Schreibgenauigkeit aufbauen', 'Jede Session im Fortschritt behalten'],
    stayEyebrow: 'Warum Lernende dranbleiben',
    stayTitle: 'Training fühlt sich leichter an, wenn das System die schweren Stellen merkt.',
    progressEyebrow: 'Fortschrittsreview',
    progressTitle: 'Scores, Fehler und nächste Schritte',
    progressBody: 'Jede Übung kann ins Dashboard fließen, damit Lernende sehen, was besser wurde, was offen ist und was als Nächstes kommt.',
    ctaEyebrow: 'Bereit für echtes Training',
    ctaTitle: 'Gib Lernenden einen Grund, morgen wiederzukommen.',
    ctaBody: 'Starte mit einem klaren Pfad, erstelle passendes Material, übe mit Feedback und halte Fortschritt sichtbar.',
    continueLearning: 'Weiterlernen',
    createAccount: 'Kostenloses Konto erstellen',
    comparePlans: 'Pläne vergleichen',
    livePractice: 'Live-Training',
    today: 'Heute',
    sprint: 'Sprech-Sprint',
    previewPlay: 'Vorschau abspielen',
    score: 'Score',
    streak: 'Serie',
    level: 'Niveau',
    explore: 'Workflow ansehen',
    routeEyebrow: 'Persönliche Route',
    routeTitle: 'Deutsch von A1 bis B2',
    complete: '41% abgeschlossen',
    nextFocus: 'Nächster Fokus',
    nextFocusTitle: 'Alltagsroutine shadowen',
    nextFocusBody: 'Übe kurze natürliche Sätze, vergleiche die Aussprache und prüfe danach Wörter, die den Score gesenkt haben.',
  },
};

export default function LandingPage() {
  const { user } = useAuth();
  const { language } = useI18n();
  const copy = landingCopy[language];
  const primaryHref = user ? '/dashboard' : '/signup';
  const secondaryHref = user ? '/practice-path' : '/pricing';

  return (
    <div className="pt-16">
      <section className="relative isolate overflow-hidden py-8 sm:py-10">
        <div className="absolute inset-0 -z-10 bg-surface" />
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-[0.16] grayscale"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-surface/85 via-surface/94 to-surface" aria-hidden="true" />

        <div className="wp-shell">
          <div className="flex flex-col gap-10 rounded-[2rem] border border-surface-container bg-surface-container-lowest/80 px-4 py-10 shadow-sm backdrop-blur sm:px-8 sm:py-14 lg:px-12 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mx-auto max-w-5xl text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-container px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary">
              <Sparkles className="h-4 w-4" />
              {copy.eyebrow}
            </span>
            <h1 className="mt-6 font-headline text-5xl font-extrabold leading-[0.98] text-on-surface sm:text-6xl lg:text-7xl">
              {copy.headline}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-on-surface-variant sm:text-xl">
              {copy.intro}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to={primaryHref}
                className="primary-gradient inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-headline text-base font-bold text-on-primary whisper-shadow transition hover:scale-[1.02] active:scale-[0.99] sm:px-8"
              >
                {user ? copy.openDashboard : copy.startLearning}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to={secondaryHref}
                className="inline-flex items-center justify-center rounded-full bg-surface-container px-6 py-3.5 font-headline text-base font-bold text-on-surface transition hover:bg-surface-container-high active:scale-[0.99] sm:px-8"
              >
                {user ? copy.viewPath : copy.seePlans}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12 }}
            className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]"
          >
            <ProductPreview />
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {copy.proofMetrics.map((metric) => (
                <ProofMetric key={metric.label} {...metric} />
              ))}
            </div>
          </motion.div>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-18 lg:py-20">
        <div className="wp-shell">
          <SectionIntro
            eyebrow={copy.workflowEyebrow}
            title={copy.workflowTitle}
            body={copy.workflowBody}
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {copy.productPillars.map((pillar) => (
              <PillarCard key={pillar.title} {...pillar} signedIn={Boolean(user)} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low py-14 sm:py-18 lg:py-20">
        <div className="wp-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <SectionIntro
              align="left"
              eyebrow={copy.pathEyebrow}
              title={copy.pathTitle}
              body={copy.pathBody}
            />
            <div className="mt-8 space-y-4">
              {copy.learningSteps.map((step) => (
                <div key={step.number} className="grid grid-cols-[3.5rem_1fr] gap-4 rounded-3xl bg-surface-container-lowest p-5 whisper-shadow">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-on-primary">{step.number}</span>
                  <div>
                    <h3 className="font-headline text-lg font-bold text-on-surface">{step.title}</h3>
                    <p className="mt-1 leading-7 text-on-surface-variant">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <JourneyPanel />
        </div>
      </section>

      <section className="py-14 sm:py-18 lg:py-20">
        <div className="wp-shell grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <div className="rounded-[2rem] bg-on-surface p-7 text-surface sm:p-9 lg:p-10">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-container">{copy.stayEyebrow}</span>
            <h2 className="mt-4 font-headline text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              {copy.stayTitle}
            </h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {copy.outcomes.map((outcome) => (
                <div key={outcome} className="flex items-center gap-3 rounded-2xl bg-white/8 p-4 text-sm font-semibold text-white">
                  <CheckCircle className="h-5 w-5 shrink-0 text-primary-container" />
                  <span>{outcome}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-surface-container bg-surface-container-lowest p-7 whisper-shadow sm:p-9 lg:p-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tertiary-container text-tertiary">
                <LineChart className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">{copy.progressEyebrow}</p>
                <h3 className="font-headline text-2xl font-extrabold text-on-surface">{copy.progressTitle}</h3>
              </div>
            </div>
            <div className="mt-8 space-y-4">
              <ProgressRow label="Dictation accuracy" value="86%" width="86%" />
              <ProgressRow label="Shadowing score" value="74%" width="74%" />
              <ProgressRow label="Path completion" value="41%" width="41%" />
            </div>
            <p className="mt-7 rounded-2xl bg-surface-container-low p-4 text-sm leading-6 text-on-surface-variant">
              {copy.progressBody}
            </p>
          </div>
        </div>
      </section>

      <section className="pb-16 sm:pb-20 lg:pb-24">
        <div className="wp-shell">
          <div className="overflow-hidden rounded-[2rem] primary-gradient px-6 py-12 text-center text-on-primary whisper-shadow sm:px-10 sm:py-16 lg:px-16">
          <span className="text-xs font-bold uppercase tracking-widest text-on-primary/75">{copy.ctaEyebrow}</span>
          <h2 className="mx-auto mt-4 max-w-3xl font-headline text-3xl font-extrabold leading-tight sm:text-5xl">
            {copy.ctaTitle}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-on-primary/82">
            {copy.ctaBody}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to={primaryHref}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-surface-container-lowest px-7 py-4 font-headline font-bold text-primary transition hover:scale-[1.02] active:scale-[0.99]"
            >
              {user ? copy.continueLearning : copy.createAccount}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center rounded-full bg-white/12 px-7 py-4 font-headline font-bold text-on-primary transition hover:bg-white/18 active:scale-[0.99]"
            >
              {copy.comparePlans}
            </Link>
          </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProductPreview() {
  const { language } = useI18n();
  const copy = landingCopy[language];

  return (
    <div className="rounded-[2rem] bg-surface-container-low p-3 whisper-shadow sm:p-4">
      <div className="overflow-hidden rounded-3xl bg-surface-container-lowest">
        <div className="flex items-center justify-between border-b border-surface-container px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-error-container" />
            <span className="h-2.5 w-2.5 rounded-full bg-tertiary-container" />
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          </div>
          <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-bold text-primary">{copy.livePractice}</span>
        </div>
        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <PreviewCard icon={Sparkles} title={copy.productPillars[0].title} body={copy.productPillars[0].description} />
            <PreviewCard icon={Headphones} title={copy.productPillars[1].title} body={copy.productPillars[1].description} />
            <PreviewCard icon={Video} title={copy.productPillars[2].title} body={copy.productPillars[2].description} />
          </div>
          <div className="rounded-3xl bg-surface-container-low p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">{copy.today}</p>
                <h3 className="mt-1 font-headline text-2xl font-extrabold text-on-surface">{copy.sprint}</h3>
              </div>
              <button className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary" aria-label={copy.previewPlay} type="button">
                <PlayCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-7 space-y-3">
              <WordLine active words={['I', 'want', 'to', 'speak', 'more', 'fluently']} />
              <WordLine words={['Listen', 'repeat', 'record', 'review']} />
              <WordLine words={['Score', 'missed', 'words', 'next', 'sentence']} />
            </div>
            <div className="mt-7 grid grid-cols-3 gap-3">
              <MiniScore label={copy.score} value="82%" />
              <MiniScore label={copy.streak} value="7" />
              <MiniScore label={copy.level} value="B1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProofMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  key?: React.Key;
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="group rounded-3xl border border-surface-container bg-surface-container-low p-4 transition hover:-translate-y-0.5 hover:bg-surface-container-lowest hover:shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
          <p className="mt-2 font-headline text-3xl font-extrabold tracking-tight text-on-surface">{value}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-primary transition group-hover:bg-primary group-hover:text-on-primary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-on-surface-variant">{detail}</p>
    </article>
  );
}

function PreviewCard({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <div className="rounded-3xl bg-surface-container-low p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-headline font-bold text-on-surface">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-on-surface-variant">{body}</p>
        </div>
      </div>
    </div>
  );
}

function WordLine({ words, active = false }: { words: string[]; active?: boolean }) {
  return (
    <div className={cn('flex flex-wrap gap-2 rounded-2xl p-3', active ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface-variant')}>
      {words.map((word) => (
        <span key={word} className="rounded-full bg-white/20 px-2.5 py-1 text-sm font-semibold">
          {word}
        </span>
      ))}
    </div>
  );
}

function MiniScore({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest p-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="mt-1 font-headline text-xl font-extrabold text-on-surface">{value}</p>
    </div>
  );
}

function SectionIntro({ eyebrow, title, body, align = 'center' }: { eyebrow: string; title: string; body: string; align?: 'center' | 'left' }) {
  return (
    <div className={cn('max-w-3xl', align === 'center' ? 'mx-auto text-center' : 'text-left')}>
      <span className="text-xs font-bold uppercase tracking-widest text-primary">{eyebrow}</span>
      <h2 className="mt-3 font-headline text-3xl font-extrabold leading-tight text-on-surface sm:text-4xl">{title}</h2>
      <p className="mt-4 text-lg leading-8 text-on-surface-variant">{body}</p>
    </div>
  );
}

function PillarCard({ icon: Icon, title, description, to, color, signedIn }: { key?: React.Key; icon: React.ElementType; title: string; description: string; to: string; color: string; signedIn: boolean }) {
  const { language } = useI18n();
  const copy = landingCopy[language];
  const colors: Record<string, string> = {
    primary: 'bg-primary-container text-primary',
    secondary: 'bg-secondary-container text-secondary',
    tertiary: 'bg-tertiary-container text-tertiary',
  };
  const href = signedIn ? to : '/signup';

  return (
    <Link to={href} className="group flex min-h-[18rem] flex-col justify-between rounded-3xl bg-surface-container-lowest p-6 whisper-shadow transition hover:-translate-y-1 hover:shadow-lg">
      <div>
        <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl transition group-hover:scale-105', colors[color])}>
          <Icon className="h-7 w-7" />
        </div>
        <h3 className="mt-6 font-headline text-2xl font-extrabold text-on-surface">{title}</h3>
        <p className="mt-3 leading-7 text-on-surface-variant">{description}</p>
      </div>
      <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">
        {copy.explore}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

function JourneyPanel() {
  const { language } = useI18n();
  const copy = landingCopy[language];

  return (
    <div className="rounded-[2rem] bg-surface-container-lowest p-5 whisper-shadow sm:p-7 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">{copy.routeEyebrow}</p>
          <h3 className="mt-1 font-headline text-2xl font-extrabold text-on-surface">{copy.routeTitle}</h3>
        </div>
        <span className="w-fit rounded-full bg-primary-container px-4 py-2 text-sm font-bold text-primary">{copy.complete}</span>
      </div>
      <div className="mt-7 h-3 overflow-hidden rounded-full bg-surface-container-high">
        <div className="h-full w-[41%] rounded-full bg-primary" />
      </div>
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        <PathTile icon={Headphones} label={language === 'de' ? 'Hören' : 'Listen'} value={language === 'de' ? '12 Aufgaben' : '12 tasks'} />
        <PathTile icon={Keyboard} label={language === 'de' ? 'Schreiben' : 'Write'} value={language === 'de' ? '8 Aufgaben' : '8 tasks'} />
        <PathTile icon={Mic2} label={language === 'de' ? 'Sprechen' : 'Speak'} value={language === 'de' ? '5 Aufgaben' : '5 tasks'} />
      </div>
      <div className="mt-7 rounded-3xl bg-surface-container-low p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{copy.nextFocus}</p>
            <p className="mt-2 font-headline text-xl font-bold text-on-surface">{copy.nextFocusTitle}</p>
          </div>
          <Trophy className="h-7 w-7 shrink-0 text-primary" />
        </div>
        <p className="mt-3 leading-7 text-on-surface-variant">{copy.nextFocusBody}</p>
      </div>
    </div>
  );
}

function PathTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-4">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="mt-1 font-headline text-lg font-extrabold text-on-surface">{value}</p>
    </div>
  );
}

function ProgressRow({ label, value, width }: { label: string; value: string; width: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm font-bold text-on-surface">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-surface-container-high">
        <div className="h-full rounded-full bg-primary" style={{ width }} />
      </div>
    </div>
  );
}

