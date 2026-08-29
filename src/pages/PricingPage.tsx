import React, { useMemo, useState } from 'react';
import { CheckCircle, ChevronDown, Beaker, Sparkles, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useEntitlements } from '../hooks/useEntitlements';
import { fetchApi } from '../lib/api';
import { useI18n } from '../i18n';

type FeatureItem = {
  text: string;
  included: boolean;
};

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'generation',
    question: 'How does the AI Lab generate texts?',
    answer:
      'AI Lab builds dictation texts from your chosen topic, CEFR level, language, tone, and length. You can generate a fresh draft, refine it, save it to your library, and move it straight into practice.',
  },
  {
    id: 'cefr',
    question: 'Which CEFR levels are supported?',
    answer:
      'WordPilot supports A1 through C2. The writing style, sentence length, and vocabulary density are adjusted to the level you select before generation or practice.',
  },
  {
    id: 'languages',
    question: 'Can I switch between languages?',
    answer:
      'Yes. You can work in English or German across AI Lab and Exercises, and the practice workspace now follows the language of the text you launch so the voice and dictation setup stay aligned.',
  },
  {
    id: 'discount',
    question: 'Is there a student discount available?',
    answer:
      'The current pricing page shows the standard plans. If you need an academic or team arrangement, use the contact route and we can handle that separately.',
  },
];

const FREE_FEATURES: FeatureItem[] = [
  { text: 'Save up to 3 texts in your library', included: true },
  { text: 'Manual correction and self-review', included: true },
  { text: 'Basic session history', included: true },
  { text: 'AI Lab generation tools', included: false },
];

const PRO_FEATURES: FeatureItem[] = [
  { text: 'Unlimited AI Lab generations and refinements', included: true },
  { text: 'Real-time dictation feedback', included: true },
  { text: 'Progress tracking and saved history', included: true },
  { text: 'English and German workflows', included: true },
  { text: 'CEFR targeting from A1 to C2', included: true },
];

