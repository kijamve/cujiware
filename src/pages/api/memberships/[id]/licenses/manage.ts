import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { formatDate } from '@/utils/date';

export const GET: APIRoute = async (context) => {
  try {
    // Validar que sea super admin
    const admin = await requireSuperAdmin(context);
    if (admin instanceof Response) {
      return admin;
    }

    const membershipId = context.params.id;
    if (!membershipId) {
      return new Response(JSON.stringify({ message: 'ID de membresía no proporcionado' }), {
        status: 400,
      });
    }

    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        plan: true,
        licenses: {
          include: {
            usages: true,
            plugins: true,
          },
        },
      },
    });

    if (!membership) {
      return new Response(JSON.stringify({ message: 'Membresía no encontrada' }), {
        status: 404,
      });
    }

    const html = `
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center overflow-y-auto">
        <div class="bg-white rounded-lg p-6 max-w-2xl w-full my-8">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-medium">Gestionar Licencias</h2>
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
            <div class="flex justify-between items-center">
              <p class="text-sm text-gray-500">
                Licencias: ${membership.licenses.length} / ${membership.plan.license_count}
              </p>
              <button
                class="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                data-action="add-license"
                data-membership-id=${membershipId}
              >
                Agregar Licencia
              </button>
            </div>
          </div>

          <div class="space-y-4 max-h-[calc(100vh-16rem)] overflow-y-auto">
            ${membership.licenses.map((license) => `
              <div class="border rounded-lg p-4">
                <div class="flex justify-between items-center mb-2">
                  <div>
                    <p class="text-sm font-medium">ID: ${license.id}</p>
                    <p class="text-sm text-gray-500">
                      Estado: <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        license.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }">
                        ${license.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}
                      </span>
                    </p>
                    <p class="text-sm text-gray-500">
                      Último reset: ${license.last_reset ? formatDate(license.last_reset) : 'Nunca'}
                    </p>
                  </div>
                  <div class="flex space-x-2">
                    ${license.status === 'ACTIVE'
                      ? `<button
                          class="text-red-600 hover:text-red-900"
                          data-action="deactivate-license"
                          data-license-id="${license.id}"
                        >
                          Desactivar
                        </button>`
                      : `<button
                          class="text-green-600 hover:text-green-900"
                          data-action="activate-license"
                          data-license-id="${license.id}"
                        >
                          Activar
                        </button>`
                    }
                    <button
                      class="text-indigo-600 hover:text-indigo-900"
                      data-action="reset-license"
                      data-license-id="${license.id}"
                    >
                      Resetear
                    </button>
                    <button
                      class="text-indigo-600 hover:text-indigo-900"
                      data-action="view-license-details"
                      data-license-id="${license.id}"
                    >
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
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
    console.error('Error al obtener modal de gestión de licencias:', error);
    return new Response(JSON.stringify({ message: 'Error al obtener modal de gestión de licencias' }), {
      status: 500,
    });
  }
};
