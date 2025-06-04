import { ServerClient } from 'postmark';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const client = new ServerClient(import.meta.env.POSTMARK_SERVER_TOKEN);

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    await client.sendEmail({
      From: 'system@cujiware.com',
      To: to,
      Subject: subject,
      HtmlBody: html,
      TextBody: html.replace(/<[^>]*>/g, '') // Convertir HTML a texto plano
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Error sending email');
  }
} 