// lib/auth/server.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { User } from '@/lib/db/schema';

export async function getAuthenticatedUser(): Promise<User> {
  const user = await getUser();
  
  if (!user) {
    throw new Error('Non authentifié');
  }
  
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await getAuthenticatedUser();
  
  if (user.role !== 'admin') {
    throw new Error('Permissions insuffisantes');
  }
  
  return user;
}

export function handleAuthError(error: Error) {
  if (error.message === 'Non authentifié') {
    return NextResponse.json(
      { error: 'Authentification requise' },
      { status: 401 }
    );
  }
  
  if (error.message === 'Permissions insuffisantes') {
    return NextResponse.json(
      { error: 'Permissions administrateur requises' },
      { status: 403 }
    );
  }
  
  return NextResponse.json(
    { error: 'Erreur serveur' },
    { status: 500 }
  );
}