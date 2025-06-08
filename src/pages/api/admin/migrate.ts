import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/middleware/auth.ts';
import { prisma } from '@/lib/prisma';
import { MEMBERSHIP_STATUS, LICENSE_STATUS, PAYMENT_METHOD, PLAN_INTERVAL } from '@/constants/status';
import bcrypt from 'bcryptjs';
import { sendMigrationEmail } from '../../../utils/email';

export const POST: APIRoute = async (context) => {
  try {
    // Verificar autenticación master
    const user = await requireSuperAdmin(context);
    if (user instanceof Response) {
      return user;
    }

    // Obtener el JSON del body
    const migrateData = await context.request.json();

    const results = {
      users: { created: 0, updated: 0 },
      plans: { created: 0, updated: 0 },
      memberships: { created: 0, updated: 0 },
      licenses: { created: 0, skipped: 0 }
    };

    for (const data of migrateData) {
      // 1. Crear o actualizar usuario
      const password = data.email.split('@')[0]; // Contraseña es el email sin dominio
      const hashedPassword = await bcrypt.hash(password, 10); // Encriptar contraseña
      const userData = {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        country: data.country,
        ...(data.country === 'VE' && data.billing ? {
          billing_full_name: data.name,
          billing_phone: data.billing.phone,
          billing_tax_id: data.billing.tax_id,
          billing_address: data.billing.address
        } : {})
      };

      const user = await prisma.user.upsert({
        where: { email: data.email },
        update: userData,
        create: userData
      });

      if (user) {
        results.users.created++;
      } else {
        results.users.updated++;
      }

      // 2. Crear o actualizar plan
      const planData = {
        name: data.membership.plan_name,
        description: `Plan ${data.membership.interval.toLowerCase()}`,
        price: data.membership.price,
        currency: 'USD',
        interval: data.membership.interval as typeof PLAN_INTERVAL[keyof typeof PLAN_INTERVAL],
        features: [],
        is_visible: false,
        license_count: data.licenses.length
      };

      // Buscar plan existente por precio e intervalo
      const existingPlan = await prisma.plan.findFirst({
        where: {
          price: data.membership.price,
          interval: data.membership.interval as typeof PLAN_INTERVAL[keyof typeof PLAN_INTERVAL]
        }
      });

      const plan = existingPlan
        ? await prisma.plan.update({
            where: { id: existingPlan.id },
            data: planData
          })
        : await prisma.plan.create({
            data: planData
          });

      if (plan) {
        results.plans.created++;
      } else {
        results.plans.updated++;
      }

      // 3. Verificar licencias existentes y buscar membresía
      const existingLicenses = await prisma.license.findMany({
        where: {
          id: {
            in: data.licenses
          }
        },
        include: {
          membership: true
        }
      });

      const existingLicenseIds = existingLicenses.map(l => l.id);
      const newLicenseIds = data.licenses.filter((id: string) => !existingLicenseIds.includes(id));

      // Si hay licencias existentes, obtener la membresía asociada
      let existingMembership = existingLicenses.length > 0 ? existingLicenses[0].membership : null;

      if (existingMembership) {
        // Si existe una membresía, agregar las licencias faltantes
        if (newLicenseIds.length > 0) {
          await prisma.license.createMany({
            data: newLicenseIds.map((id: string) => ({
              id,
              membership_id: existingMembership.id,
              status: LICENSE_STATUS.ACTIVE
            }))
          });
          await sendMigrationEmail(
            data.email,
            data.name,
            data.country,
            data.email,
            data.email.split('@')[0] // Usamos el email sin dominio como contraseña temporal
          );
          results.licenses.created += newLicenseIds.length;
        }
      } else if (newLicenseIds.length > 0) {
        // Si no existe membresía y hay licencias nuevas, crear una nueva membresía
        const membership = await prisma.membership.create({
          data: {
            user_id: user.id,
            plan_id: plan.id,
            status: MEMBERSHIP_STATUS.ACTIVE,
            start_date: new Date(data.membership.start_date),
            end_date: new Date(data.membership.end_date),
            payment_method: data.country === 'VE' ? PAYMENT_METHOD.VENEZUELA : PAYMENT_METHOD.STRIPE,
            licenses: {
              create: newLicenseIds.map((id: string) => ({
                id,
                status: LICENSE_STATUS.ACTIVE
              }))
            }
          }
        });

        if (membership) {
          results.memberships.created++;
          results.licenses.created += newLicenseIds.length;
        }

        // Enviar email de migración solo si se crearon nuevas licencias
        await sendMigrationEmail(
          data.email,
          data.name,
          data.country,
          data.email,
          data.email.split('@')[0] // Usamos el email sin dominio como contraseña temporal
        );
      }

      results.licenses.skipped += existingLicenseIds.length;
    }

    return new Response(JSON.stringify({
      success: true,
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en migración:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
