import type { APIRoute } from 'astro';
import { requireAuth } from '../../../middleware/auth';
import prisma from '../../../lib/db';
import { getBCVRate } from '../../../lib/bcv';
import { CachicamoService } from '../../../services/cachicamoService';
import { MEMBERSHIP_STATUS, LICENSE_STATUS, PAYMENT_STATUS, PAYMENT_METHOD, PLAN_INTERVAL } from '../../../constants/status';
import crypto from 'crypto';

// Verificar si el usuario ha tenido alguna membresía anterior
async function hasPreviousMembership(userId: string) {
  const previousMembership = await prisma.membership.findFirst({
    where: {
      user_id: userId
    }
  });
  return !!previousMembership;
}

// Obtener la membresía activa del usuario
async function getActiveMembership(userId: string) {
  return await prisma.membership.findFirst({
    where: {
      user_id: userId,
      status: MEMBERSHIP_STATUS.ACTIVE,
      payment_method: PAYMENT_METHOD.VENEZUELA
    },
    include: {
      plan: true
    }
  });
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

    let membership;
    if (membership_id) {
      // Es una renovación, verificar que la membresía existe y pertenece al usuario
      const existingMembership = await prisma.membership.findFirst({
        where: {
          id: membership_id,
          user_id: user.id,
          status: MEMBERSHIP_STATUS.ACTIVE,
          payment_method: PAYMENT_METHOD.VENEZUELA
        }
      });

      if (!existingMembership) {
        return new Response(JSON.stringify({ 
          error: 'Membresía no encontrada o no está activa',
          details: 'No se encontró una membresía activa con el ID proporcionado'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Calcular la nueva fecha de finalización
      const currentEndDate = new Date(existingMembership.end_date);
      let newEndDate: Date;
      
      const timestamp = currentEndDate.getTime();
      switch (plan.interval) {
        case PLAN_INTERVAL.MONTH: {
          const oneMontInMs =  Math.round((365.25 / 12) * 24 * 60 * 60 * 1000); // 30 días en milisegundos
          newEndDate = new Date(timestamp + oneMontInMs);
          break;
        }
        case PLAN_INTERVAL.SEMESTER: {
          const halfYearInMs = Math.round((365.25 / 2) * 24 * 60 * 60 * 1000); // 180 días en milisegundos
          newEndDate = new Date(timestamp + halfYearInMs);
          break;
        }
        case PLAN_INTERVAL.YEAR: {
          const oneYearInMs = Math.round(365.25 * 24 * 60 * 60 * 1000); // 31,556,926.08 segundos
          newEndDate = new Date(timestamp + oneYearInMs);
          break;
        }
        default:
          return new Response(JSON.stringify({ error: 'Intervalo de plan no válido' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
      }

      // Actualizar la membresía existente
      membership = await prisma.membership.update({
        where: { id: existingMembership.id },
        data: {
          end_date: newEndDate,
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
    } else {
      // Es una nueva membresía
      const startDate = new Date();
      let endDate: Date;
      
      switch (plan.interval) {
        case PLAN_INTERVAL.MONTH: {
          // Convertir a timestamp y sumar 30 días en segundos
          const timestamp = startDate.getTime();
          const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
          endDate = new Date(timestamp + thirtyDaysInMs);
          break;
        }
        case PLAN_INTERVAL.SEMESTER: {
          // Convertir a timestamp y sumar 180 días en segundos
          const timestamp = startDate.getTime();
          const oneHundredEightyDaysInMs = 180 * 24 * 60 * 60 * 1000;
          endDate = new Date(timestamp + oneHundredEightyDaysInMs);
          break;
        }
        case PLAN_INTERVAL.YEAR: {
          // Para el caso anual mantenemos la lógica anterior ya que es más precisa para años
          endDate = new Date(startDate);
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
        }
        default:
          return new Response(JSON.stringify({ error: 'Intervalo de plan no válido' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
      }

      // Crear nueva membresía
      membership = await prisma.membership.create({
        data: {
          user_id: user.id,
          plan_id: plan.id,
          status: MEMBERSHIP_STATUS.ACTIVE,
          start_date: startDate,
          end_date: endDate,
          payment_method: PAYMENT_METHOD.VENEZUELA,
          licenses: {
            create: Array(plan.license_count).fill({
              status: LICENSE_STATUS.ACTIVE
            })
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