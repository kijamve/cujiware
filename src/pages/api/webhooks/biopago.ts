import type { APIRoute } from 'astro';
import prisma from '../../../lib/db';
import { BiopagoVzlaAPI } from '../../../services/biopagoService';
import { CachicamoService } from '../../../services/cachicamoService';
import { getBCVRate } from '../../../lib/bcv';
import { PAYMENT_STATUS, PAYMENT_METHOD } from '../../../constants/status';
import { handleMembershipCreation, handleMembershipRenewal, createInvoice } from '../../../lib/subscription/utils';

export const GET: APIRoute = async (context) => {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('user');
    const planId = url.searchParams.get('plan');
    const membershipId = url.searchParams.get('membership_id');
    const paymentId = url.searchParams.get('id') ?? url.searchParams.get('?id');

    if (!userId || !planId || !paymentId) {
      return new Response(JSON.stringify({ 
        error: 'Faltan parámetros requeridos',
        details: 'Se requieren: user, plan y payment_id'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener el plan
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return new Response(JSON.stringify({ error: 'Plan no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Consultar el estado del pago en Biopago
    const biopagoApi = new BiopagoVzlaAPI();
    const paymentResult = await biopagoApi.getPayment(paymentId);

    if (!paymentResult.response) {
      return new Response(JSON.stringify({
        error: 'Error al consultar el pago',
        details: 'No se pudo obtener información del pago'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const paymentData = paymentResult.response;
    const authorizationCode = paymentData.authorizationCode ? paymentData.authorizationCode.replace(/^0+/, '') : '';

    // Validar el estado del pago
    if (
      paymentData.status == 1 && 
      paymentData.result == 1 && 
      authorizationCode
    ) {
      // Obtener la tasa del BCV
      const bcvRate = await getBCVRate();

      // Crear instancia del servicio Cachicamo
      const cachicamoService = new CachicamoService();
      let customerUuid: string;

      const user = await prisma.user.findUnique({
        where: {
          id: userId
        }
      });

      if (!user) {
        return new Response(JSON.stringify({ 
          error: 'Usuario no encontrado',
          details: 'El usuario no fue encontrado'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      try {
        const customer = await cachicamoService.createOrUpdateCustomer({
          email: user.email,
          name: user.billing_full_name || user.name,
          dni: user.billing_tax_id || paymentData.dni,
          phone: user.billing_phone || '04120000000',
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

      // Crear factura usando la función del utils
      const invoiceUrl = await createInvoice(
        customerUuid,
        plan,
        parseFloat(paymentData.amount),
        paymentData.transactionId,
        'BIOPAGO'
      );

      // Si es una renovación de membresía
      if (membershipId) {
        const membership = await handleMembershipRenewal(
          membershipId,
          userId,
          plan,
          parseFloat(paymentData.amount),
          bcvRate,
          'Biopago - '+paymentData.paymentMethodDescription,
          ''+paymentData.transactionId,
          invoiceUrl
        );

        if (membership instanceof Response) {
          return membership;
        }
      } else {
        // Si es una nueva membresía
        const membership = await handleMembershipCreation(
          userId,
          plan,
          parseFloat(paymentData.amount),
          bcvRate,
          'Biopago - '+paymentData.paymentMethodDescription,
          ''+paymentData.transactionId,
          invoiceUrl
        );

        if (membership instanceof Response) {
          return membership;
        }
      }

      // Redirigir al dashboard
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/dashboard'
        }
      });
    }

    // Si el pago no fue exitoso, redirigir al dashboard con mensaje de error
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/dashboard?error=Pago+no+exitoso'
      }
    });

  } catch (error) {
    console.error('Error en el webhook de Biopago:', error);
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/dashboard?error=Error+en+el+procesamiento+del+pago'
      }
    });
  }
}; 