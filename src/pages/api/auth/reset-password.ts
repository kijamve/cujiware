import type { APIRoute } from 'astro';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return new Response(
        JSON.stringify({
          error: 'Token y contraseña son requeridos'
        }),
        { status: 400 }
      );
    }

    // Buscar usuario con el token válido
    const user = await prisma.user.findFirst({
      where: {
        reset_token: token,
        reset_token_expires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return new Response(
        JSON.stringify({
          error: 'Token inválido o expirado'
        }),
        { status: 400 }
      );
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Actualizar la contraseña y limpiar el token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        reset_token: null,
        reset_token_expires: null
      }
    });

    // Generar nuevo token JWT
    const jwtToken = jwt.sign(
      { userId: user.id },
      import.meta.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Establecer la cookie
    return new Response(
      JSON.stringify({
        message: 'Contraseña actualizada exitosamente'
      }),
      {
        status: 200,
        headers: {
          'Set-Cookie': `token=${jwtToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
        }
      }
    );
  } catch (error) {
    console.error('Error en reset-password:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al procesar la solicitud'
      }),
      { status: 500 }
    );
  }
}; 