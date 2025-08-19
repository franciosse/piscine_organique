// app/api/courses/[courseId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { courses, users } from '@/lib/db/schema';

interface RouteParams {
  params: {
    courseId: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { courseId } = params;

    // Récupérer le cours avec les informations de l'instructeur
    const courseData = await db.select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      price: courses.price,
      duration: courses.estimatedDuration,
      level: courses.difficultyLevel,
      imageUrl: courses.imageUrl,
      isPublished: courses.published,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
      // Informations de l'instructeur
      instructor: users.name,
      instructorEmail: users.email,
    })
    .from(courses)
    .where(eq(courses.id, parseInt(courseId)))
    .limit(1);

    if (!courseData[0]) {
      return NextResponse.json(
        { error: 'Cours introuvable' },
        { status: 404 }
      );
    }

    const course = courseData[0];

    // Vérifier que le cours est publié (sauf pour les admins/instructeurs)
    if (!course.isPublished) {
      return NextResponse.json(
        { error: 'Ce cours n\'est pas disponible' },
        { status: 403 }
      );
    }

    // Formater les données pour la réponse
    const formattedCourse = {
      id: course.id,
      title: course.title,
      description: course.description,
      price: course.price || 0,
      originalPrice: course.price,
      duration: course.duration || 'Non spécifié',
      level: course.level || 'Tous niveaux',
      instructor: course.instructor || 'Instructeur',
      imageUrl: course.imageUrl,
    };

    return NextResponse.json(formattedCourse);

  } catch (error) {
    console.error('Get course error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du cours' },
      { status: 500 }
    );
  }
}