import type { APIRoute } from 'astro';
import { requireAuth } from '../../../../middleware/auth';
import prisma from '../../../../lib/db';
import { getBCVRate } from '../../../../lib/bcv';
import { CachicamoService } from '../../../../services/cachicamoService';
import { MEMBERSHIP_STATUS, LICENSE_STATUS, PAYMENT_STATUS, PAYMENT_METHOD, PLAN_INTERVAL } from '../../../../constants/status';
import { handleMembershipCreation, handleMembershipRenewal, createInvoice } from '../../../../lib/subscription/utils';

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

    // Simular pago exitoso y generar referencia
    const reference = Math.random().toString().slice(2, 8);

    // Crear factura usando la función del utils
    const invoiceUrl = await createInvoice(
      customerUuid,
      plan,
      amountInBs,
      reference,
      'TDC'
    );

    // Crear o renovar membresía
    const membership = membership_id 
      ? await handleMembershipRenewal(membership_id, user.id, plan, amountInBs, bcvRate, 'TDC', reference, invoiceUrl)
      : await handleMembershipCreation(user.id, plan, amountInBs, bcvRate, 'TDC', reference, invoiceUrl);

    if (membership instanceof Response) {
      return membership;
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: membership_id ? 'Membresía renovada correctamente.' : 'Pago registrado correctamente.',
      membership_id: membership.id,
      amount_in_bs: amountInBs
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
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