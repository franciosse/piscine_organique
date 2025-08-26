// /app/api/auth/auto-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, coursePurchases } from '@/lib/db/schema';
import { setSession } from '@/lib/auth/session';
import logger from '@/lib/logger/logger';


const autoLoginSchema = z.object({
  userId: z.number(),
  userEmail : z.string(),
  sessionId: z.string().optional(), // Session Stripe pour validation
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = autoLoginSchema.parse(body);

    logger.info('🔐 Tentative de connexion automatique pour utilisateur:' + data.userId);

    // Vérifier que l'utilisateur existe
    let user;
    if (data.userId) {
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, data.userId))
        .limit(1);
    } else if (data.userEmail) {
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, data.userEmail))
        .limit(1);
    }
    
    if (!user) {
      logger.error('❌ Utilisateur introuvable:' + data.userId);
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    // Validation supplémentaire avec la session Stripe si fournie
    if (data.sessionId) {
      const purchase = await db
        .select()
        .from(coursePurchases)
        .where(
          eq(coursePurchases.stripeSessionId, data.sessionId)
        )
        .limit(1);

      if (purchase.length === 0 || purchase[0].userId !== data.userId) {
        logger.error('❌ Session Stripe invalide ou utilisateur non correspondant');
        return NextResponse.json(
          { error: 'Session invalide' },
          { status: 403 }
        );
      }
    }

    // ✅ Créer la session utilisateur
    await setSession(user);

    logger.info('✅ Connexion automatique réussie pour:' + user.email);

    return NextResponse.json({
      success: true,
      message: 'Connexion automatique réussie',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

  } catch (error: any) {
    logger.error('❌ Erreur lors de la connexion automatique:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la connexion automatique' },
      { status: 500 }
    );
  }
}