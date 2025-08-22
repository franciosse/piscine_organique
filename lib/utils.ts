import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Fonction utilitaire pour formater les prix
export function formatPrice(priceInCents: number): string {
  if (priceInCents === 0) return 'Gratuit';
  return `${(priceInCents / 100).toFixed(2)}€`;
}

// Fonction utilitaire pour formater la durée
export function formatDuration(minutes: number | null): string {
  if (!minutes) return 'Non spécifié';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
  }
  return `${mins}min`;
}

// Fonction utilitaire pour les initiales utilisateur
export function getUserInitials(name: string | null, email: string): string {
  if (name && typeof name === 'string') {
    return name
      .split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  
  if (email && typeof email === 'string') {
    const emailPart = email.split('@')[0];
    if (emailPart.length >= 2) {
      return emailPart.slice(0, 2).toUpperCase();
    }
    return emailPart[0]?.toUpperCase() || 'U';
  }
  
  return 'U';
}

export const getBaseUrl = (request?: Request): string => {
  // En développement
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXTAUTH_URL || 'http://localhost:3000';
  }
  
  // Variables d'environnement en priorité (recommandé pour la production)
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  
  // Si on a une requête, on peut construire depuis les headers
  if (request) {
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    
    // Sur Vercel, filtrer les URLs de déploiement temporaires
    if (host && host.includes('vercel.app')) {
      // Extraire le nom de base (avant le premier tiret avec suffixe)
      const baseHost = host.split('-').slice(0, 2).join('-') + '.vercel.app';
      return `${protocol}://${baseHost}`;
    }
    
    return `${protocol}://${host}`;
  }
  
  throw new Error('Unable to determine base URL');
};