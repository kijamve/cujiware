import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';

export const GET: APIRoute = async ({ params }) => {
  try {
    const membershipId = params.id;
    if (!membershipId) {
      return new Response(JSON.stringify({ message: 'ID de membresía no proporcionado' }), {
        status: 400,
      });
    }

    const licenses = await prisma.license.findMany({
      where: { membership_id: membershipId },
      orderBy: {
        created_at: 'desc',
      },
    });

    return new Response(JSON.stringify({ licenses }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error al obtener licencias:', error);
    return new Response(JSON.stringify({ message: 'Error al obtener licencias' }), {
      status: 500,
    });
  }
};

export const POST: APIRoute = async (context) => {
  try {
    // Validar que sea super admin
    const admin = await requireSuperAdmin(context);
    if (admin instanceof Response) {
      return admin;
    }

    const membershipId = context.params.id;
    if (!membershipId) {
      return new Response(JSON.stringify({ message: 'ID de membresía no proporcionado' }), {
        status: 400,
      });
    }

    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        plan: true,
        licenses: true,
      },
    });

    if (!membership) {
      return new Response(JSON.stringify({ message: 'Membresía no encontrada' }), {
        status: 404,
      });
    }

    const license = await prisma.license.create({
      data: {
        membership_id: membershipId,
        status: 'ACTIVE',
      },
    });

    return new Response(JSON.stringify({ license }), {
      status: 201,
    });
  } catch (error) {
    console.error('Error al crear licencia:', error);
    return new Response(JSON.stringify({ message: 'Error al crear licencia' }), {
      status: 500,
    });
  }
};
