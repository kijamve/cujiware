import type { APIRoute } from 'astro';
import { requireAuth } from '@/middleware/auth';
import prisma from '@/lib/db';
import { getBCVRate } from '@/lib/bcv';
import { CachicamoService } from '@/services/cachicamoService';
import { VenezolanoService } from '@/services/venezolano';
import { PLAN_INTERVAL } from '@/constants/status';
import { handleMembershipCreation, handleMembershipRenewal, createInvoice } from '@/lib/subscription/utils';

// Verificar si el usuario ha tenido alguna membresía anterior
async function hasPreviousMembership(userId: string) {
  const previousMembership = await prisma.membership.findFirst({
    where: {
      user_id: userId
    }
  });
  return !!previousMembership;
}

export const POST: APIRoute = async (context) => {
  try {
    const user = await requireAuth(context);
    if (user instanceof Response) {
      return user;
    }

    const body = await context.request.json();
    const { 
      plan_id, 
      card_name, 
      card_number, 
      card_expire, 
      card_cvv, 
      card_address,
      card_tax_id,
      membership_id 
    } = body;

    if (!plan_id || !card_name || !card_number || !card_expire || !card_cvv || !card_address || !card_tax_id) {
      return new Response(JSON.stringify({ 
        error: 'Faltan datos requeridos',
        details: 'Se requieren todos los datos de la tarjeta'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar CVC
    if (!card_cvv) {
      return new Response(JSON.stringify({ 
        error: 'El código CVC es requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (!/^[0-9]+$/.test(card_cvv)) {
      return new Response(JSON.stringify({ 
        error: 'Su código CVC solo puede contener digitos'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (card_cvv.length !== 3) {
      return new Response(JSON.stringify({ 
        error: `El código CVC debe ser de 3 digitos y no de ${card_cvv.length}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar fecha de expiración
    const [expireMonth, expireYear] = card_expire.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    if (parseInt(expireYear) < currentYear || 
        (parseInt(expireYear) === currentYear && parseInt(expireMonth) < currentMonth)) {
      return new Response(JSON.stringify({ 
        error: 'Su tarjeta esta Vencida'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Limpiar y formatear la cédula
    let cleanTaxId = card_tax_id.replace(/[^A-Za-z0-9]/g, ''); // Eliminar caracteres especiales
    if (/^\d+$/.test(cleanTaxId)) { // Si solo contiene números
      cleanTaxId = 'V' + cleanTaxId; // Agregar V al principio
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
    const hasPrevious = await hasPreviousMembership(user.id);
    let amountInBs: number;
    if (!hasPrevious && plan.interval === PLAN_INTERVAL.MONTH) {
      amountInBs = Number((plan.price * bcvRate * 0.75).toFixed(2));
    } else {
      amountInBs = Number((plan.price * bcvRate).toFixed(2));
    }

    // Crear instancia del servicio Cachicamo
    const cachicamoService = new CachicamoService();
    let customerUuid: string;
    try {
      const customer = await cachicamoService.createOrUpdateCustomer({
        email: user.email,
        name: user.billing_full_name || user.name,
        dni: user.billing_tax_id || card_tax_id,
        phone: user.billing_phone || '',
        address: card_address
      });
      if (!customer || !customer.uuid) {
        return new Response(JSON.stringify({ 
          error: 'Error al crear o actualizar el cliente',
          details: 'El cliente no fue creado o actualizado correctamente'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      customerUuid = customer.uuid;
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Error al crear o actualizar el cliente',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }), {
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Procesar pago con Venezolano
    const venezolanoService = new VenezolanoService();
    const orderId = `MEM-${Date.now()}`;
    const customerIp = context.request.headers.get('x-forwarded-for') || '127.0.0.1';

    try {
      const cardData = {
        cardholder: card_name,
        dni_type: cleanTaxId[0],
        dni: cleanTaxId.substring(1),
        card_number: card_number.replace(/\s/g, ''),
        email: user.email,
        phone: user.billing_phone || '04120000000',
        address: card_address,
        expire: {
          mm: expireMonth,
          yyyy: expireYear
        },
        cvc: card_cvv
      };

      const paymentResult = await venezolanoService.createPaymentTDC(
        `Pago de membresía ${plan.name}`,
        orderId,
        amountInBs,
        customerIp,
        cardData
      );

      if (!paymentResult || paymentResult.estatus?.toLowerCase() !== 'pagado') {
        let errorMessage = 'Error al procesar el pago';
        if (paymentResult?.descResp) {
          errorMessage += `: ${paymentResult.descResp}`;
        }
        if (paymentResult?.codRespuesta) {
          errorMessage += ` [error nro.: ${paymentResult.codRespuesta}]`;
        }
        return new Response(JSON.stringify({ 
          error: errorMessage
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Crear factura usando la función del utils
      const invoiceUrl = await createInvoice(
        customerUuid,
        plan,
        amountInBs,
        paymentResult.referenciaBVC || orderId,
        'TDC'
      );

      // Crear o renovar membresía
      const membership = membership_id 
        ? await handleMembershipRenewal(membership_id, user.id, plan, amountInBs, bcvRate, 'TDC', paymentResult.referenciaBVC || orderId, invoiceUrl)
        : await handleMembershipCreation(user.id, plan, amountInBs, bcvRate, 'TDC', paymentResult.referenciaBVC || orderId, invoiceUrl);

      if (membership instanceof Response) {
        return membership;
      }

      return new Response(JSON.stringify({ 
        success: true,
        message: membership_id ? 'Membresía renovada correctamente.' : 'Pago registrado correctamente.',
        membership_id: membership.id,
        amount_in_bs: amountInBs,
        reference: paymentResult.referenciaBVC,
        authorization_code: paymentResult.codAutorizacion
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error al procesar pago con tarjeta:', error);
      return new Response(JSON.stringify({ 
        error: 'Error al procesar el pago',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error al procesar pago con tarjeta:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 