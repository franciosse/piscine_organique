// app/api/admin/users/[userId]/purchases/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { coursePurchases, courses, users } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';
import { withAdminAuth } from '@/app/api/_lib/route-helpers';
import logger from '@/lib/logger/logger';

const addPurchaseSchema = z.object({
  courseId: z.number().int().positive(),
});

interface RouteParams {
  userId: string;
}

// GET /api/admin/users/[userId]/purchases - Récupérer les achats d'un utilisateur
export const GET = withAdminAuth(async (req, adminUser, { params }) => {
  try {
    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.userId);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID utilisateur invalide' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer les achats avec les informations des cours
    const purchases = await db
      .select({
        id: coursePurchases.id,
        userId: coursePurchases.userId,
        courseId: coursePurchases.courseId,
        amount: coursePurchases.amount,
        status: coursePurchases.status,
        paymentMethod: coursePurchases.paymentMethod,
        createdAt: coursePurchases.purchasedAt,
        course: {
          id: courses.id,
          title: courses.title,
          description: courses.description,
          price: courses.price,
          imageUrl: courses.imageUrl,
          published: courses.published,
        }
      })
      .from(coursePurchases)
      .innerJoin(courses, eq(coursePurchases.courseId, courses.id))
      .where(eq(coursePurchases.userId, userId))
      .orderBy(desc(coursePurchases.purchasedAt));

    const formattedPurchases = purchases.map(purchase => ({
      id: purchase.id,
      userId: purchase.userId,
      courseId: purchase.courseId,
      amount: purchase.amount,
      status: purchase.status,
      paymentMethod: purchase.paymentMethod,
      createdAt: purchase.createdAt.toISOString(),
      course: {
        ...purchase.course,
        price: purchase.course.price / 100, // Convertir en euros
      }
    }));

    return NextResponse.json({ 
      purchases: formattedPurchases,
      total: formattedPurchases.length
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des achats utilisateur:'+ error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: error instanceof Error && error.message.includes('auth') ? 401 : 500 }
    );
  }
});

// POST /api/admin/users/[userId]/purchases - Ajouter un achat pour un utilisateur
export const POST = withAdminAuth(async (request, adminUser, { params }) => {
  try {
    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.userId);
    const body = await request.json();

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID utilisateur invalide' },
        { status: 400 }
      );
    }

    // Validation des données
    const validatedData = addPurchaseSchema.parse(body);
    const { courseId } = validatedData;

    // Vérifier que l'utilisateur existe
    const user = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const userEmail = user[0]?.email;


    if (user.length === 0) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que le cours existe
    const course = await db
      .select({ 
        id: courses.id, 
        title: courses.title, 
        price: courses.price,
        description: courses.description,
        imageUrl: courses.imageUrl,
        published: courses.published
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (course.length === 0) {
      return NextResponse.json(
        { error: 'Cours non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que l'achat n'existe pas déjà
    const existingPurchase = await db
      .select({ id: coursePurchases.id })
      .from(coursePurchases)
      .where(
        and(
          eq(coursePurchases.userId, userId),
          eq(coursePurchases.courseId, courseId)
        )
      )
      .limit(1);

    if (existingPurchase.length > 0) {
      return NextResponse.json(
        { error: 'L\'utilisateur possède déjà ce cours' },
        { status: 400 }
      );
    }

    // Créer l'achat
    const [newPurchase] = await db
      .insert(coursePurchases)
      .values({
        userId: userId,
        courseId: courseId,
        customerEmail:userEmail,
        amount: course[0].price || 0,
        status: 'completed', // Admin ajoute directement
        paymentMethod: 'admin',
        currency: 'EUR',
        purchasedAt: new Date(),
      })
      .returning({
        id: coursePurchases.id,
        userId: coursePurchases.userId,
        courseId: coursePurchases.courseId,
        amount: coursePurchases.amount,
        status: coursePurchases.status,
        paymentMethod: coursePurchases.paymentMethod,
        createdAt: coursePurchases.purchasedAt,
      });

    const purchase = {
      ...newPurchase,
      createdAt: newPurchase.createdAt.toISOString(),
      course: {
        ...course[0],
        price: course[0].price / 100, // Convertir en euros
      }
    };

    logger.info(`Admin ${adminUser.email} a ajouté le cours ${course[0].title} à l'utilisateur ${user[0].email}`);

    return NextResponse.json({ 
      success: true,
      purchase,
      message: 'Cours ajouté avec succès à l\'utilisateur'
    });

  } catch (error) {
    logger.error('Erreur lors de l\'ajout d\'un achat:'+ error);
    
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
