import { type APIRoute } from 'astro';
import { db } from '@/db';
import { memberships } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireSuperAdmin } from '@/middleware/auth';

export const GET: APIRoute = async (context) => {
  try {
    const admin = await requireSuperAdmin(context);
    if (admin instanceof Response) return admin;

    const url = new URL(context.request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 30;
    const offset = (page - 1) * limit;

    // Obtener el total de membresías para la paginación
    const totalMemberships = await db.select({ count: sql`count(*)` }).from(memberships);
    const total = Number(totalMemberships[0].count);
    const totalPages = Math.ceil(total / limit);

    // Obtener las membresías paginadas
    const membershipsList = await db.query.memberships.findMany({
      with: {
        user: {
          columns: {
            name: true,
            email: true,
          },
        },
        plan: {
          columns: {
            name: true,
            description: true,
            license_count: true,
          },
        },
        licenses: true,
      },
      limit,
      offset,
      orderBy: (memberships, { desc }) => [desc(memberships.end_date)],
    });

    return new Response(JSON.stringify({
      memberships: membershipsList,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
      },
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error al obtener membresías:', error);
    return new Response(JSON.stringify({ error: 'Error al obtener membresías' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
