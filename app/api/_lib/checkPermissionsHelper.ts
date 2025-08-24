// app/api/helpers/checkPermissionsHelper.ts
import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';
import { createAuthError, logAuthAttempt } from '@/lib/types/utils';
import type { AuthUserResult } from '@/lib/types/auth';
import logger from '@/lib/logger/logger';


export async function checkAdminPermission(request: NextRequest): Promise<AuthUserResult> {
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

    if (user.role !== 'admin') {
      logAuthAttempt(false, 'FORBIDDEN', user.id, ip);
      return createAuthError(
        'FORBIDDEN',
        'Permissions administrateur requises',
        403
      );
    }

    logAuthAttempt(true, undefined, user.id, ip);
    return { success: true, data: user };
    
  } catch (error) {
    logger.error('Erreur lors de la vérification admin:'+ error);
    return createAuthError(
      'SERVER_ERROR',
      'Erreur interne du serveur',
      500
    );
  }
}