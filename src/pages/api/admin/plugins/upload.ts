import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '../../../../middleware/auth';
import { prisma } from '../../../../lib/prisma';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const POST: APIRoute = async (context) => {
  try {
    // Verificar si el usuario es super admin
    const user = await requireSuperAdmin(context);
    if (user instanceof Response) {
      return user;
    }

    const formData = await context.request.formData();
    const pluginSlug = formData.get('plugin_slug') as string;
    const version = formData.get('version') as string;
    const fileName = formData.get('file_name') as string;
    const file = formData.get('file') as File;

    if (!pluginSlug || !version || !file || !fileName) {
      return new Response(
        JSON.stringify({ message: 'Faltan campos requeridos' }),
        { status: 400 }
      );
    }

    // Verificar si ya existe una versión con el mismo número
    const existingVersion = await prisma.pluginVersion.findFirst({
      where: {
        plugin_slug: pluginSlug,
        version: version
      }
    });

    if (existingVersion) {
      return new Response(
        JSON.stringify({ message: 'Ya existe una versión con este número' }),
        { status: 400 }
      );
    }

    // Crear directorio si no existe
    const uploadDir = path.join(process.cwd(), 'zip_plugins', pluginSlug);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generar nombre único para el archivo en el servidor
    const serverFileName = `${version}-${uuidv4()}.zip`;
    const filePath = path.join(uploadDir, serverFileName);

    // Guardar el archivo
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    // Crear registro en la base de datos
    const pluginVersion = await prisma.pluginVersion.create({
      data: {
        plugin_slug: pluginSlug,
        version: version,
        file_name: fileName,
        file_path_server: path.join(pluginSlug, serverFileName)
      }
    });

    return new Response(
      JSON.stringify({ message: 'Versión subida correctamente', version: pluginVersion }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al subir versión:', error);
    return new Response(
      JSON.stringify({ message: 'Error al procesar la solicitud' }),
      { status: 500 }
    );
  }
}; 