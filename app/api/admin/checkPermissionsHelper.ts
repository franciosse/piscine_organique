// app/api/admin/helpers.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';

export async function checkAdminPermission(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    throw new Error('Non authentifié');
  }

  // if (user.role !== 'admin') {
  //   throw new Error('Permissions insuffisantes');
  // }

  return user;
}

// Ajoutez aussi cette fonction utilitaire pour gérer les erreurs
export function handleAuthError(error: Error): NextResponse {
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