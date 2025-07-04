import type { APIRoute } from 'astro';
import { requireAuth } from '@/middleware/auth';
import prisma from '@/lib/db';
import Stripe from 'stripe';
import { getBCVRate } from '@/lib/bcv';
import { PLAN_INTERVAL } from '@/constants/status';
import { MEMBERSHIP_STATUS } from '@/constants/status';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil'
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
      interval: plan.interval === PLAN_INTERVAL.MONTH ? 'month' : 
                plan.interval === PLAN_INTERVAL.SEMESTER ? 'month' : 'year',
      interval_count: plan.interval === PLAN_INTERVAL.SEMESTER ? 6 : 1
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
  const couponId = 'FIRST_MONTH_25';
  try {
    return (await stripe.coupons.retrieve(couponId)).id;
  } catch {
    return (await stripe.coupons.create({
      id: couponId,
      percent_off: 25,
      duration: 'repeating',
      duration_in_months: 1,
      name: '25% OFF Primer Mes'
    })).id;
  }
}

export const POST: APIRoute = async (context) => {
  try {
    const user = await requireAuth(context);
    if (user instanceof Response) {
      return user;
    }

    const { plan, membership_id } = await context.request.json();

    if (!plan) {
      return new Response(
        JSON.stringify({ error: 'El ID del plan es requerido' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Obtener el plan de la base de datos
    const planData = await prisma.plan.findUnique({
      where: { id: plan }
    });

    if (!planData) {
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
      const priceInBs = Number((planData.price * bcvRate).toFixed(2));

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
      if (!hasPrevious && planData.interval === PLAN_INTERVAL.MONTH) {
        discountedPriceBs = priceInBs * 0.75;
        discountedFormattedPriceBs = new Intl.NumberFormat('es-VE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(discountedPriceBs);
      }
      console.log('Datos de pago Venezuela:', {
        payment_method: 'venezuela',
        plan_id: planData.id,
        price_usd: planData.price,
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
        plan_id: planData.id,
        price_usd: planData.price,
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
    const stripePriceId = await getOrCreateStripePrice(planData);
    
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
      success_url: `http://${context.request.headers.get('host')}/dashboard?session_id={CHECKOUT_SESSION_ID}&token=${context.cookies.get('token')?.value}`,
      cancel_url: `http://${context.request.headers.get('host')}/suscripcion`,
      metadata: {
        userId: user.id,
        planId: planData.id,
        membershipId: membership_id,
        licenseCount: planData.license_count.toString()
      },
      automatic_tax: {
        enabled: true
      }
    };

    // Si es una renovación de una membresía existente sin stripe_subscription_id
    if (membership_id) {
      const existingMembership = await prisma.membership.findFirst({
        where: {
          id: membership_id,
          user_id: user.id,
          status: MEMBERSHIP_STATUS.ACTIVE,
          stripe_subscription_id: null
        }
      });

      if (existingMembership) {
        const now = new Date();
        const hoursUntilExpiration = (existingMembership.end_date.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        // Solo usar trial_end si faltan más de 48 horas
        if (hoursUntilExpiration > 48) {
          sessionConfig.subscription_data = {
            trial_end: Math.floor(existingMembership.end_date.getTime() / 1000)
          };
        }
      } else {
        return new Response(JSON.stringify({ error: 'Membresía ya tiene una suscripción o esta cancelada' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Aplicar descuento solo para planes mensuales y usuarios nuevos
    if (planData.interval === PLAN_INTERVAL.MONTH) {
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
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}; 