const pricingCopy = {
  en: {
    faq: FAQ_ITEMS,
    freeFeatures: FREE_FEATURES,
    proFeatures: PRO_FEATURES,
    checkoutUnavailable: 'Checkout is temporarily unavailable. Please contact support or try again later.',
    unableCheckout: 'Unable to start checkout.',
    openAiLab: 'Open AI Lab',
    startFree: 'Start Free',
    startPractising: 'Start Practising',
    signIn: 'Sign In',
    headline: 'Simple Pricing for Focused Practice',
    intro: 'Pick the plan that matches your pace, then move between AI drafting, dictation practice, saved texts, and review without breaking flow.',
    essential: 'Essential',
    free: 'Free',
    freeDescription: 'A lightweight starting point for learners exploring the workspace.',
    continueFree: 'Continue Free',
    startForFree: 'Start for Free',
    proTier: 'WordPilot Pro',
    month: '/ month',
    proDescription: 'The full practice workflow with AI generation, saved drafts, and cleaner progress tracking.',
    currentPlan: 'Current Plan',
    checkingPlan: 'Checking Plan...',
    openingCheckout: 'Opening Checkout...',
    upgrade: 'Upgrade to Pro',
    aiLabTitle: 'Generate practice texts that already fit your level before you start dictation.',
    aiLabBody: 'Build English or German dictation scripts around your topic, level, and tone, then send them straight into Exercises with the right practice setup.',
    insightPills: ['CEFR adaptive', 'Topic-driven', 'Practice-ready', 'Library connected'],
    liveFlow: 'Live Flow',
    liveFlowBody: 'Generate, refine, save, then launch directly into dictation without manually rebuilding the same setup.',
    previewTags: ['B2 German', 'History', 'Academic'],
    faqTitle: 'Frequently Asked Questions',
    faqIntro: 'Short answers to the things people usually want to know before they commit to the workflow.',
    highlighted: 'Highlighted Answer',
    ctaTitle: 'Ready to build your next practice session?',
    ctaBody: 'Start with a text, open the exercise workspace, and let the product carry the setup from one step to the next.',
    current: 'Current',
    recommended: 'Recommended',
  },
  de: {
    faq: [
      {
        id: 'generation',
        question: 'Wie erstellt das KI-Lab Texte?',
        answer: 'Das KI-Lab erstellt Diktattexte aus Thema, CEFR-Niveau, Sprache, Ton und Länge. Du kannst Entwürfe generieren, verfeinern, speichern und direkt ins Training schicken.',
      },
      {
        id: 'cefr',
        question: 'Welche CEFR-Niveaus werden unterstützt?',
        answer: 'WordPilot unterstützt A1 bis C2. Schreibstil, Satzlänge und Wortschatzdichte passen sich dem Niveau an, das du vor dem Erstellen oder Üben auswählst.',
      },
      {
        id: 'languages',
        question: 'Kann ich zwischen Sprachen wechseln?',
        answer: 'Ja. Du kannst Englisch oder Deutsch im KI-Lab und in Übungen nutzen. Der Übungsbereich folgt der Sprache des Textes, damit Stimme und Diktat zusammenpassen.',
      },
      {
        id: 'discount',
        question: 'Gibt es einen Studentenrabatt?',
        answer: 'Die aktuelle Preisseite zeigt die Standardpläne. Für akademische oder Team-Lösungen kannst du den Kontaktbereich nutzen.',
      },
    ],
    freeFeatures: [
      { text: 'Bis zu 3 Texte in der Bibliothek speichern', included: true },
      { text: 'Manuelle Korrektur und Selbstreview', included: true },
      { text: 'Basis-Sessions im Verlauf', included: true },
      { text: 'KI-Lab Generierungstools', included: false },
    ],
    proFeatures: [
      { text: 'Unbegrenzte KI-Lab Generierungen und Verbesserungen', included: true },
      { text: 'Echtzeit-Diktatfeedback', included: true },
      { text: 'Fortschrittstracking und gespeicherter Verlauf', included: true },
      { text: 'Englische und deutsche Workflows', included: true },
      { text: 'CEFR-Ziele von A1 bis C2', included: true },
    ],
    checkoutUnavailable: 'Checkout ist vorübergehend nicht verfügbar. Kontaktiere den Support oder versuche es später erneut.',
    unableCheckout: 'Checkout konnte nicht gestartet werden.',
    openAiLab: 'KI-Lab öffnen',
    startFree: 'Kostenlos starten',
    startPractising: 'Training starten',
    signIn: 'Anmelden',
    headline: 'Einfache Preise für fokussiertes Training',
    intro: 'Wähle den Plan, der zu deinem Tempo passt, und wechsle ohne Reibung zwischen KI-Texten, Diktat, gespeicherten Texten und Review.',
    essential: 'Essential',
    free: 'Kostenlos',
    freeDescription: 'Ein leichter Einstieg für Lernende, die den Arbeitsbereich erkunden.',
    continueFree: 'Kostenlos weitermachen',
    startForFree: 'Kostenlos starten',
    proTier: 'WordPilot Pro',
    month: '/ Monat',
    proDescription: 'Der vollständige Übungsworkflow mit KI-Generierung, gespeicherten Entwürfen und klarerem Fortschrittstracking.',
    currentPlan: 'Aktueller Plan',
    checkingPlan: 'Plan wird geprüft...',
    openingCheckout: 'Checkout wird geöffnet...',
    upgrade: 'Auf Pro upgraden',
    aiLabTitle: 'Erstelle Übungstexte, die vor dem Diktat schon zu deinem Niveau passen.',
    aiLabBody: 'Baue englische oder deutsche Diktatskripte nach Thema, Niveau und Ton und sende sie direkt mit passender Einstellung in die Übungen.',
    insightPills: ['CEFR-adaptiv', 'Themenbasiert', 'Übungsbereit', 'Mit Bibliothek verbunden'],
    liveFlow: 'Live-Flow',
    liveFlowBody: 'Generieren, verfeinern, speichern und direkt ins Diktat starten, ohne dieselbe Einrichtung erneut zu bauen.',
    previewTags: ['B2 Deutsch', 'Geschichte', 'Akademisch'],
    faqTitle: 'Häufige Fragen',
    faqIntro: 'Kurze Antworten auf die Dinge, die man vor dem Start meist wissen will.',
    highlighted: 'Markierte Antwort',
    ctaTitle: 'Bereit für deine nächste Übungssession?',
    ctaBody: 'Starte mit einem Text, öffne den Übungsbereich und lass WordPilot die Einrichtung von Schritt zu Schritt tragen.',
    current: 'Aktuell',
    recommended: 'Empfohlen',
  },
};

