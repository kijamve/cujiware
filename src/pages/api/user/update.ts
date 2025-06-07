import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middleware/auth';
import bcrypt from 'bcryptjs';

export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await requireAuth(request);
    if (user instanceof Response) return user;

    const data = await request.json();
    const { billing_full_name, billing_phone, billing_tax_id, new_password, confirm_password } = data;

    // Validar contraseña si se proporciona
    if (new_password) {
      if (new_password !== confirm_password) {
        return new Response(JSON.stringify({ message: 'Las contraseñas no coinciden' }), {
          status: 400,
        });
      }
      if (new_password.length < 8) {
        return new Response(JSON.stringify({ message: 'La contraseña debe tener al menos 8 caracteres' }), {
          status: 400,
        });
      }
    }

    // Actualizar usuario
    const updateData: any = {
      billing_full_name,
      billing_phone,
      billing_tax_id,
    };

    if (new_password) {
      updateData.password = await bcrypt.hash(new_password, 10);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return new Response(JSON.stringify({ message: 'Perfil actualizado correctamente' }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    return new Response(JSON.stringify({ message: 'Error al actualizar el perfil' }), {
      status: 500,
    });
  }
}; 