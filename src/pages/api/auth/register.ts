import type { APIRoute } from 'astro';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm-password') as string;
    const name = formData.get('name') as string;
    const country = formData.get('country') as string;

    if (!email || !password || !confirmPassword || !name || !country) {
      return new Response(
        JSON.stringify({
          error: 'Todos los campos son requeridos'
        }),
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return new Response(
        JSON.stringify({
          error: 'Las contraseñas no coinciden'
        }),
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return new Response(
        JSON.stringify({
          error: 'El email ya está registrado'
        }),
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        country
      }
    });

    return new Response(
      JSON.stringify({
        message: 'Usuario registrado exitosamente',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          country: user.country
        }
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en registro:', error);
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor'
      }),
      { status: 500 }
    );
  }
}; 