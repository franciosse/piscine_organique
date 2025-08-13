// =============================================================================
// METTEZ À JOUR : app/api/user/purchased-courses/route.ts
// Récupérer tous les cours achetés (avec votre auth personnalisé)
// =============================================================================

import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, coursePurchases, courses } from '@/lib/db/schema';
import { getSession, setSession } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Récupérer les cours achetés par l'utilisateur
    const purchasedCourses = await db
      .select({
        courseId: coursePurchases.courseId,
        purchaseDate: coursePurchases.purchasedAt,
        course: {
          id: courses.id,
          title: courses.title,
          price: courses.price,
          imageUrl: courses.imageUrl,
        }
      })
      .from(coursePurchases)
      .innerJoin(courses, eq(coursePurchases.courseId, courses.id))
      .where(eq(coursePurchases.userId, userId))
      .orderBy(coursePurchases.purchasedAt);

    // Extraire juste les IDs pour compatibilité avec le code existant
    const courseIds = purchasedCourses.map(purchase => purchase.courseId);

    return NextResponse.json({
      success: true,
      courseIds,
      purchasedCourses, // Données détaillées si besoin
      count: courseIds.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des cours achetés:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        courseIds: [] // Fallback pour éviter les erreurs côté client
      },
      { status: 500 }
    );
  }
}