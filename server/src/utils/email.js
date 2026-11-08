// Transactional email through Resend (https://resend.com/docs/api-reference/emails/send-email).
// Optional: without RESEND_API_KEY and EMAIL_FROM, reminders are listed in the admin panel instead.
const { email, storeName } = require('../config/env');

const emailConfigured = () => Boolean(email.resendKey && email.from);

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

async function sendReminderEmail(reminder, fitUrl) {
  const first = (reminder.name || '').split(' ')[0] || 'there';
  const items = reminder.products.map((p) => `<li>${escapeHtml(p)}</li>`).join('');
  const html = `
    <p>Hi ${escapeHtml(first)},</p>
    <p>It has been a while since you bought these wiper blades from ${escapeHtml(storeName)}:</p>
    <ul>${items}</ul>
    <p>Rubber hardens with sun and heat, so now is a good time to check them. If you see streaks,
    hear chatter, or notice cracked edges, it's time for a new pair.</p>
    <p><a href="${fitUrl}">Find the right size for your car</a></p>
    <p style="color:#888;font-size:12px">You are receiving this because you asked for a replacement reminder at checkout.
    You can cancel reminders from your orders page.</p>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${email.resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: email.from, to: [reminder.email], subject: 'Time to check your wiper blades', html }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}`);
}

module.exports = { emailConfigured, sendReminderEmail };
