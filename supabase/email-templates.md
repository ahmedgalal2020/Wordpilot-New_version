# Supabase Email Templates

Use these templates inside the Supabase dashboard:

1. Open `Authentication`
2. Open `Templates`
3. Replace the HTML for:
   - `Confirm signup`
   - `Reset password`
   - `Change email address` or reauthentication-related templates if enabled

Recommended subjects:

- Confirm signup: `Confirm your Scholar Script account`
- Reset password: `Reset your Scholar Script password`
- Reauthentication: `Confirm your Scholar Script password change`

Template files:

- `supabase/templates/confirm-signup.html`
- `supabase/templates/reset-password.html`
- `supabase/templates/password-change-code.html`

Important variables supported by Supabase templates:

- `{{ .ConfirmationURL }}`
- `{{ .Token }}`
- `{{ .TokenHash }}`
- `{{ .SiteURL }}`
- `{{ .Email }}`

Note:

- The app now routes password reset links to `/reset-password`
- The account page password flow expects the reauthentication code email when secure password change is enabled
