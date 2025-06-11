import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const GET: APIRoute = async ({ params }) => {
  try {
    const membershipId = params.id;
    if (!membershipId) {
      return new Response(JSON.stringify({ message: 'ID de membresía no proporcionado' }), {
        status: 400,
      });
    }

    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
    });

    if (!membership) {
      return new Response(JSON.stringify({ message: 'Membresía no encontrada' }), {
        status: 404,
      });
    }

    const html = `
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
        <div class="bg-white rounded-lg p-6 max-w-md w-full">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-medium">Editar Fechas</h2>
            <button
              class="text-gray-400 hover:text-gray-500"
              data-action="close"
            >
              <span class="sr-only">Cerrar</span>
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="mb-4">
            <label for="end-date" class="block text-sm font-medium text-gray-700">
              Fecha de Fin
            </label>
            <input
              type="date"
              id="end-date"
              name="end-date"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value="${new Date(membership.end_date).toISOString().split('T')[0]}"
              min="${new Date().toISOString().split('T')[0]}"
            />
          </div>

          <div class="flex justify-end space-x-2">
            <button
              class="bg-white text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
              data-action="close"
            >
              Cancelar
            </button>
            <button
              class="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              data-action="save"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    `;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error al obtener modal de edición de fechas:', error);
    return new Response(JSON.stringify({ message: 'Error al obtener modal de edición de fechas' }), {
      status: 500,
    });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const membershipId = params.id;
    if (!membershipId) {
      return new Response(JSON.stringify({ message: 'ID de membresía no proporcionado' }), {
        status: 400,
      });
    }

    const { end_date } = await request.json();
    if (!end_date) {
      return new Response(JSON.stringify({ message: 'Fecha de fin no proporcionada' }), {
        status: 400,
      });
    }

    const membership = await prisma.membership.update({
      where: { id: membershipId },
      data: { end_date: new Date(end_date) },
    });

    return new Response(JSON.stringify({ membership }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error al actualizar fechas:', error);
    return new Response(JSON.stringify({ message: 'Error al actualizar fechas' }), {
      status: 500,
    });
  }
};
