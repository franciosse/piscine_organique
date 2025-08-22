// /lib/auth/session.ts
import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NewUser } from '@/lib/db/schema';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const key = new TextEncoder().encode(process.env.AUTH_SECRET);
const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword);
}

type SessionData = {
  user: { id: number };
  expires: string;
};

export async function signToken(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day from now')
    .sign(key);
}

export async function verifyToken(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload as SessionData;
}

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    
    if (!session) {
      console.log('🍪 Aucun cookie de session trouvé');
      return null;
    }

    console.log('🍪 Cookie de session trouvé, vérification...');
    const verified = await verifyToken(session);
    
    console.log('✅ Session valide pour utilisateur:', verified.user.id);
    return verified;
  } catch (error : any) {
    console.warn('❌ Session invalide:', error.message);
    // Nettoyer le cookie invalide
    try {
      const cookieStore = await cookies();
      cookieStore.delete('session');
    } catch (deleteError) {
      console.warn('⚠️ Erreur suppression cookie:', deleteError);
    }
    return null;
  }
}

// ✅ setSession mise à jour - PAS de redirection automatique
export async function setSession(user: NewUser) {
  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session: SessionData = {
    user: { id: user.id! },
    expires: expiresInOneDay.toISOString(),
  };

  const encryptedSession = await signToken(session);
  
  // ✅ Juste créer la session, PAS de redirection
  const cookieStore = await cookies();
  cookieStore.set('session', encryptedSession, {
    expires: expiresInOneDay,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/', // ✅ Important : définir le path
  });

  console.log('🍪 Session créée pour utilisateur:', user.id);
  
  // ❌ PAS de redirect() ici !
  // La redirection est gérée côté client
}

export async function getUser() {
  const session = await getSession();
  if (!session) {
    console.log('❌ Aucune session pour getUser()');
    return null;
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      console.log('❌ Utilisateur introuvable en base pour ID:', session.user.id);
      return null;
    }

    console.log('✅ Utilisateur récupéré:', user.email);
    return user;
  } catch (error) {
    console.error('❌ Erreur récupération utilisateur:', error);
    return null;
  }
}

// ✅ Fonction utilitaire pour supprimer la session
export async function destroySession() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    console.log('🍪 Session supprimée');
  } catch (error) {
    console.error('Erreur suppression session:', error);
  }
}