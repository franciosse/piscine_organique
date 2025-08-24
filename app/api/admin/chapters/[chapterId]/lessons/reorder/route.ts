// app/api/admin/chapters/[chapterId]/lessons/reorder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { lessons, courseChapters } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { withAdminAuth } from '@/app/api/_lib/route-helpers';
import logger from '@/lib/logger/logger';


// --- SCHEMAS DE VALIDATION ---
const lessonPositionSchema = z.object({
  id: z.number().positive('L\'ID de la leçon doit être un nombre positif'),
  position: z.number().positive('La position doit être un nombre positif'),
});

const reorderLessonsSchema = z.object({
  lessons: z.array(lessonPositionSchema)
    .min(1, 'Au moins une leçon doit être fournie')
    .max(100, 'Pas plus de 100 leçons à la fois'),
});

// Typage pour Next.js App Router
interface RouteParams {
  chapterId: string;
}

// --- VALIDATION MÉTIER ---
const validateLessonsPositions = (lessons: any[]) => {
  const errors: string[] = [];
  const positions = lessons.map(l => l.position);
  const ids = lessons.map(l => l.id);

  // Vérifier que les positions sont consécutives et commencent à 1
  const sortedPositions = [...positions].sort((a, b) => a - b);
  for (let i = 0; i < sortedPositions.length; i++) {
    if (sortedPositions[i] !== i + 1) {
      errors.push(`Les positions doivent être consécutives et commencer à 1. Position manquante: ${i + 1}`);
      break;
    }
  }

  // Vérifier qu'il n'y a pas de doublons de positions
  const uniquePositions = new Set(positions);
  if (uniquePositions.size !== positions.length) {
    errors.push('Chaque leçon doit avoir une position unique');
  }

  // Vérifier qu'il n'y a pas de doublons d'IDs
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    errors.push('Chaque ID de leçon doit être unique');
  }

  return errors;
};

