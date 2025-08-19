// app/api/courses/[courseId]/purchase/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { courses, coursePurchases } from '@/lib/db/schema';
import { withUserAuth } from '@/app/api/_lib/route-helpers';
import { createCheckoutSession } from '@/lib/payments/stripe';

interface RouteParams {
  params: {
    courseId: string;
  };
}

export const POST = withUserAuth(async (req: NextRequest, authenticatedUser, { params }) => {
  try {
    const resolvedParams = await params;
    const courseId = parseInt(resolvedParams.courseId);

    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'ID de cours invalide' },
        { status: 400 }
      );
    }

    // Vérifier que le cours existe
    const course = await db.select({
      id: courses.id,
      title: courses.title,
      price: courses.price,
      published: courses.published,
    })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

    if (!course[0]) {
      return NextResponse.json(
        { error: 'Cours introuvable' },
        { status: 404 }
      );
    }

    // Vérifier que le cours est publié
    if (!course[0].published) {
      return NextResponse.json(
        { error: 'Ce cours n\'est pas disponible' },
        { status: 400 }
      );
    }

    // Vérifier que le cours est payant (sinon rediriger vers /enroll)
    if (course[0].price <= 0) {
      return NextResponse.json(
        { 
          error: 'Ce cours est gratuit', 
          redirect: `/api/courses/${courseId}/enroll`,
          message: 'Utilisez l\'inscription gratuite pour ce cours'
        },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur n'est pas déjà inscrit
    const existingPurchase = await db.select()
      .from(coursePurchases)
      .where(
        and(
          eq(coursePurchases.userId, authenticatedUser.id),
          eq(coursePurchases.courseId, courseId)
        )
      )
      .limit(1);

    if (existingPurchase[0]) {
      return NextResponse.json(
        { error: 'Vous êtes déjà inscrit à ce cours' },
        { status: 400 }
      );
    }

    // Utiliser votre fonction createCheckoutSession existante
    try {
      await createCheckoutSession({
        courseId: courseId,
        userId: authenticatedUser.id,
      });
      
      // Si createCheckoutSession utilise redirect(), cette ligne ne sera jamais atteinte
      // Mais on garde cette réponse au cas où vous modifieriez la fonction pour retourner l'URL
      return NextResponse.json({
        success: true,
        message: 'Redirection vers Stripe en cours...'
      });

    } catch (redirectError) {
      // Si createCheckoutSession fait un redirect(), cela génère une erreur
      // C'est normal avec les redirections Next.js
      throw redirectError;
    }

  } catch (error: any) {
    // Si c'est une redirection Next.js, on la laisse passer
    if (error?.digest?.includes('NEXT_REDIRECT')) {
      throw error;
    }
    
    console.error('Course purchase error:', error);
    
    return NextResponse.json(
      { error: 'Une erreur s\'est produite lors de la création du paiement' },
      { status: 500 }
    );
  }
});