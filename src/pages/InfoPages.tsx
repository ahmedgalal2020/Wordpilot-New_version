import type { FormEvent, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, LifeBuoy, LockKeyhole, Mail, ScrollText, Send } from 'lucide-react';

type InfoSection = {
  title: string;
  body: string;
  items?: string[];
};

type InfoPageContent = {
  title: string;
  eyebrow: string;
  updated: string;
  description: string;
  icon: ReactNode;
  highlights: string[];
  sections: InfoSection[];
  note?: string;
};

const supportEmail = 'support@wordpilot.app';

const pages: Record<string, InfoPageContent> = {
  '/privacy': {
    title: 'Privacy Policy',
    eyebrow: 'Privacy',
    updated: 'Effective May 3, 2026',
    icon: <LockKeyhole className="h-5 w-5" />,
    description: 'How WordPilot collects, uses, protects, and manages account, learning, billing, and support data.',
    highlights: [
      'We collect the data needed to run accounts, practice history, AI workflows, billing, and support.',
      'Payment details are handled by Stripe; WordPilot stores billing references and invoice metadata.',
      'You can request account support, deletion, or correction through Contact Support.',
    ],
    sections: [
      {
        title: 'Information we collect',
        body: 'WordPilot may collect information you provide directly, information generated while using the product, and technical information needed to keep the service reliable.',
        items: [
          'Account data: email, name, authentication state, profile language, and CEFR level.',
          'Learning data: saved texts, generated prompts, dictation attempts, scores, certificates, and usage counts.',
          'Billing data: plan status, subscription identifiers, invoice labels, payment status, renewal dates, and Stripe references.',
          'Support data: messages, screenshots, issue descriptions, account email, and admin actions needed to resolve a request.',
        ],
      },
      {
        title: 'How we use information',
        body: 'We use data for product operation, personalization, billing, security, support, and legal compliance.',
        items: [
          'Authenticate users and protect admin-only areas.',
          'Sync progress, saved content, certificates, and dashboard metrics.',
          'Apply plan limits, unlock WordPilot Pro, and show invoices.',
          'Send account emails such as confirmation, recovery, and security notices.',
          'Investigate misuse, blocked accounts, billing issues, or technical errors.',
        ],
      },
      {
        title: 'AI and learning content',
        body: 'AI features may process prompts, generated texts, and related settings to create practice material. Users should avoid entering highly sensitive personal information into prompts or practice text.',
        items: [
          'Generated content should be reviewed before use in formal or professional settings.',
          'Practice scores are learning aids, not official language certifications unless separately verified.',
          'Saved AI outputs and dictation history may be used to display account history and usage counts.',
        ],
      },
      {
        title: 'Sharing and service providers',
        body: 'WordPilot uses trusted providers to operate the product. We do not sell personal information as a product feature.',
        items: [
          'Supabase for authentication, database records, and account email delivery.',
          'Stripe for checkout, subscriptions, payment status, and invoices.',
          'AI providers for text generation when you use AI features.',
          'Email or support providers if configured for receipts and customer support.',
        ],
      },
      {
        title: 'Security and retention',
        body: 'We aim to keep only data needed for the service and protect it with account controls, role-based admin access, and provider security tools.',
        items: [
          'Admin access is checked server-side before platform-wide data is returned.',
          'Blocked accounts may be restricted through Supabase Auth and internal records.',
          'Billing records may be retained as needed for accounting, dispute handling, and compliance.',
          'Deletion requests may be limited where retention is required for security, fraud prevention, or legal obligations.',
        ],
      },
      {
        title: 'Your choices and rights',
        body: 'Depending on your location, you may have rights to access, correct, delete, or receive information about personal data.',
        items: [
          'Update profile details from Account Settings.',
          'Request help with account deletion, correction, or billing records from Contact Support.',
          'Use reset password flows to recover access securely.',
          'Contact us if you believe an admin block or subscription action was applied incorrectly.',
        ],
      },
    ],
    note: 'This policy is a product-ready starting point and should be reviewed by legal counsel before large-scale commercial launch or international expansion.',
  },
  '/terms': {
    title: 'Terms of Service',
    eyebrow: 'Terms',
    updated: 'Effective May 3, 2026',
    icon: <ScrollText className="h-5 w-5" />,
    description: 'The rules for using WordPilot, WordPilot Pro, AI practice tools, subscriptions, and account features.',
    highlights: [
      'Use WordPilot for lawful language learning, writing, and dictation practice.',
      'WordPilot Pro subscriptions should be presented clearly, with accessible cancellation and billing support.',
      'AI-generated content and practice scores are learning tools and should be reviewed by the user.',
    ],
    sections: [
      {
        title: 'Account responsibilities',
        body: 'You are responsible for keeping your account credentials safe and for activity that occurs under your account.',
        items: [
          'Use accurate signup and billing information.',
          'Do not share admin access or attempt to access another user account.',
          'Notify support if you believe your account was compromised.',
        ],
      },
      {
        title: 'Acceptable use',
        body: 'WordPilot must not be used for unlawful, abusive, deceptive, or harmful activity.',
        items: [
          'Do not upload or generate content that infringes rights or violates applicable law.',
          'Do not bypass limits, payment checks, authentication, or admin controls.',
          'Do not interfere with the service, database, email flows, or third-party providers.',
        ],
      },
      {
        title: 'Subscriptions and billing',
        body: 'WordPilot Pro may renew automatically when purchased through checkout. Billing terms should be clear before payment.',
        items: [
          'Plan status, invoices, and renewal information are shown in Account Settings when available.',
          'Cancellation support should be reasonably accessible through the account or support channel.',
          'Refunds, disputes, and failed payments may depend on Stripe records and applicable law.',
          'Admin cancellation may stop future access and update local subscription records.',
        ],
      },
      {
        title: 'AI outputs and learning results',
        body: 'AI-generated text, dictation scores, and certificates are designed for learning and productivity.',
        items: [
          'Review generated content before relying on it.',
          'Do not treat AI output as legal, medical, financial, or official academic advice.',
          'Certificates generated in the app reflect WordPilot activity, not government or university accreditation.',
        ],
      },
      {
        title: 'Suspension and blocking',
        body: 'WordPilot may restrict or block accounts to protect users, billing systems, or platform integrity.',
        items: [
          'Reasons may include abuse, payment disputes, security risk, policy violations, or admin review.',
          'Blocked users can contact support with their account email and issue details.',
          'Admins should document block reasons and avoid blocking their own owner account.',
        ],
      },
      {
        title: 'Changes and availability',
        body: 'WordPilot may update features, limits, pricing, policies, or integrations as the product evolves.',
        items: [
          'We aim to avoid unnecessary disruption to saved learning work.',
          'Some features depend on Supabase, Stripe, AI providers, and email services.',
          'Continued use after updates means acceptance of the updated terms where allowed by law.',
        ],
      },
    ],
    note: 'These terms are operational product terms and should be reviewed by counsel before public launch or paid scale.',
  },
  '/help': {
    title: 'Help Center',
    eyebrow: 'Support',
    updated: 'Updated May 3, 2026',
    icon: <LifeBuoy className="h-5 w-5" />,
    description: 'Fast answers for account access, practice history, AI generation, billing, certificates, and admin-managed account issues.',
    highlights: [
      'Use Forgot Password or ask an admin to send a reset email if you cannot access your account.',
      'Practice history appears after sessions are saved and Supabase sync is connected.',
      'Billing and invoice data appears after a successful Stripe checkout or sync.',
    ],
    sections: [
      {
        title: 'Account access',
        body: 'If you cannot sign in, start with the password recovery flow.',
        items: [
          'Open Login, choose Forgot Password, and follow the email link.',
          'Check spam or promotions folders if the email does not arrive.',
          'If rate limits appear, wait before requesting another reset email.',
          'If an account is blocked, contact support with your account email.',
        ],
      },
      {
        title: 'Dictation workspace',
        body: 'The workspace saves sessions, scores, source text, typed text, and review details when connected to your account.',
        items: [
          'Start a new dictation from Dashboard or Start New.',
          'Review recent sessions from Dashboard.',
          'Free plans may have saved-session limits.',
          'WordPilot Pro unlocks expanded saved practice history.',
        ],
      },
      {
        title: 'AI Lab',
        body: 'AI Lab creates practice texts aligned to your language, level, and prompt.',
        items: [
          'Choose a level and language before generation.',
          'Save useful texts to your library.',
          'Avoid entering highly sensitive personal information into prompts.',
          'If generation is unavailable, check usage limits or API configuration.',
        ],
      },
      {
        title: 'Billing and invoices',
        body: 'Plan and billing data is visible in Account Settings after checkout and sync.',
        items: [
          'Successful checkout activates WordPilot Pro.',
          'Invoices appear when Stripe or the server sync returns invoice data.',
          'Admins can cancel active subscription records from the admin dashboard.',
          'For invoice issues, include the invoice label and account email in support requests.',
        ],
      },
      {
        title: 'Certificates',
        body: 'Certificates reflect strong dictation performance recorded inside WordPilot.',
        items: [
          'Open Certificates from the account navigation.',
          'Use certificates as practice evidence, not official accreditation.',
          'If a certificate is missing, confirm the session was saved successfully.',
        ],
      },
      {
        title: 'Admin dashboard',
        body: 'Admins can monitor users, subscriptions, invoices, learning activity, and support actions.',
        items: [
          'Search users by name or email.',
          'Send password reset emails for registered users.',
          'Block or unblock user accounts.',
          'Cancel active subscriptions and review billing metrics.',
        ],
      },
    ],
  },
  '/contact': {
    title: 'Contact Support',
    eyebrow: 'Contact',
    updated: 'Support desk',
    icon: <Mail className="h-5 w-5" />,
    description: 'Send a focused support request with the details WordPilot needs to help quickly.',
    highlights: [
      'Include your account email and the page where the issue happened.',
      'For billing issues, include invoice labels or checkout email.',
      'For access issues, include the exact error message shown on screen.',
    ],
    sections: [
      {
        title: 'What to include',
        body: 'Good support requests are specific and easy to reproduce.',
        items: [
          'Account email and full name.',
          'Issue type: access, billing, AI Lab, dictation, certificates, or admin.',
          'Steps that caused the issue.',
          'Screenshots or exact error messages when available.',
        ],
      },
      {
        title: 'Expected response',
        body: 'Support priority depends on account access, billing impact, and whether data or security is involved.',
        items: [
          'Access and billing issues should be handled first.',
          'Product questions can include page names and desired outcome.',
          'Security concerns should be clearly marked in the subject.',
        ],
      },
      {
        title: 'Support address',
        body: `Use ${supportEmail} for account, billing, and technical support until a dedicated ticketing system is connected.`,
        items: [
          'Do not include passwords or full payment card details.',
          'Use the same email tied to your WordPilot account.',
          'Admins should include affected user email when reporting platform issues.',
        ],
      },
    ],
  },
};

