// /app/api/account/user/route.ts - Fix Edge Runtime
import { NextRequest, NextResponse } from 'next/server';
import { getSession, getUser } from '@/lib/auth/session';
import logger from '@/lib/logger/logger';


// ✅ Forcer l'utilisation du Node.js runtime (pas Edge)
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    logger.info('📋 API /account/user appelée');

    // Récupérer la session
    const session = await getSession();
    
    if (!session) {
      logger.info('❌ Aucune session trouvée');
      return NextResponse.json(
        { error: 'Non authentifié', user: null },
        { status: 401 }
      );
    }

    logger.info('✅ Session trouvée pour utilisateur:'+ session.user.id);

    // Récupérer les données complètes de l'utilisateur
    const user = await getUser();
    
    if (!user) {
      logger.info('❌ Utilisateur introuvable en base');
      return NextResponse.json(
        { error: 'Utilisateur introuvable', user: null },
        { status: 404 }
      );
    }

    logger.info('✅ Utilisateur récupéré:'+ user.email);

    // Retourner les données utilisateur (sans le mot de passe)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    logger.error('❌ Erreur API /account/user:'+ error);
    return NextResponse.json(
      { error: 'Erreur serveur', user: null },
      { status: 500 }
    );
  }
}