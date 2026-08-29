export type ApiRouteMethod = 'GET' | 'POST' | 'DELETE';

export type ApiRoute = {
  method: ApiRouteMethod;
  path: string;
  area: 'admin' | 'ai' | 'billing' | 'shadowing' | 'stripe' | 'support' | 'youtube';
  description: string;
};

export const API_ROUTES: ApiRoute[] = [
  {
    method: 'POST',
    path: '/api/stripe/create-checkout-session',
    area: 'stripe',
    description: 'Create a Stripe Checkout subscription session for the signed-in user.',
  },
  {
    method: 'GET',
    path: '/api/stripe/checkout-session',
    area: 'stripe',
    description: 'Read a Stripe Checkout session and verify it belongs to the signed-in user.',
  },
  {
    method: 'POST',
    path: '/api/stripe/webhook',
    area: 'stripe',
    description: 'Receive signed Stripe webhooks and sync subscriptions/invoices.',
  },
  {
    method: 'POST',
    path: '/api/billing/sync-checkout',
    area: 'billing',
    description: 'Persist a paid Stripe Checkout result into Supabase.',
  },
  {
    method: 'POST',
    path: '/api/billing/send-receipt',
    area: 'billing',
    description: 'Send a receipt email for a paid checkout session.',
  },
  {
    method: 'POST',
    path: '/api/support/request',
    area: 'support',
    description: 'Send a user support request through the server-side email provider.',
  },
  {
    method: 'GET',
    path: '/api/youtube/transcript',
    area: 'youtube',
    description: 'Fetch and cache public YouTube captions for shadowing lessons.',
  },
  {
    method: 'POST',
    path: '/api/shadowing/evaluate',
    area: 'shadowing',
    description: 'Evaluate a learner recording against the current shadowing segment.',
  },
  {
    method: 'POST',
    path: '/api/ai/generate',
    area: 'ai',
    description: 'Generate AI Lab practice text and record server-owned AI usage.',
  },
  {
    method: 'GET',
    path: '/api/admin/access',
    area: 'admin',
    description: 'Check whether the signed-in user may access admin operations.',
  },
  {
    method: 'GET',
    path: '/api/admin/overview',
    area: 'admin',
    description: 'Load admin dashboard metrics, users, billing, and activity summaries.',
  },
  {
    method: 'GET',
    path: '/api/admin/users/:userId',
    area: 'admin',
    description: 'Load one user profile, billing, AI usage, and learning history for admins.',
  },
  {
    method: 'DELETE',
    path: '/api/admin/users/:userId',
    area: 'admin',
    description: 'Permanently delete one user and their owned records after owner authorization.',
  },
  {
    method: 'POST',
    path: '/api/admin/admin-users',
    area: 'admin',
    description: 'Grant admin access to a registered user.',
  },
  {
    method: 'POST',
    path: '/api/admin/admin-users/:userId/revoke',
    area: 'admin',
    description: 'Revoke admin access while preserving at least one active admin.',
  },
  {
    method: 'POST',
    path: '/api/admin/users/:userId/block',
    area: 'admin',
    description: 'Block or unblock a user account.',
  },
  {
    method: 'POST',
    path: '/api/admin/users/:userId/cancel-subscription',
    area: 'admin',
    description: 'Cancel a user subscription in Stripe when available and mark it canceled locally.',
  },
  {
    method: 'POST',
    path: '/api/admin/users/:userId/reset-password',
    area: 'admin',
    description: 'Send a password reset email to a user.',
  },
];

export function routeSignature(route: Pick<ApiRoute, 'method' | 'path'>) {
  return `${route.method} ${route.path}`;
}
