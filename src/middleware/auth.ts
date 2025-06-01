import type { APIContext } from 'astro';
import jwt from 'jsonwebtoken';
import prisma from '../lib/db';

interface JWTPayload {
  userId: string;
  email: string;
}

export async function isAuthenticated(context: APIContext | Request) {
  const token = context instanceof Request 
    ? context.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1]
    : context.cookies.get('token')?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, import.meta.env.JWT_SECRET) as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        memberships: {
          include: {
            plan: true
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

export async function requireAuth(context: APIContext | Request) {
  const token = context instanceof Request 
    ? context.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1]
    : context.cookies.get('token')?.value;
  
  // Solo intentar obtener el token de la URL si estamos en una ruta de página
  if (!token && 'url' in context) {
    const urlToken = context.url.searchParams.get('token');
    if (urlToken) {
      // Si encontramos el token en la URL, establecer la cookie
      if ('cookies' in context) {
        context.cookies.set('token', urlToken, {
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 7 // 7 días
        });
      }
      return await validateToken(urlToken, context);
    }
  }

  if (!token) {
    return context instanceof Request
      ? new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 })
      : context.redirect('/mi-cuenta');
  }

  return await validateToken(token, context);
}

async function validateToken(token: string, context: APIContext | Request) {
  try {
    const decoded = jwt.verify(token, import.meta.env.JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        memberships: {
          include: {
            plan: true
          }
        }
      }
    });

    if (!user) {
      return context instanceof Request
        ? new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 404 })
        : context.redirect('/mi-cuenta');
    }

    return user;
  } catch {
    return context instanceof Request
      ? new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401 })
      : context.redirect('/mi-cuenta');
  }
} 