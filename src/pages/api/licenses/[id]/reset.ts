import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin, requireAuth } from '@/middleware/auth';

export const POST: APIRoute = async (context) => {
  // Primero intentar validar como super admin
  const admin = await requireSuperAdmin(context);
  let isSuperAdmin = !(admin instanceof Response);

  // Si no es super admin, validar como usuario común
  let user;
  if (!isSuperAdmin) {
    user = await requireAuth(context);
    if (user instanceof Response) {
      return user;
    }
  }

  const licenseId = context.params.id;
  if (!licenseId) {
    return new Response(JSON.stringify({ message: 'ID de licencia no proporcionado' }), {
      status: 400,
    });
  }

  try {
    // Construir la consulta base
    const whereClause = {
      id: licenseId,
      ...(isSuperAdmin ? {} : {
        membership: {
          user_id: user?.id ?? ''
        }
      })
    };

    // Verificar que la licencia existe y pertenece al usuario (si no es super admin)
    const license = await prisma.license.findFirst({
      where: whereClause,
      include: {
        membership: true
      }
    });

    if (!license) {
      return new Response(JSON.stringify({ message: 'Licencia no encontrada' }), {
        status: 404,
      });
    }

    // Si no es super admin, verificar el período de 15 días
    if (!isSuperAdmin && license.last_reset) {
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      if (license.last_reset > fifteenDaysAgo) {
        return new Response(JSON.stringify({
          message: 'Debes esperar 15 días entre cada reset de licencia'
        }), {
          status: 400,
        });
      }
    }

    // Eliminar todos los usos y actualizar last_reset
    await prisma.$transaction([
      prisma.licenseUsage.deleteMany({
        where: {
          license_id: licenseId
        }
      }),
      prisma.license.update({
        where: {
          id: licenseId
        },
        data: {
          last_reset: new Date()
        }
      })
    ]);

    return new Response(JSON.stringify({ message: 'Licencia reseteada exitosamente' }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error al resetear licencia:', error);
    return new Response(JSON.stringify({ message: 'Error al resetear la licencia' }), {
      status: 500,
    });
  }
};
