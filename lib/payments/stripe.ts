
// /lib/payments/stripe.ts
import Stripe from 'stripe';
import { redirect } from 'next/navigation';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { courses, coursePurchases, users } from '@/lib/db/schema';
import { findOrCreateUser } from '@/lib/services/userService';
import { createOrUpdatePurchase, getCourseById } from '@/lib/services/purchaseService';
import { sendWelcomeEmail, sendPurchaseConfirmationEmail } from '@/lib/email/emailService';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil', // Version plus récente
});

export async function createCheckoutSession({
  courseId,
  userId,
  priceId
}: {
  courseId: number;
  userId: number;
  priceId?: string;
}) {
  try {
    // Récupérer le cours
    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (course.length === 0) {
      throw new Error('Course not found');
    }

    const courseData = course[0];

    // Vérifier que l'utilisateur n'a pas déjà acheté ce cours
    const existingPurchase = await db
      .select()
      .from(coursePurchases)
      .where(and(
        eq(coursePurchases.userId, userId),
        eq(coursePurchases.courseId, courseId)
      ))
      .limit(1);

    if (existingPurchase.length > 0) {
      redirect(`/courses/${courseId}?error=already_purchased`);
    }

    // Récupérer l'utilisateur pour l'email
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Utiliser le priceId fourni ou celui du cours
    let stripePriceId = priceId || courseData.stripePriceId;

    // Si pas de price ID, créer le produit et le prix dans Stripe
    if (!stripePriceId) {
      const product = await stripe.products.create({
        name: courseData.title,
        description: courseData.description || undefined,
        images: courseData.imageUrl ? [courseData.imageUrl] : undefined,
        metadata: {
          courseId: courseId.toString(),
          type: 'course',
        },
      });

      const price = await stripe.prices.create({
        unit_amount: courseData.price,
        currency: 'eur',
        product: product.id,
        metadata: {
          courseId: courseId.toString(),
        },
      });

      stripePriceId = price.id;

      // Sauvegarder l'ID du prix dans la base de données
      await db
        .update(courses)
        .set({ stripePriceId })
        .where(eq(courses.id, courseId));
    }

    // Créer la session de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'payment', // Paiement unique pour les cours
      success_url: `${process.env.BASE_URL}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL}/courses/${courseId}`,
      customer_email: user[0].email,
      client_reference_id: userId.toString(),
      metadata: {
        courseId: courseId.toString(),
        userId: userId.toString(),
      },
      allow_promotion_codes: true,
    });

    redirect(session.url!);
  } catch (error) {
    console.error('Error creating checkout session:', error);
    redirect(`/courses/${courseId}?error=checkout_creation_failed`);
  }
}

export async function handlePaymentSuccess(session: Stripe.Checkout.Session) {
  try {
    console.log('=== 🚀 DÉBUT TRAITEMENT PAIEMENT RÉUSSI ===');
    console.log('Session ID:', session.id);
    console.log('Customer email:', session.customer_details?.email);

    // === VALIDATION DES DONNÉES ===
    const { courseId, userId } = session.metadata || {};
    const customerEmail = session.customer_details?.email;

    if (!courseId || !customerEmail) {
      console.error('❌ Métadonnées manquantes:', { courseId, customerEmail });
      throw new Error('Métadonnées invalides dans la session Stripe');
    }

    const courseIdNum = parseInt(courseId);
    const userIdNum = userId ? parseInt(userId) : null;

    // === VÉRIFICATION DU COURS ===
    console.log('📚 Vérification du cours...');
    const course = await getCourseById(courseIdNum);
    
    if (!course) {
      console.error('❌ Cours introuvable:', courseIdNum);
      throw new Error('Cours introuvable');
    }

    console.log('✅ Cours trouvé:', course.title);

    // === GESTION DE L'UTILISATEUR ===
    console.log('👤 Gestion de l\'utilisateur...');
    
    let finalUserId = userIdNum;
    let isNewUser = false;
    let temporaryPassword: string | undefined;

    if (!finalUserId) {
      // Utilisateur non connecté - créer ou trouver le compte
      const userResult = await findOrCreateUser({
        email: customerEmail,
        createdViaStripe: true,
        isVerified: true, // Email vérifié car paiement effectué
      });

      finalUserId = userResult.userId;
      isNewUser = userResult.isNewUser;
      temporaryPassword = userResult.temporaryPassword;

      if (isNewUser) {
        console.log('🆕 Nouveau compte créé pour:', customerEmail);
      } else {
        console.log('✅ Compte existant trouvé pour:', customerEmail);
      }
    } else {
      console.log('✅ Utilisateur connecté existant:', finalUserId);
    }

    // === ENREGISTREMENT DE L'ACHAT ===
    console.log('💰 Enregistrement de l\'achat...');
    
    const purchaseResult = await createOrUpdatePurchase({
      userId: finalUserId,
      courseId: courseIdNum,
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string,
      amount: session.amount_total || 0,
    });

    if (purchaseResult.isNewPurchase) {
      console.log('✅ Nouvel achat enregistré');
    } else {
      console.log('ℹ️ Achat existant mis à jour');
    }

    // === ENVOI DES EMAILS ===
    console.log('📧 Envoi des notifications...');
    
    // Email de bienvenue pour les nouveaux comptes
    if (isNewUser && temporaryPassword) {
      await sendWelcomeEmail({
        email: customerEmail,
        name: customerEmail.split('@')[0],
        temporaryPassword,
      });
    }

    // Email de confirmation d'achat
    await sendPurchaseConfirmationEmail({
      email: customerEmail,
      course: {
        id: course.id,
        title: course.title,
        price: course.price,
      },
    });

    console.log('=== ✅ TRAITEMENT TERMINÉ AVEC SUCCÈS ===');
    console.log(`Résumé: User ${finalUserId} - Course ${courseIdNum} - New User: ${isNewUser}`);

  } catch (error) {
    console.error('=== ❌ ERREUR LORS DU TRAITEMENT ===');
    console.error('Session ID:', session.id);
    console.error('Error:', error);
    throw error;
  }
}

