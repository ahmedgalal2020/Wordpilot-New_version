import type { NextFunction, Request, Response } from 'express';

type RateLimiterOptions = {
  windowMs: number;
  max: number;
  keyPrefix?: string;
  getToken?: (req: Request) => string | null;
};

export function createRateLimiter({ windowMs, max, keyPrefix = 'default', getToken }: RateLimiterOptions) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const token = getToken?.(req) ?? 'anonymous';
    const key = `${keyPrefix}:${req.ip}:${token}:${req.path}`;
    const current = hits.get(key);

    if (!current || current.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    current.count += 1;
    if (current.count > max) {
      res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000).toString());
      res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
      return;
    }

    next();
  };
}
