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

export async function sendMigrationEmail(email: string, name: string, country: string, username: string, tempPassword: string) {
  const isVenezuela = country === 'VE';
  const subject = '[Yipi.app] ¡Bienvenido a Cujiware! Tu cuenta ha sido migrada exitosamente';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <img src="https://cujiware.com/CujiwareLetras.svg" alt="Cujiware Logo" style="max-width: 200px; margin-bottom: 20px;">

      <h1 style="color: #008AFF;">¡Bienvenido a Cujiware!</h1>

      <p>Hola ${name},</p>

      <p>Nos complace informarte que tu cuenta ha sido migrada exitosamente desde Yipi.app a nuestra nueva plataforma Cujiware. Este cambio es parte de nuestro proceso de renovación de marca y mejora continua de nuestros servicios.</p>

      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #008AFF; margin-top: 0;">Tus credenciales de acceso</h3>
        <p><strong>Email:</strong> ${username}</p>
        <p><strong>Contraseña temporal:</strong> ${tempPassword}</p>
        <p style="color: #dc3545; font-size: 14px;">Por seguridad, te recomendamos cambiar tu contraseña al ingresar por primera vez.</p>
      </div>

      <h2 style="color: #008AFF;">¿Qué ha cambiado?</h2>

      <p>Hemos implementado un nuevo sistema de gestión que ofrece:</p>

      <ul>
        <li>Panel de control mejorado para gestionar tus licencias y suscripciones</li>
        <li>Sistema de pagos más seguro y eficiente</li>
        <li>Mejor seguimiento del uso de tus licencias</li>
        <li>Acceso a nuevas funcionalidades y mejoras</li>
      </ul>

      ${!isVenezuela ? `
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #008AFF; margin-top: 0;">¡Importante! Acción requerida</h3>
        <p>Para asegurar la continuidad de tu servicio, necesitas vincular tu tarjeta de crédito a nuestro sistema antes de la fecha de renovación de tu plan. Si no realizas esta acción, tu licencia quedará suspendida en la fecha de renovación.</p>
        <p>Puedes vincular tu tarjeta ingresando a tu panel de control en <a href="https://cujiware.com/mi-cuenta">https://cujiware.com/mi-cuenta</a></p>
      </div>
      ` : ''}

      <h2 style="color: #008AFF;">Beneficios de la nueva plataforma</h2>

      <ul>
        <li><strong>Gestión de Licencias Mejorada:</strong> Control total sobre tus licencias y dominios autorizados</li>
        <li><strong>Sistema de Pagos Flexible:</strong> ${isVenezuela ? 'Pago móvil y Biopago en Venezuela' : 'Pagos con tarjeta a nivel internacional y automatizados con Stripe Subscriptions'}</li>
        <li><strong>Monitoreo de Uso:</strong> Ver y darle seguimiento detallado del uso de tus licencias por dominio, resetear el uso de una licencia cada 15 dias de forma manual.</li>
        <li><strong>Actualizaciones Automáticas:</strong> Estamos trabajando en el acceso a las últimas versiones de los plugins de forma automatica.</li>
      </ul>

      <h2 style="color: #008AFF;">Próximos pasos</h2>

      <ol>
        <li>Ingresa a tu cuenta en <a href="https://cujiware.com/mi-cuenta">https://cujiware.com/mi-cuenta</a> usando las credenciales proporcionadas</li>
        <li>Cambia tu contraseña por una nueva y segura</li>
        <li>Verifica que tus licencias y suscripciones estén correctamente migradas</li>
        ${!isVenezuela ? '<li>Vincula tu tarjeta para pagos automáticos</li>' : ''}
        <li>Explora las nuevas funcionalidades en tu panel de control</li>
      </ol>

      <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos respondiendo este correo.</p>

      <p>¡Gracias por tu confianza!</p>

      <p>El equipo de Cujiware</p>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
        <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}