// app/api/admin/courses/[id]/chapters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle'; // Votre instance Drizzle
import { courses, courseChapters, users } from '@/lib/db/schema';
import { eq, max } from 'drizzle-orm';
import { z } from 'zod';
import { checkAdminPermission } from '../../../checkPermissionsHelper'; // Assurez-vous que ce chemin est correct

const createChapterSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
});

const reorderChaptersSchema = z.object({
  chapters: z.array(z.object({
    id: z.number(),
    position: z.number(),
  })),
});

interface RouteParams {
  params: { id: string };
}

// GET /api/admin/courses/[id]/chapters - Liste les chapitres d'un cours
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await checkAdminPermission(request);
    const courseId = parseInt(params.id);

    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'ID de cours invalide' },
        { status: 400 }
      );
    }

    // Vérifier que le cours existe
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

    // Récupérer les chapitres
    const chapters = await db
      .select()
      .from(courseChapters)
      .where(eq(courseChapters.courseId, courseId))
      .orderBy(courseChapters.position);

    return NextResponse.json({ chapters });
  } catch (error) {
    console.error('Erreur lors de la récupération des chapitres:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: error instanceof Error && error.message.includes('auth') ? 401 : 500 }
    );
  }
}

// POST /api/admin/courses/[id]/chapters - Créer un nouveau chapitre
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await checkAdminPermission(request);
    const courseId = parseInt(params.id);
    const body = await request.json();

    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'ID de cours invalide' },
        { status: 400 }
      );
    }

    // Validation des données
    const validatedData = createChapterSchema.parse(body);

    // Vérifier que le cours existe
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

    // Déterminer la position du nouveau chapitre
    const maxPositionResult = await db
      .select({ maxPosition: max(courseChapters.position) })
      .from(courseChapters)
      .where(eq(courseChapters.courseId, courseId));

    const nextPosition = (maxPositionResult[0]?.maxPosition || 0) + 1;

    // Créer le chapitre
    const [newChapter] = await db
      .insert(courseChapters)
      .values({
        courseId,
        title: validatedData.title,
        description: validatedData.description,
        position: nextPosition,
      })
      .returning();

    return NextResponse.json({
      success: true,
      chapter: newChapter,
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création du chapitre:', error);
    
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
}

// PUT /api/admin/courses/[id]/chapters/reorder - Réorganiser les chapitres
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await checkAdminPermission(request);
    const courseId = parseInt(params.id);
    const body = await request.json();

    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'ID de cours invalide' },
        { status: 400 }
      );
    }

    // Validation des données
    const validatedData = reorderChaptersSchema.parse(body);

    // Mettre à jour les positions
    await db.transaction(async (tx) => {
      for (const chapter of validatedData.chapters) {
        await tx
          .update(courseChapters)
          .set({ 
            position: chapter.position,
            updatedAt: new Date(),
          })
          .where(eq(courseChapters.id, chapter.id));
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Chapitres réorganisés avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la réorganisation des chapitres:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}