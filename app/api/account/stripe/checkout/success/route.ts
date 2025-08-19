// app/api/stripe/checkout/success/route.ts
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { setSession } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.redirect(new URL('/dashboard/courses?error=no_session', request.url));
  }

  try {
    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed.');
    }

    const userId = session.client_reference_id;
    if (!userId) {
      throw new Error("No user ID found in session's client_reference_id.");
    }

    // Récupérer l'utilisateur
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (!user[0]) {
      throw new Error('User not found in database.');
    }

    // Récupérer le courseId depuis les métadonnées
    const { courseId } = session.metadata || {};
    if (!courseId) {
      throw new Error('Course ID not found in session metadata.');
    }

    // Rétablir la session utilisateur
    await setSession(user[0]);

    // Rediriger vers le cours avec message de succès
    return NextResponse.redirect(
      new URL(`/dashboard/courses/${courseId}?purchased=true`, request.url)
    );

  } catch (error) {
    console.error('Error handling successful checkout:', error);
    return NextResponse.redirect(
      new URL('/dashboard/courses?error=checkout_failed', request.url)
    );
  }
}