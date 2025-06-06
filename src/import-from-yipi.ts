// scripts/draft-import-woocommerce.ts
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// TODO: Reemplazar con tus credenciales reales
const wooCommerce = new WooCommerceRestApi({
  url: 'https://tu-tienda.com',
  consumerKey: 'tu-consumer-key',
  consumerSecret: 'tu-consumer-secret',
  version: 'wc/v3'
});

// TODO: Mapeo de planes de WooCommerce a tus planes
const planMapping: Record<string, string> = {
  // 'woocommerce-product-id': 'tu-plan-id'
};

async function importSubscriptions() {
  try {
    console.log('Iniciando importación de suscripciones...');
    
    // Obtener todas las suscripciones activas
    const subscriptions = await wooCommerce.get('subscriptions', {
      status: 'active',
      per_page: 100 // TODO: Ajustar según necesites
    });

    console.log(`Encontradas ${subscriptions.data.length} suscripciones activas`);

    for (const subscription of subscriptions.data) {
      try {
        // Obtener el usuario asociado a la suscripción
        const customer = await wooCommerce.get(`customers/${subscription.customer_id}`);
        
        console.log(`Procesando suscripción para: ${customer.data.email}`);

        // Crear el usuario en tu sistema
        const user = await prisma.user.upsert({
          where: { email: customer.data.email },
          update: {},
          create: {
            email: customer.data.email,
            name: `${customer.data.first_name} ${customer.data.last_name}`,
            password: '', // Se generará un token de reset
            reset_token: crypto.randomUUID(),
            reset_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
            country: 'Venezuela', // País por defecto para usuarios importados
          }
        });

        // TODO: Determinar el plan_id basado en el producto de WooCommerce
        const planId = planMapping[subscription.line_items[0].product_id] || 'ID_PLAN_DEFAULT';

        // Crear la membresía
        await prisma.membership.create({
          data: {
            user_id: user.id,
            plan_id: planId,
            status: 'ACTIVE',
            start_date: new Date(subscription.date_created),
            end_date: new Date(subscription.next_payment_date),
            payment_method: 'VENEZUELA', // TODO: Determinar el método de pago correcto
          }
        });

        console.log(`Suscripción importada exitosamente para: ${customer.data.email}`);
      } catch (error) {
        console.error(`Error procesando suscripción para ${subscription.id}:`, error);
        // Continuar con la siguiente suscripción
        continue;
      }
    }

    console.log('Importación completada');
  } catch (error) {
    console.error('Error durante la importación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// No ejecutar automáticamente, solo exportar la función
export { importSubscriptions };