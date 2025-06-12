import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middleware/auth';
import { generateToken } from '@/utils/token';
import type { User } from '@prisma/client';

// Almacenamiento temporal de tokens por usuario (en producción usar Redis o similar)
export const userTokens = new Map<string, {
  token: string;
  expiresAt: Date;
  userId: string;
}>();

// Limpiar tokens expirados cada minuto
setInterval(() => {
  const now = new Date();
  for (const [userId, data] of userTokens.entries()) {
    if (data.expiresAt < now) {
      userTokens.delete(userId);
    }
  }
}, 60 * 1000);

export const GET: APIRoute = async (context) => {
  try {
    const { slug } = context.params;
    if (!slug) {
      return new Response('Slug no proporcionado', { status: 400 });
    }

    // Verificar si el usuario está autenticado
    const user = await requireAuth(context) as (User | Response);
    let isAuthenticated = true;
    if (user instanceof Response) {
      isAuthenticated = false;
    }

    const withLicenseActive = isAuthenticated && (user as any).memberships.some((membership: { licenses: { status: string }[] }) => membership.licenses.some((license: { status: string }) => license.status === 'ACTIVE'));

    // Obtener las versiones del plugin ordenadas por fecha de creación (más reciente primero)
    const versions = await prisma.pluginVersion.findMany({
      where: {
        plugin_slug: slug
      },
      select: {
        id: true,
        version: true,
        file_name: true,
        created_at: true,
        changelog: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Si el usuario está autenticado, generar o renovar su token
    const versionsWithTokens = versions.map((version: {
      id: string;
      version: string;
      file_name: string;
      created_at: Date;
      changelog: string | null;
    }) => {
      if (withLicenseActive) {
        return { ...version, download_token: generateToken() };
      }
      return { ...version, download_token: null };
    });

    return new Response(JSON.stringify(versionsWithTokens), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error al obtener las versiones:', error);
    return new Response('Error interno del servidor', { status: 500 });
  }
};
