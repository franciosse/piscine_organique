// middleware.ts - Version adaptée à votre système de session existant
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { routing } from '@/i18n/routing';
import logger from '@/lib/logger/logger';

const intlMiddleware = createIntlMiddleware(routing);

// Toutes les routes protégées
const protectedRoutes = ['/dashboard', '/admin'];

// Routes qui nécessitent des rôles spécifiques
const roleProtectedRoutes: Record<string, string[]> = {
  '/admin': ['admin'],
};

// 🆕 Cache simple pour éviter trop de requêtes DB
const userRoleCache = new Map<number, { role: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getUserRole(userId: number): Promise<string | null> {
  // Vérifier le cache
  const cached = userRoleCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.role;
  }

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

    if (!user) {
      userRoleCache.delete(userId); // Supprimer du cache si utilisateur n'existe plus
      return null;
    }

    // Mettre en cache
    userRoleCache.set(userId, {
      role: user.role,
      timestamp: Date.now()
    });

    return user.role;
  } catch (error) {
    logger.error('Erreur récupération rôle utilisateur:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ Assets statiques
  const isStaticAsset = pathname.startsWith('/images/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/flags/') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif|ico|pdf)$/i);

  if (isStaticAsset) {
    return NextResponse.next();
  }

  // ✅ EXCEPTION SPÉCIALE : Pages de succès après paiement (non protégées)
  const isSuccessPage = pathname.match(/\/dashboard\/courses\/\d+\/success$/) ||
    pathname.match(/\/(fr|en|eu|es)\/dashboard\/courses\/\d+\/success$/);

  if (isSuccessPage) {
    logger.info('✅ Page de succès détectée (non protégée): ' + pathname);
    return intlMiddleware(request);
  }

  // ✅ Routes publiques standard
  const publicPaths = [
    '/api/auth',
    '/api/account',
    '/api/stripe',
    '/sign-in',
    '/sign-up',
    '/register',
    '/verify-email',
    '/courses',
    '/unauthorized', // Votre page unauthorized existante
  ];

  const isPublicPath = publicPaths.some(path => {
    if (path.startsWith('/api/')) {
      return pathname.startsWith(path);
    }
    return pathname === path || pathname.match(new RegExp(`^/(fr|en|eu|es)${path}`));
  });

  if (isPublicPath) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.next();
    }
    return intlMiddleware(request);
  }

  // ✅ Middleware i18n pour les autres routes
  let response = intlMiddleware(request);

  // ✅ Vérification de l'authentification
  const sessionCookie = request.cookies.get('session');
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route) ||
    pathname.match(new RegExp(`^/(fr|en|es|eu)${route}`))
  );

  // ✅ Routes API protégées : retourner 401
  if (pathname.startsWith('/api/') && !sessionCookie) {
    logger.info('🚫 API route without session: ' + pathname);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ✅ Redirection si route protégée sans session
  if (isProtectedRoute && !sessionCookie) {
    logger.info('🔄 Redirecting to sign-in from protected route: ' + pathname);
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // ✅ Vérification des rôles (ADAPTÉE À VOTRE SYSTÈME)
  if (sessionCookie && Object.keys(roleProtectedRoutes).length > 0) {
    try {
      const sessionData = await verifyToken(sessionCookie.value);
      const userId = sessionData.user.id;

      // 🆕 Récupérer le rôle utilisateur depuis la DB
      const userRole = await getUserRole(userId);

      if (!userRole) {
        logger.error(`❌ Impossible de récupérer le rôle pour l'utilisateur ${userId}`);
        // Session invalide, supprimer le cookie et rediriger
        response.cookies.delete('session');
        if (isProtectedRoute) {
          return NextResponse.redirect(new URL('/sign-in', request.url));
        }
        return response;
      }

      // Vérifier chaque route protégée par rôle
      for (const [routePrefix, allowedRoles] of Object.entries(roleProtectedRoutes)) {
        const matchesRoute = pathname.startsWith(routePrefix) ||
          pathname.match(new RegExp(`^/(fr|en|es|eu)${routePrefix}`));

        if (matchesRoute) {
          logger.info(`🔍 Route protégée par rôle accédée: ${routePrefix} par utilisateur ${userId} (rôle: ${userRole})`);
          
          // 🆕 VÉRIFICATION DU RÔLE
          if (!allowedRoles.includes(userRole)) {
            logger.warn(`🚫 Accès refusé: Utilisateur avec rôle '${userRole}' (ID: ${userId}) a tenté d'accéder à '${routePrefix}'`);
            
            // Pour les API routes admin, retourner 403
            if (pathname.startsWith('/api/admin')) {
              return NextResponse.json(
                { error: 'Forbidden: Admin privileges required' }, 
                { status: 403 }
              );
            }
            
            // Pour les pages, rediriger vers unauthorized
            const unauthorizedUrl = new URL('/unauthorized', request.url);
            // Préserver la locale si elle existe
            const localeMatch = pathname.match(/^\/((fr|en|es|eu))/);
            if (localeMatch) {
              unauthorizedUrl.pathname = `/${localeMatch[1]}/unauthorized`;
            }
            
            return NextResponse.redirect(unauthorizedUrl);
          }
          
          logger.info(`✅ Accès accordé: Utilisateur avec rôle '${userRole}' (ID: ${userId}) accédant à '${routePrefix}'`);
          break;
        }
      }
    } catch (error) {
      logger.error('❌ Erreur de vérification de session dans le middleware: ' + error);
      response.cookies.delete('session');
      
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
    }
  }

  // 🆕 Vérification spéciale pour les API routes admin
  if (pathname.startsWith('/api/admin')) {
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
      const sessionData = await verifyToken(sessionCookie.value);
      const userId = sessionData.user.id;
      const userRole = await getUserRole(userId);
      
      if (!userRole || userRole !== 'admin') {
        logger.warn(`🚫 Accès API Admin refusé: Utilisateur ${userId} avec rôle '${userRole}' a tenté d'accéder à '${pathname}'`);
        return NextResponse.json(
          { error: 'Forbidden: Admin privileges required' }, 
          { status: 403 }
        );
      }
      
      logger.info(`✅ Accès API Admin accordé: Utilisateur admin ${userId} accédant à '${pathname}'`);
    } catch (error) {
      logger.error('❌ Vérification du token échouée pour API admin: ' + error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};