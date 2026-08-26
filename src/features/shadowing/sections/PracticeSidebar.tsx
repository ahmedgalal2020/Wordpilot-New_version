import { FileText, Trophy } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { ReportBox, SegmentStatus } from '../components';
import type { ShadowingSegment } from '../types';

type ShadowingReport = {
  difficultSentences: string[];
  frequentlyMissedWords: string[];
  rating: string;
  recommendation: string;
};

type PracticeSidebarProps = {
  averageScore: number;
  bestScore: number;
  completedCount: number;
  currentIndex: number;
  justCompletedSegmentId: string | null;
  onRestoreSegmentPractice: (segment: ShadowingSegment, index: number) => void;
  report: ShadowingReport;
  segments: ShadowingSegment[];
};

export function PracticeSidebar({
  averageScore,
  bestScore,
  completedCount,
  currentIndex,
  justCompletedSegmentId,
  onRestoreSegmentPractice,
  report,
  segments,
}: PracticeSidebarProps) {
  return (
    <aside className="xl:col-span-4 space-y-6">
      <section className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 whisper-shadow">
        <div className="flex items-center gap-2 text-primary text-[0.6875rem] font-bold tracking-widest uppercase">
          <FileText className="h-4 w-4" />
          Segments
        </div>
        <div className="mt-4 max-h-[460px] space-y-3 overflow-y-auto pr-1">
          {segments.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Transcript segments will appear after lesson setup.</p>
          ) : (
            segments.map((segment, index) => (
              <button
                key={segment.id}
                type="button"
                onClick={() => onRestoreSegmentPractice(segment, index)}
                className={cn(
                  'w-full rounded-2xl border p-4 text-left transition duration-300',
                  segment.status === 'completed'
                    ? 'border-primary/30 bg-primary/10 text-on-surface'
                    : index === currentIndex
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-outline-variant/10 bg-surface-container-low hover:border-primary/40',
                  justCompletedSegmentId === segment.id && 'scale-[1.015] ring-4 ring-primary/15',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-widest">Sentence {index + 1}</p>
                  <SegmentStatus status={segment.status === 'completed' ? 'completed' : index === currentIndex ? 'current' : segment.status} />
                </div>
                <p className={cn('mt-2 line-clamp-2 text-sm leading-6', segment.status === 'completed' ? 'text-on-surface' : index === currentIndex ? 'text-on-primary/85' : 'text-on-surface-variant')}>
                  {segment.text}
                </p>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="bg-primary text-on-primary rounded-[2rem] p-5 sm:p-6 whisper-shadow">
        <div className="flex items-center gap-2 text-primary-container text-[0.6875rem] font-bold tracking-widest uppercase">
          <Trophy className="h-4 w-4" />
          Session report
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <ReportBox label="Average" value={`${averageScore}%`} />
          <ReportBox label="Best" value={`${bestScore}%`} />
          <ReportBox label="Rating" value={report.rating} wide />
          <ReportBox label="Completed" value={`${completedCount}/${segments.length || 0}`} />
        </div>
        <p className="mt-5 text-sm leading-6 text-on-primary/85">{report.recommendation}</p>
      </section>
    </aside>
  );
}
