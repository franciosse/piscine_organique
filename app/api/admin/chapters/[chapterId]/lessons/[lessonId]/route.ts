// app/api/admin/chapters/[chapterId]/lessons/[lessonId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  lessons, 
  courseChapters,
  courses,
  lessonAttachments,
  quizzes,
  quizQuestions,
  quizAnswers
} from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { z } from 'zod';
import { withAdminAuth } from '@/app/api/_lib/route-helpers';
import logger from '@/lib/logger/logger';


// --- SCHEMAS ---
const updateLessonSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').optional(),
  content: z.string().optional(),
  videoUrl: z.string().url('URL vidéo invalide').optional().or(z.literal('')),
  duration: z.number().min(0, 'La durée doit être positive').optional(),
  position: z.number().min(1, 'La position doit être supérieure à 0').optional(),
  published: z.boolean().optional(),
});

// Typage correct pour Next.js App Router
interface RouteParams {
  chapterId: string;
  lessonId: string;
}

// --- SLUG GENERATOR ---
async function generateUniqueSlug(title: string, chapterId: number, excludeLessonId?: number): Promise<string> {
  const baseSlug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existingLesson = await db
      .select({ id: lessons.id })
      .from(lessons)
      .where(
        and(
          eq(lessons.slug, slug), 
          eq(lessons.chapterId, chapterId),
          ...(excludeLessonId ? [ne(lessons.id, excludeLessonId)] : [])
        )
      )
      .limit(1);

    if (existingLesson.length === 0) break;
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

// --- GET LESSON WITH FULL DETAILS ---
export const GET = withAdminAuth(async (req, adminUser, { params }) => {
  const resolvedParams = await params;
  const chapterId = parseInt(resolvedParams.chapterId);
  const lessonId = parseInt(resolvedParams.lessonId);

  if (isNaN(chapterId) || isNaN(lessonId)) {
    return NextResponse.json(
      { error: 'ID de chapitre ou de leçon invalide' },
      { status: 400 }
    );
  }

  try {
    // 1. Récupérer la leçon avec les infos du chapitre et du cours
    const lessonWithChapter = await db
      .select({
        // Champs de la leçon
        id: lessons.id,
        title: lessons.title,
        slug: lessons.slug,
        content: lessons.content,
        videoUrl: lessons.videoUrl,
        position: lessons.position,
        duration: lessons.duration,
        published: lessons.published,
        chapterId: lessons.chapterId,
        createdAt: lessons.createdAt,
        updatedAt: lessons.updatedAt,
        // Champs du chapitre
        chapterTitle: courseChapters.title,
        chapterDescription: courseChapters.description,
        // Champs du cours
        courseId: courses.id,
        courseTitle: courses.title,
        courseSlug: courses.slug,
      })
      .from(lessons)
      .innerJoin(courseChapters, eq(lessons.chapterId, courseChapters.id))
      .innerJoin(courses, eq(courseChapters.courseId, courses.id))
      .where(
        and(
          eq(lessons.id, lessonId),
          eq(lessons.chapterId, chapterId)
        )
      )
      .limit(1);

    if (lessonWithChapter.length === 0) {
      return NextResponse.json(
        { error: 'Leçon introuvable' },
        { status: 404 }
      );
    }

    const lessonData = lessonWithChapter[0];

    // 2. Récupérer les attachments
    const attachments = await db
      .select()
      .from(lessonAttachments)
      .where(eq(lessonAttachments.lessonId, lessonId))
      .orderBy(lessonAttachments.createdAt);

    // 3. Récupérer les quizzes avec leurs questions et réponses
    const quizzesData = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.lessonId, lessonId))
      .orderBy(quizzes.createdAt);

    // 4. Pour chaque quiz, récupérer ses questions et réponses
    const quizzesWithQuestions = await Promise.all(
      quizzesData.map(async (quiz) => {
        // Récupérer les questions du quiz
        const questions = await db
          .select()
          .from(quizQuestions)
          .where(eq(quizQuestions.quizId, quiz.id))
          .orderBy(quizQuestions.position);

        // Pour chaque question, récupérer ses réponses
        const questionsWithAnswers = await Promise.all(
          questions.map(async (question) => {
            const answers = await db
              .select()
              .from(quizAnswers)
              .where(eq(quizAnswers.questionId, question.id))
              .orderBy(quizAnswers.position);

            return {
              ...question,
              answers,
            };
          })
        );

        return {
          ...quiz,
          questions: questionsWithAnswers,
        };
      })
    );

    // 5. Construire la réponse finale
    const lessonWithDetails = {
      id: lessonData.id,
      title: lessonData.title,
      slug: lessonData.slug,
      content: lessonData.content,
      videoUrl: lessonData.videoUrl,
      position: lessonData.position,
      duration: lessonData.duration,
      published: lessonData.published,
      chapterId: lessonData.chapterId,
      createdAt: lessonData.createdAt,
      updatedAt: lessonData.updatedAt,
      // Informations enrichies
      chapter: {
        id: lessonData.chapterId,
        title: lessonData.chapterTitle,
        description: lessonData.chapterDescription,
        courseId: lessonData.courseId,
      },
      course: {
        id: lessonData.courseId,
        title: lessonData.courseTitle,
        slug: lessonData.courseSlug,
      },
      attachments,
      quizzes: quizzesWithQuestions,
    };

    return NextResponse.json(lessonWithDetails);

  } catch (error: any) {
    logger.error('Erreur lors de la récupération de la leçon:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la leçon' },
      { status: 500 }
    );
  }
});

