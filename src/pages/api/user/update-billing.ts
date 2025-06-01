import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../middleware/auth';

export const POST: APIRoute = async (context) => {
  try {
    const user = await requireAuth(context);
    if (user instanceof Response) return user;

    const data = await context.request.json();
    const { billing_full_name, billing_phone, billing_tax_id, billing_address } = data;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        billing_full_name,
        billing_phone,
        billing_tax_id,
        billing_address,
      },
    });

    return new Response(JSON.stringify({ message: 'Datos de facturación actualizados correctamente' }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error al actualizar datos de facturación:', error);
    return new Response(JSON.stringify({ message: 'Error al actualizar los datos de facturación' }), {
      status: 500,
    });
  }
}; 