// /app/api/courses/[courseId]/checkout/route.ts - VERSION CORRIGÉE
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, coursePurchases, courses } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import { getBaseUrl } from '@/lib/utils';
import logger from '@/lib/logger/logger';


interface RouteParams {
  courseId: string;
}

interface RouteContext {
  params: Promise<RouteParams>;
}

// ⚠️ IMPORTANT : On retire withUserAuth pour permettre les achats sans connexion
export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    const resolvedParams = await context.params;
    const courseId = parseInt(resolvedParams.courseId);

    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'ID de cours invalide' }, { status: 400 });
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

    let userId = null;
    let customerEmail = null;

    // Si utilisateur connecté, récupérer ses infos
    if (session?.user?.id) {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);

      if (user.length > 0) {
        userId = user[0].id;
        customerEmail = user[0].email;

        // Vérifier si déjà acheté
        const existingPurchase = await db
          .select()
          .from(coursePurchases)
          .where(
            and(
              eq(coursePurchases.userId, userId),
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
      }
    }

    const baseUrl = getBaseUrl(request);

    // 🎯 URL CORRIGÉE : Redirection vers la page de succès du cours, pas l'API
    const successUrl = `${baseUrl}/dashboard/courses/${courseId}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/dashboard/courses/${courseId}`;

    logger.info('=== DEBUG CHECKOUT ===');
    logger.info('Course ID:'+ courseId);
    logger.info('User ID:'+ userId);
    logger.info('Customer Email:'+ customerEmail);
    logger.info('Success URL:'+ successUrl);
    logger.info('Cancel URL:'+ cancelUrl);
    logger.info('=====================');

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
      success_url: successUrl,
      cancel_url: cancelUrl,
      
      // Métadonnées pour le webhook
      metadata: {
        courseId: courseId.toString(),
        userId: userId ? userId.toString() : '', // Peut être vide si pas connecté
      },
      
      // Email client si connecté, sinon Stripe le demandera
      customer_email: customerEmail || undefined,
      
      // Si pas connecté, forcer la collecte de l'email
      ...((!customerEmail) && {
        billing_address_collection: 'required',
      }),
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id
    });

  } catch (error) {
    logger.error('Erreur lors de la création du checkout:'+ error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du paiement' },
      { status: 500 }
    );
  }
}