import type { APIRoute } from 'astro';
import { requireAuth } from '../../../../middleware/auth';
import prisma from '../../../../lib/db';
import { getBCVRate } from '../../../../lib/bcv';
import { BiopagoVzlaAPI } from '../../../../services/biopagoService';
import { PLAN_INTERVAL } from '../../../../constants/status';

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
    const { plan_id, tax_id: originalTaxId, phone, membership_id } = body;

    if (!plan_id || !originalTaxId || !phone) {
      return new Response(JSON.stringify({ 
        error: 'Faltan datos requeridos',
        details: 'Se requieren: plan_id, tax_id y phone'
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

    
    // Extraer el tipo de documento y número de la cédula limpia
    const dniType = cleanTaxId.charAt(0);
    const dniNumber = cleanTaxId.slice(1);

    // Validar formato del teléfono
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 11) {
      return new Response(JSON.stringify({
        error: 'Formato de teléfono inválido',
        details: 'El teléfono debe tener 11 dígitos incluyendo el código de área'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Crear instancia de BiopagoVzlaAPI
    const biopagoApi = new BiopagoVzlaAPI();

    // Preparar datos para la creación del pago
    const paymentData = {
      reference: user.id.toString(),
      title: `CUJIWARE`,
      description: `Suscripción plan ${plan.name}`,
      dni_type: dniType,
      dni: dniNumber,
      email: user.email,
      phone: cleanPhone,
      return_url: `${process.env.PUBLIC_APP_URL}api/webhooks/biopago?user=${user.id}&plan=${plan_id}${membership_id ? `&membership_id=${membership_id}` : ''}&`,
      is_rif: false // Por ahora no manejamos RIF
    };

    // Crear el pago en Biopago
    const paymentResponse = await biopagoApi.createPayment(
      user.id.toString(),
      amountInBs,
      paymentData
    );

    if (paymentResponse.status !== 200 || !paymentResponse.response?.urlPayment) {
      return new Response(JSON.stringify({
        error: 'Error al crear el pago',
        details: paymentResponse.response?.responseDescription || 'Error desconocido'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Retornar URL de pago
    return new Response(JSON.stringify({
      url: paymentResponse.response.urlPayment,
      payment_id: paymentResponse.response.paymentId,
      paymentUrl: paymentResponse.response.urlPayment
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en la solicitud:', error);
    return new Response(JSON.stringify({ 
      error: 'Error en la solicitud',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 