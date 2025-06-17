import type { APIRoute } from 'astro';
import { requireAuth } from '@/middleware/auth';
import prisma from '@/lib/db';
import { getBCVRate } from '@/lib/bcv';
import { CachicamoService } from '@/services/cachicamoService';
import { MEMBERSHIP_STATUS, LICENSE_STATUS, PAYMENT_STATUS, PAYMENT_METHOD, PLAN_INTERVAL } from '@/constants/status';
import crypto from 'crypto';
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
    const { plan_id, bank_origin, bank_dest, phone, tax_id: originalTaxId, reference, membership_id } = body;

    if (!plan_id || !bank_origin || !bank_dest || !phone || !originalTaxId || !reference) {
      return new Response(JSON.stringify({
        error: 'Faltan datos requeridos',
        details: 'Se requieren: plan_id, bank_origin, bank_dest, tax_id y reference'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Limpiar y formatear la cédula
    let cleanTaxId = originalTaxId.replace(/[^A-Za-z0-9]/g, ''); // Eliminar caracteres especiales
    if (/^\d+$/.test(cleanTaxId)) { // Si solo contiene números
      cleanTaxId = 'V' + cleanTaxId; // Agregar V al principio
    }

    // Validar formato de la cédula
    if (!/^[VEP]\d{6,8}$/.test(cleanTaxId)) {
      return new Response(JSON.stringify({
        error: 'Formato de cédula inválido',
        details: 'La cédula debe tener el formato V1234567, V12345678 o P12345678'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Actualizar tax_id con el valor limpio y formateado
    const tax_id = cleanTaxId;

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
        dni: user.billing_tax_id || tax_id,
        phone: user.billing_phone || phone,
        address: user.billing_address || 'No se proporcionó dirección'
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

    // Crear pago asíncrono para verificar
    let asyncPaymentUuid: string;
    try {
      const asyncPayment = await cachicamoService.createAsyncPayment({
        payment_method_uuid: bank_dest === 'BDV' ? cachicamoService.mobileBDVPaymentUuid : cachicamoService.mobileBVCPaymentUuid,
        payment_reference: reference,
        async_payment_uuid: crypto.randomUUID(),
        origin_total_payment: Math.round(amountInBs*10000),
        extra_fields: {
          nationality: tax_id.charAt(0),
          dni: tax_id.substring(1),
          phone: phone,
          bank: bank_origin,
          reference: reference,
          payment_date: new Date().toISOString()
        }
      });

      // Verificar el estado del pago
      if (!asyncPayment || !asyncPayment.uuid) {
        return new Response(JSON.stringify({
          error: 'El pago móvil no ha sido verificado. Por favor, asegúrese de que el pago se haya realizado correctamente y que haya ingresado datos correctos en el formulario.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      asyncPaymentUuid = asyncPayment.uuid;
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'El pago móvil no ha sido verificado. Por favor, asegúrese de que el pago se haya realizado correctamente y que haya ingresado datos correctos en el formulario.'
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
      reference,
      bank_dest,
      asyncPaymentUuid
    );

    // Crear o renovar membresía
    const membership = membership_id
      ? await handleMembershipRenewal(membership_id, user.id, plan, amountInBs, bcvRate, bank_dest, reference, invoiceUrl)
      : await handleMembershipCreation(user.id, plan, amountInBs, bcvRate, bank_dest, reference, invoiceUrl);

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
    console.error('Error al procesar pago móvil:', error);
    return new Response(JSON.stringify({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};