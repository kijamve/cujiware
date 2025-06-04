import type { APIRoute } from 'astro';
import prisma from '../../../lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Debug: Log de los headers
    console.log('Headers recibidos:', Object.fromEntries(request.headers.entries()));
    
    let email: string;
    let password: string;

    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      email = formData.get('email') as string;
      password = formData.get('password') as string;
    } else {
      // Intentar parsear como JSON
      const rawBody = await request.text();
      console.log('Body raw recibido:', rawBody);
      
      try {
        const body = JSON.parse(rawBody);
        email = body.email;
        password = body.password;
      } catch (e) {
        console.error('Error al parsear JSON:', e);
        return new Response(
          JSON.stringify({
            error: 'JSON inválido en la petición',
            details: e instanceof Error ? e.message : 'Error desconocido'
          }),
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
    }

    if (!email || !password) {
      return new Response(
        JSON.stringify({
          error: 'El email y la contraseña son requeridos'
        }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return new Response(
        JSON.stringify({
          error: 'Credenciales inválidas'
        }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return new Response(
        JSON.stringify({
          error: 'Credenciales inválidas'
        }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        name: user.name,
        country: user.country
      },
      import.meta.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Establecer cookie usando el objeto cookies
    cookies.set('token', token, {
      path: '/',
      httpOnly: false, // Permitir acceso desde JavaScript
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 días
    });

    return new Response(
      JSON.stringify({
        message: 'Login exitoso',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          country: user.country
        }
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error en login:', error);
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}; 