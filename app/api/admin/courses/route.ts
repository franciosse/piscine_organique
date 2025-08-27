// app/api/admin/courses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle' // Votre instance Drizzle
import { courses, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { withAdminAuth, withUserAuth } from '@/app/api/_lib/route-helpers';
import logger from '@/lib/logger/logger';


// Schema de validation pour créer un cours
const createCourseSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  price: z.number().min(0, 'Le prix doit être positif'),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  estimatedDuration: z.number().optional(),
});

// Fonction pour générer un slug unique
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// GET /api/admin/courses - Liste tous les cours
export const GET = withUserAuth(async (request, adminUser) => {
  try {

    const allCourses = await db
      .select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        description: courses.description,
        price: courses.price,
        published: courses.published,
        imageUrl: courses.imageUrl,
        difficultyLevel: courses.difficultyLevel,
        estimatedDuration: courses.estimatedDuration,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
        authorName: users.name,
        authorEmail: users.email,
      })
      .from(courses)
      .leftJoin(users, eq(courses.authorId, users.id))
      .orderBy(desc(courses.createdAt));

    return NextResponse.json({
      courses: allCourses,
      total: allCourses.length,
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des cours:'+ error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: error instanceof Error && error.message.includes('auth') ? 401 : 500 }
    );
  }
});

// POST /api/admin/courses - Créer un nouveau cours
export const POST = withAdminAuth(async (request, adminUser) => {
  try {
    const body = await request.json();
    
    // Validation des données
    const validatedData = createCourseSchema.parse(body);
    
    // Générer le slug
    const baseSlug = generateSlug(validatedData.title);
    let slug = baseSlug;
    let counter = 1;
    
    // Vérifier l'unicité du slug
    while (true) {
      const existingCourse = await db
        .select({ id: courses.id })
        .from(courses)
        .where(eq(courses.slug, slug))
        .limit(1);
      
      if (existingCourse.length === 0) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Créer le cours
    const [newCourse] = await db
      .insert(courses)
      .values({
        title: validatedData.title,
        slug: slug,
        description: validatedData.description,
        price: Math.round(validatedData.price * 100), // Convertir en centimes
        difficultyLevel: validatedData.difficultyLevel,
        estimatedDuration: validatedData.estimatedDuration,
        //authorId: user.id || null, // Assigner l'ID de l'auteur
      })
      .returning();

    return NextResponse.json({
      success: true,
      course: newCourse,
    }, { status: 201 });
  } catch (error) {
    logger.error('Erreur lors de la création du cours:'+ error);
    
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