import React from 'react';
import { CheckCircle2, LoaderCircle, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function isValidEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value);
}

export default function ForgotPasswordPage() {
  const { resetPassword, authReady, authMessage } = useAuth();
  const [email, setEmail] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(authMessage);
  const [isSuccess, setIsSuccess] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSuccess(false);

    if (!isValidEmail(email.trim())) {
      setMessage('Enter a valid email address first.');
      return;
    }

    setSubmitting(true);
    const result = await resetPassword(email.trim());
    setSubmitting(false);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setIsSuccess(true);
    setMessage(result.message ?? 'Password reset email sent.');
  }

  return (
    <main className="flex-grow flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-container rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-48 w-80 h-80 bg-tertiary-container rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-surface-container-lowest rounded-[2.5rem] whisper-shadow overflow-hidden p-10 flex flex-col gap-8">
          <div className="text-left space-y-2">
            <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight">Reset your password</h1>
            <p className="text-on-surface-variant">
              Enter your email and we will send you a secure reset link in the same clean account flow.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">Email Address</label>
              <input
                className="w-full bg-surface-container-low border border-transparent rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-on-surface placeholder:text-outline text-sm"
                placeholder="student@university.edu"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>

            {message && (
              <div className={`rounded-xl border px-4 py-3 text-sm flex items-start gap-3 ${isSuccess ? 'bg-primary/10 text-on-surface border-primary/20' : 'bg-error/10 text-error border-error/20'}`}>
                {isSuccess ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <Mail className="w-5 h-5 shrink-0 mt-0.5" />}
                <span>{message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !authReady}
              className="w-full py-4 px-6 primary-gradient text-on-primary rounded-full font-headline font-bold tracking-tight shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 inline-flex items-center justify-center gap-2"
            >
              {submitting && <LoaderCircle className="w-4 h-4 animate-spin" />}
              Send reset link
            </button>
          </form>

          <div className="pt-2 text-center">
            <p className="text-sm text-on-surface-variant">
              Remembered it?
              <Link to="/login" className="text-primary font-semibold hover:underline ml-1">
                Back to log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