// --- PUT - REORDER LESSONS ---
export const PUT = withAdminAuth(async (req, adminUser, { params }) => {
  const resolvedParams = await params;
  const chapterId = parseInt(resolvedParams.chapterId);

  logger.info('=== REORDER API CALLED ===');
  logger.info('Chapter ID:'+ chapterId);

  if (isNaN(chapterId)) {
    logger.info('❌ Invalid chapter ID');
    return NextResponse.json(
      { error: 'ID de chapitre invalide' },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();  
    logger.info('📦 Body received:'+ JSON.stringify(body, null, 2));
    
    const parsed = reorderLessonsSchema.parse(body);
    logger.info('✅ Schema validation passed');

    // Validation métier des positions
    const validationErrors = validateLessonsPositions(parsed.lessons);
    if (validationErrors.length > 0) {
      logger.info('❌ Business validation failed:'+ validationErrors);
      return NextResponse.json(
        { 
          error: 'Erreurs de validation',
          details: validationErrors
        },
        { status: 400 }
      );
    }
    logger.info('✅ Business validation passed');

    // Vérifier que le chapitre existe
    const chapter = await db
      .select()
      .from(courseChapters)
      .where(eq(courseChapters.id, chapterId))
      .limit(1);

    if (chapter.length === 0) {
      logger.info('❌ Chapter not found');
      return NextResponse.json(
        { error: 'Chapitre introuvable' },
        { status: 404 }
      );
    }
    logger.info('✅ Chapter found:'+ chapter[0].title);

    // Récupérer toutes les leçons actuelles du chapitre
    const existingLessons = await db
      .select({ id: lessons.id })
      .from(lessons)
      .where(eq(lessons.chapterId, chapterId));

    logger.info('📚 Existing lessons:'+ existingLessons.map(l => l.id));

    const existingLessonIds = existingLessons.map(l => l.id);
    const providedLessonIds = parsed.lessons.map(l => l.id);

    logger.info('🔄 Provided lesson IDs:'+ providedLessonIds);

    // Vérifier que toutes les leçons fournies appartiennent au chapitre
    const invalidLessonIds = providedLessonIds.filter(id => !existingLessonIds.includes(id));
    if (invalidLessonIds.length > 0) {
      logger.info('❌ Invalid lesson IDs:'+ invalidLessonIds);
      return NextResponse.json(
        { 
          error: `Les leçons suivantes n'appartiennent pas à ce chapitre: ${invalidLessonIds.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Vérifier que toutes les leçons du chapitre sont incluses
    const missingLessonIds = existingLessonIds.filter(id => !providedLessonIds.includes(id));
    if (missingLessonIds.length > 0) {
      logger.info('❌ Missing lesson IDs:'+ missingLessonIds);
      return NextResponse.json(
        { 
          error: `Les leçons suivantes du chapitre sont manquantes: ${missingLessonIds.join(', ')}`,
          suggestion: 'Vous devez inclure toutes les leçons du chapitre dans la réorganisation'
        },
        { status: 400 }
      );
    }

    logger.info('✅ All validations passed, starting transaction...');

    // Transaction pour mettre à jour toutes les positions
    const updatedLessons = await db.transaction(async (tx) => {
      const results = [];

      logger.info('🔄 Starting 2-step position update to avoid unique constraint violations...');

      // ÉTAPE 1: Mettre toutes les leçons à des positions temporaires (négatives)
      // pour éviter les conflits de contrainte d'unicité
      logger.info('📝 Step 1: Setting temporary positions...');
      for (let i = 0; i < parsed.lessons.length; i++) {
        const lesson = parsed.lessons[i];
        const tempPosition = -(i + 1000); // Position temporaire négative pour éviter les conflits
        
        await tx
          .update(lessons)
          .set({ position: tempPosition })
          .where(
            and(
              eq(lessons.id, lesson.id),
              eq(lessons.chapterId, chapterId)
            )
          );
        
        logger.info(`  ✅ Lesson ${lesson.id} -> temp position ${tempPosition}`);
      }

      // ÉTAPE 2: Mettre les vraies positions finales
      logger.info('📝 Step 2: Setting final positions...');
      for (const lesson of parsed.lessons) {
        logger.info(`  📝 Updating lesson ${lesson.id} to final position ${lesson.position}`);
        
        const [updatedLesson] = await tx
          .update(lessons)
          .set({ 
            position: lesson.position,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(lessons.id, lesson.id),
              eq(lessons.chapterId, chapterId)
            )
          )
          .returning();

        if (updatedLesson) {
          results.push(updatedLesson);
          logger.info(`  ✅ Updated lesson ${lesson.id} to position ${lesson.position}`);
        } else {
          logger.info(`  ❌ Failed to update lesson ${lesson.id}`);
        }
      }

      return results;
    });

    logger.info(`✅ Transaction completed. Updated ${updatedLessons.length} lessons`);

    // Vérifier que toutes les mises à jour ont réussi
    if (updatedLessons.length !== parsed.lessons.length) {
      logger.info('❌ Not all lessons were updated');
      return NextResponse.json(
        { error: 'Certaines leçons n\'ont pas pu être mises à jour' },
        { status: 500 }
      );
    }

    // Récupérer les leçons mises à jour avec tous leurs détails
    const finalLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.chapterId, chapterId))
      .orderBy(lessons.position);

    logger.info('📋 Final lessons order:'+ finalLessons.map(l => `${l.id}:${l.position}`));

    const response = {
      success: true,
      message: `${updatedLessons.length} leçon(s) réorganisée(s) avec succès`,
      lessons: finalLessons,
      reorderedCount: updatedLessons.length
    };

    logger.info('🎉 Sending success response');
    return NextResponse.json(response);

  } catch (error: any) {
    logger.error('💥 Error in reorder API:', error);
    
    if (error instanceof z.ZodError) {
      logger.info('❌ Zod validation error:'+ error.errors);
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
      { error: 'Erreur lors de la réorganisation des leçons', details: error.message },
      { status: 500 }
    );
  }
});

// --- GET - GET CURRENT ORDER ---
export const GET = withAdminAuth(async (req, adminUser, { params }) => {
  const resolvedParams = await params;
  const chapterId = parseInt(resolvedParams.chapterId);

  if (isNaN(chapterId)) {
    return NextResponse.json(
      { error: 'ID de chapitre invalide' },
      { status: 400 }
    );
  }

  try {
    // Vérifier que le chapitre existe
    const chapter = await db
      .select()
      .from(courseChapters)
      .where(eq(courseChapters.id, chapterId))
      .limit(1);

    if (chapter.length === 0) {
      return NextResponse.json(
        { error: 'Chapitre introuvable' },
        { status: 404 }
      );
    }

    // Récupérer toutes les leçons du chapitre ordonnées par position
    const lessonsOrder = await db
      .select({
        id: lessons.id,
        title: lessons.title,
        position: lessons.position,
        published: lessons.published,
        duration: lessons.duration
      })
      .from(lessons)
      .where(eq(lessons.chapterId, chapterId))
      .orderBy(lessons.position);

    return NextResponse.json({
      success: true,
      chapter: chapter[0],
      lessons: lessonsOrder,
      totalLessons: lessonsOrder.length
    });

  } catch (error: any) {
    logger.error('Erreur lors de la récupération de l\'ordre des leçons:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'ordre des leçons' },
      { status: 500 }
    );
  }
});

// --- POST - AUTOMATIC REORDER OPERATIONS ---
export const POST = withAdminAuth(async (req, adminUser, { params }) => {
  const resolvedParams = await params;
  const chapterId = parseInt(resolvedParams.chapterId);

  if (isNaN(chapterId)) {
    return NextResponse.json(
      { error: 'ID de chapitre invalide' },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { operation, options } = body;

    // Vérifier que le chapitre existe
    const chapter = await db
      .select()
      .from(courseChapters)
      .where(eq(courseChapters.id, chapterId))
      .limit(1);

    if (chapter.length === 0) {
      return NextResponse.json(
        { error: 'Chapitre introuvable' },
        { status: 404 }
      );
    }

    // Récupérer toutes les leçons actuelles
    const currentLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.chapterId, chapterId))
      .orderBy(lessons.position);

    if (currentLessons.length === 0) {
      return NextResponse.json(
        { error: 'Aucune leçon à réorganiser dans ce chapitre' },
        { status: 400 }
      );
    }

    let sortedLessons = [...currentLessons];

    // Appliquer l'opération demandée
    switch (operation) {
      case 'alphabetical':
        // Tri alphabétique par titre
        sortedLessons.sort((a, b) => 
          a.title.localeCompare(b.title, 'fr', { 
            sensitivity: 'base',
            ignorePunctuation: true 
          })
        );
        break;

      case 'reverse':
        // Inverser l'ordre actuel
        sortedLessons.reverse();
        break;

      case 'by_duration':
        // Trier par durée (plus courtes en premier)
        sortedLessons.sort((a, b) => (a.duration || 0) - (b.duration || 0));
        break;

      case 'published_first':
        // Leçons publiées en premier
        sortedLessons.sort((a, b) => {
          if (a.published && !b.published) return -1;
          if (!a.published && b.published) return 1;
          return a.position - b.position; // Garder l'ordre actuel pour celles du même statut
        });
        break;

      case 'reset_consecutive':
        // Réinitialiser les positions pour qu'elles soient consécutives
        // (utile si il y a des trous dans les positions)
        break; // Pas besoin de tri, juste de réassignation

      default:
        return NextResponse.json(
          { 
            error: 'Opération inconnue',
            availableOperations: ['alphabetical', 'reverse', 'by_duration', 'published_first', 'reset_consecutive']
          },
          { status: 400 }
        );
    }

    // Préparer les nouvelles positions
    const reorderedLessons = sortedLessons.map((lesson, index) => ({
      id: lesson.id,
      position: index + 1,
    }));

    // Appliquer les changements via transaction
    const updatedLessons = await db.transaction(async (tx) => {
      const results = [];

      for (const lesson of reorderedLessons) {
        const [updatedLesson] = await tx
          .update(lessons)
          .set({ 
            position: lesson.position,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(lessons.id, lesson.id),
              eq(lessons.chapterId, chapterId)
            )
          )
          .returning();

        if (updatedLesson) {
          results.push(updatedLesson);
        }
      }

      return results;
    });

    // Récupérer le résultat final
    const finalLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.chapterId, chapterId))
      .orderBy(lessons.position);

    return NextResponse.json({
      success: true,
      message: `Leçons réorganisées avec succès (${operation})`,
      operation,
      lessons: finalLessons,
      reorderedCount: updatedLessons.length
    });

  } catch (error: any) {
    logger.error('Erreur lors de la réorganisation automatique:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la réorganisation automatique' },
      { status: 500 }
    );
  }
});