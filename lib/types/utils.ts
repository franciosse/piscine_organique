// lib/auth/utils.ts
import { NextResponse } from 'next/server';
import type { AuthResult, AuthError } from './auth';


/**
 * Helper pour logger les tentatives d'authentification
 */
export function logAuthAttempt(
  success: boolean, 
  errorCode?: string, 
  userId?: number,
  ip?: string
) {
  const logData = {
    timestamp: new Date().toISOString(),
    success,
    errorCode: errorCode || null,
    userId: userId || null,
    ip: ip || 'unknown'
  };
  
  if (success) {
    console.log('🔐 AUTH SUCCESS:', logData);
  } else {
    console.warn('🚨 AUTH FAILED:', logData);
  }
}

/**
 * Créer une erreur d'auth standardisée
 */
export function createAuthError(
  code: AuthError['code'], 
  message: string, 
  status: number
): AuthResult<never> {
  return {
    success: false,
    error: { code, message, status }
  };
}

/**
 * Type guard pour vérifier si un AuthResult est un succès
 */
export function isAuthSuccess<T>(result: AuthResult<T>): result is { success: true; data: T } {
  return result.success === true;
}

/**
 * Type guard pour vérifier si un AuthResult est une erreur
 */
export function isAuthError<T>(result: AuthResult<T>): result is { success: false; error: AuthError } {
  return result.success === false;
}

/**
 * Convertit un AuthResult en NextResponse si c'est une erreur
 */
export function authResultToResponse<T>(result: AuthResult<T>): NextResponse | null {
  if (isAuthError(result)) {
    return NextResponse.json(
      { 
        error: result.error.message,
        code: result.error.code 
      },
      { status: result.error.status }
    );
  }
  return null;
}