// /lib/auth/session.ts
import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NewUser } from '@/lib/db/schema';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import logger from '@/lib/logger/logger';


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
      logger.info('🍪 Aucun cookie de session trouvé');
      return null;
    }

    logger.info('🍪 Cookie de session trouvé, vérification...');
    const verified = await verifyToken(session);
    
    logger.info('✅ Session valide pour utilisateur:'+ verified.user.id);
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

  logger.info('🍪 Session créée pour utilisateur:'+ user.id);
  
  // ❌ PAS de redirect() ici !
  // La redirection est gérée côté client
}

export async function getUser() {
  const session = await getSession();
  if (!session) {
    logger.info('❌ Aucune session pour getUser()');
    return null;
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      logger.info('❌ Utilisateur introuvable en base pour ID:' +  session.user.id);
      return null;
    }

    logger.info('✅ Utilisateur récupéré:'+ user.email);
    return user;
  } catch (error) {
    logger.error('❌ Erreur récupération utilisateur:'+ error);
    return null;
  }
}

// ✅ Fonction utilitaire pour supprimer la session
export async function destroySession() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    logger.info('🍪 Session supprimée');
  } catch (error) {
    logger.error('Erreur suppression session:' + error);
  }
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const user = await getUser();
    return user?.role === 'admin';
  } catch (error) {
    logger.error('Erreur vérification admin:', error);
    return false;
  }
}

// 🆕 Fonction pour obtenir le rôle de l'utilisateur actuel
export async function getCurrentUserRole(): Promise<string | null> {
  try {
    const user = await getUser();
    return user?.role || null;
  } catch (error) {
    logger.error('Erreur récupération rôle:', error);
    return null;
  }
}

// 🆕 Fonction pour vérifier un rôle spécifique par ID utilisateur
export async function getUserRole(userId: number): Promise<string | null> {
  try {
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          isNull(users.deletedAt)
        )
      )
      .limit(1);

    return user?.role || null;
  } catch (error) {
    logger.error('Erreur récupération rôle utilisateur:', error);
    return null;
  }
}

// 🆕 Fonction pour vérifier les permissions d'une route
export async function canAccessRoute(route: string): Promise<boolean> {
  try {
    const userRole = await getCurrentUserRole();
    
    // Routes admin
    if (route.startsWith('/admin') && userRole !== 'admin') {
      return false;
    }
    
    // Ajoutez d'autres vérifications de routes si nécessaire
    // if (route.startsWith('/teacher') && !['admin', 'teacher'].includes(userRole)) {
    //   return false;
    // }
    
    return true;
  } catch (error) {
    logger.error('Erreur vérification accès route:', error);
    return false;
  }
}

// 🆕 Fonction pour obtenir les informations complètes de l'utilisateur avec session
export async function getUserWithSession() {
  const session = await getSession();
  if (!session) {
    return null;
  }

  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(
        and(
          eq(users.id, session.user.id),
          isNull(users.deletedAt)
        )
      )
      .limit(1);

    if (!user) {
      logger.info('❌ Utilisateur introuvable en base pour ID:' + session.user.id);
      return null;
    }

    return {
      ...user,
      sessionData: session
    };
  } catch (error) {
    logger.error('❌ Erreur récupération utilisateur avec session:', error);
    return null;
  }
}

// 🆕 Hook/fonction pour les composants côté client
export async function requireAdmin() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    throw new Error('Admin access required');
  }
  return true;
}