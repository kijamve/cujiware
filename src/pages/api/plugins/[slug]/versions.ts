import type { APIRoute } from 'astro';
import { prisma } from '../../../../lib/prisma';
import { isAuthenticated } from '../../../../middleware/auth';
import type { User } from '@prisma/client';
import { randomUUID } from 'crypto';

interface PluginVersion {
  id: string;
  version: string;
  file_name: string;
  created_at: Date;
}

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

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const { slug } = params;
    if (!slug) {
      return new Response('Slug no proporcionado', { status: 400 });
    }

    // Verificar si el usuario está autenticado
    const user: User | null = await isAuthenticated(request);
    const isUserAuthenticated = !!user;

    // Obtener las versiones del plugin ordenadas por fecha de creación (más reciente primero)
    const versions = await prisma.pluginVersion.findMany({
      where: {
        plugin_slug: slug
      },
      select: {
        id: true,
        version: true,
        file_name: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Si el usuario está autenticado, generar o renovar su token
    const versionsWithTokens = versions.map((version) => {
      if (isUserAuthenticated && user) {
        // Generar nuevo token si no existe o ha expirado
        if (!userTokens.has(user.id) || userTokens.get(user.id)!.expiresAt < new Date()) {
          const token = randomUUID();
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
          userTokens.set(user.id, { token, expiresAt, userId: user.id });
        }
        return { ...version, download_token: userTokens.get(user.id)!.token };
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