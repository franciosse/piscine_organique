import type { NextRequest } from 'next/server';
import { getUser } from '@/lib/db/queries';

/**
 * Récupère l'utilisateur connecté à partir de la requête.
 * Utilise getUser() interne, mais tu peux l'adapter si besoin pour lire un JWT, cookie, etc.
 */
export async function getUserFromRequest(req: NextRequest) {
  // Ici, on utilise ton getUser existant
  const user = await getUser();

  // Si aucun user trouvé → return null
  if (!user) {
    return null;
  }

  return user;
}
