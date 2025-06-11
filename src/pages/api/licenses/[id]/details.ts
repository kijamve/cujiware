import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const GET: APIRoute = async ({ params }) => {
  try {
    const licenseId = params.id;
    if (!licenseId) {
      return new Response(JSON.stringify({ message: 'ID de licencia no proporcionado' }), {
        status: 400,
      });
    }

    const license = await prisma.license.findUnique({
      where: { id: licenseId },
      include: {
        usages: {
          orderBy: {
            last_used_at: 'desc',
          },
        },
        plugins: {
          orderBy: {
            last_usage: 'desc',
          },
        },
      },
    });

    if (!license) {
      return new Response(JSON.stringify({ message: 'Licencia no encontrada' }), {
        status: 404,
      });
    }

    const html = `
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
        <div class="bg-white rounded-lg p-6 max-w-2xl w-full">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-medium">Detalles de Licencia</h2>
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

          <div class="space-y-4">
            <div>
              <h3 class="text-sm font-medium text-gray-500">ID de Licencia</h3>
              <div class="mt-1 flex items-center">
                <p class="text-sm text-gray-900" data-license-id="${license.id}">${license.id}</p>
                <button
                  class="ml-2 text-indigo-600 hover:text-indigo-900"
                  data-action="copy-license-id"
                >
                  Copiar
                </button>
              </div>
            </div>

            <div>
              <h3 class="text-sm font-medium text-gray-500">Estado</h3>
              <p class="mt-1 text-sm text-gray-900">
                ${license.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}
              </p>
            </div>

            <div>
              <h3 class="text-sm font-medium text-gray-500">Último Reset</h3>
              <p class="mt-1 text-sm text-gray-900">
                ${license.last_reset ? new Date(license.last_reset).toLocaleDateString() : 'Nunca'}
              </p>
            </div>

            <div>
              <h3 class="text-sm font-medium text-gray-500">Dominios Activos</h3>
              ${license.usages.length > 0
                ? `<div class="mt-1 space-y-2">
                    ${license.usages.map(usage => `
                      <div class="flex justify-between items-center">
                        <p class="text-sm text-gray-900">${usage.domain}</p>
                        <p class="text-sm text-gray-500">
                          Último uso: ${new Date(usage.last_used_at).toLocaleDateString()}
                        </p>
                      </div>
                    `).join('')}
                  </div>`
                : '<p class="mt-1 text-sm text-gray-500">No hay dominios activos</p>'
              }
            </div>

            <div>
              <h3 class="text-sm font-medium text-gray-500">Plugins Utilizados</h3>
              ${license.plugins.length > 0
                ? `<div class="mt-1 space-y-2">
                    ${license.plugins.map(plugin => `
                      <div class="flex justify-between items-center">
                        <p class="text-sm text-gray-900">${plugin.plugin_slug}</p>
                        <p class="text-sm text-gray-500">
                          Último uso: ${plugin.last_usage ? new Date(plugin.last_usage).toLocaleDateString() : 'Nunca'}
                        </p>
                      </div>
                    `).join('')}
                  </div>`
                : '<p class="mt-1 text-sm text-gray-500">No hay plugins utilizados</p>'
              }
            </div>
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
    console.error('Error al obtener detalles de licencia:', error);
    return new Response(JSON.stringify({ message: 'Error al obtener detalles de licencia' }), {
      status: 500,
    });
  }
};
