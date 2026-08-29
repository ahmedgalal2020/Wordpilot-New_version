import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useI18n } from '../i18n';

export function DynamicTitle() {
  const location = useLocation();
  const { getRouteTitle, t } = useI18n();

  useEffect(() => {
    const currentTitle = getRouteTitle(location.pathname);
    document.title = currentTitle;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.title = t('title.return');
      } else {
        document.title = currentTitle;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [getRouteTitle, location.pathname, t]);

  return null;
}
