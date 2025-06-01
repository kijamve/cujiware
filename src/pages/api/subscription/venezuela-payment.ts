import type { APIRoute } from 'astro';
import { isAuthenticated } from '../../../middleware/auth';
import prisma from '../../../lib/db';
import { getBCVRate } from '../../../lib/bcv';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const user = await isAuthenticated({ request, cookies });
    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { plan_id, bank_name, tax_id, reference } = body;

    if (!plan_id || !bank_name || !tax_id || !reference) {
      return new Response(JSON.stringify({ 
        error: 'Faltan datos requeridos',
        details: 'Se requieren: plan_id, bank_name, tax_id y reference'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener el plan
    const plan = await prisma.plan.findUnique({
      where: { id: plan_id }
    });

    if (!plan) {
      return new Response(JSON.stringify({ error: 'Plan no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener la tasa del BCV
    const bcvRate = await getBCVRate();
    const amountInBs = plan.price * bcvRate;

    // Crear la membresía
    const membership = await prisma.membership.create({
      data: {
        user_id: user.id,
        plan_id: plan.id,
        status: 'active',
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        payment_method: 'venezuela',
        licenses: {
          create: {
            status: 'active'
          }
        },
        payments: {
          create: {
            amount: plan.price,
            currency: plan.currency,
            status: 'pending',
            payment_method: 'venezuela',
            bank_name: bank_name,
            reference: reference,
            currency_rate: bcvRate
          }
        }
      }
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: `Pago registrado correctamente. Monto a pagar: Bs. ${amountInBs.toFixed(2)}. Tu suscripción será activada una vez confirmemos el pago.`,
      membership_id: membership.id,
      amount_in_bs: amountInBs
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al procesar pago de Venezuela:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 