export async function getStripePrices() {
  const prices = await stripe.prices.list({
    expand: ['data.product'],
    active: true,
    type: 'one_time', // Changé de 'recurring' à 'one_time' pour les cours
  });

  return prices.data.map((price) => ({
    id: price.id,
    productId: typeof price.product === 'string' ? price.product : price.product.id,
    unitAmount: price.unit_amount,
    currency: price.currency,
    courseId: price.metadata?.courseId,
  }));
}

export async function getStripeProducts() {
  const products = await stripe.products.list({
    active: true,
    expand: ['data.default_price'],
 //   metadata: { type: 'course' }, // Filtrer seulement les produits de type cours
  });

  return products.data.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    defaultPriceId: typeof product.default_price === 'string'
      ? product.default_price
      : product.default_price?.id,
    courseId: product.metadata?.courseId,
  }));
}

// Nouvelle fonction pour créer un prix Stripe pour un cours
export async function createStripeProductAndPrice(course: {
  id: number;
  title: string;
  description?: string;
  price: number;
  imageUrl?: string;
}) {
  try {
    // Créer le produit
    const product = await stripe.products.create({
      name: course.title,
      description: course.description || undefined,
      images: course.imageUrl ? [course.imageUrl] : undefined,
      metadata: {
        courseId: course.id.toString(),
        type: 'course',
      },
    });

    // Créer le prix
    const price = await stripe.prices.create({
      unit_amount: course.price,
      currency: 'eur',
      product: product.id,
      metadata: {
        courseId: course.id.toString(),
      },
    });

    return {
      productId: product.id,
      priceId: price.id,
    };
  } catch (error) {
    console.error('Error creating Stripe product and price:', error);
    throw error;
  }
}

// Fonction pour mettre à jour le prix d'un cours dans Stripe
export async function updateStripePrice(course: {
  id: number;
  title: string;
  description?: string;
  price: number;
  stripePriceId?: string;
}) {
  try {
    if (course.stripePriceId) {
      // Désactiver l'ancien prix
      await stripe.prices.update(course.stripePriceId, {
        active: false,
      });
    }

    // Créer un nouveau prix (les prix Stripe ne peuvent pas être modifiés)
    const { priceId } = await createStripeProductAndPrice(course);
    
    return priceId;
  } catch (error) {
    console.error('Error updating Stripe price:', error);
    throw error;
  }
}

export async function createCheckoutSessionForAPI({
  courseId,
  userId,
  priceId
}: {
  courseId: number;
  userId: number;
  priceId?: string;
}) {
  try {
    // Récupérer le cours
    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (course.length === 0) {
      throw new Error('Course not found');
    }

    const courseData = course[0];

    // Vérifier que l'utilisateur n'a pas déjà acheté ce cours
    const existingPurchase = await db
      .select()
      .from(coursePurchases)
      .where(and(
        eq(coursePurchases.userId, userId),
        eq(coursePurchases.courseId, courseId)
      ))
      .limit(1);

    if (existingPurchase.length > 0) {
      throw new Error('Vous êtes déjà inscrit à ce cours');
    }

    // Récupérer l'utilisateur pour l'email
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Utiliser le priceId fourni ou celui du cours
    let stripePriceId = priceId || courseData.stripePriceId;

    // Si pas de price ID, créer le produit et le prix dans Stripe
    if (!stripePriceId) {
      const product = await stripe.products.create({
        name: courseData.title,
        description: courseData.description || undefined,
        images: courseData.imageUrl ? [courseData.imageUrl] : undefined,
        metadata: {
          courseId: courseId.toString(),
          type: 'course',
        },
      });

      const price = await stripe.prices.create({
        unit_amount: courseData.price,
        currency: 'eur',
        product: product.id,
        metadata: {
          courseId: courseId.toString(),
        },
      });

      stripePriceId = price.id;

      // Sauvegarder l'ID du prix dans la base de données
      await db
        .update(courses)
        .set({ stripePriceId })
        .where(eq(courses.id, courseId));
    }

    // Créer la session de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.BASE_URL}/api/stripe/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL}/dashboard/courses/${courseId}/purchase?canceled=true`,
      customer_email: user[0].email,
      client_reference_id: userId.toString(),
      metadata: {
        courseId: courseId.toString(),
        userId: userId.toString(),
      },
      allow_promotion_codes: true,
    });

    // RETOURNER l'URL au lieu de faire un redirect
    return {
      url: session.url!,
      sessionId: session.id,
    };

  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}