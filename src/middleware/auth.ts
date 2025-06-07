import type { APIContext } from 'astro';
import jwt from 'jsonwebtoken';
import prisma from '../lib/db';

interface JWTPayload {
  userId: string;
  email: string;
}

export async function isAuthenticated(request: Request) {
  try {
    let token: string | undefined;

    // Intentar obtener el token del header de autorización
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Si no hay token en el header, intentar obtenerlo de las cookies
    if (!token) {
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const tokenCookie = cookies.split(';').find(cookie => cookie.trim().startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }
    }

    if (!token) {
      console.log('No se encontró el token en el header de autorización ni en las cookies');
      return null;
    }

    // Verificar el token
    const decoded = jwt.verify(token, import.meta.env.JWT_SECRET) as {
      id: string;
      email: string;
      name: string;
      country: string;
    };

    // Obtener el usuario de la base de datos
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      console.log('Usuario no encontrado en la base de datos');
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error al verificar autenticación:', error);
    return null;
  }
}

export async function requireAuth(context: APIContext) {
  const token = context.cookies.get('token')?.value;

  if (!token) {
    if (context.request.headers.get('accept')?.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401 }
      );
    }
    return context.redirect('/mi-cuenta');
  }

  try {
    const decoded = jwt.verify(token, import.meta.env.JWT_SECRET) as {
      id: string;
      email: string;
      name: string;
      country: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        memberships: {
          include: {
            plan: true,
            licenses: {
              include: {
                usages: true
              }
            },
            payments: true
          }
        }
      }
    });

    if (!user) {
      if (context.request.headers.get('accept')?.includes('application/json')) {
        return new Response(
          JSON.stringify({ error: 'Usuario no encontrado' }),
          { status: 401 }
        );
      }
      return context.redirect('/mi-cuenta');
    }

    return user;
  } catch (error) {
    if (context.request.headers.get('accept')?.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401 }
      );
    }
    return context.redirect('/mi-cuenta');
  }
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

export async function requireSuperAdmin(context: APIContext) {
  const token = context.cookies.get('super_admin_token')?.value;

  if (!token) {
    if (context.request.headers.get('accept')?.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401 }
      );
    }
    return context.redirect('/dashboard_master/login');
  }

  try {
    const decoded = jwt.verify(token, import.meta.env.JWT_SECRET) as {
      email: string;
      password: string;
    };

    // Verificar credenciales directamente contra .env
    if (decoded.email !== import.meta.env.SUPER_ADMIN_EMAIL || 
        decoded.password !== import.meta.env.SUPER_ADMIN_PASSWORD) {
      if (context.request.headers.get('accept')?.includes('application/json')) {
        return new Response(
          JSON.stringify({ error: 'No autorizado' }),
          { status: 401 }
        );
      }
      return context.redirect('/dashboard_master/login');
    }

    return { email: decoded.email };
  } catch (error) {
    if (context.request.headers.get('accept')?.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401 }
      );
    }
    return context.redirect('/dashboard_master/login');
  }
} 