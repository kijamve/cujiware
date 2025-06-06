import { ServerClient } from 'postmark';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const client = new ServerClient(import.meta.env.POSTMARK_SERVER_TOKEN);

export async function sendWelcomeEmail(email: string, password: string) {
  await client.sendEmail({
    From: 'system@cujiware.com',
    To: email,
    Subject: 'Bienvenido a Cujiware - Tus credenciales de acceso',
    TextBody: `Bienvenido a Cujiware!\n\nTu cuenta ha sido creada exitosamente.\n\nEmail: ${email}\nContraseña: ${password}\n\nPor favor, inicia sesión y cambia tu contraseña lo antes posible.\n\nSaludos,\nEl equipo de Cujiware`,
    HtmlBody: `
      <h1>Bienvenido a Cujiware!</h1>
      <p>Tu cuenta ha sido creada exitosamente.</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Contraseña:</strong> ${password}</p>
      <p>Por favor, inicia sesión y cambia tu contraseña lo antes posible.</p>
      <p>Saludos,<br>El equipo de Cujiware</p>
    `
  });
}

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