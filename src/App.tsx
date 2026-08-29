/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { Footer, Navbar } from './components/Layout';
import { AdminRoute, ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards';
import { DynamicTitle } from './components/DynamicTitle';
import { SessionSecurityPrompt } from './components/SessionSecurityPrompt';
import { LearningOnboardingPrompt } from './components/LearningOnboardingPrompt';
import { LanguageProvider, useI18n } from './i18n';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const InfoPage = lazy(() => import('./pages/InfoPages'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AILab = lazy(() => import('./pages/AILab'));
const DictationWorkspace = lazy(() => import('./pages/DictationWorkspace'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const CertificatesPage = lazy(() => import('./pages/CertificatesPage'));
const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const PracticePathPage = lazy(() => import('./pages/PracticePathPage'));
const CurriculumPage = lazy(() => import('./pages/CurriculumPage'));
const ShadowingPracticePage = lazy(() => import('./pages/ShadowingPracticePage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminUserPage = lazy(() => import('./pages/AdminUserPage'));

function PageLoadingState() {
  const { t } = useI18n();

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="inline-flex items-center gap-3 rounded-full bg-surface-container-low px-5 py-3 text-sm font-semibold text-on-surface-variant">
        <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
        {t('app.loading')}
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Router>
      <LanguageProvider>
        <DynamicTitle />
        <SessionSecurityPrompt />
        <LearningOnboardingPrompt />
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <div className="flex-grow">
            <Suspense fallback={<PageLoadingState />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/privacy" element={<InfoPage />} />
                <Route path="/terms" element={<InfoPage />} />
                <Route path="/help" element={<InfoPage />} />
                <Route path="/contact" element={<InfoPage />} />
                <Route element={<PublicOnlyRoute />}>
                  <Route path="/login" element={<AuthPage />} />
                  <Route path="/signup" element={<AuthPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                </Route>
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/ai-lab" element={<AILab />} />
                  <Route path="/workspace" element={<DictationWorkspace />} />
                  <Route path="/practice-path" element={<PracticePathPage />} />
                  <Route path="/curriculum" element={<CurriculumPage />} />
                  <Route path="/shadowing" element={<ShadowingPracticePage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/certificates" element={<CertificatesPage />} />
                  <Route path="/library" element={<LibraryPage />} />
                </Route>
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/users/:userId" element={<AdminUserPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
          <Footer />
        </div>
      </LanguageProvider>
    </Router>
  );
}

