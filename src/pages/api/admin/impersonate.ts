import type { APIRoute } from 'astro';
import jwt from 'jsonwebtoken';
import { requireSuperAdmin } from '@/middleware/auth';
import prisma from '@/lib/db';

export const POST: APIRoute = async (context) => {
  // Verificar que es un super admin
  const adminResult = await requireSuperAdmin(context);
  if (adminResult instanceof Response) {
    return adminResult;
  }

  try {
    const { userId } = await context.request.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'ID de usuario requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
      return new Response(
        JSON.stringify({ error: 'Usuario no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Crear token JWT para el usuario personificado
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        country: user.country,
        impersonated: true, // Marcar como personificado
        impersonatedBy: adminResult.email // Registrar quién está personificando
      },
      import.meta.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log de la personificación para auditoría
    console.log(`Super admin ${adminResult.email} is impersonating user ${user.email} (${user.id})`);

    // Configurar cookie con el token
    context.cookies.set('token', token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 horas
      path: '/'
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Personificando usuario: ${user.email}`,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error al personificar usuario:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
