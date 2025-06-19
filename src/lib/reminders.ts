import { prisma } from './prisma';
import { MEMBERSHIP_STATUS, LICENSE_STATUS } from '@/constants/status';
import { sendEmail } from '@/utils/email';

// Variable para controlar el intervalo
let reminderInterval: NodeJS.Timeout | null = null;

// Función para enviar notificación a N8N
async function sendWhatsAppNotification(data: {
  phone: string;
  email: string;
  expire_at: string;
  pay_date: string;
  client_name: string;
  plan_name: string;
  plan_cost: string;
}) {
  try {
    data.phone = data.phone.replace(/[^\d]/g, '');
    data.phone = data.phone.startsWith('04') ? '584' + data.phone.substring(2) : data.phone;
    data.phone = !data.phone.startsWith('5') ? '58' + data.phone : data.phone;
    const response = await fetch('https://n8n-server.kijam.com/webhook/19b2c9a9-a143-4200-b7da-998118a0f708', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('WhatsApp notification sent successfully');
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
  }
}

export async function checkAndSendReminders() {
  const now = new Date();

  // Membresías que vencen en 1 día
  const expireDate = new Date(now);
  expireDate.setTime(expireDate.getTime() + (24 * 60 * 60 * 1000));

  // Membresías que vencieron hace 5 días (para desactivar)
  const fiveDaysAfter = new Date(now);
  fiveDaysAfter.setTime(fiveDaysAfter.getTime() - (5 * 24 * 60 * 60 * 1000));


  // Primero, desactivar membresías que vencieron hace 5 días
  const membershipsToDeactivate = await prisma.membership.findMany({
    where: {
      status: MEMBERSHIP_STATUS.ACTIVE,
      end_date: {
        lte: fiveDaysAfter
      }
    },
    include: {
      licenses: true
    }
  });

  for (const membership of membershipsToDeactivate) {
    try {
      // Desactivar todas las licencias de la membresía
      await prisma.license.updateMany({
        where: { membership_id: membership.id },
        data: { status: LICENSE_STATUS.INACTIVE }
      });

      // Desactivar la membresía y resetear last_remember_date
      await prisma.membership.update({
        where: { id: membership.id },
        data: {
          status: MEMBERSHIP_STATUS.INACTIVE,
          last_remember_date: null
        }
      });

      console.log(`Membresía ${membership.id} desactivada automáticamente después de 5 días`);
    } catch (error) {
      console.error(`Error al desactivar membresía ${membership.id}:`, error);
    }
  }

  // Obtener membresías que necesitan recordatorio
  const memberships = await prisma.membership.findMany({
    where: {
      status: MEMBERSHIP_STATUS.ACTIVE,
      end_date: {
        lte: expireDate // Desde hace 1 día hacia adelante
      }
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          billing_phone: true
        }
      },
      plan: {
        select: {
          name: true,
          price: true,
          currency: true
        }
      }
    }
  });

  for (const membership of memberships) {
    const endDateOnly = new Date(membership.end_date);

    // Verificar si ya se envió recordatorio hoy
    const lastRememberDate = membership.last_remember_date;
    let alreadySentToday = false;

    if (lastRememberDate) {
      const lastRememberDateOnly = new Date(lastRememberDate);
      const timeDifference = now.getTime() - lastRememberDateOnly.getTime();
      const hoursDifference = timeDifference / (1000 * 60 * 60); // Convertir a horas
      alreadySentToday = hoursDifference < 48; // Si han pasado menos de 24 horas
    }

    // Si ya se envió hoy, continuar con la siguiente
    if (alreadySentToday) {
      continue;
    }

    let subject = '';
    let content = '';
    let shouldSendReminder = false;

    // Determinar qué tipo de recordatorio enviar basado en la fecha de vencimiento
    const daysUntilExpiry = Math.ceil(((new Date()).getTime() - endDateOnly.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 1) {
      // Vence mañana
      subject = 'Tu membresía de Cujiware vence muy pronto';
      content = `
        <p>Hola ${membership.user.name},</p>
        <p>Te recordamos que tu membresía del plan ${membership.plan.name} vence muy pronto.</p>
        <p>Este es solo un recordatorio amigable para que tengas presente la fecha de vencimiento.</p>
        <p>Puedes acceder a tu <a href="${process.env.SITE_URL}/dashboard">dashboard</a> cuando lo consideres necesario.</p>
      `;
      shouldSendReminder = true;
    } else if (daysUntilExpiry >= 1 && daysUntilExpiry <= 2) {
      // Venció hace 1 día
      subject = 'Tu membresía de Cujiware ha vencido';
      content = `
        <p>Hola ${membership.user.name},</p>
        <p>Te informamos que tu membresía del plan ${membership.plan.name} ha vencido.</p>
        <p>Para mantener el acceso a todas las funcionalidades, te recomendamos renovar tu suscripción lo antes posible.</p>
        <p>Puedes renovar tu membresía desde tu <a href="${process.env.SITE_URL}/dashboard">dashboard</a>.</p>
      `;
      shouldSendReminder = true;
    } else if (daysUntilExpiry > 3) {
      // Venció hace 4 días
      subject = 'Último aviso: Tu membresía de Cujiware ha vencido';
      content = `
        <p>Hola ${membership.user.name},</p>
        <p>Este es un último aviso para informarte que tu membresía del plan ${membership.plan.name} ha vencido hace más de 3 días.</p>
        <p>Si no renuevas tu suscripción pronto, perderás el acceso a todas las funcionalidades.</p>
        <p>Puedes renovar tu membresía desde tu <a href="${process.env.SITE_URL}/dashboard">dashboard</a>.</p>
      `;
      shouldSendReminder = true;
    }

    if (!shouldSendReminder) {
      continue;
    }

    try {
      await sendEmail({
        to: membership.user.email,
        subject,
        html: content
      });

      // Enviar notificación por WhatsApp si el usuario tiene teléfono
      /*
      if (membership.user.billing_phone) {
        await sendWhatsAppNotification({
          phone: membership.user.billing_phone,
          email: membership.user.email,
          expire_at: new Date(membership.end_date.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // YYYY-MM-DD
          pay_date: membership.end_date.toISOString().split('T')[0], // YYYY-MM-DD
          client_name: membership.user.name,
          plan_name: membership.plan.name,
          plan_cost: `${membership.plan.price} ${membership.plan.currency === 'USD' ? '$' : membership.plan.currency}`
        });
      }
        */

      // Actualizar la fecha del último recordatorio
      await prisma.membership.update({
        where: { id: membership.id },
        data: { last_remember_date: now }
      });

      console.log(`✅ Recordatorio enviado para membresía ${membership.id} (${membership.user.email})`);
    } catch (error) {
      console.error(`Error al enviar recordatorio a ${membership.user.email}:`, error);
    }
  }

  console.log(`✅ Recordatorios procesados: ${memberships.length} membresías revisadas`);
}

// Función para iniciar el sistema de recordatorios automáticos
export function startReminderService() {
  // Si ya existe un intervalo, lo limpiamos
  if (reminderInterval) {
    clearInterval(reminderInterval);
  }

  // Ejecutar inmediatamente al iniciar
  console.log('🚀 Iniciando servicio de recordatorios automáticos...');
  checkAndSendReminders().catch(error => {
    console.error('Error al ejecutar recordatorios al inicio:', error);
  });

  // Configurar para ejecutar cada hora (3600000 ms = 1 hora)
/*  reminderInterval = setInterval(async () => {
    console.log('⏰ Ejecutando recordatorios programados...');
    try {
      await checkAndSendReminders();
    } catch (error) {
      console.error('Error al ejecutar recordatorios programados:', error);
    }
  },10000 /*3600000* /); // 1 hora
*/
  console.log('✅ Servicio de recordatorios configurado para ejecutar cada hora');
}

// Función para detener el servicio
export function stopReminderService() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
    console.log('🛑 Servicio de recordatorios detenido');
  }
}
