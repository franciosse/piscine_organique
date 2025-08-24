// /lib/payments/stripe.ts - 
import { db } from '@/lib/db/drizzle';
import { coursePurchases } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil', // Version stable
});

export async function handlePaymentSuccess(session: any) {
  console.log('🎯 ======================');
  console.log('🎯 DÉBUT handlePaymentSuccess');
  console.log('🎯 ======================');

  try {
    // Extraire les informations de la session
    const sessionId = session.id;
    const paymentIntentId = session.payment_intent;
    const customerEmail = session.customer_details?.email;
    const amountPaid = session.amount_total;
    
    console.log('📊 Données de session:', {
      sessionId,
      paymentIntentId,
      customerEmail,
      amountPaid,
      metadata: session.metadata
    });

    // Rechercher l'achat en pending par session ID
    console.log('🔍 Recherche de l\'achat pending...');
    
    const existingPurchases = await db
      .select({
        id: coursePurchases.id,
        userId: coursePurchases.userId,
        courseId: coursePurchases.courseId,
        status: coursePurchases.status,
        stripeSessionId: coursePurchases.stripeSessionId,
        stripePaymentIntentId: coursePurchases.stripePaymentIntentId,
      })
      .from(coursePurchases)
      .where(
        and(
          eq(coursePurchases.stripeSessionId, sessionId),
          eq(coursePurchases.status, 'pending')
        )
      );

    console.log('🔍 Achats trouvés:', existingPurchases.length);

    if (existingPurchases.length === 0) {
      // Essayer de trouver par payment_intent_id si pas trouvé par session
      if (paymentIntentId) {
        console.log('🔍 Recherche par Payment Intent ID...');
        
        const purchasesByPI = await db
          .select({
            id: coursePurchases.id,
            userId: coursePurchases.userId,
            courseId: coursePurchases.courseId,
            status: coursePurchases.status,
            stripeSessionId : coursePurchases.stripeSessionId,
            stripePaymentIntentId : coursePurchases.stripePaymentIntentId
          })
          .from(coursePurchases)
          .where(
            and(
              eq(coursePurchases.stripePaymentIntentId, paymentIntentId),
              eq(coursePurchases.status, 'pending')
            )
          );

        if (purchasesByPI.length > 0) {
          existingPurchases.push(...purchasesByPI);
        }
      }
    }

    if (existingPurchases.length === 0) {
      console.error('❌ Aucun achat pending trouvé pour:', { sessionId, paymentIntentId });
      
      // Option: Créer l'achat si metadata disponibles
      if (session.metadata?.courseId && session.metadata?.userId) {
        console.log('🆕 Création d\'un nouvel achat depuis les metadata...');
        await createPurchaseFromMetadata(session);
        return;
      }
      
      throw new Error('Aucun achat pending trouvé et metadata insuffisantes');
    }

    // Mettre à jour tous les achats trouvés
    for (const purchase of existingPurchases) {
      console.log(`✅ Mise à jour de l'achat ${purchase.id}:`, {
        userId: purchase.userId,
        courseId: purchase.courseId,
        oldStatus: purchase.status
      });

      await db
        .update(coursePurchases)
        .set({
          status: 'completed',
          stripePaymentIntentId: paymentIntentId,
          // Optionnel: mettre à jour le montant si différent
          ...(amountPaid && { amount: Math.round(amountPaid / 100) }) // Convertir centimes en euros
        })
        .where(eq(coursePurchases.id, purchase.id));

      console.log(`✅ Achat ${purchase.id} mis à jour vers 'completed'`);

      // Optionnel: Envoyer email de confirmation
      // await sendPurchaseConfirmationEmail(purchase.userId, purchase.courseId);
    }

    console.log('🎉 SUCCÈS: Tous les achats ont été mis à jour');

  } catch (error) {
    console.error('💥 ERREUR dans handlePaymentSuccess:', error);
    throw error;
  }

  console.log('🎯 ======================');
  console.log('🎯 FIN handlePaymentSuccess');
  console.log('🎯 ======================');
}

// Créer un achat depuis les metadata si pas trouvé en base
async function createPurchaseFromMetadata(session: any) {
  try {
    const { courseId, userId } = session.metadata;
    const sessionId = session.id;
    const paymentIntentId = session.payment_intent;
    const amountPaid = Math.round(session.amount_total / 100); // Convertir en euros

    console.log('🆕 Création achat depuis metadata:', {
      courseId: parseInt(courseId),
      userId: parseInt(userId),
      amount: amountPaid
    });

    await db
      .insert(coursePurchases)
      .values({
        userId: parseInt(userId),
        courseId: parseInt(courseId),
        stripeSessionId: sessionId,
        stripePaymentIntentId: paymentIntentId,
        amount: amountPaid,
        currency: session.currency?.toUpperCase() || 'EUR',
        status: 'completed', // Directement completed puisque le paiement est confirmé
        purchasedAt: new Date(),
      });

    console.log('✅ Achat créé avec succès depuis les metadata');

  } catch (error) {
    console.error('💥 Erreur création achat depuis metadata:', error);
    throw error;
  }
}

export async function handlePaymentFailed(paymentIntent: any) {
  console.log('❌ Traitement échec de paiement:', paymentIntent.id);
  
  // Optionnel: marquer l'achat comme failed
  try {
    await db
      .update(coursePurchases)
      .set({
        status: 'failed',
        // Optionnel: ajouter info sur l'erreur
      })
      .where(eq(coursePurchases.stripePaymentIntentId, paymentIntent.id));
  } catch (error) {
    console.error('Erreur mise à jour échec paiement:', error);
  }
}