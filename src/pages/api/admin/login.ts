import type { APIRoute } from 'astro';
import jwt from 'jsonwebtoken';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ message: 'Faltan campos requeridos' }),
        { status: 400 }
      );
    }

    // Verificar credenciales contra .env
    if (email !== import.meta.env.SUPER_ADMIN_EMAIL || 
        password !== import.meta.env.SUPER_ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ message: 'Credenciales inválidas' }),
        { status: 401 }
      );
    }

    // Generar token
    const token = jwt.sign(
      { email, password },
      import.meta.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Establecer cookie
    cookies.set('super_admin_token', token, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 horas
    });

    return new Response(
      JSON.stringify({ message: 'Login exitoso' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en login:', error);
    return new Response(
      JSON.stringify({ message: 'Error al procesar la solicitud' }),
      { status: 500 }
    );
  }
}; 