import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth.ts';

export const GET: APIRoute = async (context) => {
  try {

  // Primero intentar validar como super admin
  const admin = await requireSuperAdmin(context);
  const membershipId = context.params.id;
  if (!membershipId) {
    return new Response(JSON.stringify({ message: 'ID de membresía no proporcionado' }), {
      status: 400,
    });
  }

    const payments = await prisma.payment.findMany({
      where: { membership_id: membershipId },
      orderBy: {
        created_at: 'desc',
      },
    });

    const html = `
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
        <div class="bg-white rounded-lg p-6 max-w-2xl w-full">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-medium">Historial de Pagos</h2>
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

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Factura
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${payments.map((payment) => `
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      $${payment.amount.toFixed(2)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        payment.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : payment.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }">
                        ${payment.status === 'COMPLETED'
                          ? 'Completado'
                          : payment.status === 'PENDING'
                          ? 'Pendiente'
                          : 'Fallido'}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${payment.payment_method}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${payment.invoice_url ? `
                        <a href="${payment.invoice_url}" target="_blank" class="text-indigo-600 hover:text-indigo-900">
                          Ver factura
                        </a>
                      ` : 'No disponible'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
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
    console.error('Error al obtener modal de pagos:', error);
    return new Response(JSON.stringify({ message: 'Error al obtener modal de pagos' }), {
      status: 500,
    });
  }
};
