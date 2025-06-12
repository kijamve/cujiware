import type { MiddlewareHandler } from 'astro';

export const onRequest: MiddlewareHandler = async (context, next) => {
  try {
    const response = await next();

    // Si la respuesta es 404, redirigir a la página principal
    if (response.status === 404) {
      console.error('404: URL no encontrada ->', context.url);
      return context.redirect('/');
    }

    return response;
  } catch (error) {
    console.error(error);
    // Si hay un error, también redirigir a la página principal
    return context.redirect('/');
  }
};
