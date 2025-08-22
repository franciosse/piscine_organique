// /lib/payments/stripe.ts - Version nettoyée
import Stripe from 'stripe';
import { findOrCreateUser } from '@/lib/services/userService';
import { createOrUpdatePurchase, getCourseById } from '@/lib/services/purchaseService';
import { sendWelcomeEmail, sendPurchaseConfirmationEmail } from '@/lib/email/emailService';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil', // Version stable
});

/**
 * Traite un paiement Stripe réussi (appelé par le webhook)
 */
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

/**
 * Récupère les prix Stripe actifs
 */
export async function getStripePrices() {
  try {
    const prices = await stripe.prices.list({
      expand: ['data.product'],
      active: true,
      type: 'one_time', // Pour les paiements uniques des cours
    });

    return prices.data.map((price) => ({
      id: price.id,
      productId: typeof price.product === 'string' ? price.product : price.product.id,
      unitAmount: price.unit_amount,
      currency: price.currency,
      courseId: price.metadata?.courseId,
    }));
  } catch (error) {
    console.error('Error fetching Stripe prices:', error);
    throw error;
  }
}

/**
 * Récupère les produits Stripe actifs
 */
export async function getStripeProducts() {
  try {
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
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
  } catch (error) {
    console.error('Error fetching Stripe products:', error);
    throw error;
  }
}

/**
 * Crée un produit et un prix Stripe pour un cours
 */
export async function createStripeProductAndPrice(course: {
  id: number;
  title: string;
  description?: string;
  price: number;
  imageUrl?: string;
}) {
  try {
    console.log('Création produit Stripe pour le cours:', course.title);

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

    console.log('✅ Produit et prix créés:', { productId: product.id, priceId: price.id });

    return {
      productId: product.id,
      priceId: price.id,
    };
  } catch (error) {
    console.error('Error creating Stripe product and price:', error);
    throw error;
  }
}

/**
 * Met à jour le prix d'un cours dans Stripe
 * (désactive l'ancien prix et crée un nouveau)
 */
export async function updateStripePrice(course: {
  id: number;
  title: string;
  description?: string;
  price: number;
  stripePriceId?: string;
}) {
  try {
    console.log('Mise à jour prix Stripe pour le cours:', course.title);

    if (course.stripePriceId) {
      // Désactiver l'ancien prix
      await stripe.prices.update(course.stripePriceId, {
        active: false,
      });
      console.log('Ancien prix désactivé:', course.stripePriceId);
    }

    // Créer un nouveau prix (les prix Stripe ne peuvent pas être modifiés)
    const { priceId } = await createStripeProductAndPrice(course);
    
    console.log('✅ Nouveau prix créé:', priceId);
    
    return priceId;
  } catch (error) {
    console.error('Error updating Stripe price:', error);
    throw error;
  }
}