import type { APIRoute } from 'astro';
import prisma from '../../../lib/db';
import Stripe from 'stripe';
import { MEMBERSHIP_STATUS, PAYMENT_STATUS, PAYMENT_METHOD, PLAN_INTERVAL } from '../../../constants/status';

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

        // Obtener el plan para saber su intervalo
        const plan = await prisma.plan.findUnique({
          where: { id: planId }
        });

        if (!plan) {
          throw new Error('Plan no encontrado');
        }


        // Crear la membresía
        const membership = await prisma.membership.create({
          data: {
            user_id: userId,
            plan_id: planId,
            status: MEMBERSHIP_STATUS.ACTIVE,
            start_date: new Date(),
            end_date: new Date(),
            stripe_subscription_id: session.subscription as string,
            payment_method: PAYMENT_METHOD.STRIPE,
            licenses: {
              create: Array(plan.license_count).fill({
                status: MEMBERSHIP_STATUS.ACTIVE
              })
            },
          }
        });
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        
        const subId = invoice.lines.data[0].parent?.subscription_item_details?.subscription || null;
        if (subId) {
          // Diferir el procesamiento por 10 segundos
          await new Promise(resolve => setTimeout(resolve, 10000));

          const membership = await prisma.membership.findFirst({
            where: { stripe_subscription_id: subId },
            include: {
              plan: true
            }
          });

          if (membership) {
            // Crear el registro de pago
            await prisma.payment.create({
              data: {
                membership_id: membership.id,
                amount: invoice.amount_paid / 100,
                currency: invoice.currency.toUpperCase(),
                status: PAYMENT_STATUS.COMPLETED,
                payment_method: PAYMENT_METHOD.STRIPE,
                stripe_invoice_id: invoice.id,
                invoice_url: invoice.hosted_invoice_url || undefined
              }
            });

            // Calcular la nueva fecha de finalización
            const now = new Date();
            let endDate = membership.end_date || new Date(now);
            
            switch (membership.plan.interval) {
              case PLAN_INTERVAL.MONTH:
                endDate.setMonth(endDate.getMonth() + 1);
                break;
              case PLAN_INTERVAL.SEMESTER:
                endDate.setMonth(endDate.getMonth() + 6);
                break;
              case PLAN_INTERVAL.YEAR:
                endDate.setFullYear(endDate.getFullYear() + 1);
                break;
              default:
                throw new Error('Intervalo de plan no válido');
            }

            await prisma.membership.update({
              where: { id: membership.id },
              data: {
                last_check_with_gateway: new Date(),
                end_date: endDate
              }
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription) {
          const membership = await prisma.membership.findFirst({
            where: { stripe_subscription_id: invoice.subscription as string }
          });

          if (membership) {
            // Crear el registro de pago fallido
            await prisma.payment.create({
              data: {
                membership_id: membership.id,
                amount: invoice.amount_due / 100,
                currency: invoice.currency.toUpperCase(),
                status: PAYMENT_STATUS.FAILED,
                payment_method: PAYMENT_METHOD.STRIPE,
                stripe_invoice_id: invoice.id,
                invoice_url: invoice.hosted_invoice_url || undefined
              }
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const membership = await prisma.membership.findFirst({
          where: { stripe_subscription_id: subscription.id },
        });

        if (membership) {
          const newStatus = subscription.status === 'active' ? MEMBERSHIP_STATUS.ACTIVE : MEMBERSHIP_STATUS.CANCELLED;
          
          // Solo actualizar si hay cambios en el estado
          if (membership.status !== newStatus) {
            await prisma.membership.update({
              where: { id: membership.id },
              data: {
                status: newStatus,
                last_check_with_gateway: new Date()
              }
            });
          }
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