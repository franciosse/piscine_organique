// =============================================================================
// METTEZ À JOUR : app/api/courses/[courseId]/checkout/route.ts
// Création de session de paiement (avec votre auth personnalisé)
// =============================================================================

import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, coursePurchases, courses } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import { withUserAuth } from '@/app/api/_lib/route-helpers';


interface RouteParams {
  courseId: string ;
}

export const POST = withUserAuth(async (request, authUser, { params }) => {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const resolvedParams = await params;
    const courseId = parseInt(resolvedParams.courseId);

    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'ID de cours invalide' }, { status: 400 });
    }

    // Récupérer l'utilisateur complet
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    // Vérifier le cours
    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (course.length === 0) {
      return NextResponse.json({ error: 'Cours introuvable' }, { status: 404 });
    }

    if (!course[0].published) {
      return NextResponse.json({ error: 'Ce cours n\'est pas encore disponible' }, { status: 400 });
    }

    if (course[0].price === 0) {
      return NextResponse.json({ error: 'Ce cours est gratuit, utilisez l\'inscription directe' }, { status: 400 });
    }

    // Vérifier si déjà acheté
    const existingPurchase = await db
      .select()
      .from(coursePurchases)
      .where(
        and(
          eq(coursePurchases.userId, authUser.id),
          eq(coursePurchases.courseId, courseId)
        )
      )
      .limit(1);

    if (existingPurchase.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Cours déjà acheté',
        purchased: true
      });
    }

    // Créer session Stripe
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: course[0].title,
            images: course[0].imageUrl ? [course[0].imageUrl] : [],
          },
          unit_amount: course[0].price, // Prix en centimes
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL || process.env.APP_URL}/api/stripe/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL || process.env.APP_URL}/courses/${courseId}`,
      client_reference_id: authUser.id.toString(),
      metadata: {
        courseId: courseId.toString(),
        userId: authUser.id.toString(),
      },
      customer_email: user[0].email || undefined,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id
    });

  } catch (error) {
    console.error('Erreur lors de la création du checkout:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du paiement' },
      { status: 500 }
    );
  }
});