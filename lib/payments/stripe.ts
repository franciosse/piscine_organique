// /lib/payments/stripe.ts - 
import { db } from '@/lib/db/drizzle';
import { coursePurchases, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import Stripe from 'stripe';
import logger from '@/lib/logger/logger';


export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil', // Version stable
});

export async function handlePaymentSuccess(session: any) {
  logger.info('🎯 ======================');
  logger.info('🎯 DÉBUT handlePaymentSuccess');
  logger.info('🎯 ======================');

  try {
    // Extraire les informations de la session
    const sessionId = session.id;
    const paymentIntentId = session.payment_intent;
    const customerEmail = session.customer_details?.email;
    const amountPaid = session.amount_total;
    let userId = session.metadata?.userId;
    const courseId = session.metadata?.courseId;
    
    logger.info('📊 Données de session:', JSON.stringify({
      sessionId,
      paymentIntentId,
      customerEmail,
      amountPaid,
      userId,
      courseId,
      metadata: session.metadata
    }));

    // 🆕 NOUVEAU : Si pas d'userId mais on a un email, chercher l'utilisateur
    if ((!userId || userId === '') && customerEmail) {
      logger.info('🔍 Pas d\'userId, recherche par email...');
      
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, customerEmail))
        .limit(1);

      if (existingUser.length > 0) {
        userId = existingUser[0].id.toString();
        logger.info('✅ Utilisateur existant trouvé:' + userId);
      } else {
        // logger.info('👤 Utilisateur non trouvé, création d\'un nouveau compte...');
        // // Créer un nouvel utilisateur
        // const newUser = await db.insert(users).values({
        //   email: customerEmail,
        //   name: session.customer_details?.name || customerEmail.split('@')[0],
        //   isVerified : true,
        //   passwordHash: '', 
        // }).returning();
        
        // userId = newUser[0].id.toString();
        // logger.info('✅ Nouvel utilisateur créé:', userId);
        logger.error('👤 Utilisateur non trouvé : ' + customerEmail)
      }
    }

    // Rechercher l'achat en pending par session ID
    logger.info('🔍 Recherche de l\'achat pending...');
    
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

    logger.info('🔍 Achats trouvés:'+ existingPurchases.length);

    if (existingPurchases.length === 0) {
      // Essayer de trouver par payment_intent_id
      if (paymentIntentId) {
        logger.info('🔍 Recherche par Payment Intent ID...');
        
        const purchasesByPI = await db
          .select({
            id: coursePurchases.id,
            userId: coursePurchases.userId,
            courseId: coursePurchases.courseId,
            status: coursePurchases.status,
            stripeSessionId: coursePurchases.stripeSessionId,
            stripePaymentIntentId: coursePurchases.stripePaymentIntentId
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
      logger.error('❌ Aucun achat pending trouvé pour:'+ { sessionId, paymentIntentId });
      
      // Créer l'achat si on a les infos nécessaires
      if (courseId && userId) {
        logger.info('🆕 Création d\'un nouvel achat...');
        await createPurchaseFromSession(session, userId, courseId);
        return;
      }
      
      throw new Error('Aucun achat pending trouvé et informations insuffisantes');
    }

    // Mettre à jour tous les achats trouvés
    for (const purchase of existingPurchases) {
      logger.info(`✅ Mise à jour de l'achat ${purchase.id}:`, {
        userId: purchase.userId,
        courseId: purchase.courseId,
        oldStatus: purchase.status
      });

      // 🆕 NOUVEAU : Mettre à jour avec l'email client aussi
      await db
        .update(coursePurchases)
        .set({
          status: 'completed',
          stripePaymentIntentId: paymentIntentId,
          customerEmail: customerEmail, // 👈 Ajouter l'email
          ...(amountPaid && { amount: Math.round(amountPaid / 100) })
        })
        .where(eq(coursePurchases.id, purchase.id));

      logger.info(`✅ Achat ${purchase.id} mis à jour vers 'completed'`);
    }

    logger.info('🎉 SUCCÈS: Tous les achats ont été mis à jour');

  } catch (error) {
    logger.error('💥 ERREUR dans handlePaymentSuccess:'+ error);
    throw error;
  }

  logger.info('🎯 ======================');
  logger.info('🎯 FIN handlePaymentSuccess');
  logger.info('🎯 ======================');
}

// Créer un achat depuis les metadata si pas trouvé en base
async function createPurchaseFromSession(session: any, userId: string, courseId: string) {
  try {
    const sessionId = session.id;
    const paymentIntentId = session.payment_intent;
    const amountPaid = Math.round(session.amount_total / 100);
    const customerEmail = session.customer_details?.email;

    logger.info('🆕 Création achat:', {
      courseId: parseInt(courseId),
      userId: parseInt(userId),
      amount: amountPaid,
      customerEmail
    });

    await db
      .insert(coursePurchases)
      .values({
        userId: parseInt(userId),
        courseId: parseInt(courseId),
        stripeSessionId: sessionId,
        stripePaymentIntentId: paymentIntentId,
        customerEmail: customerEmail, 
        amount: amountPaid,
        currency: session.currency?.toUpperCase() || 'EUR',
        status: 'completed',
        purchasedAt: new Date(),
      });

    logger.info('✅ Achat créé avec succès');

  } catch (error) {
    logger.error('💥 Erreur création achat:', error);
    throw error;
  }
}

export async function handlePaymentFailed(paymentIntent: any) {
  logger.info('❌ Traitement échec de paiement:', paymentIntent.id);
  
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
    logger.error('Erreur mise à jour échec paiement:'+ error);
  }
}