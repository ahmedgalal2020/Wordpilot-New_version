import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const routeTitles: Record<string, string> = {
  '/': 'WordPilot - AI Dictation & Learning',
  '/pricing': 'Pricing | WordPilot',
  '/login': 'Login | WordPilot',
  '/signup': 'Sign Up | WordPilot',
  '/forgot-password': 'Forgot Password | WordPilot',
  '/reset-password': 'Reset Password | WordPilot',
  '/dashboard': 'Dashboard | WordPilot',
  '/ai-lab': 'AI Lab | WordPilot',
  '/workspace': 'Dictation Workspace | WordPilot',
  '/account': 'My Account | WordPilot',
  '/certificates': 'Certificates | WordPilot',
  '/library': 'Library | WordPilot',
};

export function DynamicTitle() {
  const location = useLocation();

  useEffect(() => {
    const currentTitle = routeTitles[location.pathname] || 'WordPilot';
    document.title = currentTitle;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.title = 'Come back! 😢 | WordPilot';
      } else {
        document.title = currentTitle;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname]);

  return null;
}
