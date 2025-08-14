// =============================================================================
// METTEZ À JOUR : app/api/courses/[courseId]/enroll/route.ts
// Inscription gratuite (avec votre auth personnalisé)
// =============================================================================

import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, coursePurchases, courses } from '@/lib/db/schema';
import { getSession, setSession } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { withUserAuth } from '@/app/api/_lib/route-helpers';

interface RouteParams {
  courseId: string ;
}

export const POST = withUserAuth(async (request, user, { params }) => {
  const resolvedParams = await params;
  const courseId = parseInt(resolvedParams.courseId);
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'ID de cours invalide' },
        { status: 400 }
      );
    }

    // Vérifier que le cours existe et est gratuit
    const course = await db
      .select({
        id: courses.id,
        price: courses.price,
        published: courses.published,
        title: courses.title,
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (course.length === 0) {
      return NextResponse.json(
        { error: 'Cours introuvable' },
        { status: 404 }
      );
    }

    if (!course[0].published) {
      return NextResponse.json(
        { error: 'Ce cours n\'est pas encore disponible' },
        { status: 400 }
      );
    }

    if (course[0].price > 0) {
      return NextResponse.json(
        { error: 'Ce cours n\'est pas gratuit' },
        { status: 400 }
      );
    }

    // Vérifier si déjà inscrit
    const existingPurchase = await db
      .select()
      .from(coursePurchases)
      .where(
        and(
          eq(coursePurchases.userId, userId),
          eq(coursePurchases.courseId, courseId)
        )
      )
      .limit(1);

    if (existingPurchase.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Déjà inscrit à ce cours',
        enrollment: existingPurchase[0]
      });
    }

    // Créer l'inscription
    const newEnrollment = await db
      .insert(coursePurchases)
      .values({
        userId,
        courseId,
        amount: 0,
        currency: 'eur',
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: `Inscription réussie au cours "${course[0].title}"`,
      enrollment: newEnrollment[0]
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
});