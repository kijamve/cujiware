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
        return new Response(null, {
          status: 302,
          headers: {
            'Location': '/dashboard?error=Error+en+el+procesamiento+del+pago'
          }
        });
    }

    // Obtener el plan
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
        return new Response(null, {
          status: 302,
          headers: {
            'Location': '/dashboard?error=Error:+Plan+no+encontrado'
          }
        });
    }

    // Consultar el estado del pago en Biopago
    const biopagoApi = new BiopagoVzlaAPI();
    const paymentResult = await biopagoApi.getPayment(paymentId);

    if (!paymentResult.response) {
        return new Response(null, {
          status: 302,
          headers: {
            'Location': '/dashboard?error=Error+al+consultar+el+pago'
          }
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

      // Verificar si ya existe un pago con esta referencia
      const existingPayment = await prisma.payment.findFirst({
        where: {
          reference: ''+paymentData.transactionId
        }
      });

      if (existingPayment) {
        return new Response(null, {
          status: 302,
          headers: {
            'Location': '/dashboard?error=Error:+Pago+duplicado'
          }
        });
      }
      // Crear instancia del servicio Cachicamo
      const cachicamoService = new CachicamoService();
      let customerUuid: string;

      const user = await prisma.user.findUnique({
        where: {
          id: userId
        }
      });

      if (!user) {
        return new Response(null, {
          status: 302,
          headers: {
            'Location': '/dashboard?error=Error:+Usuario+no+encontrado'
          }
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
            return new Response(null, {
              status: 302,
              headers: {
                'Location': '/dashboard?error=Error:+Error+al+crear+o+actualizar+el+cliente'
              }
            });
        }
        customerUuid = customer.uuid;
      } catch (error) {
        return new Response(null, {
          status: 302,
          headers: {
            'Location': '/dashboard?error=Error:+Error+al+crear+o+actualizar+el+cliente'
          }
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
          'Location': '/dashboard?success=Pago+procesado+exitosamente+con+el+ID:+'+paymentData.transactionId
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