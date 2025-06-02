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

// Verificar si el usuario ha tenido alguna membresía anterior
async function hasPreviousMembership(userId: string) {
  const previousMembership = await prisma.membership.findFirst({
    where: {
      user_id: userId
    }
  });
  return !!previousMembership;
}

// Crear o obtener el cupón de descuento del 50% para el primer mes
async function getOrCreateFirstMonthDiscountCoupon() {
  const couponId = 'FIRST_MONTH_50';
  try {
    return (await stripe.coupons.retrieve(couponId)).id;
  } catch {
    return (await stripe.coupons.create({
      id: couponId,
      percent_off: 50,
      duration: 'repeating',
      duration_in_months: 1,
      name: '50% OFF Primer Mes'
    })).id;
  }
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

    const hasPrevious = await hasPreviousMembership(user.id);

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
      });
      let discountedPriceBs = 0
      let discountedFormattedPriceBs = ''
      if (!hasPrevious && plan.interval === 'month') {
        discountedPriceBs = priceInBs / 2;
        discountedFormattedPriceBs = new Intl.NumberFormat('es-VE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(discountedPriceBs);
      }
      console.log('Datos de pago Venezuela:', {
        payment_method: 'venezuela',
        plan_id: plan.id,
        price_usd: plan.price,
        price_bs: formattedPriceBs,
        price_bs_discounted: discountedFormattedPriceBs,
        discounted_price_bs: discountedPriceBs,
        has_previous: hasPrevious,
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
        discounted_price_bs: discountedFormattedPriceBs,
        has_previous: hasPrevious,
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
    
    // Configuración base de la sesión
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
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
    };

    // Aplicar descuento solo para planes mensuales y usuarios nuevos
    if (plan.interval === 'month') {
      if (!hasPrevious) {
        const discountCouponId = await getOrCreateFirstMonthDiscountCoupon();
        sessionConfig.discounts = [{
          coupon: discountCouponId
        }];
      }
    }

    // Crear sesión de checkout de Stripe
    const session = await stripe.checkout.sessions.create(sessionConfig);

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