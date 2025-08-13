// app/api/user/purchased-courses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session'; // Ajustez le chemin selon votre config
import { db } from '@/lib/db/drizzle'; // Ajustez selon votre configuration DB
import { coursePurchases, courses } from '@/lib/db/schema'; // Ajustez selon votre schéma
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getSession();
    if (!session) {
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
      .where(
        and(
          eq(coursePurchases.userId, userId),
          eq(coursePurchases.status, 'completed') // Seulement les achats confirmés
        )
      )
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