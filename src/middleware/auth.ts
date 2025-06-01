import type { APIContext } from 'astro';
import jwt from 'jsonwebtoken';
import prisma from '../lib/db';

interface JWTPayload {
  userId: string;
  email: string;
}

export async function isAuthenticated(context: APIContext) {
  const token = context.cookies.get('token')?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, import.meta.env.JWT_SECRET) as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        memberships: {
          include: {
            plan: true
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

export async function requireAuth(context: APIContext) {
  const token = context.cookies.get('token')?.value;
  if (!token) {
    return context.redirect('/mi-cuenta');
  }

  try {
    const decoded = jwt.verify(token, import.meta.env.JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        memberships: {
          include: {
            plan: true
          }
        }
      }
    });

    if (!user) {
      return context.redirect('/mi-cuenta');
    }

    return user;
  } catch {
    return context.redirect('/mi-cuenta');
  }
} 