import React, { useEffect, useState } from 'react';
import { Award, CalendarDays, Download, Medal, ScrollText } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { Certificate } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { hasSupabaseEnv } from '../lib/env';

const FALLBACK_CERTIFICATES: Certificate[] = [
  {
    id: 'cert-1',
    title: 'Best Performance',
    score: 100,
    language: 'English',
    issuedAt: '2026-04-18',
    level: 'B2',
    sessionTitle: 'English Literary Analysis',
  },
];

export default function CertificatesPage() {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [certificates, setCertificates] = useState<Certificate[]>(FALLBACK_CERTIFICATES);
  const highlighted = searchParams.get('highlight');

  useEffect(() => {
    if (!user || !hasSupabaseEnv()) {
      return;
    }

    async function loadCertificates() {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setCertificates(
          data.map((certificate) => ({
            id: certificate.id,
            title: certificate.title,
            score: Math.round(certificate.score ?? 0),
            language: certificate.language ?? 'English',
            issuedAt: certificate.issued_at,
            level: certificate.cefr_level ?? 'B1',
            sessionTitle: certificate.title,
          })),
        );
      }
    }

    void loadCertificates();
  }, [user]);

  const activeCertificate =
    certificates.find((certificate) => certificate.id === highlighted) ?? certificates[0];

  function handleDownloadPdf(certificate: Certificate) {
    const learnerName =
      profile?.full_name?.trim() ||
      user?.user_metadata.full_name?.trim() ||
      user?.email?.split('@')[0] ||
      'Scholar Script Learner';
    const issuedOn = new Date(certificate.issuedAt).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const certificateCode = certificate.id.slice(0, 8).toUpperCase();
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const outerX = 28;
    const outerY = 28;
    const outerWidth = pageWidth - outerX * 2;
    const outerHeight = pageHeight - outerY * 2;
    const innerX = outerX + 18;
    const innerY = outerY + 18;
    const innerWidth = outerWidth - 36;
    const primary: [number, number, number] = [0, 83, 219];
    const textDark: [number, number, number] = [32, 49, 61];
    const textMuted: [number, number, number] = [86, 109, 123];
    const softBlue: [number, number, number] = [236, 244, 255];

    doc.setFillColor(247, 250, 252);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setDrawColor(...primary);
    doc.setLineWidth(2.5);
    doc.roundedRect(outerX, outerY, outerWidth, outerHeight, 26, 26, 'S');

    doc.setDrawColor(218, 230, 244);
    doc.setLineWidth(1);
    doc.roundedRect(innerX, innerY, innerWidth, outerHeight - 36, 18, 18, 'S');

    doc.setFillColor(...softBlue);
    doc.circle(pageWidth - 120, pageHeight - 95, 54, 'F');
    doc.setFillColor(225, 237, 255);
    doc.circle(pageWidth - 120, pageHeight - 95, 34, 'F');

    doc.setTextColor(...primary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('Scholar Script', outerX + 30, outerY + 44);

    doc.setFontSize(10);
    doc.text('VERIFIED CERTIFICATE', outerX + 30, outerY + 72);

    doc.setTextColor(...textDark);
    doc.setFontSize(34);
    doc.text('Certificate of Achievement', outerX + 30, outerY + 122);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(15);
    doc.setTextColor(...textMuted);
    const introText = doc.splitTextToSize(
      'This document certifies the learner below for an outstanding dictation performance recorded inside Scholar Script.',
      470,
    );
    doc.text(introText, outerX + 30, outerY + 154, { lineHeightFactor: 1.45 });

    doc.setTextColor(...primary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(30);
    doc.text(learnerName, outerX + 30, outerY + 238);

    doc.setTextColor(...textDark);
    doc.setFontSize(20);
    const achievementLines = doc.splitTextToSize(
      `has successfully completed ${certificate.level} ${certificate.language} ${certificate.sessionTitle} with a final score of ${certificate.score}%.`,
      600,
    );
    doc.text(achievementLines, outerX + 30, outerY + 274, { lineHeightFactor: 1.45 });

    const cardTop = outerY + 330;
    const gap = 14;
    const cardWidth = (innerWidth - 30 - gap * 3) / 4;
    const cardHeight = 92;

    const metrics = [
      { label: 'Score', value: `${certificate.score}%` },
      { label: 'Level', value: certificate.level },
      { label: 'Issued', value: issuedOn },
      { label: 'Certificate ID', value: certificateCode },
    ];

    metrics.forEach((metric, index) => {
      const x = outerX + 30 + index * (cardWidth + gap);
      doc.setFillColor(...softBlue);
      doc.setDrawColor(219, 230, 245);
      doc.roundedRect(x, cardTop, cardWidth, cardHeight, 16, 16, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...textMuted);
      doc.text(metric.label.toUpperCase(), x + 18, cardTop + 25);

      doc.setFontSize(metric.label === 'Issued' ? 18 : 22);
      doc.setTextColor(...textDark);
      const metricLines = doc.splitTextToSize(metric.value, cardWidth - 34);
      doc.text(metricLines, x + 18, cardTop + 58);
    });

    doc.setFillColor(245, 249, 255);
    doc.setDrawColor(219, 230, 245);
    doc.roundedRect(outerX + 30, outerY + 448, 470, 88, 18, 18, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(...textMuted);
    const noteLines = doc.splitTextToSize(
      'Keep this certificate as a clean record of your achievement. It reflects your strongest verified result in the dictation workspace.',
      420,
    );
    doc.text(noteLines, outerX + 50, outerY + 482, { lineHeightFactor: 1.5 });

    const signatureX = pageWidth - 270;
    const signatureY = pageHeight - 112;
    doc.setDrawColor(176, 191, 205);
    doc.line(signatureX, signatureY, signatureX + 170, signatureY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...textDark);
    doc.text('Scholar Script Verification', signatureX, signatureY + 18);

    const fileSafeTitle = `${certificate.level}-${certificate.language}-${certificate.sessionTitle}`
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, '-')
      .replaceAll(/^-|-$/g, '');

    doc.save(`scholar-script-certificate-${fileSafeTitle || certificateCode}.pdf`);
  }

  return (
    <main className="max-w-[1440px] mx-auto px-8 py-12 pt-28">
      <header className="mb-12">
        <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary mb-3">Certificates</p>
        <h1 className="font-headline font-extrabold text-4xl tracking-tight text-on-surface">Achievement History</h1>
        <p className="text-on-surface-variant mt-3 max-w-2xl">
          Review your strongest performances and keep a clean history of certificates inside the account experience.
        </p>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-[0.8fr_1.2fr] gap-8">
        <aside className="bg-surface-container-lowest rounded-[2rem] p-8 whisper-shadow space-y-4">
          {certificates.map((certificate) => {
            const active = certificate.id === activeCertificate?.id;

            return (
              <Link
                key={certificate.id}
                to={`/certificates?highlight=${certificate.id}`}
                className={`block rounded-2xl p-5 transition-colors ${active ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface hover:bg-surface-container'}`}
              >
                <p className="font-semibold">{certificate.level} {certificate.language} {certificate.sessionTitle}</p>
                <div className="flex items-center justify-between mt-3 text-sm">
                  <span className={active ? 'text-on-primary/80' : 'text-on-surface-variant'}>{new Date(certificate.issuedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="font-bold">{certificate.score}%</span>
                </div>
              </Link>
            );
          })}
        </aside>

        <section className="bg-primary text-on-primary rounded-[2rem] p-10 whisper-shadow relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-10">
            <Award className="w-56 h-56" />
          </div>
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary-container mb-4">Verified Certificate</p>
              <h2 className="font-headline font-black text-4xl leading-tight max-w-xl">
                {activeCertificate.level} {activeCertificate.language} {activeCertificate.sessionTitle}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => handleDownloadPdf(activeCertificate)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/12 px-5 py-3 font-semibold text-on-primary transition hover:bg-white/18"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            <MetricCard icon={<Medal className="w-5 h-5" />} label="Score" value={`${activeCertificate.score}%`} />
            <MetricCard icon={<CalendarDays className="w-5 h-5" />} label="Issued" value={new Date(activeCertificate.issuedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
            <MetricCard icon={<ScrollText className="w-5 h-5" />} label="Level" value={activeCertificate.level} />
          </div>

          <div className="mt-10 bg-white/10 rounded-3xl p-8 max-w-2xl">
            <p className="text-lg font-medium text-on-primary/90 leading-relaxed">
              This certificate confirms that you achieved a strong performance in your dictation workspace and can be used as a clean history entry inside your account.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-2 text-primary-container">
        {icon}
        <span className="text-xs uppercase tracking-widest font-bold">{label}</span>
      </div>
      <p className="mt-4 font-headline font-black text-3xl">{value}</p>
    </div>
  );
}
