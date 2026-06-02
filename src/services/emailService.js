const nodemailer = require('nodemailer');
const { nodeEnv, email: emailConfig } = require('../config/env');
const ApiError = require('../utils/ApiError');

let transporter = null;

const SENT_MODES = new Set(['smtp', 'resend']);

function isResendConfigured() {
  return Boolean(emailConfig.resend.apiKey);
}

function isSmtpConfigured() {
  return Boolean(
    emailConfig.smtp.host && emailConfig.smtp.user && emailConfig.smtp.pass
  );
}

function isEmailConfigured() {
  return isResendConfigured() || isSmtpConfigured();
}

function getActiveProvider() {
  const preferred = (emailConfig.provider || 'auto').toLowerCase();
  if (preferred === 'resend' && isResendConfigured()) return 'resend';
  if (preferred === 'smtp' && isSmtpConfigured()) return 'smtp';
  if (preferred === 'auto') {
    if (isResendConfigured()) return 'resend';
    if (isSmtpConfigured()) return 'smtp';
  }
  return null;
}

function resolveFromAddress() {
  const from = emailConfig.from || emailConfig.smtp.user;
  if (!from) return null;
  return emailConfig.fromName
    ? `"${emailConfig.fromName}" <${from}>`
    : from;
}

function getTransporter() {
  if (transporter) return transporter;
  if (!isSmtpConfigured()) return null;

  const auth = {
    user: emailConfig.smtp.user,
    pass: emailConfig.smtp.pass,
  };

  const isGmail =
    emailConfig.smtp.host === 'smtp.gmail.com' ||
    (emailConfig.smtp.user && emailConfig.smtp.user.endsWith('@gmail.com'));

  transporter = isGmail
    ? nodemailer.createTransport({ service: 'gmail', auth })
    : nodemailer.createTransport({
        host: emailConfig.smtp.host,
        port: emailConfig.smtp.port,
        secure: emailConfig.smtp.secure,
        requireTLS: !emailConfig.smtp.secure && emailConfig.smtp.port === 587,
        auth,
        tls: { minVersion: 'TLSv1.2' },
      });

  return transporter;
}

async function sendViaResend({ to, subject, html, text }) {
  const from = emailConfig.resend.from || resolveFromAddress();
  if (!from) {
    throw new Error('Set EMAIL_FROM or RESEND_FROM in .env (e.g. onboarding@resend.dev)');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${emailConfig.resend.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = body.message || body.error || response.statusText;
    throw new Error(`Resend API: ${detail}`);
  }

  return { success: true, mode: 'resend', id: body.id };
}

async function sendViaSmtp({ to, subject, html, text }) {
  const transport = getTransporter();
  const from = resolveFromAddress();

  if (!transport || !from) {
    throw new Error('SMTP is misconfigured — set SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM');
  }

  const info = await transport.sendMail({ from, to, subject, html, text });
  const previewUrl = nodemailer.getTestMessageUrl(info);
  return {
    success: true,
    mode: 'smtp',
    messageId: info.messageId,
    previewUrl: previewUrl || undefined,
  };
}

async function deliverEmail(payload) {
  if (nodeEnv === 'test') {
    return { success: true, mode: 'console' };
  }

  const provider = getActiveProvider();

  if (!provider) {
    return { success: true, mode: 'console' };
  }

  try {
    if (provider === 'resend') {
      return await sendViaResend(payload);
    }
    return await sendViaSmtp(payload);
  } catch (err) {
    console.error(`[EMAIL] ${provider} delivery failed:`, err.message);
    if (nodeEnv === 'production' || isEmailConfigured()) {
      throw ApiError.serviceUnavailable(
        'Could not send email. Check EMAIL / SMTP / Resend settings in .env and run: npm run email:setup'
      );
    }
    throw err;
  }
}

function buildVerificationEmail(verificationLink) {
  const subject = 'Verify your 247 Shop email';
  const text = `Verify your email for 247 Shop:\n\n${verificationLink}\n\nThis link expires in 24 hours.`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h2 style="color:#1e3a5f">Verify your email</h2>
      <p>Thanks for registering with <strong>247 Shop</strong>.</p>
      <p>Click the button below to verify your email address:</p>
      <p style="margin:28px 0">
        <a href="${verificationLink}"
           style="background:#1e3a5f;color:#fff;padding:14px 24px;text-decoration:none;border-radius:8px;font-weight:600">
          Verify Email
        </a>
      </p>
      <p style="font-size:13px;color:#6b7280">Or copy this link:<br/>
        <a href="${verificationLink}">${verificationLink}</a>
      </p>
      <p style="font-size:12px;color:#9ca3af">If you did not create an account, ignore this email.</p>
    </div>
  `;
  return { subject, text, html };
}

function buildResetEmail(resetLink) {
  const subject = 'Reset your 247 Shop PIN / password';
  const text = `Reset your credentials:\n\n${resetLink}\n\nThis link expires in 1 hour.`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h2 style="color:#1e3a5f">Reset credentials</h2>
      <p>We received a request to reset your PIN and password.</p>
      <p style="margin:28px 0">
        <a href="${resetLink}"
           style="background:#1e3a5f;color:#fff;padding:14px 24px;text-decoration:none;border-radius:8px;font-weight:600">
          Reset PIN / Password
        </a>
      </p>
      <p style="font-size:13px;color:#6b7280"><a href="${resetLink}">${resetLink}</a></p>
    </div>
  `;
  return { subject, text, html };
}

function logConsoleFallback(kind, email, link) {
  console.log(`\n========== ${kind} (not sent — configure email in .env) ==========`);
  console.log(`To: ${email}`);
  console.log(`Link: ${link}`);
  console.log('Run: npm run email:setup');
  console.log('================================================================\n');
}

async function sendVerificationEmail(email, verificationLink) {
  const content = buildVerificationEmail(verificationLink);
  const result = await deliverEmail({ to: email, ...content });

  if (SENT_MODES.has(result.mode)) {
    console.log(`[EMAIL] Verification sent to ${email} via ${result.mode}`);
    if (result.previewUrl) {
      console.log(`[EMAIL] Preview (dev): ${result.previewUrl}`);
    }
    return result;
  }

  logConsoleFallback('EMAIL VERIFICATION', email, verificationLink);
  return { success: true, mode: 'console' };
}

async function sendCredentialResetEmail(email, resetLink) {
  const content = buildResetEmail(resetLink);
  const result = await deliverEmail({ to: email, ...content });

  if (SENT_MODES.has(result.mode)) {
    console.log(`[EMAIL] Reset link sent to ${email} via ${result.mode}`);
    return result;
  }

  logConsoleFallback('CREDENTIAL RESET', email, resetLink);
  return { success: true, mode: 'console' };
}

async function verifySmtpConnection() {
  const transport = getTransporter();
  if (!transport) return false;
  await transport.verify();
  return true;
}

async function verifyEmailConnection() {
  const provider = getActiveProvider();
  if (!provider) return false;
  if (provider === 'smtp') {
    await verifySmtpConnection();
    return true;
  }
  return true;
}

function getTransportMode() {
  return getActiveProvider() || 'console';
}

function wasEmailSent(emailResult) {
  return emailResult && SENT_MODES.has(emailResult.mode);
}

module.exports = {
  sendVerificationEmail,
  sendCredentialResetEmail,
  isSmtpConfigured,
  isResendConfigured,
  isEmailConfigured,
  getActiveProvider,
  getTransportMode,
  verifySmtpConnection,
  verifyEmailConnection,
  wasEmailSent,
};
