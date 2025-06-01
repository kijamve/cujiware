import type { APIRoute } from 'astro';
import prisma from '../../../lib/db';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return new Response(JSON.stringify({ error: 'No se proporcionó firma' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Firma inválida' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, planId } = session.metadata || {};

        if (!userId || !planId) {
          throw new Error('Metadata incompleta en la sesión');
        }

        // Crear la membresía
        const membership = await prisma.membership.create({
          data: {
            user_id: userId,
            plan_id: planId,
            status: 'active',
            start_date: new Date(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
            stripe_subscription_id: session.subscription as string,
            payment_method: 'stripe',
            licenses: {
              create: {
                status: 'active'
              }
            }
          }
        });
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const membership = await prisma.membership.findFirst({
          where: { stripe_subscription_id: subscription.id },
          include: { licenses: true }
        });

        if (membership) {
          // Asegurarnos de que la fecha sea válida
          const endDate = subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días por defecto

          await prisma.membership.update({
            where: { id: membership.id },
            data: {
              status: subscription.status === 'active' ? 'active' : 'cancelled',
              end_date: endDate,
              licenses: {
                updateMany: {
                  where: { status: 'active' },
                  data: { status: 'inactive' }
                }
              }
            }
          });
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en webhook:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 