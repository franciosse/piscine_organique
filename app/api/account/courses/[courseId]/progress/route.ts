// app/api/account/courses/[courseId]/progress/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle'; // Votre instance Drizzle
import { 
  courseChapters, 
  lessons, 
  studentProgress, 
  coursePurchases, 
  courses 
} from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { withUserAuth } from '@/app/api/_lib/route-helpers';
import logger from '@/lib/logger/logger';


interface RouteParams {
  courseId: string ;
}


// GET /api/account/courses/[courseId]/progress - Récupérer le progrès de l'étudiant
export const GET = withUserAuth(async (request, user, { params }) => {
  const resolvedParams = await params;
  const courseId = parseInt(resolvedParams.courseId);
  logger.debug('Get Course progress. CourseId:' + courseId);
  try {

    logger.info('CourseId :' + courseId);
    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'ID de cours invalide' },
        { status: 400 }
      );
    }
    logger.info('CourseId valide:' + courseId);
    const courseInfo = await db
      .select({ 
        id: courses.id, 
        price: courses.price,
        isPublished: courses.published 
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (courseInfo.length === 0) {
      return NextResponse.json(
        { error: 'Cours non trouvé' },
        { status: 404 }
      );
    }

    const course = courseInfo[0];

    // Vérifier que l'utilisateur a accès au cours
    if (course.price > 0) {
      const purchase = await db
          .select({ id: coursePurchases.id })
          .from(coursePurchases)
          .where(and(
            eq(coursePurchases.userId, user.id),
            eq(coursePurchases.courseId, courseId)
          ))
          .limit(1);

        if (purchase.length === 0) {
          return NextResponse.json(
            { error: 'Vous n\'avez pas accès à ce cours' },
            { status: 403 }
          );
        }
      }

    // Récupérer les statistiques de progrès
    const progressStats = await db
      .select({
        totalLessons: sql<number>`COUNT(DISTINCT ${lessons.id})`.as('total_lessons'),
        completedLessons: sql<number>`COUNT(DISTINCT CASE WHEN ${studentProgress.completed} = true THEN ${studentProgress.lessonId} END)`.as('completed_lessons'),
        totalWatchTime: sql<number>`COALESCE(SUM(${studentProgress.watchTime}), 0)`.as('total_watch_time'),
      })
      .from(lessons)
      .innerJoin(courseChapters, eq(lessons.chapterId, courseChapters.id))
      .leftJoin(studentProgress, and(
        eq(studentProgress.lessonId, lessons.id),
        eq(studentProgress.userId, user.id)
      ))
      .where(and(
        eq(courseChapters.courseId, courseId),
        eq(lessons.published, sql`${lessons.published} IS NOT NULL`)
      ))
      .groupBy();

    const stats = progressStats[0] || { totalLessons: 0, completedLessons: 0, totalWatchTime: 0 };
    
    const completionPercentage = stats.totalLessons > 0 
      ? Math.round((stats.completedLessons / stats.totalLessons) * 100)
      : 0;

    // Récupérer le progrès détaillé par leçon
    const detailedProgress = await db
      .select({
        lessonId: lessons.id,
        lessonTitle: lessons.title,
        chapterTitle: courseChapters.title,
        completed: studentProgress.completed,
        completedAt: studentProgress.completedAt,
        watchTime: studentProgress.watchTime,
      })
      .from(lessons)
      .innerJoin(courseChapters, eq(lessons.chapterId, courseChapters.id))
      .leftJoin(studentProgress, and(
        eq(studentProgress.lessonId, lessons.id),
        eq(studentProgress.userId, user.id)
      ))
      .where(and(
        eq(courseChapters.courseId, courseId),
        eq(lessons.published, sql`${lessons.published} IS NOT NULL`)
      ))
      .orderBy(courseChapters.position, lessons.position);

    return NextResponse.json({
      progress: {
        totalLessons: stats.totalLessons,
        completedLessons: stats.completedLessons,
        completionPercentage,
        totalWatchTime: stats.totalWatchTime,
        lastAccessed: new Date(), // À améliorer avec une vraie date
      },
      lessons: detailedProgress,
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération du progrès:'+ error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: error instanceof Error && error.message.includes('auth') ? 401 : 500 }
    );
  }
});