// --- UPDATE LESSON ---
export const PUT = withAdminAuth(async (req, adminUser, { params }) => {
  const resolvedParams = await params;
  const chapterId = parseInt(resolvedParams.chapterId);
  const lessonId = parseInt(resolvedParams.lessonId);

  if (isNaN(chapterId) || isNaN(lessonId)) {
    return NextResponse.json(
      { error: 'ID de chapitre ou de leçon invalide' },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const parsed = updateLessonSchema.parse(body);

    // Vérifier que la leçon existe et appartient au bon chapitre
    const existingLesson = await db
      .select()
      .from(lessons)
      .where(
        and(
          eq(lessons.id, lessonId),
          eq(lessons.chapterId, chapterId)
        )
      )
      .limit(1);

    if (existingLesson.length === 0) {
      return NextResponse.json(
        { error: 'Leçon introuvable' },
        { status: 404 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Ajouter les champs modifiés
    if (parsed.title !== undefined) {
      updateData.title = parsed.title;
      // Générer un nouveau slug si le titre change
      if (parsed.title !== existingLesson[0].title) {
        updateData.slug = await generateUniqueSlug(parsed.title, chapterId, lessonId);
      }
    }

    if (parsed.content !== undefined) {
      updateData.content = parsed.content;
    }

    if (parsed.videoUrl !== undefined) {
      updateData.videoUrl = parsed.videoUrl;
    }

    if (parsed.duration !== undefined) {
      updateData.duration = parsed.duration;
    }

    if (parsed.position !== undefined) {
      updateData.position = parsed.position;
    }

    if (parsed.published !== undefined) {
      updateData.published = parsed.published ? new Date() : null;
    }

    // Effectuer la mise à jour
    const updatedLesson = await db
      .update(lessons)
      .set(updateData)
      .where(
        and(
          eq(lessons.id, lessonId),
          eq(lessons.chapterId, chapterId)
        )
      )
      .returning();

    if (updatedLesson.length === 0) {
      return NextResponse.json(
        { error: 'Échec de la mise à jour de la leçon' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Leçon mise à jour avec succès',
      lesson: updatedLesson[0]
    });

  } catch (error: any) {
    logger.error('Erreur lors de la mise à jour de la leçon:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Données invalides',
          details: error.errors.map(e => ({ 
            field: e.path.join('.'), 
            message: e.message 
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la leçon' },
      { status: 500 }
    );
  }
});

// --- PATCH LESSON (mise à jour partielle) ---
export const PATCH = withAdminAuth(async (req, adminUser, { params }) => {
  const resolvedParams = await params;
  const chapterId = parseInt(resolvedParams.chapterId);
  const lessonId = parseInt(resolvedParams.lessonId);

  if (isNaN(chapterId) || isNaN(lessonId)) {
    return NextResponse.json(
      { error: 'ID de chapitre ou de leçon invalide' },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    
    // Pour PATCH, on permet des mises à jour plus flexibles
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Traiter chaque champ individuellement
    if (body.title) {
      updateData.title = body.title;
      updateData.slug = await generateUniqueSlug(body.title, chapterId, lessonId);
    }

    if (body.content !== undefined) updateData.content = body.content;
    if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl;
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.position !== undefined) updateData.position = body.position;
    
    // Gestion spéciale pour la publication
    if (body.published !== undefined) {
      updateData.published = body.published ? new Date() : null;
    }

    // Actions rapides communes
    if (body.action) {
      switch (body.action) {
        case 'publish':
          updateData.published = new Date();
          break;
        case 'unpublish':
          updateData.published = null;
          break;
        case 'duplicate':
          // Pour la duplication, on retourne une erreur car ça nécessite POST
          return NextResponse.json(
            { error: 'Utilisez POST pour dupliquer une leçon' },
            { status: 400 }
          );
      }
    }

    const updatedLesson = await db
      .update(lessons)
      .set(updateData)
      .where(
        and(
          eq(lessons.id, lessonId),
          eq(lessons.chapterId, chapterId)
        )
      )
      .returning();

    if (updatedLesson.length === 0) {
      return NextResponse.json(
        { error: 'Leçon introuvable ou mise à jour échouée' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Leçon mise à jour avec succès',
      lesson: updatedLesson[0]
    });

  } catch (error: any) {
    logger.error('Erreur PATCH leçon:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour partielle' },
      { status: 500 }
    );
  }
});

// --- DELETE LESSON ---
export const DELETE = withAdminAuth(async (req, adminUser, { params }) => {
  const resolvedParams = await params;
  const chapterId = parseInt(resolvedParams.chapterId);
  const lessonId = parseInt(resolvedParams.lessonId);

  if (isNaN(chapterId) || isNaN(lessonId)) {
    return NextResponse.json(
      { error: 'ID de chapitre ou de leçon invalide' },
      { status: 400 }
    );
  }

  try {
    // Vérifier que la leçon existe
    const existingLesson = await db
      .select()
      .from(lessons)
      .where(
        and(
          eq(lessons.id, lessonId),
          eq(lessons.chapterId, chapterId)
        )
      )
      .limit(1);

    if (existingLesson.length === 0) {
      return NextResponse.json(
        { error: 'Leçon introuvable' },
        { status: 404 }
      );
    }

    // Supprimer la leçon (les cascades devraient gérer les dépendances)
    await db
      .delete(lessons)
      .where(
        and(
          eq(lessons.id, lessonId),
          eq(lessons.chapterId, chapterId)
        )
      );

    // Optionnel : Réorganiser les positions des leçons restantes
    const remainingLessons = await db
      .select({ id: lessons.id, position: lessons.position })
      .from(lessons)
      .where(eq(lessons.chapterId, chapterId))
      .orderBy(lessons.position);

    // Réajuster les positions pour éviter les trous
    for (let i = 0; i < remainingLessons.length; i++) {
      const lesson = remainingLessons[i];
      if (lesson.position !== i + 1) {
        await db
          .update(lessons)
          .set({ position: i + 1 })
          .where(eq(lessons.id, lesson.id));
      }
    }

    return NextResponse.json({
      success: true,
      message: `Leçon "${existingLesson[0].title}" supprimée avec succès`
    });

  } catch (error: any) {
    logger.error('Erreur lors de la suppression de la leçon:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la leçon' },
      { status: 500 }
    );
  }
});