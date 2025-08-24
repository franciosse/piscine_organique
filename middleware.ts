// middleware.ts - Version alternative plus claire
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/session';
import { routing } from '@/i18n/routing';
import logger from '@/lib/logger/logger';

const intlMiddleware = createIntlMiddleware(routing);

// Toutes les routes protégées
const protectedRoutes = ['/dashboard', '/admin'];

const roleProtectedRoutes: Record<string, string[]> = {
  '/admin': ['admin'],
};

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
    logger.info('✅ Page de succès détectée (non protégée):'+ pathname);
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
    pathname.match(new RegExp(`^/(fr|en|es)${route}`))
  );

  // ✅ Routes API protégées : retourner 401
  if (pathname.startsWith('/api/') && !sessionCookie) {
    logger.info('🚫 API route without session:'+ pathname);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ✅ Redirection si route protégée sans session
  if (isProtectedRoute && !sessionCookie) {
    logger.info('🔄 Redirecting to sign-in from protected route:'+ pathname);
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // ✅ Vérification des rôles (simplifiée)
  if (sessionCookie && Object.keys(roleProtectedRoutes).length > 0) {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      
      for (const [routePrefix, allowedRoles] of Object.entries(roleProtectedRoutes)) {
        const matchesRoute = pathname.startsWith(routePrefix) ||
          pathname.match(new RegExp(`^/(fr|en|es)${routePrefix}`));
        
        if (matchesRoute) {
          logger.info('🔍 Role-protected route accessed:'+ routePrefix);
        }
      }
    } catch (error) {
      logger.error('❌ Session verification error in middleware:'+ error);
      response.cookies.delete('session');
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};