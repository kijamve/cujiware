import { prisma } from './prisma';
import { MEMBERSHIP_STATUS } from '@/constants/status';
import { sendEmail } from '@/utils/email';

export async function checkAndSendReminders() {
  const now = new Date();
  
  // Membresías que vencen en 1 día
  const oneDayBefore = new Date(now);
  oneDayBefore.setDate(oneDayBefore.getDate() + 1);
  
  // Membresías que vencieron hace 1 día
  const oneDayAfter = new Date(now);
  oneDayAfter.setDate(oneDayAfter.getDate() - 1);
  
  // Membresías que vencieron hace 4 días
  const fourDaysAfter = new Date(now);
  fourDaysAfter.setDate(fourDaysAfter.getDate() - 4);

  // Obtener membresías que necesitan recordatorio
  const memberships = await prisma.membership.findMany({
    where: {
      status: MEMBERSHIP_STATUS.ACTIVE,
      OR: [
        // Vence en 1 día
        {
          end_date: {
            gte: oneDayBefore,
            lt: new Date(oneDayBefore.getTime() + 24 * 60 * 60 * 1000)
          },
          last_remember_date: null
        },
        // Venció hace 1 día
        {
          end_date: {
            gte: oneDayAfter,
            lt: new Date(oneDayAfter.getTime() + 24 * 60 * 60 * 1000)
          },
          last_remember_date: {
            lt: oneDayAfter
          }
        },
        // Venció hace 4 días
        {
          end_date: {
            gte: fourDaysAfter,
            lt: new Date(fourDaysAfter.getTime() + 24 * 60 * 60 * 1000)
          },
          last_remember_date: {
            lt: fourDaysAfter
          }
        }
      ]
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      plan: {
        select: {
          name: true
        }
      }
    }
  });

  for (const membership of memberships) {
    const daysUntilExpiration = Math.ceil((membership.end_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const daysAfterExpiration = Math.ceil((now.getTime() - membership.end_date.getTime()) / (1000 * 60 * 60 * 24));

    let subject = '';
    let content = '';

    if (daysUntilExpiration === 1) {
      subject = 'Tu membresía de Cujiware vence mañana';
      content = `
        <p>Hola ${membership.user.name},</p>
        <p>Te informamos que tu membresía del plan ${membership.plan.name} vence mañana.</p>
        <p>Para mantener el acceso a todas las funcionalidades, te recomendamos renovar tu suscripción.</p>
        <p>Puedes renovar tu membresía desde tu <a href="${process.env.SITE_URL}/dashboard">dashboard</a>.</p>
      `;
    } else if (daysAfterExpiration === 1) {
      subject = 'Tu membresía de Cujiware ha vencido';
      content = `
        <p>Hola ${membership.user.name},</p>
        <p>Te informamos que tu membresía del plan ${membership.plan.name} ha vencido.</p>
        <p>Para mantener el acceso a todas las funcionalidades, te recomendamos renovar tu suscripción lo antes posible.</p>
        <p>Puedes renovar tu membresía desde tu <a href="${process.env.SITE_URL}/dashboard">dashboard</a>.</p>
      `;
    } else if (daysAfterExpiration === 4) {
      subject = 'Último aviso: Tu membresía de Cujiware ha vencido';
      content = `
        <p>Hola ${membership.user.name},</p>
        <p>Este es un último aviso para informarte que tu membresía del plan ${membership.plan.name} ha vencido hace 4 días.</p>
        <p>Si no renuevas tu suscripción pronto, perderás el acceso a todas las funcionalidades.</p>
        <p>Puedes renovar tu membresía desde tu <a href="${process.env.SITE_URL}/dashboard">dashboard</a>.</p>
      `;
    }

    try {
      await sendEmail({
        to: membership.user.email,
        subject,
        html: content
      });

      // Actualizar la fecha del último recordatorio
      await prisma.membership.update({
        where: { id: membership.id },
        data: { last_remember_date: now }
      });
    } catch (error) {
      console.error(`Error al enviar recordatorio a ${membership.user.email}:`, error);
    }
  }
} 