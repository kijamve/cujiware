import type { MiddlewareHandler } from 'astro';
import { onRequest as handle404 } from './404';

export const onRequest: MiddlewareHandler = async (context, next) => {
  const response = await handle404(context, next);
  return response || next();
};
