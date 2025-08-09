import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/session';
import { routing } from '@/i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);
const protectedRoutes = '/dashboard';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Exclure les images et assets statiques du middleware i18n
  const isStaticAsset = pathname.startsWith('/images/') || 
                       pathname.startsWith('/icons/') || 
                       pathname.startsWith('/assets/') ||
                       pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif|ico|pdf)$/i);
  
  if (isStaticAsset) {
    return NextResponse.next();
  }

  // D'abord, exécuter le middleware i18n pour les autres routes
  const intlResponse = intlMiddleware(request);
  
  const sessionCookie = request.cookies.get('session');
  const isProtectedRoute = pathname.startsWith(protectedRoutes) || 
                          pathname.match(/^\/(fr|en|es)\/dashboard/);
  
  // Redirection si route protégée sans session
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
  
  // Par défaut, utiliser la réponse du middleware i18n
  let response = intlResponse;
  
  // Rafraîchir la session si elle est présente
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
    // Inclut toutes les routes SAUF les assets statiques et API
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};