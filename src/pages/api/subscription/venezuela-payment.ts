import type { APIRoute } from 'astro';
import { isAuthenticated } from '../../../middleware/auth';
import prisma from '../../../lib/db';
import { getBCVRate } from '../../../lib/bcv';
import { CachicamoService } from '../../../services/cachicamoService';

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
    const { plan_id, bank_origin, bank_dest, tax_id, reference } = body;

    if (!plan_id || !bank_origin || !bank_dest || !tax_id || !reference) {
      return new Response(JSON.stringify({ 
        error: 'Faltan datos requeridos',
        details: 'Se requieren: plan_id, bank_origin, bank_dest, tax_id y reference'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar formato de la cédula
    if (!/^[VEP]\d{7,8}$/.test(tax_id)) {
      return new Response(JSON.stringify({ 
        error: 'Formato de cédula inválido',
        details: 'La cédula debe tener el formato V1234567, V12345678 o P12345678'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar formato de la referencia
    if (!/^\d{6}$/.test(reference)) {
      return new Response(JSON.stringify({ 
        error: 'Formato de referencia inválido',
        details: 'La referencia debe tener 6 dígitos'
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
    const amountInBs = Number((plan.price * bcvRate).toFixed(2));

    // Crear instancia del servicio Cachicamo
    const cachicamoService = new CachicamoService();

    // Crear pago asíncrono para verificar
    const asyncPayment = await cachicamoService.createAsyncPayment({
      payment_method_uuid: cachicamoService.mobilePaymentUuid,
      payment_reference: reference,
      origin_total_payment: amountInBs*10000,
      extra_fields: {
        nationality: tax_id.charAt(0),
        dni: tax_id.substring(1),
        phone: user.phone || '',
        bank: bank_dest,
        reference: reference,
        payment_date: new Date().toISOString()
      }
    });

    // Verificar el estado del pago
    if (!asyncPayment || !asyncPayment.uuid) {
      return new Response(JSON.stringify({ 
        error: 'Pago no verificado',
        details: 'El pago móvil no ha sido verificado. Por favor, asegúrese de que el pago se haya realizado correctamente.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calcular la fecha de finalización basada en el intervalo del plan
    const startDate = new Date();
    let endDate = new Date(startDate);
    
    switch (plan.interval) {
      case 'month':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'semester':
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case 'year':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        return new Response(JSON.stringify({ error: 'Intervalo de plan no válido' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

    // Crear la membresía
    const membership = await prisma.membership.create({
      data: {
        user_id: user.id,
        plan_id: plan.id,
        status: 'active',
        start_date: startDate,
        end_date: endDate,
        payment_method: 'venezuela',
        licenses: {
          create: {
            status: 'active'
          }
        },
        payments: {
          create: {
            amount: amountInBs,
            currency: 'VES',
            status: 'completed',
            payment_method: 'venezuela',
            bank_name: bank_dest,
            reference: reference,
            currency_rate: bcvRate
          }
        }
      }
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: `Pago registrado correctamente.`,
      membership_id: membership.id,
      amount_in_bs: amountInBs
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al procesar pago de Venezuela:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 