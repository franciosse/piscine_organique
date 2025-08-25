// middleware.ts - Version finale optimisée pour Vercel
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/session';
import { routing } from '@/i18n/routing';
import logger from '@/lib/logger/logger';

const intlMiddleware = createIntlMiddleware(routing);

// Routes protégées
const protectedRoutes = ['/dashboard', '/admin'];

// Routes avec rôles spécifiques
const roleProtectedRoutes: Record<string, string[]> = {
  '/admin': ['admin'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ⚡ SORTIE ULTRA-RAPIDE pour les assets statiques
  if (pathname.startsWith('/images/') ||
      pathname.startsWith('/icons/') ||
      pathname.startsWith('/assets/') ||
      pathname.startsWith('/flags/') ||
      pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif|ico|pdf|css|js|woff|woff2)$/i)) {
    return NextResponse.next();
  }

  // ⚡ SORTIE RAPIDE pour les API publiques
  if (pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/stripe') ||
      pathname.startsWith('/api/account')) {
    return NextResponse.next();
  }

  // ⚡ Pages de succès (cas spécial)
  const isSuccessPage = pathname.match(/\/dashboard\/courses\/\d+\/success$/) ||
    pathname.match(/\/(fr|en|eu|es)\/dashboard\/courses\/\d+\/success$/);

  if (isSuccessPage) {
    return intlMiddleware(request);
  }

  // ⚡ Routes publiques
  const publicPaths = ['/sign-in', '/sign-up', '/register', '/verify-email', '/courses', '/unauthorized'];
  const isPublicPath = publicPaths.some(path =>
    pathname === path || pathname.match(new RegExp(`^/(fr|en|eu|es)${path}`))
  );

  if (isPublicPath) {
    return intlMiddleware(request);
  }

  // 🔒 Vérification de session
  const sessionCookie = request.cookies.get('session');
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route) || pathname.match(new RegExp(`^/(fr|en|es|eu)${route}`))
  );

  // 🚫 Pas de session sur route protégée
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // 🔒 API routes protégées (non-admin)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/admin')) {
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await verifyToken(sessionCookie.value);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
  }

  // 🔒 API routes admin - Vérification rapide avec rôle du token
  if (pathname.startsWith('/api/admin')) {
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const sessionData = await verifyToken(sessionCookie.value);
      
      // ✅ Maintenant on a le rôle dans le token !
      if (sessionData.user.role !== 'admin') {
        logger.warn(`🚫 API Admin: Accès refusé pour utilisateur ${sessionData.user.id} (rôle: ${sessionData.user.role})`);
        return NextResponse.json(
          { error: 'Forbidden: Admin privileges required' },
          { status: 403 }
        );
      }

      logger.info(`✅ API Admin: Accès accordé pour utilisateur ${sessionData.user.id}`);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
  }

  // 🌐 Middleware i18n pour les autres routes
  let response = intlMiddleware(request);

  // 🔒 Vérification des rôles pour les pages (pas API)
  if (sessionCookie && !pathname.startsWith('/api/')) {
    for (const [routePrefix, allowedRoles] of Object.entries(roleProtectedRoutes)) {
      const matchesRoute = pathname.startsWith(routePrefix) ||
        pathname.match(new RegExp(`^/(fr|en|es|eu)${routePrefix}`));

      if (matchesRoute) {
        try {
          const sessionData = await verifyToken(sessionCookie.value);
          
          // ✅ Vérification du rôle depuis le token (pas de DB !)
          if (!allowedRoles.includes(sessionData.user.role)) {
            logger.warn(`🚫 Page Admin: Accès refusé pour utilisateur ${sessionData.user.id} (rôle: ${sessionData.user.role})`);
            
            const unauthorizedUrl = new URL('/unauthorized', request.url);
            const localeMatch = pathname.match(/^\/((fr|en|es|eu))/);
            if (localeMatch) {
              unauthorizedUrl.pathname = `/${localeMatch[1]}/unauthorized`;
            }
            
            return NextResponse.redirect(unauthorizedUrl);
          }

          logger.info(`✅ Page Admin: Accès accordé pour utilisateur ${sessionData.user.id} (rôle: ${sessionData.user.role})`);
          break;
        } catch (error) {
          logger.error('❌ Token invalide pour route admin: ' + error);
          response.cookies.delete('session');
          return NextResponse.redirect(new URL('/sign-in', request.url));
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Matcher encore plus restrictif pour réduire les invocations
    '/((?!api/auth|api/stripe|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images|icons|assets|flags).*)',
  ],
};