import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';
import { createAuthError, logAuthAttempt } from '@/lib/types/utils';
import type { AuthUserResult } from '@/lib/types/auth'; 


export async function getAuthenticatedUser(request: NextRequest): Promise<AuthUserResult> {
    try {
      const user = await getUserFromRequest(request);
      const ip = request.headers.get('x-forwarded-for') || 'unknown';
      
      if (!user) {
        logAuthAttempt(false, 'UNAUTHORIZED', undefined, ip);
        return createAuthError(
          'UNAUTHORIZED',
          'Utilisateur non authentifié',
          401
        );
      }
  
      logAuthAttempt(true, undefined, user.id, ip);
      return { success: true, data: user };
      
    } catch (error) {
      console.error('Erreur lors de la vérification user:', error);
      return createAuthError(
        'SERVER_ERROR',
        'Erreur interne du serveur',
        500
      );
    }

}