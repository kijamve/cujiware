import type { APIRoute } from 'astro';
import { requireAuth } from '../../../middleware/auth';
import prisma from '../../../lib/db';
import { getBCVRate } from '../../../lib/bcv';
import { CachicamoService } from '../../../services/cachicamoService';
import { MEMBERSHIP_STATUS, PAYMENT_STATUS, PAYMENT_METHOD, PLAN_INTERVAL } from '../../../constants/status';
import crypto from 'crypto';

export const POST: APIRoute = async (context) => {
  try {
    const user = await requireAuth(context);
    if (user instanceof Response) {
      return user;
    }

    const body = await context.request.json();
    const { plan_id, bank_origin, bank_dest, phone, tax_id: originalTaxId, reference } = body;

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
    const amountInBs = Number((plan.price * bcvRate).toFixed(2));

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
        origin_total_payment: amountInBs*10000,
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

    let invoiceUrl = '';
    try {
      const invoice = await cachicamoService.createInvoice({
        customer_uuid: customerUuid,
        async_payment_uuid: asyncPaymentUuid,
        plan_name: plan.name,
        price_bs: amountInBs,
        payment_reference: reference,
        payment_type: bank_dest === 'BDV' ? 'bdv' : 'bvc'
      });
      invoiceUrl = invoice.consult_url;
    } catch (error) {
      console.log(error, {
        customer_uuid: customerUuid,
        async_payment_uuid: asyncPaymentUuid,
        plan_name: plan.name,
        price_bs: amountInBs,
        payment_reference: reference,
        payment_type: bank_dest === 'BDV' ? 'bdv' : 'bvc'
      });
    }


    // Calcular la fecha de finalización basada en el intervalo del plan
    const startDate = new Date();
    let endDate = new Date(startDate);
    
    switch (plan.interval) {
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
        status: MEMBERSHIP_STATUS.ACTIVE,
        start_date: startDate,
        end_date: endDate,
        payment_method: PAYMENT_METHOD.VENEZUELA,
        licenses: {
          create: {
            status: MEMBERSHIP_STATUS.ACTIVE
          }
        },
        payments: {
          create: {
            amount: amountInBs,
            currency: 'VES',
            status: PAYMENT_STATUS.COMPLETED,
            payment_method: PAYMENT_METHOD.VENEZUELA,
            bank_name: bank_dest,
            reference: reference,
            currency_rate: bcvRate,
            invoice_url: invoiceUrl
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