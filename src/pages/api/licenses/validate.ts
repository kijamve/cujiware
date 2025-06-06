import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import Stripe from 'stripe';
import { MEMBERSHIP_STATUS, LICENSE_STATUS } from '../../../constants/status';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { license_id, domain, plugin_slug } = body;

    if (!license_id || !domain || !plugin_slug) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // Buscar la licencia
    const license = await prisma.license.findUnique({
      where: { id: license_id },
      include: {
        membership: true,
        usages: true
      }
    });

    if (!license) {
      return new Response(
        JSON.stringify({ error: 'License not found' }),
        { status: 404 }
      );
    }

    if (license.status !== LICENSE_STATUS.ACTIVE) {
      return new Response(
        JSON.stringify({ error: 'License is not active' }),
        { status: 403 }
      );
    }

    // Verificar si la membresía ha expirado (más de 5 días desde end_date)
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    if (license.membership.end_date < fiveDaysAgo) {
      // Si existe una suscripción en Stripe, cancelarla
      if (license.membership.stripe_subscription_id) {
        try {
          await stripe.subscriptions.cancel(license.membership.stripe_subscription_id);
        } catch (error) {
          console.error('Error al cancelar suscripción en Stripe:', error);
        }
      }

      // Actualizar el estado de la membresía y sus licencias
      await prisma.$transaction([
        prisma.membership.update({
          where: { id: license.membership.id },
          data: { status: MEMBERSHIP_STATUS.CANCELLED }
        }),
        prisma.license.updateMany({
          where: { membership_id: license.membership.id },
          data: { status: LICENSE_STATUS.INACTIVE }
        })
      ]);

      return new Response(
        JSON.stringify({ error: 'Membership has expired' }),
        { status: 403 }
      );
    }

    // Verificar si hay un uso reciente con otro dominio
    const lastUsage = await prisma.licenseUsage.findFirst({
      where: {
        license_id: license_id,
        last_used_at: {
          gte: new Date(Date.now() - 72 * 60 * 60 * 1000) // Últimas 72 horas
        }
      },
      orderBy: {
        last_used_at: 'desc'
      }
    });

    if (lastUsage && lastUsage.domain !== domain) {
      return new Response(
        JSON.stringify({ 
          error: 'This license was used with another domain in the last 72 hours',
          lastUsage
        }),
        { status: 403 }
      );
    }

    // Crear o actualizar el uso de la licencia
    const licenseUsage = await prisma.licenseUsage.upsert({
      where: {
        license_id_domain: {
          license_id: license_id,
          domain: domain
        }
      },
      update: {
        last_used_at: new Date()
      },
      create: {
        license_id: license_id,
        domain: domain,
        last_used_at: new Date()
      }
    });

    // Crear o actualizar el registro de uso del plugin
    await prisma.licensePlugin.upsert({
      where: {
        license_id_plugin_slug_domain: {
          license_id: license_id,
          plugin_slug: plugin_slug,
          domain: domain
        }
      },
      update: {
        last_usage: new Date(),
        domain: domain
      },
      create: {
        license_id: license_id,
        plugin_slug: plugin_slug,
        domain: domain,
        last_usage: new Date()
      }
    });

    return new Response(
      JSON.stringify({
        valid: true,
        license: {
          ...license,
          usages: license.usages
        }
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Error validating license:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
} 