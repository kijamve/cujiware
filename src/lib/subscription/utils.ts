import prisma from '@/lib/db';
import { MEMBERSHIP_STATUS, LICENSE_STATUS, PAYMENT_STATUS, PAYMENT_METHOD, PLAN_INTERVAL } from '@/constants/status';
import { CachicamoService } from '@/services/cachicamoService';

export async function handleMembershipRenewal(
  membership_id: string,
  userId: string,
  plan: any,
  amountInBs: number,
  bcvRate: number,
  bank_dest: string,
  reference: string,
  invoiceUrl: string
) {
  // Es una renovación, verificar que la membresía existe y pertenece al usuario
  const existingMembership = await prisma.membership.findFirst({
    where: {
      id: membership_id,
      user_id: userId,
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
  return await prisma.membership.update({
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
}

export async function handleMembershipCreation(
  userId: string,
  plan: any,
  amountInBs: number,
  bcvRate: number,
  bank_dest: string,
  reference: string,
  invoiceUrl: string
) {
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
  return await prisma.membership.create({
    data: {
      user_id: userId,
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

export async function createInvoice(
  customerUuid: string,
  plan: any,
  amountInBs: number,
  reference: string,
  paymentMethod: string,
  asyncPaymentUuid?: string
) {
  const cachicamoService = new CachicamoService();
  let paymentMethodUuid: string;

  switch (paymentMethod) {
    case 'BIOPAGO':
      paymentMethodUuid = cachicamoService.biopagoPaymentUuid;
      break;
    case 'TDC':
      paymentMethodUuid = cachicamoService.cardPaymentUuid;
      break;
    case 'BDV':
      paymentMethodUuid = cachicamoService.mobileBDVPaymentUuid;
      break;
    default:
      paymentMethodUuid = cachicamoService.mobileBVCPaymentUuid;
      break;
  }

  try {
    const invoice = await cachicamoService.createInvoice({
      customer_uuid: customerUuid,
      payment_method_uuid: paymentMethodUuid,
      ...(asyncPaymentUuid ? { async_payment_uuid: asyncPaymentUuid } : {}),
      plan_name: plan.name,
      price_bs: amountInBs,
      payment_reference: reference,
    });
    return invoice.consult_url;
  } catch (error) {
    console.error('Error al crear factura:', error);
    return '';
  }
} 