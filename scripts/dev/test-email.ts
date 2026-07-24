/**
 * Quick SMTP test: npx tsx scripts/dev/test-email.ts you@gmail.com
 * Requires SMTP_USER + SMTP_PASS in backend/.env
 */
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error('Usage: npx tsx scripts/dev/test-email.ts you@gmail.com');
    process.exit(1);
  }

  // Dynamic import after dotenv so env.ts sees variables
  const { sendMail, isEmailEnabled } = await import('../../backend/src/services/email.service');

  if (!isEmailEnabled()) {
    console.error('SMTP not configured. Set SMTP_USER and SMTP_PASS in backend/.env');
    process.exit(1);
  }

  const result = await sendMail({
    to,
    subject: '[GAME MANIA] SMTP test',
    text: 'If you received this, Gmail SMTP is working for GAME MANIA.',
  });

  console.log(result);
  process.exit(result.sent ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
