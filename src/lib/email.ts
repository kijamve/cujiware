import { ServerClient } from 'postmark';

export async function sendWelcomeEmail(email: string, password: string) {
  const client = new ServerClient(import.meta.env.POSTMARK_SERVER_TOKEN);
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