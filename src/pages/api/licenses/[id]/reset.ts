import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middleware/auth';

export const POST: APIRoute = async ({ params, request }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) {
    return user;
  }

  const licenseId = params.id;
  if (!licenseId) {
    return new Response(JSON.stringify({ message: 'ID de licencia no proporcionado' }), {
      status: 400,
    });
  }

  try {
    // Verificar que la licencia pertenece al usuario
    const license = await prisma.license.findFirst({
      where: {
        id: licenseId,
        membership: {
          user_id: user.id
        }
      },
      include: {
        membership: true
      }
    });

    if (!license) {
      return new Response(JSON.stringify({ message: 'Licencia no encontrada' }), {
        status: 404,
      });
    }

    // Verificar si han pasado 15 días desde el último reset
    if (license.last_reset) {
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