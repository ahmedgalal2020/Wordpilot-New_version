import type { NextFunction, Request, Response } from 'express';

type SecurityOptions = {
  isProduction: boolean;
  getAllowedOrigins: (req: Request) => string[];
};

export function createSecurityHeaders({ isProduction }: Pick<SecurityOptions, 'isProduction'>) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=(), payment=()');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Content-Security-Policy', buildContentSecurityPolicy(isProduction));
    next();
  };
}

export function createCorsHeaders({ getAllowedOrigins }: Pick<SecurityOptions, 'getAllowedOrigins'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin?.replace(/\/$/, '');

    if (origin && getAllowedOrigins(req).includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
      res.setHeader('Access-Control-Max-Age', '86400');
      res.setHeader('Vary', 'Origin');
    }

    if (req.method === 'OPTIONS') {
      res.status(origin && !getAllowedOrigins(req).includes(origin) ? 403 : 204).end();
      return;
    }

    next();
  };
}

export function createOriginGuard({ getAllowedOrigins }: Pick<SecurityOptions, 'getAllowedOrigins'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      next();
      return;
    }

    const origin = req.headers.origin?.replace(/\/$/, '');
    if (!origin) {
      next();
      return;
    }

    if (!getAllowedOrigins(req).includes(origin)) {
      res.status(403).json({ error: 'Request origin is not allowed.' });
      return;
    }

    next();
  };
}

export function buildContentSecurityPolicy(isProduction: boolean) {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.resend.com https://generativelanguage.googleapis.com",
    "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
    "media-src 'self' blob: https:",
  ];

  if (!isProduction) {
    directives[9] = "connect-src 'self' ws: http: https:";
  }

  return directives.join('; ');
}
