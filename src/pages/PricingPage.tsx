import React, { useMemo, useState } from 'react';
import { CheckCircle, ChevronDown, Beaker, Sparkles, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useEntitlements } from '../hooks/useEntitlements';

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

export default function PricingPage() {
  const { session, user } = useAuth();
  const { entitlements, loadingEntitlements } = useEntitlements(user);
  const [openFaqId, setOpenFaqId] = useState('cefr');
  const [checkoutState, setCheckoutState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const primaryCtaHref = user ? '/ai-lab' : '/signup';
  const primaryCtaLabel = user ? 'Open AI Lab' : 'Start Free';
  const secondaryCtaHref = user ? '/workspace' : '/login';
  const secondaryCtaLabel = user ? 'Start Practising' : 'Sign In';
  const highlightedFaq = useMemo(() => FAQ_ITEMS.find((item) => item.id === openFaqId) ?? FAQ_ITEMS[1], [openFaqId]);
  const proIsCurrentPlan = Boolean(user && entitlements.isPro);

  async function startProCheckout() {
    if (!user) {
      window.location.href = '/signup';
      return;
    }

    setCheckoutState('loading');
    setCheckoutMessage(null);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const payload = await response.json();

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? 'Unable to start checkout.');
      }

      window.location.href = payload.url;
    } catch (error) {
      setCheckoutState('error');
      setCheckoutMessage(error instanceof Error ? error.message : 'Unable to start checkout.');
    }
  }

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-20 sm:pb-24 lg:pb-32">
      <header className="text-center mb-14 sm:mb-20 lg:mb-24">
        <h1 className="font-headline text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-on-surface mb-4 sm:mb-6">
          Simple Pricing for Focused Practice
        </h1>
        <p className="text-on-surface-variant text-lg sm:text-xl max-w-3xl mx-auto font-medium">
          Pick the plan that matches your pace, then move between AI drafting, dictation practice, saved texts, and review without breaking flow.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-20 sm:mb-24 lg:mb-32">
        <PricingCard
          tier="Essential"
          title="Free"
          description="A lightweight starting point for learners exploring the workspace."
          features={FREE_FEATURES}
          buttonLabel={user ? 'Continue Free' : 'Start for Free'}
          buttonHref={user ? '/dashboard' : '/signup'}
          buttonVariant="secondary"
        />
        <PricingCard
          tier="WordPilot Pro"
          title="$12"
          subtitle="/ month"
          description="The full practice workflow with AI generation, saved drafts, and cleaner progress tracking."
          features={PRO_FEATURES}
          buttonLabel={
            proIsCurrentPlan
              ? 'Current Plan'
              : loadingEntitlements
              ? 'Checking Plan...'
              : checkoutState === 'loading'
                  ? 'Opening Checkout...'
                  : 'Upgrade to Pro'
          }
          buttonHref={user ? undefined : '/signup'}
          buttonVariant="primary"
          disabled={checkoutState === 'loading' || (loadingEntitlements && !proIsCurrentPlan) || proIsCurrentPlan}
          onButtonClick={user && !proIsCurrentPlan ? startProCheckout : undefined}
          recommended
          current={proIsCurrentPlan}
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
            Generate practice texts that already fit your level before you start dictation.
          </h2>
          <p className="text-on-surface-variant text-base sm:text-lg leading-relaxed mt-5">
            Build English or German dictation scripts around your topic, level, and tone, then send them straight into Exercises with the right practice setup.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InsightPill label="CEFR adaptive" />
            <InsightPill label="Topic-driven" />
            <InsightPill label="Practice-ready" />
            <InsightPill label="Library connected" />
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
              <span className="text-xs font-bold uppercase tracking-widest">Live Flow</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-on-surface">
              Generate, refine, save, then launch directly into dictation without manually rebuilding the same setup.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
              <span className="rounded-full bg-surface-container px-3 py-1">B2 German</span>
              <span className="rounded-full bg-surface-container px-3 py-1">History</span>
              <span className="rounded-full bg-surface-container px-3 py-1">Academic</span>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto mb-20 sm:mb-24 lg:mb-32">
        <h3 className="font-headline text-3xl sm:text-4xl font-bold text-center text-on-surface mb-4">Frequently Asked Questions</h3>
        <p className="text-center text-on-surface-variant max-w-2xl mx-auto mb-10 sm:mb-14">
          Short answers to the things people usually want to know before they commit to the workflow.
        </p>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 lg:gap-8">
          <div className="space-y-4">
            {FAQ_ITEMS.map((item) => (
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
            <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-primary">Highlighted Answer</p>
            <h4 className="mt-4 font-headline font-bold text-xl text-on-surface">{highlightedFaq.question}</h4>
            <p className="mt-4 text-sm leading-7 text-on-surface-variant">{highlightedFaq.answer}</p>
          </aside>
        </div>
      </section>

      <section className="text-center bg-primary-container rounded-[2rem] p-8 sm:p-12 md:p-16 lg:p-20">
        <h4 className="font-headline text-3xl sm:text-4xl md:text-5xl font-extrabold text-on-primary-container mb-5 sm:mb-6">
          Ready to build your next practice session?
        </h4>
        <p className="text-on-primary-container/80 text-base sm:text-lg max-w-2xl mx-auto mb-8">
          Start with a text, open the exercise workspace, and let the product carry the setup from one step to the next.
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
          {current ? 'Current' : 'Recommended'}
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
