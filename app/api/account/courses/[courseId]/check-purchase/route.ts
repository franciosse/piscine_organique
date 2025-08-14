// =============================================================================
// METTEZ À JOUR : app/api/courses/[courseId]/check-purchase/route.ts
// Vérifier l'achat d'un cours (avec votre auth personnalisé)
// =============================================================================

import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, coursePurchases, courses } from '@/lib/db/schema';
import { getSession, setSession } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';

interface RouteParams {
  params: { courseId: string };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié', purchased: false },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const courseId = parseInt(params.courseId);

    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'ID de cours invalide', purchased: false },
        { status: 400 }
      );
    }

    // Vérifier si le cours existe et est publié
    const course = await db
      .select({
        id: courses.id,
        price: courses.price,
        published: courses.published,
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (course.length === 0) {
      return NextResponse.json(
        { error: 'Cours introuvable', purchased: false },
        { status: 404 }
      );
    }

    // Si le cours est gratuit, considérer comme "acheté"
    if (course[0].price === 0) {
      return NextResponse.json({
        success: true,
        purchased: true,
        reason: 'free_course'
      });
    }

    // Vérifier si l'utilisateur a acheté le cours
    const purchase = await db
      .select({
        id: coursePurchases.id,
        createdAt: coursePurchases.purchasedAt,
      })
      .from(coursePurchases)
      .where(
        and(
          eq(coursePurchases.userId, userId),
          eq(coursePurchases.courseId, courseId)
        )
      )
      .limit(1);

    const isPurchased = purchase.length > 0;

    return NextResponse.json({
      success: true,
      purchased: isPurchased,
      courseId,
      purchaseInfo: isPurchased ? {
        purchaseDate: purchase[0].createdAt,
      } : null
    });

  } catch (error) {
    console.error('Erreur lors de la vérification de l\'achat:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        purchased: false 
      },
      { status: 500 }
    );
  }
}