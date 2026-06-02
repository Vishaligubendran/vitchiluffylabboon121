#!/usr/bin/env node
/**
 * How to send verification emails to ANY inbox (Gmail, Outlook, Yahoo, company mail, etc.)
 */
console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║  247 Shop — send verification email to ANY email inbox               ║
╚══════════════════════════════════════════════════════════════════════╝

Right now emails only show on the register screen because no mail provider
is configured in .env.

Pick ONE option below (Brevo is easiest — free, any recipient):

────────────────────────────────────────────────────────────────────────
OPTION A — Brevo (recommended, free ~300 emails/day, any inbox)
────────────────────────────────────────────────────────────────────────
1. Sign up: https://www.brevo.com/
2. SMTP & API → SMTP → Create SMTP key
3. Add to .env:

   EMAIL_PROVIDER=smtp
   EMAIL_FROM=your-login-email@example.com
   EMAIL_FROM_NAME=247 Shop
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-brevo-login-email@example.com
   SMTP_PASS=your-brevo-smtp-key

4. Test:  npm run email:test recipient@any-domain.com
5. Restart API: npm run dev

────────────────────────────────────────────────────────────────────────
OPTION B — Resend (API key, good deliverability)
────────────────────────────────────────────────────────────────────────
1. Sign up: https://resend.com/ → API Keys
2. Add to .env:

   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_xxxxxxxx
   RESEND_FROM=247 Shop <onboarding@resend.dev>

   Note: onboarding@resend.dev only delivers to YOUR Resend account email
   until you verify a domain. Then it works for any recipient.

3. Test & restart as above.

────────────────────────────────────────────────────────────────────────
OPTION C — Gmail SMTP
────────────────────────────────────────────────────────────────────────
1. Google Account → Security → 2-Step Verification → App passwords
2. Add to .env:

   EMAIL_PROVIDER=smtp
   EMAIL_FROM=your@gmail.com
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your@gmail.com
   SMTP_PASS=16-char-app-password

────────────────────────────────────────────────────────────────────────
OPTION D — Outlook / Hotmail / Live
────────────────────────────────────────────────────────────────────────
   SMTP_HOST=smtp-mail.outlook.com
   SMTP_PORT=587
   SMTP_USER=your@outlook.com
   SMTP_PASS=your-password-or-app-password

After setup, register with ANY email — the link is sent to that address.
`);
