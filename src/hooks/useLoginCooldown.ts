import { useEffect, useState } from 'react';
import { passwordAttemptGuard } from '../lib/authProtection';

export function useLoginCooldown() {
  const [seconds, setSeconds] = useState(() => passwordAttemptGuard.remaining());
  useEffect(() => {
    const timer = setInterval(() => setSeconds(passwordAttemptGuard.remaining()), 500);
    return () => clearInterval(timer);
  }, []);
  return { seconds, refresh: () => setSeconds(passwordAttemptGuard.remaining()) };
}
