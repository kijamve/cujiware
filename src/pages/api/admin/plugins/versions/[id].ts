import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '../../../../../middleware/auth';
import { prisma } from '../../../../../lib/prisma';
import fs from 'fs';
import path from 'path';

export const DELETE: APIRoute = async (context) => {
  try {
    // Verificar si el usuario es super admin
    const user = await requireSuperAdmin(context);
    if (user instanceof Response) {
      return user;
    }

    const { id } = context.params;
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

    // Eliminar el archivo
    const filePath = path.join(process.cwd(), 'zip_plugins', version.file_path_server);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Eliminar el registro de la base de datos
    await prisma.pluginVersion.delete({
      where: { id }
    });

    return new Response(
      JSON.stringify({ message: 'Versión eliminada correctamente' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar versión:', error);
    return new Response(
      JSON.stringify({ message: 'Error al procesar la solicitud' }),
      { status: 500 }
    );
  }
}; 