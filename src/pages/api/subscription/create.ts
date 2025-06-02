import type { APIRoute } from 'astro';
import { isAuthenticated } from '../../../middleware/auth';
import prisma from '../../../lib/db';
import Stripe from 'stripe';
import { getBCVRate } from '../../../lib/bcv';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

async function getOrCreateStripePrice(plan: any) {
  if (plan.stripe_price_id) {
    return plan.stripe_price_id;
  }

  // Crear el producto en Stripe si no existe
  const product = await stripe.products.create({
    name: `Cujiware - Plan ${plan.name}`,
    description: plan.description,
    metadata: {
      plan_id: plan.id
    },
    statement_descriptor: 'CUJIWARE'
  });

  // Crear el precio en Stripe
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(plan.price * 100), // Stripe usa centavos
    currency: plan.currency.toLowerCase(),
    recurring: {
      interval: plan.interval === 'month' ? 'month' : 
                plan.interval === 'semester' ? 'month' : 'year',
      interval_count: plan.interval === 'semester' ? 6 : 1
    },
    metadata: {
      plan_id: plan.id
    }
  });

  // Actualizar el plan en la base de datos con el ID de precio de Stripe
  await prisma.plan.update({
    where: { id: plan.id },
    data: { stripe_price_id: price.id }
  });

  return price.id;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const user = await isAuthenticated({ request, cookies });
    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const body = await request.json();
    const planId = url.searchParams.get('plan') || body.plan;

    if (!planId) {
      return new Response(JSON.stringify({ error: 'Plan no especificado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener el plan de la base de datos
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return new Response(JSON.stringify({ error: 'Plan no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }


    // Si el usuario es de Venezuela, devolver información para pago móvil
    if (user.country === 'VE') {
      // Obtener tasa BCV
      const bcvRate = await getBCVRate();
      const priceInBs = Number((plan.price * bcvRate).toFixed(2));

      // Formatear precio en bolívares (1.2345,98)
      const formattedPriceBs = new Intl.NumberFormat('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(priceInBs);

      console.log('Datos del usuario:', {
        id: user.id,
        name: user.name,
        billing_full_name: user.billing_full_name,
        billing_tax_id: user.billing_tax_id,
        billing_address: user.billing_address,
        billing_city: user.billing_city,
        billing_state: user.billing_state,
        billing_postal_code: user.billing_postal_code
      });

      console.log('Datos de pago Venezuela:', {
        payment_method: 'venezuela',
        plan_id: plan.id,
        price_usd: plan.price,
        price_bs: formattedPriceBs,
        bcv_rate: bcvRate,
        name: user.name,
        billing_full_name: user.billing_full_name,
        billing_tax_id: user.billing_tax_id,
        billing_address: user.billing_address
      });

      return new Response(JSON.stringify({
        payment_method: 'venezuela',
        plan_id: plan.id,
        price_usd: plan.price,
        price_bs: formattedPriceBs,
        bcv_rate: bcvRate,
        name: user.name,
        billing_full_name: user.billing_full_name,
        billing_tax_id: user.billing_tax_id,
        billing_address: user.billing_address
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Para otros países, continuar con Stripe
    const stripePriceId = await getOrCreateStripePrice(plan);

    // Crear sesión de checkout de Stripe
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${url.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}&token=${cookies.get('token')?.value}`,
      cancel_url: `${url.origin}/suscripcion`,
      metadata: {
        userId: user.id,
        planId: plan.id
      },
      automatic_tax: {
        enabled: true
      }
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al crear suscripción:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 