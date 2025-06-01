import type { APIRoute } from 'astro';
import { requireAuth } from '../../../middleware/auth.ts';
import { prisma } from '../../../lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const user = await requireAuth({ request, cookies });
    if (user instanceof Response) {
      return user;
    }

    const { membership_id } = await request.json();

    if (!membership_id) {
      return new Response(
        JSON.stringify({ message: 'ID de membresía requerido' }),
        { status: 400 }
      );
    }

    // Verificar que la membresía existe y pertenece al usuario
    const membership = await prisma.membership.findFirst({
      where: {
        id: membership_id,
        user_id: user.id,
        status: 'active'
      }
    });

    if (!membership) {
      return new Response(
        JSON.stringify({ message: 'Membresía no encontrada o no está activa' }),
        { status: 404 }
      );
    }

    // Si es una suscripción de Stripe, cancelarla
    if (membership.stripe_subscription_id) {
      await stripe.subscriptions.cancel(membership.stripe_subscription_id);
    }

    // Actualizar solo el estado de la membresía
    await prisma.membership.update({
      where: { id: membership_id },
      data: {
        status: 'cancelled'
      }
    });

    return new Response(
      JSON.stringify({ message: 'Suscripción cancelada exitosamente' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al cancelar suscripción:', error);
    return new Response(
      JSON.stringify({ message: 'Error al cancelar la suscripción' }),
      { status: 500 }
    );
  }
}; 