import type { APIRoute } from 'astro';
import { isAuthenticated } from '@/middleware/auth';

export const GET: APIRoute = async (context) => {
  try {
    const user = await isAuthenticated(context.request);

    if (user) {
      return new Response(
        JSON.stringify({
          authenticated: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            country: user.country
          }
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } else {
      return new Response(
        JSON.stringify({ authenticated: false }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
    return new Response(
      JSON.stringify({ authenticated: false }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
