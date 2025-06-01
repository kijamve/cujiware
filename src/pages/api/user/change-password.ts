import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../middleware/auth';
import bcrypt from 'bcryptjs';

export const POST: APIRoute = async (context) => {
  try {
    const user = await requireAuth(context);
    if (user instanceof Response) return user;

    const data = await context.request.json();
    const { current_password, new_password, confirm_password } = data;

    // Validar que la contraseña actual sea correcta
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true }
    });

    if (!dbUser || !await bcrypt.compare(current_password, dbUser.password)) {
      return new Response(JSON.stringify({ message: 'La contraseña actual es incorrecta' }), {
        status: 400,
      });
    }

    // Validar nueva contraseña
    if (new_password !== confirm_password) {
      return new Response(JSON.stringify({ message: 'Las contraseñas no coinciden' }), {
        status: 400,
      });
    }
    if (new_password.length < 6) {
      return new Response(JSON.stringify({ message: 'La contraseña debe tener al menos 6 caracteres' }), {
        status: 400,
      });
    }

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(new_password, 10),
      },
    });

    return new Response(JSON.stringify({ message: 'Contraseña actualizada correctamente' }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    return new Response(JSON.stringify({ message: 'Error al cambiar la contraseña' }), {
      status: 500,
    });
  }
}; 