// app/api/account/courses/[courseId]/chapters/[chapterId]/lessons/[lessonId]/progress/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { lessons, studentProgress, users, coursePurchases, courseChapters } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { withUserAuth } from '@/app/api/_lib/route-helpers';
import logger from '@/lib/logger/logger';


interface RouteParams {
  courseId: string;
  chapterId: string;
  lessonId: string;
}

interface ProgressUpdateBody {
  completed?: boolean;
  watchTime?: number;
}

// PATCH /api/account/courses/[courseId]/chapters/[chapterId]/lessons/[lessonId]/progress
// Mettre à jour le progrès d'une leçon spécifique
export const PATCH = withUserAuth(async (request: NextRequest, user, { params }) => {
  try {
    const resolvedParams = await params as RouteParams;
    const courseId = parseInt(resolvedParams.courseId);
    const chapterId = parseInt(resolvedParams.chapterId);
    const lessonId = parseInt(resolvedParams.lessonId);

    // Validation des paramètres
    if (isNaN(courseId) || isNaN(chapterId) || isNaN(lessonId)) {
      return NextResponse.json(
        { error: 'Paramètres de route invalides' },
        { status: 400 }
      );
    }

    const body: ProgressUpdateBody = await request.json();
    const { completed, watchTime } = body;

    // Validation du body
    if (completed !== undefined && typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'Le paramètre completed doit être un booléen' },
        { status: 400 }
      );
    }

    if (watchTime !== undefined && (typeof watchTime !== 'number' || watchTime < 0)) {
      return NextResponse.json(
        { error: 'Le paramètre watchTime doit être un nombre positif' },
        { status: 400 }
      );
    }

    // Vérifier que la leçon existe et appartient bien au chapitre et au cours spécifiés
    const lesson = await db
      .select({
        id: lessons.id,
        title: lessons.title,
        chapterId: lessons.chapterId,
        courseId: courseChapters.courseId,
      })
      .from(lessons)
      .innerJoin(courseChapters, eq(lessons.chapterId, courseChapters.id))
      .where(and(
        eq(lessons.id, lessonId),
        eq(lessons.chapterId, chapterId),
        eq(courseChapters.courseId, courseId)
      ))
      .limit(1);

    if (lesson.length === 0) {
      return NextResponse.json(
        { error: 'Leçon non trouvée ou paramètres de route incorrects' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur a accès au cours
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

    // Vérifier si un progrès existe déjà
    const existingProgress = await db
      .select({ 
        id: studentProgress.id,
        completed: studentProgress.completed,
        watchTime: studentProgress.watchTime
      })
      .from(studentProgress)
      .where(and(
        eq(studentProgress.userId, user.id),
        eq(studentProgress.lessonId, lessonId)
      ))
      .limit(1);

    if (existingProgress.length > 0) {
      // Mettre à jour le progrès existant
      const updateData: Partial<typeof studentProgress.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (completed !== undefined) {
        updateData.completed = completed;
        if (completed) {
          updateData.completedAt = new Date();
        } else {
          updateData.completedAt = null;
        }
      }

      if (watchTime !== undefined) {
        updateData.watchTime = watchTime;
      }

      await db
        .update(studentProgress)
        .set(updateData)
        .where(eq(studentProgress.id, existingProgress[0].id));

      return NextResponse.json({
        success: true,
        message: 'Progrès mis à jour avec succès',
        progress: {
          completed: completed ?? existingProgress[0].completed,
          watchTime: watchTime ?? existingProgress[0].watchTime
        }
      });
    } else {
      // Créer un nouveau progrès
      const newProgress = await db.insert(studentProgress).values({
        userId: user.id,
        courseId: courseId,
        lessonId: lessonId,
        completed: completed || false,
        completedAt: completed ? new Date() : null,
        watchTime: watchTime || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      return NextResponse.json({
        success: true,
        message: 'Progrès créé avec succès',
        progress: {
          completed: completed || false,
          watchTime: watchTime || 0
        }
      }, { status: 201 });
    }

  } catch (error) {
    logger.error('Erreur lors de la mise à jour du progrès:'+ error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
});

// GET /api/account/courses/[courseId]/chapters/[chapterId]/lessons/[lessonId]/progress
// Récupérer le progrès d'une leçon spécifique
export const GET = withUserAuth(async (request: NextRequest, user, { params }) => {
  try {
    const resolvedParams = await params as RouteParams;
    const courseId = parseInt(resolvedParams.courseId);
    const chapterId = parseInt(resolvedParams.chapterId);
    const lessonId = parseInt(resolvedParams.lessonId);

    // Validation des paramètres
    if (isNaN(courseId) || isNaN(chapterId) || isNaN(lessonId)) {
      return NextResponse.json(
        { error: 'Paramètres de route invalides' },
        { status: 400 }
      );
    }

    // Vérifier que la leçon existe et appartient bien au chapitre et au cours spécifiés
    const lesson = await db
      .select({
        id: lessons.id,
        title: lessons.title,
      })
      .from(lessons)
      .innerJoin(courseChapters, eq(lessons.chapterId, courseChapters.id))
      .where(and(
        eq(lessons.id, lessonId),
        eq(lessons.chapterId, chapterId),
        eq(courseChapters.courseId, courseId)
      ))
      .limit(1);

    if (lesson.length === 0) {
      return NextResponse.json(
        { error: 'Leçon non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier l'accès au cours
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

    // Récupérer le progrès
    const progress = await db
      .select({
        id: studentProgress.id,
        completed: studentProgress.completed,
        completedAt: studentProgress.completedAt,
        watchTime: studentProgress.watchTime,
        createdAt: studentProgress.createdAt,
        updatedAt: studentProgress.updatedAt,
      })
      .from(studentProgress)
      .where(and(
        eq(studentProgress.userId, user.id),
        eq(studentProgress.lessonId, lessonId)
      ))
      .limit(1);

    if (progress.length === 0) {
      return NextResponse.json({
        progress: {
          completed: false,
          completedAt: null,
          watchTime: 0,
          exists: false
        }
      });
    }

    return NextResponse.json({
      progress: {
        ...progress[0],
        exists: true
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération du progrès:'+ error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
});