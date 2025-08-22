// /lib/auth/getUserFromRequest.ts - Version simplifiée pour Edge Runtime
import { NextRequest } from 'next/server';
import { verifyToken } from './session';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

export async function getUserFromRequest(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');
    
    if (!sessionCookie) {
      return null;
    }

    // ✅ Seulement vérifier le token, pas d'accès DB dans le middleware
    const session = await verifyToken(sessionCookie.value);
    
    if (!session || !session.user || typeof session.user.id !== 'number'
    ) {
      return null;
    }

 // ✅ Vérifier l'expiration
    if (new Date(session.expires) < new Date()) {
      return null;
    }

    // ✅ Récupérer l'utilisateur depuis la DB
    const user = await db
      .select()
      .from(users)
      .where(and(eq(users.id, session.user.id), isNull(users.deletedAt)))
      .limit(1);

    if (user.length === 0) {
      return null;
    }

    return user[0];

  } catch (error) {
    console.error('Invalid session in getUserFromRequest:', error);
    return null;
  }
}