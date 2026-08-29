import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { API_ROUTES, routeSignature } from '../server/routes/apiRoutes';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverSource = fs.readFileSync(path.join(projectRoot, 'server.ts'), 'utf8');

const implementedRoutes = new Set<string>();
const routePattern = /app\.(get|post|delete)\('([^']+)'/g;
let routeMatch: RegExpExecArray | null;

while ((routeMatch = routePattern.exec(serverSource))) {
  implementedRoutes.add(`${routeMatch[1].toUpperCase()} ${routeMatch[2]}`);
}

const expectedRoutes = new Set(API_ROUTES.map(routeSignature));
const missingRoutes = [...expectedRoutes].filter((route) => !implementedRoutes.has(route));

if (missingRoutes.length > 0) {
  throw new Error(`server.ts is missing API routes from the manifest:\n${missingRoutes.join('\n')}`);
}

const frontendContracts = [
  '/api/admin/access',
  '/api/admin/overview',
  '/api/admin/users/:userId',
  '/api/admin/admin-users',
  '/api/admin/admin-users/:userId/revoke',
  '/api/admin/users/:userId/block',
  '/api/admin/users/:userId/cancel-subscription',
  '/api/admin/users/:userId/reset-password',
  '/api/billing/sync-checkout',
  '/api/billing/send-receipt',
  '/api/support/request',
  '/api/stripe/create-checkout-session',
  '/api/youtube/transcript',
  '/api/shadowing/evaluate',
  '/api/ai/generate',
] as const;

function routeToRegex(routePath: string) {
  const escapedSegments = routePath
    .split('/')
    .map((segment) => (segment.startsWith(':') ? '[^/]+' : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

  return new RegExp(`^${escapedSegments.join('/')}$`);
}

const manifestPaths = API_ROUTES.map((route) => route.path);
const uncoveredFrontendRoutes = frontendContracts.filter((contract) => {
  const contractRegex = routeToRegex(contract);
  return !manifestPaths.some((routePath) => contractRegex.test(routePath) || routeToRegex(routePath).test(contract));
});

if (uncoveredFrontendRoutes.length > 0) {
  throw new Error(`Frontend API contracts are not covered by the Express route manifest:\n${uncoveredFrontendRoutes.join('\n')}`);
}

console.log(`API route smoke passed: ${API_ROUTES.length} Express routes match the production route manifest.`);
