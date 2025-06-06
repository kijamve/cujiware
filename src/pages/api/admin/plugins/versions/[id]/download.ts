import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '../../../../../middleware/auth';
import { prisma } from '../../../../../lib/prisma';
import fs from 'fs';
import path from 'path';

export const GET: APIRoute = async ({ params, request }) => {
  try {
    // Verificar si el usuario es super admin
    const user = await requireSuperAdmin({ request, cookies: new Map() } as any);
    if (user instanceof Response) {
      return user;
    }

    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ message: 'ID de versión no proporcionado' }),
        { status: 400 }
      );
    }

    // Obtener la versión
    const version = await prisma.pluginVersion.findUnique({
      where: { id }
    });

    if (!version) {
      return new Response(
        JSON.stringify({ message: 'Versión no encontrada' }),
        { status: 404 }
      );
    }

    // Verificar si el archivo existe
    const filePath = path.join(process.cwd(), 'zip_plugins', version.file_path_server);
    if (!fs.existsSync(filePath)) {
      return new Response(
        JSON.stringify({ message: 'Archivo no encontrado' }),
        { status: 404 }
      );
    }

    // Leer el archivo
    const fileBuffer = fs.readFileSync(filePath);

    // Devolver el archivo
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${version.file_name}"`
      }
    });
  } catch (error) {
    console.error('Error al descargar versión:', error);
    return new Response(
      JSON.stringify({ message: 'Error al procesar la solicitud' }),
      { status: 500 }
    );
  }
}; 