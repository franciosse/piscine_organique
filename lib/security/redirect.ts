// lib/security/redirect.ts (RECOMMANDÉ)
/**
 * Utilitaires pour les redirections sécurisées
 * Prévient les attaques de redirection ouverte et XSS
 */

// Domaines autorisés pour les redirections (configurez selon vos besoins)
const ALLOWED_DOMAINS = [
  // Ajoutez vos domaines autorisés ici si nécessaire
   'https://www.piscineorgnique.com',
   'https://piscine-organique-96k4.vercel.app/',
   'https://piscine-organique.vercel.app/'
];

// Paths autorisés pour les redirections internes
const ALLOWED_REDIRECT_PATHS = [
  '/',
  '/dashboard',
  '/profile',
  '/settings',
  '/courses',
  '/admin',
  '/login',
  '/register'
  // Ajoutez vos routes autorisées
];

/**
 * Valide qu'une URL de redirection est sécurisée
 */
export function isValidRedirectUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  // Nettoyer l'URL
  const cleanUrl = url.trim();
  
  try {
    const parsedUrl = new URL(cleanUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    
    // Rejeter les protocoles dangereux
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
    if (dangerousProtocols.some(protocol => 
        parsedUrl.protocol.toLowerCase().startsWith(protocol))) {
      return false;
    }
    
    // Autoriser les URLs relatives
    if (cleanUrl.startsWith('/') && !cleanUrl.startsWith('//')) {
      return isAllowedPath(parsedUrl.pathname);
    }
    
    // Vérifier les domaines autorisés
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL;
    
    return (
      parsedUrl.origin === currentOrigin ||
      ALLOWED_DOMAINS.includes(parsedUrl.origin)
    );
    
  } catch (error) {
    console.warn('URL malformée:', cleanUrl, error);
    return false;
  }
}

/**
 * Vérifie si un path est autorisé
 */
function isAllowedPath(pathname: string): boolean {
  return ALLOWED_REDIRECT_PATHS.some(allowedPath => 
    pathname === allowedPath || 
    pathname.startsWith(allowedPath + '/') ||
    // Autoriser les paths dynamiques comme /courses/[id]
    (allowedPath.includes('/') && pathname.startsWith(allowedPath.split('/')[0] + '/'))
  );
}

/**
 * Effectue une redirection sécurisée
 */
export function safeRedirect(url: string, fallbackUrl: string = '/dashboard'): void {
  if (typeof window === 'undefined') return;

  if (isValidRedirectUrl(url)) {
    window.location.href = url;
  } else {
    console.warn('Tentative de redirection vers une URL non autorisée:', url);
    window.location.href = fallbackUrl;
  }
}

/**
 * Hook React pour les redirections sécurisées avec Next.js Router
 */
import { useRouter } from 'next/router';
import { useCallback } from 'react';

export function useSecureRedirect() {
  const router = useRouter();

  const secureRedirect = useCallback((url: string, fallback: string = '/dashboard') => {
    if (isValidRedirectUrl(url)) {
      router.push(url);
    } else {
      console.warn('URL de redirection non autorisée, redirection vers:', fallback);
      router.push(fallback);
    }
  }, [router]);

  return secureRedirect;
}

/**
 * Version async du hook pour les redirections avec délai
 */
export function useSecureRedirectWithDelay() {
  const secureRedirect = useSecureRedirect();

  const secureRedirectWithDelay = useCallback((url: string, delay: number = 100, fallback?: string) => {
    setTimeout(() => {
      secureRedirect(url, fallback);
    }, delay);
  }, [secureRedirect]);

  return secureRedirectWithDelay;
}