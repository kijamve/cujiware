import type { APIRoute } from 'astro';
import prisma from '@/lib/db';
import { randomBytes } from 'crypto';
import { sendEmail } from '@/utils/email';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(
        JSON.stringify({
          error: 'El correo electrónico es requerido'
        }),
        { status: 400 }
      );
    }

    // Buscar el usuario por email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return new Response(
        JSON.stringify({
          message: 'Si el correo existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña.'
        }),
        { status: 200 }
      );
    }

    // Generar token único
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Expira en 1 hora

    // Guardar el token en la base de datos
    await prisma.user.update({
      where: { id: user.id },
      data: {
        reset_token: token,
        reset_token_expires: expiresAt
      }
    });

    // Enviar email con el enlace
    const resetUrl = `${import.meta.env.PUBLIC_APP_URL}/restablecer-contrasena?token=${token}`;
    await sendEmail({
      to: email,
      subject: 'Recuperación de contraseña - Cujiware',
      html: `
        <h1>Recuperación de contraseña</h1>
        <p>Hola,</p>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
      `
    });

    return new Response(
      JSON.stringify({
        message: 'Si el correo existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña.'
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en forgot-password:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al procesar la solicitud'
      }),
      { status: 500 }
    );
  }
}; 