function formatCheckoutError(message: string, fallback: string) {
  if (/stripe secret key|checkout is not configured|billing fulfillment/i.test(message)) {
    return fallback;
  }

  return message;
}

export default function PricingPage() {
  const { language } = useI18n();
  const copy = pricingCopy[language];
  const { session, user } = useAuth();
  const { entitlements, loadingEntitlements } = useEntitlements(user);
  const [openFaqId, setOpenFaqId] = useState('cefr');
  const [checkoutState, setCheckoutState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const primaryCtaHref = user ? '/ai-lab' : '/signup';
  const primaryCtaLabel = user ? copy.openAiLab : copy.startFree;
  const secondaryCtaHref = user ? '/workspace' : '/login';
  const secondaryCtaLabel = user ? copy.startPractising : copy.signIn;
  const highlightedFaq = useMemo(() => copy.faq.find((item) => item.id === openFaqId) ?? copy.faq[1], [copy.faq, openFaqId]);
  const proIsCurrentPlan = Boolean(user && entitlements.isPro);

  async function startProCheckout() {
    if (!user) {
      window.location.href = '/signup';
      return;
    }

    setCheckoutState('loading');
    setCheckoutMessage(null);

    try {
      const response = await fetchApi('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const payload = await response.json();

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? copy.unableCheckout);
      }

      window.location.href = payload.url;
    } catch (error) {
      setCheckoutState('error');
      const message = error instanceof Error ? error.message : copy.unableCheckout;
      setCheckoutMessage(formatCheckoutError(message, copy.checkoutUnavailable));
    }
  }

  return (
    <main className="wp-shell pt-24 pb-20 sm:pt-28 sm:pb-24 lg:pt-32 lg:pb-32">
      <header className="text-center mb-14 sm:mb-20 lg:mb-24">
        <h1 className="font-headline text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-on-surface mb-4 sm:mb-6">
          {copy.headline}
        </h1>
        <p className="text-on-surface-variant text-lg sm:text-xl max-w-3xl mx-auto font-medium">
          {copy.intro}
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-20 sm:mb-24 lg:mb-32">
        <PricingCard
          tier={copy.essential}
          title={copy.free}
          description={copy.freeDescription}
          features={copy.freeFeatures}
          buttonLabel={user ? copy.continueFree : copy.startForFree}
          buttonHref={user ? '/dashboard' : '/signup'}
          buttonVariant="secondary"
        />
        <PricingCard
          tier={copy.proTier}
          title="$12"
          subtitle={copy.month}
          description={copy.proDescription}
          features={copy.proFeatures}
          buttonLabel={
            proIsCurrentPlan
              ? copy.currentPlan
              : loadingEntitlements
              ? copy.checkingPlan
              : checkoutState === 'loading'
                  ? copy.openingCheckout
                  : copy.upgrade
          }
          buttonHref={user ? undefined : '/signup'}
          buttonVariant="primary"
          disabled={checkoutState === 'loading' || (loadingEntitlements && !proIsCurrentPlan) || proIsCurrentPlan}
          onButtonClick={user && !proIsCurrentPlan ? startProCheckout : undefined}
          recommended
          current={proIsCurrentPlan}
          currentLabel={copy.current}
          recommendedLabel={copy.recommended}
        />
      </section>

      {checkoutMessage && (
        <div className="mx-auto -mt-12 mb-20 max-w-2xl rounded-2xl border border-error/20 bg-error-container/25 px-5 py-4 text-center text-sm font-semibold text-error">
          {checkoutMessage}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-stretch mb-20 sm:mb-24 lg:mb-32 bg-surface-container rounded-[2rem] overflow-hidden">
        <div className="md:col-span-5 p-6 sm:p-8 lg:p-14 xl:p-16 flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/8 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary">
            <Beaker className="w-4 h-4" />
            AI Lab
          </div>
          <h2 className="font-headline text-2xl sm:text-3xl lg:text-4xl font-bold mt-6 text-on-surface leading-tight">
            {copy.aiLabTitle}
          </h2>
          <p className="text-on-surface-variant text-base sm:text-lg leading-relaxed mt-5">
            {copy.aiLabBody}
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {copy.insightPills.map((label) => (
              <React.Fragment key={label}>
                <InsightPill label={label} />
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="md:col-span-7 relative min-h-[360px] sm:min-h-[420px]">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDa6ZrLDx3xGvPIydBfzeszZMfxoSGs-t0DoJiKLKwR6aWce44sBe3NEuJfL-RBbF3JxJ7jn5-JB0vO9iBxJtC2vzPFqVkuJCwev7sxDFXArq2bn2UnVGAFa0kHV9ESRQctLnSuH7Bb5y5SzOMsHz9uN5jIqwjg6Qi1y4P5-JSOjI9UhKJP32oMp7U4YOxLKxls7yX1xS90z7WXVN-XZKVGNGIo9w8xrN9O6vxMgJSNVQqJwjWJyuCgkrIpmbi6Sga93hbXVoM_5aY"
            alt="AI Lab workspace preview"
            className="absolute inset-0 h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface/65 via-transparent to-transparent" />

          <div className="absolute left-4 right-4 bottom-4 sm:left-8 sm:right-auto sm:max-w-sm rounded-2xl border border-white/25 bg-white/85 p-5 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">{copy.liveFlow}</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-on-surface">
              {copy.liveFlowBody}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
              {copy.previewTags.map((tag) => (
                <span key={tag} className="rounded-full bg-surface-container px-3 py-1">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto mb-20 sm:mb-24 lg:mb-32">
        <h3 className="font-headline text-3xl sm:text-4xl font-bold text-center text-on-surface mb-4">{copy.faqTitle}</h3>
        <p className="text-center text-on-surface-variant max-w-2xl mx-auto mb-10 sm:mb-14">
          {copy.faqIntro}
        </p>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 lg:gap-8">
          <div className="space-y-4">
            {copy.faq.map((item) => (
              <div key={item.id}>
                <FAQItem
                  question={item.question}
                  answer={item.answer}
                  open={openFaqId === item.id}
                  onToggle={() => setOpenFaqId((current) => (current === item.id ? '' : item.id))}
                />
              </div>
            ))}
          </div>

          <aside className="bg-surface-container-low rounded-2xl p-6 h-fit">
            <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-primary">{copy.highlighted}</p>
            <h4 className="mt-4 font-headline font-bold text-xl text-on-surface">{highlightedFaq.question}</h4>
            <p className="mt-4 text-sm leading-7 text-on-surface-variant">{highlightedFaq.answer}</p>
          </aside>
        </div>
      </section>

      <section className="text-center bg-primary-container rounded-[2rem] p-8 sm:p-12 md:p-16 lg:p-20">
        <h4 className="font-headline text-3xl sm:text-4xl md:text-5xl font-extrabold text-on-primary-container mb-5 sm:mb-6">
          {copy.ctaTitle}
        </h4>
        <p className="text-on-primary-container/80 text-base sm:text-lg max-w-2xl mx-auto mb-8">
          {copy.ctaBody}
        </p>
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4 justify-center">
          <Link
            to={primaryCtaHref}
            className="px-10 py-5 bg-primary text-on-primary rounded-full font-bold text-lg shadow-lg hover:bg-primary-dim transition-all"
          >
            {primaryCtaLabel}
          </Link>
          <Link
            to={secondaryCtaHref}
            className="px-10 py-5 bg-surface-container-lowest text-primary rounded-full font-bold text-lg hover:bg-surface-bright transition-all"
          >
            {secondaryCtaLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}

function PricingCard({
  tier,
  title,
  subtitle,
  description,
  features,
  buttonLabel,
  buttonHref,
  buttonVariant,
  disabled = false,
  onButtonClick,
  recommended,
  current,
  currentLabel,
  recommendedLabel,
}: {
  tier: string;
  title: string;
  subtitle?: string;
  description: string;
  features: FeatureItem[];
  buttonLabel: string;
  buttonHref?: string;
  buttonVariant: 'primary' | 'secondary';
  disabled?: boolean;
  onButtonClick?: () => void;
  recommended?: boolean;
  current?: boolean;
  currentLabel?: string;
  recommendedLabel?: string;
}) {
  const buttonClassName = cn(
    'w-full inline-flex items-center justify-center py-4 px-6 rounded-full font-bold transition-all',
    current
      ? 'bg-primary/10 text-primary border border-primary/20 cursor-default'
      : buttonVariant === 'primary'
      ? 'primary-gradient text-on-primary hover:shadow-lg active:scale-95'
      : 'bg-surface-container-highest text-on-surface hover:bg-surface-container-high',
    disabled && 'pointer-events-none opacity-65',
  );

  return (
    <div
      className={cn(
        'relative rounded-3xl p-6 sm:p-8 lg:p-10 flex flex-col justify-between transition-all',
        recommended ? 'bg-surface-container-lowest whisper-shadow border border-primary/15' : 'bg-surface-container-low',
      )}
    >
      {recommended && (
        <div className="absolute top-0 right-6 sm:right-10 -translate-y-1/2 bg-primary text-on-primary px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
          {current ? currentLabel ?? 'Current' : recommendedLabel ?? 'Recommended'}
        </div>
      )}

      <div>
        <span className={cn('text-[0.6875rem] font-bold tracking-widest uppercase mb-4 block', recommended ? 'text-primary' : 'text-on-surface-variant')}>
          {tier}
        </span>
        <div className="flex items-baseline gap-2 mb-2 flex-wrap">
          <h2 className="font-headline text-3xl sm:text-4xl font-extrabold text-on-surface">{title}</h2>
          {subtitle && <span className="text-on-surface-variant font-medium">{subtitle}</span>}
        </div>
        <p className="text-on-surface-variant mb-8">{description}</p>
        <ul className="space-y-5">
          {features.map((feature) => (
            <li key={feature.text} className={cn('flex items-start gap-3', !feature.included && 'opacity-45')}>
              {feature.included ? <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 shrink-0 mt-0.5" />}
              <span className="font-medium text-on-surface">{feature.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
        {onButtonClick ? (
          <button type="button" onClick={onButtonClick} disabled={disabled} className={buttonClassName}>
            {buttonLabel}
          </button>
        ) : (
          <Link to={buttonHref ?? '#'} className={buttonClassName}>
            {buttonLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

function FAQItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-surface-container-low rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-6 text-left hover:bg-surface-container-high transition-colors"
        aria-expanded={open}
      >
        <span className="font-bold text-lg text-on-surface">{question}</span>
        <ChevronDown className={cn('w-5 h-5 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-6 text-on-surface-variant font-medium leading-relaxed">{answer}</div>
        </div>
      </div>
    </div>
  );
}

function InsightPill({ label }: { label: string }) {
  return <span className="rounded-full bg-surface-container-highest px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface">{label}</span>;
}
