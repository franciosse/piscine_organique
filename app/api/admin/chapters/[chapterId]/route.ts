
// app/api/admin/chapters/[chapterId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle'; // Votre instance Drizzle
import { courseChapters, lessons, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { withAdminAuth } from '@/app/api/_lib/route-helpers';
import logger from '@/lib/logger/logger';



const updateChapterSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  published: z.boolean().optional(), // ISO date string ou null
});

interface RouteParams {
  chapterId: string ;
}

// GET /api/admin/chapters/[chapterId] - Récupérer un chapitre avec ses leçons
export const GET = withAdminAuth(async (request, adminUser, { params }) => {
  const resolvedParams = await params;
  const chapterId = parseInt(resolvedParams.chapterId);

  try {

    if (isNaN(chapterId)) {
      return NextResponse.json(
        { error: 'ID de chapitre invalide' },
        { status: 400 }
      );
    }

    // Récupérer le chapitre
    const chapter = await db
      .select()
      .from(courseChapters)
      .where(eq(courseChapters.id, chapterId))
      .limit(1);

    if (chapter.length === 0) {
      return NextResponse.json(
        { error: 'Chapitre non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer les leçons du chapitre
    const chapterLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.chapterId, chapterId))
      .orderBy(lessons.position);

    const chapterWithLessons = {
      ...chapter[0],
      lessons: chapterLessons,
    };

    return NextResponse.json({ chapter: chapterWithLessons });
  } catch (error) {
    logger.error('Erreur lors de la récupération du chapitre:' + error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: error instanceof Error && error.message.includes('auth') ? 401 : 500 }
    );
  }
});

// PATCH /api/admin/chapters/[chapterId] - Mettre à jour un chapitre
export const PATCH = withAdminAuth(async (request, adminUser, { params }) => {
  const resolvedParams = await params;
  const chapterId = parseInt(resolvedParams.chapterId);

  try {
    const body = await request.json();

    if (isNaN(chapterId)) {
      return NextResponse.json(
        { error: 'ID de chapitre invalide' },
        { status: 400 }
      );
    }
    logger.info(body);

    // Validation des données
    const validatedData = updateChapterSchema.parse(body);

    // Préparer les données à mettre à jour
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (validatedData.title) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.published !== undefined) {
      updateData.published = validatedData.published ? new Date() : null;
    }

    // Mettre à jour le chapitre
    const [updatedChapter] = await db
      .update(courseChapters)
      .set(updateData)
      .where(eq(courseChapters.id, chapterId))
      .returning();

    if (!updatedChapter) {
      return NextResponse.json(
        { error: 'Chapitre non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      chapter: updatedChapter,
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du chapitre:'+ error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: error instanceof Error && error.message.includes('auth') ? 401 : 500 }
    );
  }
});

// DELETE /api/admin/chapters/[chapterId] - Supprimer un chapitre
export const DELETE = withAdminAuth(async (request, adminUser, { params }) => {

  const resolvedParams = await params;
  const chapterId = parseInt(resolvedParams.chapterId);

  try {
    if (isNaN(chapterId)) {
      return NextResponse.json(
        { error: 'ID de chapitre invalide' },
        { status: 400 }
      );
    }

    // Vérifier si le chapitre existe
    const chapter = await db
      .select({ id: courseChapters.id, position: courseChapters.position, courseId: courseChapters.courseId })
      .from(courseChapters)
      .where(eq(courseChapters.id, chapterId))
      .limit(1);

    if (chapter.length === 0) {
      return NextResponse.json(
        { error: 'Chapitre non trouvé' },
        { status: 404 }
      );
    }

    const deletedChapter = chapter[0];

    // Supprimer le chapitre et réorganiser les positions
    await db.transaction(async (tx) => {
      // Supprimer le chapitre
      await tx.delete(courseChapters).where(eq(courseChapters.id, chapterId));

      // Mettre à jour les positions des autres chapitres
      const remainingChapters = await tx
        .select()
        .from(courseChapters)
        .where(eq(courseChapters.courseId, deletedChapter.courseId))
        .orderBy(courseChapters.position);

      // Réassigner les positions
      for (let i = 0; i < remainingChapters.length; i++) {
        await tx
          .update(courseChapters)
          .set({ position: i + 1, updatedAt: new Date() })
          .where(eq(courseChapters.id, remainingChapters[i].id));
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Chapitre supprimé avec succès',
    });
  } catch (error) {
    logger.error('Erreur lors de la suppression du chapitre:'+ error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: error instanceof Error && error.message.includes('auth') ? 401 : 500 }
    );
  }
});