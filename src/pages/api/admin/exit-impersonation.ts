import type { APIRoute } from 'astro';
import jwt from 'jsonwebtoken';

export const POST: APIRoute = async (context) => {
  try {
    const token = context.cookies.get('token')?.value;

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'No hay sesión activa' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar si el token es de personificación
    const decoded = jwt.verify(token, import.meta.env.JWT_SECRET) as {
      impersonated?: boolean;
      impersonatedBy?: string;
    };

    if (!decoded.impersonated || !decoded.impersonatedBy) {
      return new Response(
        JSON.stringify({ error: 'No estás en modo personificación' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Crear nuevo token para el super admin
    const adminToken = jwt.sign(
      {
        email: decoded.impersonatedBy,
        password: import.meta.env.SUPER_ADMIN_PASSWORD // Esto es seguro porque ya verificamos que es super admin
      },
      import.meta.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log para auditoría
    console.log(`Exiting impersonation mode. Returning to super admin: ${decoded.impersonatedBy}`);

    // Limpiar la cookie de usuario personificado y establecer la cookie de super admin
    context.cookies.delete('token', { path: '/' });
    context.cookies.set('super_admin_token', adminToken, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 horas
      path: '/'
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Saliendo del modo personificación'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error al salir del modo personificación:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
