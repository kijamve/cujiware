import type { MiddlewareHandler } from 'astro';
import { onRequest as handle404 } from './404';
import { startReminderService } from '@/lib/reminders';

// Variable para asegurar que el servicio se inicie solo una vez
let reminderServiceStarted = false;

export const onRequest: MiddlewareHandler = async (context, next) => {
  // Inicializar el servicio de recordatorios solo una vez
  if (!reminderServiceStarted) {
    reminderServiceStarted = true;
    startReminderService();
  }

  const response = await handle404(context, next);
  return response || next();
};
