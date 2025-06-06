import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies }) => {
  try {
    // Eliminar cookie de super admin
    cookies.delete('super_admin_token', {
      path: '/'
    });

    return new Response(
      JSON.stringify({ message: 'Logout exitoso' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en logout:', error);
    return new Response(
      JSON.stringify({ message: 'Error al procesar la solicitud' }),
      { status: 500 }
    );
  }
}; 