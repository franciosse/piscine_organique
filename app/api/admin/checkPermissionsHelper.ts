// app/api/admin/helpers.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';

export async function checkAdminPermission(request: NextRequest) {
  try {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
        { error: 'Utilisateur non authentifié' },
        { status: 401 }
      );  }

   if (user.role !== 'admin') {
    return NextResponse.json(
        { error: 'Permissions insuffisantes. Accès administrateur requis.' },
        { status: 403 }
      );  }

  return { user, error: null };
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
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