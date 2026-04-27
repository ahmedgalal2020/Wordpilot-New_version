/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { Footer, Navbar } from './components/Layout';
import { ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AILab from './pages/AILab';
import DictationWorkspace from './pages/DictationWorkspace';
import AuthPage from './pages/AuthPage';
import PricingPage from './pages/PricingPage';
import AccountPage from './pages/AccountPage';
import CertificatesPage from './pages/CertificatesPage';
import LibraryPage from './pages/LibraryPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { DynamicTitle } from './components/DynamicTitle';

export default function App() {
  return (
    <Router>
      <DynamicTitle />
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/pricing" element={<PricingPage />} />
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
              <Route path="/account" element={<AccountPage />} />
              <Route path="/certificates" element={<CertificatesPage />} />
              <Route path="/library" element={<LibraryPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}
