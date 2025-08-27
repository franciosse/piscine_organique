// app/api/account/stats/route.ts
import { NextResponse } from 'next/server';
import { withUserAuth } from '@/app/api/_lib/route-helpers';
import { db } from '@/lib/db/drizzle';
import { coursePurchases } from '@/lib/db/schema'; // Ajustez selon votre schéma
import { eq, and, count } from 'drizzle-orm';
import logger from '@/lib/logger/logger';


export const GET = withUserAuth(async (req, authenticatedUser) => {
  try {
    // Récupérer les statistiques de l'utilisateur
    const stats = await Promise.all([
      // Nombre de cours terminés
      db.select({ count: count() })
        .from(coursePurchases)
        .where(
          and(
            eq(coursePurchases.userId, authenticatedUser.id),
            eq(coursePurchases.status, 'completed') // Ajustez selon votre schéma
          )
        ),
      
      // Nombre total de cours inscrits
      db.select({ count: count() })
        .from(coursePurchases)
        .where(eq(coursePurchases.userId, authenticatedUser.id)),
      
      // Moyenne des notes (si vous avez un système de notes)
      // db.select({ avg: avg(coursePurchases.grade) })
      //   .from(coursePurchases)
      //   .where(
      //     and(
      //       eq(coursePurchases.userId, authenticatedUser.id),
      //       isNotNull(coursePurchases.grade)
      //     )
      //   ),
    ]);

    const [completedCoursesResult, totalCoursesResult] = stats;

    const userStats = {
      completedCourses: completedCoursesResult[0]?.count || 0,
      totalCourses: totalCoursesResult[0]?.count || 0,
      // averageGrade: averageGradeResult[0]?.avg || null,
    };

    return NextResponse.json({
      user: userStats,
      message: 'Statistiques récupérées avec succès'
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des statistiques:'+ error);
    return NextResponse.json(
      { error: 'Impossible de récupérer les statistiques' },
      { status: 500 }
    );
  }
});