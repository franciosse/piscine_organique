
// app/api/admin/courses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { courses, courseChapters, lessons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { withAdminAuth } from '@/app/api/_lib/route-helpers';
import logger from '@/lib/logger/logger';


const updateCourseSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  estimatedDuration: z.number().optional(),
  imageUrl: z.string().url().optional(),
  published: z.string().datetime().nullable().optional(), // ISO date string ou null
});


interface RouteParams {
  id: string;
}

// GET /api/admin/courses/[id] - Récupérer un cours spécifique avec ses chapitres 
export const GET = withAdminAuth(async (req, adminUser, { params }) => {
  try {
      const resolvedParams = await params;
      const courseId = parseInt(resolvedParams.id);
      
      if (isNaN(courseId)) {
        return NextResponse.json(
          { error: 'ID de cours invalide' },
          { status: 400 }
        );
      }

    // Récupérer le cours avec ses chapitres et leçons
    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (course.length === 0) {
      return NextResponse.json(
        { error: 'Cours non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer les chapitres avec leurs leçons
    const chaptersWithLessons = await db
      .select({
        id: courseChapters.id,
        title: courseChapters.title,
        description: courseChapters.description,
        position: courseChapters.position,
        published: courseChapters.published,
        lessons: {
          id: lessons.id,
          title: lessons.title,
          slug: lessons.slug,
          position: lessons.position,
          duration: lessons.duration,
          published: lessons.published,
        }
      })
      .from(courseChapters)
      .leftJoin(lessons, eq(courseChapters.id, lessons.chapterId))
      .where(eq(courseChapters.courseId, courseId))
      .orderBy(courseChapters.position, lessons.position);

    // Organiser les données
    const chaptersMap = new Map();
    chaptersWithLessons.forEach(row => {
      if (!chaptersMap.has(row.id)) {
        chaptersMap.set(row.id, {
          id: row.id,
          title: row.title,
          description: row.description,
          position: row.position,
          published: row.published,
          lessons: []
        });
      }

      if (row.lessons !== null && row.lessons.id) {
        chaptersMap.get(row.id).lessons.push(row.lessons);
      }
    });

    const courseWithDetails = {
      ...course[0],
      price: course[0].price / 100, // Convertir en euros
      chapters: Array.from(chaptersMap.values())
    };

    return NextResponse.json({ course: courseWithDetails });
  } catch (error) {
    logger.error('Erreur lors de la récupération du cours:'+ error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: error instanceof Error && error.message.includes('auth') ? 401 : 500 }
    );
  }
});

//mise à jour
export const PATCH = withAdminAuth(async (request, adminUser, { params }) => {
  try {
    const resolvedParams = await params;
    const courseId = parseInt(resolvedParams.id);
    const body = await request.json();

    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'ID de cours invalide' },
        { status: 400 }
      );
    }

    // Validation des données
    const validatedData = updateCourseSchema.parse(body);

    // Préparer les données à mettre à jour
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (validatedData.title) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.price !== undefined) updateData.price = Math.round(validatedData.price * 100);
    if (validatedData.difficultyLevel) updateData.difficultyLevel = validatedData.difficultyLevel;
    if (validatedData.estimatedDuration !== undefined) updateData.estimatedDuration = validatedData.estimatedDuration;
    if (validatedData.imageUrl !== undefined) updateData.imageUrl = validatedData.imageUrl;
    if (validatedData.published !== undefined) {
      updateData.published = validatedData.published ? new Date(validatedData.published) : null;
    }

    // Mettre à jour le cours
    const [updatedCourse] = await db
      .update(courses)
      .set(updateData)
      .where(eq(courses.id, courseId))
      .returning();

    if (!updatedCourse) {
      return NextResponse.json(
        { error: 'Cours non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      course: {
        ...updatedCourse,
        price: updatedCourse.price / 100, // Convertir en euros
      },
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du cours:'+ error);
    
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

// DELETE /api/admin/courses/[id] - Supprimer un cours
export const DELETE = withAdminAuth(async (request, adminUser, { params }) => {
  try {
    const resolvedParams = await params;
    const courseId = parseInt(resolvedParams.id);

    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'ID de cours invalide' },
        { status: 400 }
      );
    }

    // Vérifier si le cours existe
    const course = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (course.length === 0) {
      return NextResponse.json(
        { error: 'Cours non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer le cours (cascade sur les chapitres et leçons)
    await db.delete(courses).where(eq(courses.id, courseId));

    return NextResponse.json({
      success: true,
      message: 'Cours supprimé avec succès',
    });
  } catch (error) {
    logger.error('Erreur lors de la suppression du cours:'+ error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: error instanceof Error && error.message.includes('auth') ? 401 : 500 }
    );
  }
});