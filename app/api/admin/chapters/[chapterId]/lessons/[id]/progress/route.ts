
// app/api/lessons/[lessonId]/progress/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { lessons, studentProgress, users, coursePurchases, courseChapters } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthenticatedUser } from '../../../../../getAuthenticatedUserHelper'; 

interface RouteParams {
  params: { lessonId: string };
}

// PATCH /api/lessons/[lessonId]/progress - Mettre à jour le progrès d'une leçon
export async function PATCH(request: NextRequest, context : any) {
  const { params } = context as { params: { chapterId: string, lessonId: string } };

  try {
    const user = await getAuthenticatedUser(request);
    const lessonId = parseInt(params.lessonId);
    const body = await request.json();

    if (isNaN(lessonId)) {
      return NextResponse.json(
        { error: 'ID de leçon invalide' },
        { status: 400 }
      );
    }

    // Récupérer la leçon et vérifier l'accès
    const lesson = await db
      .select({
        id: lessons.id,
        courseId: courseChapters.courseId,
      })
      .from(lessons)
      .innerJoin(courseChapters, eq(lessons.chapterId, courseChapters.id))
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (lesson.length === 0) {
      return NextResponse.json(
        { error: 'Leçon non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur a accès au cours
    const purchase = await db
      .select({ id: coursePurchases.id })
      .from(coursePurchases)
      .where(and(
        eq(coursePurchases.userId, user.id),
        eq(coursePurchases.courseId, lesson[0].courseId)
      ))
      .limit(1);

    if (purchase.length === 0) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas accès à ce cours' },
        { status: 403 }
      );
    }

    const { completed, watchTime } = body;

    // Mettre à jour ou créer le progrès
    const existingProgress = await db
      .select({ id: studentProgress.id })
      .from(studentProgress)
      .where(and(
        eq(studentProgress.userId, user.id),
        eq(studentProgress.lessonId, lessonId)
      ))
      .limit(1);

    if (existingProgress.length > 0) {
      // Mettre à jour
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (typeof completed === 'boolean') {
        updateData.completed = completed;
        if (completed) {
          updateData.completedAt = new Date();
        }
      }

      if (typeof watchTime === 'number' && watchTime >= 0) {
        updateData.watchTime = watchTime;
      }

      await db
        .update(studentProgress)
        .set(updateData)
        .where(eq(studentProgress.id, existingProgress[0].id));
    } else {
      // Créer un nouveau progrès
      await db.insert(studentProgress).values({
        userId: user.id,
        courseId: lesson[0].courseId,
        lessonId,
        completed: completed || false,
        completedAt: completed ? new Date() : null,
        watchTime: watchTime || 0,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Progrès mis à jour',
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du progrès:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: error instanceof Error && error.message.includes('auth') ? 401 : 500 }
    );
  }
}