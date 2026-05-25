import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.resolve(rootDir, '.env.local') });
dotenv.config({ path: path.resolve(rootDir, '.env') });

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.SUPABASE_PROJECT_REF ?? 'tusyyfbgitltfhgewarn';

if (!accessToken) {
  throw new Error('SUPABASE_ACCESS_TOKEN is required.');
}

const brand = {
  name: 'WordPilot',
  tagline: 'Focused dictation and AI practice in one workspace.',
  siteUrl: process.env.APP_URL ?? 'http://localhost:3000',
};

function shell({ eyebrow, title, preview, body, ctaLabel, ctaUrl = '{{ .ConfirmationURL }}', code, note }) {
  const cta = ctaLabel
    ? `
      <tr>
        <td style="padding:0 40px 6px;">
          <a href="${ctaUrl}" style="display:inline-block;background:#0053db;color:#f8f7ff;text-decoration:none;padding:15px 24px;border-radius:999px;font-size:15px;font-weight:800;letter-spacing:0;">
            ${ctaLabel}
          </a>
        </td>
      </tr>`
    : '';
  const codeBlock = code
    ? `
      <tr>
        <td style="padding:4px 40px 26px;">
          <div style="background:#f0f4f7;border:1px solid #e1e9ee;border-radius:20px;padding:22px;text-align:center;">
            <div style="font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#566166;">Verification code</div>
            <div style="margin-top:12px;font-size:34px;line-height:1;font-weight:900;letter-spacing:.24em;color:#0053db;">${code}</div>
          </div>
        </td>
      </tr>`
    : '';
  const backup = ctaLabel
    ? `
      <tr>
        <td style="padding:20px 40px 0;">
          <div style="background:#f7f9fb;border:1px solid #e8eff3;border-radius:18px;padding:16px;">
            <div style="font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#566166;">Backup link</div>
            <p style="margin:10px 0 0;font-size:13px;line-height:1.6;color:#566166;word-break:break-all;">${ctaUrl}</p>
          </div>
        </td>
      </tr>`
    : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f7f9fb;font-family:Inter,Arial,sans-serif;color:#2a3439;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preview}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f9fb;padding:34px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e8eff3;border-radius:28px;overflow:hidden;box-shadow:0 14px 34px rgba(42,52,57,.08);">
            <tr>
              <td style="background:#0053db;padding:34px 40px;color:#f8f7ff;">
                <div style="font-size:30px;line-height:1;font-weight:900;letter-spacing:-.04em;">${brand.name}</div>
                <div style="margin-top:14px;font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#dbe1ff;">${eyebrow}</div>
                <h1 style="margin:16px 0 0;font-size:34px;line-height:1.12;font-weight:900;letter-spacing:0;color:#ffffff;">${title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 40px 22px;">
                <p style="margin:0 0 14px;font-size:15px;line-height:1.8;color:#566166;">Hi {{ .Email }},</p>
                ${body}
              </td>
            </tr>
            ${cta}
            ${codeBlock}
            ${backup}
            <tr>
              <td style="padding:24px 40px 34px;">
                <p style="margin:0;font-size:13px;line-height:1.8;color:#566166;">${note}</p>
                <div style="height:1px;background:#e8eff3;margin:24px 0;"></div>
                <p style="margin:0;font-size:12px;line-height:1.7;color:#717c82;">${brand.tagline}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

const templates = {
  mailer_subjects_confirmation: `Confirm your ${brand.name} account`,
  mailer_templates_confirmation_content: shell({
    eyebrow: 'Confirm signup',
    title: 'Welcome to your learning workspace',
    preview: `Confirm your ${brand.name} account and start using your dashboard.`,
    body: `<p style="margin:0 0 12px;font-size:15px;line-height:1.8;color:#566166;">Your account is almost ready. Confirm your email to open your dashboard and saved learning work.</p>`,
    ctaLabel: 'Confirm my account',
    note: 'If this was not you, no action is needed.',
  }),
  mailer_subjects_recovery: `Reset your ${brand.name} access`,
  mailer_templates_recovery_content: shell({
    eyebrow: 'Account recovery',
    title: 'Create new sign-in details',
    preview: `Use this link to recover your ${brand.name} account.`,
    body: `<p style="margin:0 0 12px;font-size:15px;line-height:1.8;color:#566166;">We received a request to recover your account. Use the button below to continue.</p>`,
    ctaLabel: 'Continue recovery',
    note: 'If this was not you, no action is needed.',
  }),
  mailer_subjects_magic_link: `Your ${brand.name} sign-in link`,
  mailer_templates_magic_link_content: shell({
    eyebrow: 'Secure sign in',
    title: 'Open your workspace',
    preview: `Use this magic link to sign in to ${brand.name}.`,
    body: `<p style="margin:0 0 12px;font-size:15px;line-height:1.8;color:#566166;">Use this secure link to sign in without typing your password.</p>`,
    ctaLabel: 'Sign in to WordPilot',
    note: 'If this was not you, no action is needed.',
  }),
  mailer_subjects_invite: `You have been invited to ${brand.name}`,
  mailer_templates_invite_content: shell({
    eyebrow: 'Workspace invite',
    title: 'Accept your invitation',
    preview: `You have been invited to create a ${brand.name} account.`,
    body: `<p style="margin:0 0 12px;font-size:15px;line-height:1.8;color:#566166;">You have been invited to create an account and start using the learning workspace.</p>`,
    ctaLabel: 'Accept invitation',
    note: 'If this was not expected, no action is needed.',
  }),
  mailer_subjects_email_change: `Confirm your ${brand.name} email change`,
  mailer_templates_email_change_content: shell({
    eyebrow: 'Email change',
    title: 'Confirm your new email',
    preview: `Confirm the email address update for your ${brand.name} account.`,
    body: `<p style="margin:0 0 12px;font-size:15px;line-height:1.8;color:#566166;">Confirm the update from <strong>{{ .Email }}</strong> to <strong>{{ .NewEmail }}</strong>.</p>`,
    ctaLabel: 'Confirm email change',
    note: 'If this was not you, no action is needed.',
  }),
  mailer_subjects_reauthentication: `Confirm your ${brand.name} code`,
  mailer_templates_reauthentication_content: shell({
    eyebrow: 'Verification code',
    title: 'Confirm this account step',
    preview: `Use this code to continue in ${brand.name}.`,
    body: `<p style="margin:0 0 12px;font-size:15px;line-height:1.8;color:#566166;">Enter this verification code in your account page to continue.</p>`,
    code: '{{ .Token }}',
    note: 'If this was not you, no action is needed.',
  }),
};

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(templates),
});

const payload = await response.json().catch(() => ({}));

if (!response.ok) {
  throw new Error(payload.message ?? payload.error ?? `Supabase Auth config update failed with ${response.status}`);
}

console.log(`Updated Supabase Auth email templates for ${projectRef}.`);
