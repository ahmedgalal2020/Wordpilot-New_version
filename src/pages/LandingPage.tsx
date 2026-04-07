import React from 'react';
import { Link } from 'react-router-dom';
import { SpellCheck, Activity, Beaker, CheckCircle, PlayCircle, SkipBack, SkipForward, Waves } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

export default function LandingPage() {
  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32 px-8">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 space-y-8"
          >
            <h1 className="font-headline font-extrabold text-5xl md:text-7xl text-on-surface tracking-tight leading-[1.1]">
              Master Dictation. <br/>
              <span className="text-primary">Master Language.</span>
            </h1>
            <p className="text-on-surface-variant text-xl md:text-2xl leading-relaxed max-w-xl">
              A professional platform for practicing dictation with real-time feedback and AI-powered text generation.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/signup" className="primary-gradient text-on-primary font-headline font-bold px-8 py-4 rounded-full text-lg whisper-shadow hover:scale-105 transition-transform">
                Get Started for Free
              </Link>
              <button className="bg-surface-container-low text-on-surface font-headline font-bold px-8 py-4 rounded-full text-lg hover:bg-surface-container transition-colors">
                View Demo
              </button>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-6 relative"
          >
            <div className="bg-surface-container-high rounded-[2rem] p-4 whisper-shadow transform lg:rotate-2">
              <div className="bg-surface-container-lowest rounded-xl overflow-hidden aspect-video relative group">
                <img 
                  className="w-full h-full object-cover grayscale opacity-20" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvP-Y4L4_Ivh3NL_B9rVLzERpgA5dKN7agCr8KMVg_aVI8g6FxMCNMy3dg7rldeA78jXrhbBTVffOSsqv2M6YLoft-2BMqaW_JfHLIGNxCJrSf0UwgwnmmieYa1JPzUnc5ktpAVwQG9Byvn13YEut3s9dPjmnaYvK9JXTViEbZrEZywzmHnnJePi9hcuXlrFLD-YbHEhKVSu6LzLoOhKS1Jbk8nj9J1EsKQBZ02rJMoq8oZf4ELfv0PyPDIgTvNXNoMqx9eKcW8xs" 
                  alt="Workspace"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl border border-outline-variant/20 whisper-shadow max-w-[80%]">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-3 h-3 rounded-full bg-error"></div>
                      <div className="w-3 h-3 rounded-full bg-primary-container"></div>
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                    </div>
                    <p className="font-body text-lg text-on-surface-variant leading-relaxed italic">
                      "The transition to digital ateliers allows for focused learning..."
                    </p>
                    <div className="mt-4 flex gap-1">
                      <div className="h-1 w-12 bg-primary rounded-full"></div>
                      <div className="h-1 w-8 bg-surface-container-highest rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary-container rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
          </motion.div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section className="py-24 px-8 bg-surface-container-low">
        <div className="max-w-[1440px] mx-auto">
          <div className="mb-16">
            <span className="text-primary font-headline font-bold tracking-widest text-sm uppercase">Capabilities</span>
            <h2 className="font-headline font-extrabold text-4xl text-on-surface mt-4">Precision Engineering for Fluency</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<SpellCheck className="w-8 h-8" />}
              title="Real-time Validation"
              description="Instant feedback on every word you type. Never lose track of your progress with subtle success flashes and error highlighting."
              color="primary"
            />
            <FeatureCard 
              icon={<Activity className="w-8 h-8" />}
              title="Dynamic Audio Engine"
              description="Control speech rate and word gaps for a personalized pace. Tailor the listening experience to your current comprehension level."
              color="tertiary"
            />
            <FeatureCard 
              icon={<Beaker className="w-8 h-8" />}
              title="AI-Powered Lab"
              description="Generate high-quality practice texts tailored to your level. From medical journals to casual dialogue, focus on what you need."
              color="secondary"
            />
          </div>
        </div>
      </section>

      {/* Asymmetric Detail Section */}
      <section className="py-32 px-8 overflow-hidden">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="absolute inset-0 bg-primary/5 rounded-full filter blur-3xl"></div>
            <div className="relative bg-surface-container rounded-full aspect-square flex items-center justify-center p-12">
              <div className="bg-surface-container-lowest whisper-shadow rounded-xl w-full h-full overflow-hidden flex flex-col">
                <div className="h-12 bg-surface-container flex items-center px-4 gap-2">
                  <div className="w-2 h-2 rounded-full bg-outline-variant"></div>
                  <div className="w-2 h-2 rounded-full bg-outline-variant"></div>
                  <div className="w-2 h-2 rounded-full bg-outline-variant"></div>
                </div>
                <div className="p-8 space-y-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-container shrink-0"></div>
                    <div className="space-y-2 w-full">
                      <div className="h-4 bg-surface-container-highest rounded w-3/4"></div>
                      <div className="h-4 bg-surface-container-highest rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-32 bg-surface-container-low rounded-lg w-full flex items-center justify-center">
                      <Waves className="text-primary-dim w-12 h-12" />
                    </div>
                  </div>
                  <div className="flex justify-center gap-6 pt-4 text-on-surface-variant">
                    <SkipBack className="w-6 h-6" />
                    <PlayCircle className="w-10 h-10 text-primary fill-primary" />
                    <SkipForward className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 space-y-8">
            <h2 className="font-headline font-extrabold text-4xl md:text-5xl text-on-surface leading-tight">Focus. Practice. Perfect.</h2>
            <p className="text-on-surface-variant text-xl leading-relaxed">
              Scholar Script is designed to remove the friction between listening and typing. Our interface stays out of your way so you can focus on the nuances of the language.
            </p>
            <ul className="space-y-4">
              <ListItem text="Customizable vocabulary targets" />
              <ListItem text="Progressive difficulty scaling" />
              <ListItem text="Detailed phonetics analysis" />
            </ul>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-8">
        <div className="max-w-[1440px] mx-auto">
          <div className="primary-gradient p-12 md:p-24 rounded-[3rem] text-center text-on-primary whisper-shadow">
            <h2 className="font-headline font-extrabold text-4xl md:text-6xl mb-8 leading-tight">Ready to elevate your <br/>language journey?</h2>
            <p className="text-on-primary/80 text-xl md:text-2xl mb-12 max-w-2xl mx-auto">Join thousands of students who have mastered fluency through focused dictation.</p>
            <Link to="/signup" className="bg-surface-container-lowest text-primary font-headline font-bold px-12 py-5 rounded-full text-xl hover:scale-105 transition-transform inline-block">
              Get Started for Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) {
  const bgColors: Record<string, string> = {
    primary: 'bg-primary-container text-primary',
    tertiary: 'bg-tertiary-container text-tertiary',
    secondary: 'bg-secondary-container text-secondary',
  };

  return (
    <div className="bg-surface-container-lowest p-10 rounded-3xl flex flex-col justify-between whisper-shadow group">
      <div className="space-y-6">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform", bgColors[color])}>
          {icon}
        </div>
        <h3 className="font-headline font-bold text-2xl text-on-surface leading-tight">{title}</h3>
        <p className="text-on-surface-variant leading-relaxed text-lg">
          {description}
        </p>
      </div>
    </div>
  );
}

function ListItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-4 text-on-surface font-medium">
      <CheckCircle className="w-6 h-6 text-primary fill-primary text-on-primary" />
      {text}
    </li>
  );
}
