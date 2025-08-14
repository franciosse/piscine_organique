// /app/api/stripe/checkout/route.ts
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, coursePurchases, courses } from '@/lib/db/schema';
import { setSession } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import { withUserAuth } from '@/app/api/_lib/route-helpers';

export const GET = withUserAuth(async (request, user) => {

  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');
  
  if (!sessionId) {
    return NextResponse.redirect(new URL('/courses', request.url));
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'line_items.data.price.product'],
    });

    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed.');
    }

    const userId = session.client_reference_id;
    if (!userId) {
      throw new Error("No user ID found in session's client_reference_id.");
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(userId)))
      .limit(1);

    if (user.length === 0) {
      throw new Error('User not found in database.');
    }

    // Récupérer les informations du cours depuis les métadonnées
    const { courseId } = session.metadata || {};
    if (!courseId) {
      throw new Error('Course ID not found in session metadata.');
    }

    const courseIdNum = parseInt(courseId);

    // Vérifier que le cours existe
    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseIdNum))
      .limit(1);

    if (course.length === 0) {
      throw new Error('Course not found in database.');
    }

    // Vérifier que l'achat n'existe pas déjà
    const existingPurchase = await db
      .select()
      .from(coursePurchases)
      .where(and(
        eq(coursePurchases.userId, user[0].id),
        eq(coursePurchases.courseId, courseIdNum)
      ))
      .limit(1);

    if (existingPurchase.length === 0) {
      // Créer l'enregistrement de l'achat
      await db.insert(coursePurchases).values({
        userId: user[0].id,
        courseId: courseIdNum,
        stripePaymentIntentId: session.payment_intent as string,
        amount: session.amount_total || 0,
        currency: session.currency || 'eur',
      });
    }

    await setSession(user[0]);
    return NextResponse.redirect(new URL(`/courses/${courseId}/success`, request.url));
  } catch (error) {
    console.error('Error handling successful checkout:', error);
    return NextResponse.redirect(new URL('/courses?error=checkout_failed', request.url));
  }
});
