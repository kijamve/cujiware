import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ message: 'ID de membresía no proporcionado' }), {
        status: 400,
      });
    }

    const payments = await prisma.payment.findMany({
      where: {
        membership_id: id,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return new Response(JSON.stringify({ payments }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    return new Response(JSON.stringify({ message: 'Error al obtener los pagos' }), {
      status: 500,
    });
  }
};
