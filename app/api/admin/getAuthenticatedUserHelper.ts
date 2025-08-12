import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle'; // Votre instance Drizzle
import { 
  users, 
} from '@/lib/db/schema';
import { eq} from 'drizzle-orm';


export async function getAuthenticatedUser(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    throw new Error('Non authentifié');
  }

  const user = await db.select().from(users).where(eq(users.id, parseInt(userId))).limit(1);
  if (!user[0]) {
    throw new Error('Utilisateur non trouvé');
  }

  return user[0];
}