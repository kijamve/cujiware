import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const licenseId = params.id;
    if (!licenseId) {
      return new Response(JSON.stringify({ message: 'ID de licencia no proporcionado' }), {
        status: 400,
      });
    }

    const { status } = await request.json();
    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      return new Response(JSON.stringify({ message: 'Estado no válido' }), {
        status: 400,
      });
    }

    const license = await prisma.license.update({
      where: { id: licenseId },
      data: { status },
    });

    return new Response(JSON.stringify({ license }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error al actualizar estado de licencia:', error);
    return new Response(JSON.stringify({ message: 'Error al actualizar estado de licencia' }), {
      status: 500,
    });
  }
};
