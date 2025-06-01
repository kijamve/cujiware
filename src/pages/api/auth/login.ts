import type { APIRoute } from 'astro';
import prisma from '../../../lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return new Response(
        JSON.stringify({
          error: 'Email y contraseña son requeridos'
        }),
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            plan: true
          }
        }
      }
    });

    if (!user) {
      return new Response(
        JSON.stringify({
          error: 'Credenciales inválidas'
        }),
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return new Response(
        JSON.stringify({
          error: 'Credenciales inválidas'
        }),
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email
      },
      import.meta.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return new Response(
      JSON.stringify({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          country: user.country,
          memberships: user.memberships
        }
      }),
      {
        status: 200,
        headers: {
          'Set-Cookie': `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800; Secure`
        }
      }
    );
  } catch (error) {
    console.error('Error en login:', error);
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor'
      }),
      { status: 500 }
    );
  }
}; 