import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { license_id, domain, plugin_slug } = req.body;

    if (!license_id || !domain || !plugin_slug) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Buscar la licencia
    const license = await prisma.license.findUnique({
      where: { id: license_id },
      include: {
        membership: true
      }
    });

    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    if (license.status !== 'active') {
      return res.status(403).json({ error: 'License is not active' });
    }

    // Verificar si la membresía ha expirado (más de 5 días desde end_date)
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    if (license.membership.end_date < fiveDaysAgo) {
      // Actualizar el estado de la membresía y sus licencias
      await prisma.$transaction([
        prisma.membership.update({
          where: { id: license.membership.id },
          data: { status: 'cancelled' }
        }),
        prisma.license.updateMany({
          where: { membership_id: license.membership.id },
          data: { status: 'inactive' }
        })
      ]);

      return res.status(403).json({ error: 'Membership has expired' });
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
      return res.status(403).json({ 
        error: 'This license was used with another domain in the last 72 hours',
        lastUsage
      });
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
        plugin_slug: plugin_slug,
        domain: domain
      }
    });

    // Crear o actualizar el registro de uso del plugin
    await prisma.licensePlugin.upsert({
      where: {
        license_id_plugin_slug: {
          license_id: license_id,
          plugin_slug: plugin_slug,
          domain: domain
        }
      },
      update: {
        last_usage: new Date()
      },
      create: {
        license_id: license_id,
        plugin_slug: plugin_slug,
        domain: domain,
        last_usage: new Date()
      }
    });

    return res.status(200).json({
      valid: true,
      license: {
        ...license,
        usages: license.usages
      }
    });

  } catch (error) {
    console.error('Error validating license:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 