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