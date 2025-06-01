import type { APIRoute } from 'astro';
import { isAuthenticated } from '../../../middleware/auth';
import prisma from '../../../lib/db';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

export const post: APIRoute = async ({ request, cookies }) => {
  try {
    const user = await isAuthenticated({ request, cookies });
    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener la membresía activa del usuario
    const membership = await prisma.membership.findFirst({
      where: {
        user_id: user.id,
        status: 'active'
      },
      include: { licenses: true }
    });

    if (!membership) {
      return new Response(JSON.stringify({ error: 'No tienes una suscripción activa' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (membership.payment_method === 'stripe') {
      // Cancelar la suscripción en Stripe
      await stripe.subscriptions.cancel(membership.stripe_subscription_id);
    }

    // Actualizar el estado de la membresía y sus licencias
    await prisma.membership.update({
      where: { id: membership.id },
      data: {
        status: 'cancelled',
        licenses: {
          updateMany: {
            where: { status: 'active' },
            data: { status: 'inactive' }
          }
        }
      }
    });

    return new Response(JSON.stringify({ message: 'Suscripción cancelada exitosamente' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al cancelar suscripción:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 