import type { APIRoute } from 'astro';
import { prisma } from '../../../../../lib/prisma';
import fs from 'fs';
import path from 'path';
import { validateToken } from '../../../../../utils/token';

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const { slug, token, version } = params;
    if (!slug || !token || !version) {
      return new Response('Parámetros incompletos', { status: 400 });
    }

    // Verificar si el token es válido
    if (!validateToken(token)) {
      return new Response('Token inválido o expirado', { status: 401 });
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