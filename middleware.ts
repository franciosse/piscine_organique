// middleware.ts (racine)
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/session';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';
import { routing } from '@/i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

// Toutes les routes protégées
const protectedRoutes = ['/dashboard'];
const roleProtectedRoutes: Record<string, string[]> = {
  // '/admin': ['admin'],
  // '/courses/create': ['admin'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Assets statiques
  const isStaticAsset = pathname.startsWith('/images/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/flags/') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif|ico|pdf)$/i);

  if (isStaticAsset) {
    return NextResponse.next();
  }

  // Routes publiques (auth, API publique, etc.)
  const publicPaths = [
    '/api/public', 
    '/sign-in', 
    '/register',
    '/api/auth',
    '/verify-email'
  ];
  
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.match(new RegExp(`^/(fr|en|eu|es)${path}`))
  );

  if (isPublicPath) {
    return intlMiddleware(request);
  }

  // Middleware i18n d'abord
  let response = intlMiddleware(request);
  
  // Vérification de l'authentification
  const sessionCookie = request.cookies.get('session');
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route) || 
    pathname.match(new RegExp(`^/(fr|en|es)${route}`))
  );

  // Routes API : retourner 401 au lieu de rediriger
  if (pathname.startsWith('/api/') && !sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Redirection si route protégée sans session
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // Vérification des rôles pour routes spécifiques
  if (sessionCookie && Object.keys(roleProtectedRoutes).length > 0) {
    try {
      const user = await getUserFromRequest(request);
      if (user) {
        for (const [routePrefix, allowedRoles] of Object.entries(roleProtectedRoutes)) {
          const matchesRoute = pathname.startsWith(routePrefix) || 
            pathname.match(new RegExp(`^/(fr|en|es)${routePrefix}`));
            
          if (matchesRoute && !allowedRoles.includes(user.role)) {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
          }
        }
      }
    } catch (error) {
      console.error('Role verification error:', error);
    }
  }

  // Rafraîchir la session
  if (sessionCookie && request.method === 'GET') {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      response.cookies.set({
        name: 'session',
        value: await signToken({
          ...parsed,
          expires: expiresInOneDay.toISOString()
        }),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiresInOneDay
      });
    } catch (error) {
      console.error('Error updating session:', error);
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