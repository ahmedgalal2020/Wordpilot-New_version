import React from 'react';
import { CheckCircle, XCircle, Beaker, ChevronDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function PricingPage() {
  return (
    <main className="max-w-7xl mx-auto px-8 pt-32 pb-32">
      <header className="text-center mb-24">
        <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface mb-6">
          Simple Pricing for Mastery
        </h1>
        <p className="text-on-surface-variant text-xl max-w-2xl mx-auto font-medium">
          Invest in your linguistic precision with tools designed for the modern scholar.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
        <PricingCard 
          tier="ESSENTIAL"
          title="Free"
          description="Perfect for exploring the atelier's foundational tools."
          features={[
            { text: "3 saved texts in library", included: true },
            { text: "Manual correction only", included: true },
            { text: "Basic practice history", included: true },
            { text: "AI Lab Access", included: false },
          ]}
          buttonText="Start for Free"
          buttonVariant="secondary"
        />
        <PricingCard 
          tier="SCHOLAR PRO"
          title="$12"
          subtitle="/ month"
          description="Unleash the full power of AI-assisted language acquisition."
          features={[
            { text: "Unlimited AI text generation (AI Lab)", included: true },
            { text: "Real-time validation & feedback", included: true },
            { text: "Advanced analytics & progress tracking", included: true },
            { text: "German, Arabic & English support", included: true },
            { text: "CEFR level targeting (A1-C2)", included: true },
          ]}
          buttonText="Upgrade to Pro"
          buttonVariant="primary"
          recommended
        />
      </div>

      <section className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center mb-32 bg-surface-container rounded-[2rem] overflow-hidden">
        <div className="md:col-span-5 p-12 lg:p-20 order-2 md:order-1">
          <Beaker className="text-primary w-12 h-12 mb-6" />
          <h3 className="font-headline text-3xl font-bold mb-6 text-on-surface leading-tight">Generate practice texts for your specific CEFR level and topic interest</h3>
          <p className="text-on-surface-variant text-lg leading-relaxed mb-8">
            The AI Lab is your personal content curator. Whether you're mastering architectural German at a B2 level or medical Arabic at C1, our laboratory generates bespoke dictation scripts that evolve with you.
          </p>
          <div className="flex gap-4">
            <span className="px-4 py-2 bg-surface-container-highest rounded-full text-xs font-bold text-on-surface">CEFR ADAPTIVE</span>
            <span className="px-4 py-2 bg-surface-container-highest rounded-full text-xs font-bold text-on-surface">TOPIC-DRIVEN</span>
          </div>
        </div>
        <div className="md:col-span-7 h-full min-h-[400px] relative order-1 md:order-2">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDa6ZrLDx3xGvPIydBfzeszZMfxoSGs-t0DoJiKLKwR6aWce44sBe3NEuJfL-RBbF3JxJ7jn5-JB0vO9iBxJtC2vzPFqVkuJCwev7sxDFXArq2bn2UnVGAFa0kHV9ESRQctLnSuH7Bb5y5SzOMsHz9uN5jIqwjg6Qi1y4P5-JSOjI9UhKJP32oMp7U4YOxLKxls7yX1xS90z7WXVN-XZKVGNGIo9w8xrN9O6vxMgJSNVQqJwjWJyuCgkrIpmbi6Sga93hbXVoM_5aY" 
            alt="AI Interface" 
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
          <div className="glass-panel absolute bottom-8 left-8 p-6 rounded-xl shadow-xl max-w-xs border border-white/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Live Lab Insight</span>
            </div>
            <p className="text-sm font-medium text-on-surface leading-snug italic">"Generating a B2 narrative about Bauhaus architecture for your next session..."</p>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto mb-32">
        <h3 className="font-headline text-4xl font-bold text-center mb-16">Frequently Asked Questions</h3>
        <div className="space-y-4">
          <FAQItem question="How does the AI Lab generate texts?" />
          <FAQItem 
            question="Which CEFR levels are supported?" 
            answer="Scholar Script supports all levels from A1 (Beginner) to C2 (Mastery). Our AI Lab adjusts vocabulary complexity, grammatical structures, and sentence length based on your selected target level."
            open
          />
          <FAQItem question="Can I switch between languages?" />
          <FAQItem question="Is there a student discount available?" />
        </div>
      </section>

      <section className="text-center bg-primary-container rounded-[2rem] p-16 md:p-24 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10">
          <h4 className="font-headline text-4xl md:text-5xl font-extrabold text-on-primary-container mb-8">Ready to master your next language?</h4>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button className="px-10 py-5 bg-primary text-on-primary rounded-full font-bold text-lg shadow-lg hover:bg-primary-dim transition-all">Get Started Now</button>
            <button className="px-10 py-5 bg-surface-container-lowest text-primary rounded-full font-bold text-lg hover:bg-surface-bright transition-all">Contact Sales</button>
          </div>
        </div>
      </section>
    </main>
  );
}

function PricingCard({ tier, title, subtitle, description, features, buttonText, buttonVariant, recommended }: any) {
  return (
    <div className={cn(
      "relative rounded-3xl p-10 flex flex-col justify-between transition-all",
      recommended ? "bg-surface-container-lowest whisper-shadow border-2 border-primary/10" : "bg-surface-container-low"
    )}>
      {recommended && (
        <div className="absolute top-0 right-10 -translate-y-1/2 bg-primary text-on-primary px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
          Recommended
        </div>
      )}
      <div>
        <span className={cn("text-[0.6875rem] font-bold tracking-widest uppercase mb-4 block", recommended ? "text-primary" : "text-on-surface-variant")}>
          {tier}
        </span>
        <div className="flex items-baseline gap-2 mb-2">
          <h2 className="font-headline text-4xl font-extrabold">{title}</h2>
          {subtitle && <span className="text-on-surface-variant font-medium">{subtitle}</span>}
        </div>
        <p className="text-on-surface-variant mb-10">{description}</p>
        <ul className="space-y-6">
          {features.map((f: any, i: number) => (
            <li key={i} className={cn("flex items-start gap-3", !f.included && "opacity-40")}>
              {f.included ? <CheckCircle className="w-5 h-5 text-primary" /> : <XCircle className="w-5 h-5" />}
              <span className="font-medium text-on-surface">{f.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-12">
        <button className={cn(
          "w-full py-4 px-6 rounded-full font-bold transition-all",
          buttonVariant === 'primary' ? "primary-gradient text-on-primary hover:shadow-lg scale-100 active:scale-95" : "bg-surface-container-highest text-on-surface hover:bg-surface-container-high"
        )}>
          {buttonText}
        </button>
      </div>
    </div>
  );
}

function FAQItem({ question, answer, open }: { question: string; answer?: string; open?: boolean }) {
  return (
    <div className="bg-surface-container-low rounded-2xl overflow-hidden">
      <button className="w-full flex items-center justify-between p-6 text-left hover:bg-surface-container-high transition-colors">
        <span className="font-bold text-lg text-on-surface">{question}</span>
        <ChevronDown className={cn("w-5 h-5 transition-transform", open && "rotate-180")} />
      </button>
      {open && answer && (
        <div className="px-6 pb-6 text-on-surface-variant font-medium leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}
