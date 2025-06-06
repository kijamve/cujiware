import type { APIRoute } from 'astro';
import { prisma } from '../../../../../lib/prisma';
import { isAuthenticated } from '../../../../../middleware/auth';
import fs from 'fs';
import path from 'path';
import { LICENSE_STATUS } from '../../../../../constants/status';

// Importar el mapa de tokens desde el archivo de versiones
import { userTokens } from '../versions';

interface PluginVersion {
  id: string;
  version: string;
  plugin_slug: string;
  file_name: string;
  file_path_server: string;
  created_at: Date;
}

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const { slug, token, version } = params;
    if (!slug || !token || !version) {
      return new Response('Parámetros incompletos', { status: 400 });
    }

    // Verificar si el usuario está autenticado
    const user = await isAuthenticated(request);
    if (!user) {
      return new Response('No autorizado', { status: 401 });
    }

    // Verificar si el usuario tiene una licencia activa para el plugin
    const license = await prisma.license.findFirst({
      where: {
        membership: {
          user_id: user.id,
        },
        status: LICENSE_STATUS.ACTIVE
      }
    });

    if (!license) {
      return new Response('Se requiere una licencia activa para descargar este plugin', { status: 403 });
    }

    // Verificar si el usuario tiene un token válido
    const userTokenData = userTokens.get(user.id);
    if (!userTokenData || userTokenData.token !== token) {
      return new Response('Token inválido', { status: 404 });
    }

    // Verificar si el token ha expirado
    if (userTokenData.expiresAt < new Date()) {
      userTokens.delete(user.id);
      return new Response('Token expirado', { status: 410 });
    }

    // Obtener la versión del plugin
    const pluginVersion = await prisma.pluginVersion.findFirst({
      where: {
        plugin_slug: slug,
        id: version
      }
    });

    if (!pluginVersion) {
      return new Response('Versión no encontrada', { status: 404 });
    }

    // Verificar si el archivo existe
    const filePath = path.join(process.cwd(), 'zip_plugins', pluginVersion.file_path_server);
    if (!fs.existsSync(filePath)) {
      return new Response('Archivo no encontrado', { status: 404 });
    }

    // Leer el archivo
    const fileBuffer = fs.readFileSync(filePath);

    // Enviar el archivo
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${pluginVersion.file_name}"`
      }
    });
  } catch (error) {
    console.error('Error en la descarga:', error);
    return new Response('Error interno del servidor', { status: 500 });
  }
}; 