import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Crear planes por defecto
  const plans = [
    {
      name: 'Mensual',
      description: 'Perfecto para probar nuestros plugins o proyectos cortos.',
      price: 12.00,
      currency: 'USD',
      interval: 'month',
      features: ['Todos los plugins', 'Actualizaciones', 'Soporte técnico'],
      is_highlighted: false,
      savings_text: null,
      is_visible: true,
      stripe_price_id: 'price_monthly'
    },
    {
      name: 'Semestral',
      description: 'Nuestro plan más popular para negocios en crecimiento.',
      price: 60.00,
      currency: 'USD',
      interval: 'semester',
      features: ['Todos los plugins', 'Actualizaciones', 'Soporte técnico'],
      is_highlighted: true,
      savings_text: '17% DE DESCUENTO',
      is_visible: true,
      stripe_price_id: 'price_semester'
    },
    {
      name: 'Anual',
      description: 'Mejor valor para dueños de tiendas serios.',
      price: 115.00,
      currency: 'USD',
      interval: 'year',
      features: ['Todos los plugins', 'Actualizaciones', 'Soporte técnico'],
      is_highlighted: false,
      savings_text: '20% DE DESCUENTO',
      is_visible: true,
      stripe_price_id: 'price_yearly'
    }
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { stripe_price_id: plan.stripe_price_id },
      update: plan,
      create: plan
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 