
// app/api/admin/users/[userId]/purchases/[courseId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { coursePurchases, courses, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { withAdminAuth } from '@/app/api/_lib/route-helpers';
import logger from '@/lib/logger/logger';

interface RouteParams {
  userId: string;
  courseId: string;
}

// DELETE /api/admin/users/[userId]/purchases/[courseId] - Supprimer un achat
export const DELETE = withAdminAuth(async (request, adminUser, { params }) => {
  try {
    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.userId);
    const courseId = parseInt(resolvedParams.courseId);

    if (isNaN(userId) || isNaN(courseId)) {
      return NextResponse.json(
        { error: 'ID utilisateur ou ID cours invalide' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const user = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que le cours existe
    const course = await db
      .select({ id: courses.id, title: courses.title })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (course.length === 0) {
      return NextResponse.json(
        { error: 'Cours non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que l'achat existe
    const existingPurchase = await db
      .select({ 
        id: coursePurchases.id,
        amount: coursePurchases.amount,
        status: coursePurchases.status
      })
      .from(coursePurchases)
      .where(
        and(
          eq(coursePurchases.userId, userId),
          eq(coursePurchases.courseId, courseId)
        )
      )
      .limit(1);

    if (existingPurchase.length === 0) {
      return NextResponse.json(
        { error: 'Achat non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer l'achat
    const deletedPurchase = await db
      .delete(coursePurchases)
      .where(
        and(
          eq(coursePurchases.userId, userId),
          eq(coursePurchases.courseId, courseId)
        )
      )
      .returning({ id: coursePurchases.id });

    if (deletedPurchase.length === 0) {
      return NextResponse.json(
        { error: 'Échec de la suppression de l\'achat' },
        { status: 500 }
      );
    }

    logger.info(`Admin ${adminUser.email} a supprimé l'achat du cours ${course[0].title} de l'utilisateur ${user[0].email}`);

    return NextResponse.json({
      success: true,
      message: 'Achat supprimé avec succès',
      deletedPurchase: {
        id: deletedPurchase[0].id,
        userId,
        courseId,
        courseTitle: course[0].title,
        userEmail: user[0].email
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la suppression d\'un achat:'+ error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: error instanceof Error && error.message.includes('auth') ? 401 : 500 }
    );
  }
});