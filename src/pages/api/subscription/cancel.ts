import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../middleware/auth';
import Stripe from 'stripe';

export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await requireAuth(request);
    if (user instanceof Response) {
      return user;
    }

    const { membership_id } = await request.json();
    if (!membership_id) {
      return new Response(
        JSON.stringify({ error: 'Se requiere el ID de la membresía' }),
        { status: 400 }
      );
    }

    // Verificar que la membresía pertenece al usuario
    const membership = await prisma.membership.findFirst({
      where: {
        id: membership_id,
        user_id: user.id,
        status: 'active'
      },
      include: {
        stripe_subscription: true
      }
    });

    if (!membership) {
      return new Response(
        JSON.stringify({ error: 'Membresía no encontrada o no está activa' }),
        { status: 404 }
      );
    }

    // Si tiene una suscripción de Stripe, cancelarla
    if (membership.stripe_subscription) {
      const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16'
      });

      await stripe.subscriptions.cancel(membership.stripe_subscription.stripe_subscription_id);
    }

    // Actualizar la membresía
    await prisma.membership.update({
      where: { id: membership_id },
      data: {
        status: 'cancelled',
        cancelled_at: new Date()
      }
    });

    return new Response(
      JSON.stringify({ message: 'Suscripción cancelada exitosamente' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al cancelar suscripción:', error);
    return new Response(
      JSON.stringify({ error: 'Error al cancelar la suscripción' }),
      { status: 500 }
    );
  }
}; 