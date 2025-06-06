import type { APIRoute } from 'astro';
import { checkAndSendReminders } from '../../../lib/reminders';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Verificar el token de autorización
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${import.meta.env.CRON_SECRET}`) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401 }
      );
    }

    await checkAndSendReminders();

    return new Response(
      JSON.stringify({ message: 'Recordatorios enviados correctamente' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al enviar recordatorios:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500 }
    );
  }
}; 