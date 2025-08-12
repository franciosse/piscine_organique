// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  users, 
  courses, 
  coursePurchases, 
  studentProgress, 
  courseChapters, 
  lessons 
} from '@/lib/db/schema';
import { eq, sql, and } from 'drizzle-orm';

// Helper pour récupérer l'utilisateur authentifié
async function getAuthenticatedUser(request: NextRequest) {
  const userId = request.headers.get('x-user-id'); // Adaptez selon votre système d'auth
  if (!userId) {
    throw new Error('Non authentifié');
  }

  const user = await db.select().from(users).where(eq(users.id, parseInt(userId))).limit(1);
  if (!user[0]) {
    throw new Error('Utilisateur non trouvé');
  }

  return user[0];
}

// GET /api/dashboard - Récupérer les données du dashboard
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    // Récupérer tous les cours achetés par l'utilisateur
    const purchasedCoursesData = await db
      .select({
        // Données du cours
        courseId: courses.id,
        title: courses.title,
        description: courses.description,
        price: courses.price,
        imageUrl: courses.imageUrl,
        difficultyLevel: courses.difficultyLevel,
        estimatedDuration: courses.estimatedDuration,
        published: courses.published,
        slug: courses.slug,
        stripePriceId: courses.stripePriceId,
        authorId: courses.authorId,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
        // Données d'achat
        purchasedAt: coursePurchases.purchasedAt,
      })
      .from(coursePurchases)
      .innerJoin(courses, eq(coursePurchases.courseId, courses.id))
      .where(eq(coursePurchases.userId, user.id))
      .orderBy(coursePurchases.purchasedAt);

    // Pour chaque cours acheté, calculer le progrès
    const coursesWithProgress = await Promise.all(
      purchasedCoursesData.map(async (courseData) => {
        // Compter le nombre total de leçons publiées dans le cours
        const totalLessonsResult = await db
          .select({ count: sql<number>`COUNT(*)`.as('count') })
          .from(lessons)
          .innerJoin(courseChapters, eq(lessons.chapterId, courseChapters.id))
          .where(and(
            eq(courseChapters.courseId, courseData.courseId),
            sql`${lessons.published} IS NOT NULL`
          ));

        const totalLessons = totalLessonsResult[0]?.count || 0;

        // Compter le nombre de leçons complétées par l'utilisateur
        const completedLessonsResult = await db
          .select({ count: sql<number>`COUNT(*)`.as('count') })
          .from(studentProgress)
          .innerJoin(lessons, eq(studentProgress.lessonId, lessons.id))
          .innerJoin(courseChapters, eq(lessons.chapterId, courseChapters.id))
          .where(and(
            eq(courseChapters.courseId, courseData.courseId),
            eq(studentProgress.userId, user.id),
            eq(studentProgress.completed, true)
          ));

        const completedLessons = completedLessonsResult[0]?.count || 0;

        // Calculer le temps total de visionnage
        const watchTimeResult = await db
          .select({ 
            totalWatchTime: sql<number>`COALESCE(SUM(${studentProgress.watchTime}), 0)`.as('totalWatchTime') 
          })
          .from(studentProgress)
          .innerJoin(lessons, eq(studentProgress.lessonId, lessons.id))
          .innerJoin(courseChapters, eq(lessons.chapterId, courseChapters.id))
          .where(and(
            eq(courseChapters.courseId, courseData.courseId),
            eq(studentProgress.userId, user.id)
          ));

        const totalWatchTime = watchTimeResult[0]?.totalWatchTime || 0;

        // Récupérer la dernière date d'accès
        const lastAccessResult = await db
          .select({ lastAccess: sql<Date>`MAX(${studentProgress.updatedAt})`.as('lastAccess') })
          .from(studentProgress)
          .innerJoin(lessons, eq(studentProgress.lessonId, lessons.id))
          .innerJoin(courseChapters, eq(lessons.chapterId, courseChapters.id))
          .where(and(
            eq(courseChapters.courseId, courseData.courseId),
            eq(studentProgress.userId, user.id)
          ));

        const lastAccess = lastAccessResult[0]?.lastAccess;

        const completionPercentage = totalLessons > 0 
          ? Math.round((completedLessons / totalLessons) * 100) 
          : 0;

        return {
          id: courseData.courseId,
          title: courseData.title,
          description: courseData.description,
          price: courseData.price,
          imageUrl: courseData.imageUrl,
          difficultyLevel: courseData.difficultyLevel,
          estimatedDuration: courseData.estimatedDuration,
          published: courseData.published,
          slug: courseData.slug,
          stripePriceId: courseData.stripePriceId,
          authorId: courseData.authorId,
          createdAt: courseData.createdAt,
          updatedAt: courseData.updatedAt,
          progress: {
            completed_lessons: completedLessons,
            total_lessons: totalLessons,
            completion_percentage: completionPercentage,
            total_watch_time: Math.floor(totalWatchTime / 60), // Convertir en minutes
            last_accessed: lastAccess,
          },
        };
      })
    );

    // Calculer les statistiques globales
    const totalCourses = coursesWithProgress.length;
    const completedCourses = coursesWithProgress.filter(
      course => course.progress.completion_percentage === 100
    ).length;
    const inProgressCourses = coursesWithProgress.filter(
      course => course.progress.completion_percentage > 0 && course.progress.completion_percentage < 100
    ).length;
    const totalWatchTime = coursesWithProgress.reduce(
      (sum, course) => sum + course.progress.total_watch_time, 0
    );

    // Récupérer les achats récents
    const recentPurchases = await db
      .select({
        id: coursePurchases.id,
        courseId: coursePurchases.courseId,
        courseTitle: courses.title,
        amount: coursePurchases.amount,
        currency: coursePurchases.currency,
        purchasedAt: coursePurchases.purchasedAt,
      })
      .from(coursePurchases)
      .innerJoin(courses, eq(coursePurchases.courseId, courses.id))
      .where(eq(coursePurchases.userId, user.id))
      .orderBy(sql`${coursePurchases.purchasedAt} DESC`)
      .limit(5);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      purchasedCourses: coursesWithProgress,
      recentPurchases,
      stats: {
        totalCourses,
        completedCourses,
        inProgressCourses,
        totalWatchTime,
      },
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des données du dashboard:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: error instanceof Error && error.message.includes('auth') ? 401 : 500 }
    );
  }
}