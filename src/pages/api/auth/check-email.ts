import type { APIRoute } from 'astro';
import prisma from '@/lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(
        JSON.stringify({
          error: 'El email es requerido'
        }),
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    return new Response(
      JSON.stringify({
        exists: !!existingUser
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al verificar email:', error);
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor'
      }),
      { status: 500 }
    );
  }
}; 