import { BarChart3, RotateCcw } from 'lucide-react';
import { WordList } from '../components';
import { formatDate } from '../storage';
import type { ShadowingSession } from '../types';

type ShadowingReport = {
  difficultSentences: string[];
  frequentlyMissedWords: string[];
  rating: string;
  recommendation: string;
};

type ProgressReviewSectionProps = {
  onResumeSession: (session: ShadowingSession) => void;
  report: ShadowingReport;
  savedSessions: ShadowingSession[];
};

export function ProgressReviewSection({ onResumeSession, report, savedSessions }: ProgressReviewSectionProps) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
      <div className="lg:col-span-7 bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 whisper-shadow">
        <div className="flex items-center gap-2 text-primary text-[0.6875rem] font-bold tracking-widest uppercase">
          <BarChart3 className="h-4 w-4" />
          Historical progress
        </div>
        <div className="mt-5 space-y-3">
          {savedSessions.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Previous shadowing sessions will appear here after you start practising.</p>
          ) : (
            savedSessions.map((session) => (
              <article key={session.id} className="rounded-2xl bg-surface-container-low p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-headline font-bold text-on-surface">{session.title}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {formatDate(session.updatedAt)} - {session.language} {session.level} - {session.completed}/{session.total} completed
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-primary-container px-3 py-2 text-sm font-black text-primary">{session.averageScore}%</span>
                    <button type="button" onClick={() => onResumeSession(session)} className="inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2 text-xs font-bold text-on-surface">
                      <RotateCcw className="h-3.5 w-3.5" />
                      Resume
                    </button>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container-high">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((session.completed / Math.max(session.total, 1)) * 100)}%` }} />
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <div className="lg:col-span-5 bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 whisper-shadow">
        <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary">Review focus</p>
        <h2 className="mt-2 font-headline font-black text-2xl text-on-surface">Difficult sentences and missed words</h2>
        <div className="mt-5 space-y-4">
          <WordList title="Frequently missed words" words={report.frequentlyMissedWords} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Most difficult sentences</p>
            <div className="mt-2 space-y-2">
              {report.difficultSentences.length === 0 ? (
                <p className="text-sm text-on-surface-variant">Difficult sentences appear after retry attempts.</p>
              ) : (
                report.difficultSentences.map((sentence) => (
                  <p key={sentence} className="rounded-xl bg-surface-container-low px-4 py-3 text-sm leading-6 text-on-surface">{sentence}</p>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
