// /lib/auth/getUserFromRequest.ts - Version simplifiée pour Edge Runtime
import { NextRequest } from 'next/server';
import { verifyToken } from './session';

export async function getUserFromRequest(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');
    
    if (!sessionCookie) {
      return null;
    }

    // ✅ Seulement vérifier le token, pas d'accès DB dans le middleware
    const session = await verifyToken(sessionCookie.value);
    
    if (!session) {
      return null;
    }

    // ✅ Retourner un objet simple avec l'ID utilisateur
    // La vérification complète se fera côté serveur
    return {
      id: session.user.id,
      role: 'user', // ✅ Valeur par défaut, à vérifier côté serveur
    };

  } catch (error) {
    console.error('Invalid session in getUserFromRequest:', error);
    return null;
  }
}