const issueTypes = ['Account access', 'Billing', 'AI Lab', 'Dictation workspace', 'Certificates', 'Admin dashboard', 'Other'];

export default function InfoPage() {
  const location = useLocation();
  const content = pages[location.pathname] ?? pages['/help'];

  return (
    <main className="pt-24 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto min-h-screen">
      <header className="mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-container px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary">
          {content.icon}
          {content.eyebrow}
        </div>
        <h1 className="mt-5 font-headline font-extrabold text-3xl sm:text-4xl tracking-tight text-on-surface">
          {content.title}
        </h1>
        <p className="mt-3 max-w-3xl text-on-surface-variant">{content.description}</p>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">{content.updated}</p>
      </header>

      <section className="mb-10 rounded-[2rem] bg-primary p-6 sm:p-8 text-on-primary whisper-shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {content.highlights.map((highlight) => (
            <div key={highlight} className="flex gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary-container" />
              <p className="text-sm leading-6 text-on-primary/85">{highlight}</p>
            </div>
          ))}
        </div>
      </section>

      {location.pathname === '/contact' ? <ContactForm /> : null}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {content.sections.map((section) => (
          <article key={section.title} className="rounded-2xl bg-surface-container-lowest p-6 whisper-shadow">
            <h2 className="font-headline font-bold text-xl text-on-surface">{section.title}</h2>
            <p className="mt-3 text-sm leading-7 text-on-surface-variant">{section.body}</p>
            {section.items && (
              <ul className="mt-5 space-y-3">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-on-surface-variant">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </section>

      {content.note && (
        <section className="mt-8 rounded-2xl border border-surface-container bg-surface-container-low px-5 py-4 text-sm leading-6 text-on-surface-variant">
          {content.note}
        </section>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/dashboard" className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-on-primary transition hover:bg-primary-dim">
          Open Dashboard
        </Link>
        <Link to="/contact" className="rounded-full bg-surface-container px-6 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-high">
          Contact Support
        </Link>
      </div>
    </main>
  );
}

function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [issueType, setIssueType] = useState(issueTypes[0]);
  const [message, setMessage] = useState('');

  const mailto = useMemo(() => {
    const subject = encodeURIComponent(`WordPilot support: ${issueType}`);
    const body = encodeURIComponent(
      `Name: ${name}\nAccount email: ${email}\nIssue type: ${issueType}\n\nMessage:\n${message}`,
    );
    return `mailto:${supportEmail}?subject=${subject}&body=${body}`;
  }, [email, issueType, message, name]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.location.href = mailto;
  }

  return (
    <section className="mb-10 rounded-[2rem] bg-surface-container-lowest p-6 sm:p-8 whisper-shadow">
      <div className="mb-6">
        <h2 className="font-headline font-bold text-2xl text-on-surface">Send a support request</h2>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
          This form prepares an email with the details support needs. It does not send passwords or payment card details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Your name">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-surface-container bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary"
            placeholder="Eng.Ahmed Hassan"
          />
        </Field>
        <Field label="Account email">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            className="w-full rounded-xl border border-surface-container bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary"
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Issue type">
          <select
            value={issueType}
            onChange={(event) => setIssueType(event.target.value)}
            className="w-full rounded-xl border border-surface-container bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary"
          >
            {issueTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>
        <div className="md:row-span-2">
          <Field label="Message">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={6}
              className="w-full resize-none rounded-xl border border-surface-container bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="Tell us what happened, where it happened, and what you expected."
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-on-primary transition hover:bg-primary-dim"
          >
            <Send className="h-4 w-4" />
            Prepare Email
          </button>
          <a href={`mailto:${supportEmail}`} className="ml-4 text-sm font-bold text-primary hover:underline">
            {supportEmail}
          </a>
        </div>
      </form>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant">{label}</span>
      {children}
    </label>
  );
}
