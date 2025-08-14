// lib/auth/getUserFromRequest.ts - VERSION SÉCURISÉE
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

export async function getUserFromRequest(req: NextRequest) {
  try {
    // ✅ RÉCUPÉRER LE COOKIE DEPUIS LA REQUÊTE (pas cookies() globaux)
    const sessionCookie = req.cookies.get('session');
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    // ✅ Vérifier le token
    const sessionData = await verifyToken(sessionCookie.value);
    if (
      !sessionData ||
      !sessionData.user ||
      typeof sessionData.user.id !== 'number'
    ) {
      return null;
    }

    // ✅ Vérifier l'expiration
    if (new Date(sessionData.expires) < new Date()) {
      return null;
    }

    // ✅ Récupérer l'utilisateur depuis la DB
    const user = await db
      .select()
      .from(users)
      .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
      .limit(1);

    if (user.length === 0) {
      return null;
    }

    return user[0];
    
  } catch (error) {
    console.warn('Invalid session in getUserFromRequest:', error);
    return null;
  }
}