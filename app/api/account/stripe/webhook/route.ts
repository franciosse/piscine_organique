// /app/api/stripe/webhook/route.ts - Version améliorée
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { handlePaymentSuccess, handlePaymentFailed, stripe } from '@/lib/payments/stripe';
import logger from '@/lib/logger/logger';


const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  logger.info('🔔 =========================');
  logger.info('🔔 WEBHOOK STRIPE APPELÉ !');
  logger.info('🔔 =========================');
  
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    logger.info('📋 Headers reçus:'+ Object.fromEntries(headersList.entries()));
    logger.info('📧 Signature présente:'+ !!signature);
    logger.info('🔑 Webhook secret configuré:'+ !!webhookSecret);
    logger.info('📦 Body length:'+ body.length);

    if (!signature) {
      logger.error('❌ Signature Stripe manquante');
      return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });
    }

    if (!webhookSecret) {
      logger.error('❌ STRIPE_WEBHOOK_SECRET non configuré !');
      return NextResponse.json({ error: 'Configuration webhook manquante' }, { status: 500 });
    }

    // Vérifier la signature du webhook
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logger.info('✅ Signature webhook validée avec succès');
    } catch (err: any) {
      logger.error('❌ ERREUR DE VÉRIFICATION WEBHOOK:');
      logger.error('- Message:'+ err.message);
      logger.error('- Signature reçue:'+ signature?.substring(0, 50) + '...');
      logger.error('- Secret utilisé:'+webhookSecret?.substring(0, 10) + '...');
      return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
    }

    logger.info('📦 ÉVÉNEMENT STRIPE:');
    logger.info('- Type:'+ event.type);
    logger.info('- ID:'+ event.id);
    logger.info('- Created:'+ new Date(event.created * 1000).toISOString());

    // Traiter différents types d'événements
    switch (event.type) {
      // ✅ Session de checkout complétée (paiement réussi)
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event);
        break;

      // ✅ Paiement réussi (confirmation supplémentaire)
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event);
        break;

      // ❌ Paiement échoué
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event);
        break;

      // ❌ Session expirée
      case 'checkout.session.expired':
        await handleCheckoutExpired(event);
        break;

      // ℹ️ Autres événements non traités
      default:
        logger.info(`ℹ️ Événement non traité: ${event.type}`);
        break;
    }

    logger.info('🔔 ===========================');
    logger.info('🔔 WEBHOOK TERMINÉ AVEC SUCCÈS');
    logger.info('🔔 ===========================');

    return NextResponse.json({ received: true });
  } catch (error: any) {
    logger.error('💥 ===============================');
    logger.error('💥 ERREUR CRITIQUE WEBHOOK STRIPE:');
    logger.error('💥 ===============================');
    logger.error('Message:', error.message);
    logger.error('Stack:', error.stack);
    logger.error('💥 ===============================');
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// Gérer les sessions de checkout complétées
async function handleCheckoutCompleted(event: any) {
  const session = event.data.object;
  
  logger.info('💳 ======================');
  logger.info('💳 SESSION DE CHECKOUT:');
  logger.info('💳 ======================');
  logger.info('- Session ID:'+ session.id);
  logger.info('- Payment Status:'+ session.payment_status);
  logger.info('- Customer Email:'+ session.customer_details?.email);
  logger.info('- Amount Total:'+ session.amount_total);
  logger.info('- Currency:'+ session.currency);
  logger.info('- Payment Intent:'+ session.payment_intent);
  logger.info('- Metadata:'+ JSON.stringify(session.metadata, null, 2));

  if (session.payment_status === 'paid') {
    logger.info('💰 PAIEMENT CONFIRMÉ VIA CHECKOUT - Traitement...');
    
    try {
      await handlePaymentSuccess(session);
      logger.info('✅ CHECKOUT: Traitement terminé avec succès');
    } catch (error) {
      logger.error('💥 CHECKOUT: Erreur lors du traitement:'+ error);
      throw error;
    }
  } else {
    logger.info('⚠️ CHECKOUT: Paiement non confirmé:', session.payment_status);
  }
}

// Gérer les payment_intent réussis (confirmation supplémentaire)
async function handlePaymentIntentSucceeded(event: any) {
  const paymentIntent = event.data.object;
  
  logger.info('💰 ==========================');
  logger.info('💰 PAYMENT INTENT RÉUSSI:');
  logger.info('💰 ==========================');
  logger.info('- Payment Intent ID:'+ paymentIntent.id);
  logger.info('- Amount:'+ paymentIntent.amount);
  logger.info('- Currency:'+ paymentIntent.currency);
  logger.info('- Status:'+ paymentIntent.status);
  logger.info('- Customer:'+ paymentIntent.customer);
  logger.info('- Metadata:'+ JSON.stringify(paymentIntent.metadata, null, 2));

  try {
    // Essayer de confirmer le paiement via Payment Intent aussi
    await handlePaymentSuccess({
      id: paymentIntent.id,
      payment_intent: paymentIntent.id,
      amount_total: paymentIntent.amount,
      currency: paymentIntent.currency,
      customer_details: { email: paymentIntent.receipt_email },
      metadata: paymentIntent.metadata
    });
    logger.info('✅ PAYMENT_INTENT: Traitement terminé avec succès');
  } catch (error) {
    logger.error('💥 PAYMENT_INTENT: Erreur lors du traitement:'+ error);
    // Ne pas re-throw car c'est une confirmation supplémentaire
  }
}

// Gérer les échecs de paiement
async function handlePaymentIntentFailed(event: any) {
  const paymentIntent = event.data.object;
  
  logger.info('❌ ========================');
  logger.info('❌ PAIEMENT ÉCHOUÉ:');
  logger.info('❌ ========================');
  logger.info('- Payment Intent ID:'+ paymentIntent.id);
  logger.info('- Failure Code:'+ paymentIntent.last_payment_error?.code);
  logger.info('- Failure Message:'+ paymentIntent.last_payment_error?.message);
  logger.info('- Customer:'+ paymentIntent.customer);

  try {
    if (handlePaymentFailed) {
      await handlePaymentFailed(paymentIntent);
      logger.info('✅ Échec de paiement traité');
    }
  } catch (error) {
    logger.error('💥 Erreur lors du traitement de l\'échec:'+ error);
  }
}

// Gérer les sessions expirées
async function handleCheckoutExpired(event: any) {
  const session = event.data.object;
  
  logger.info('⏰ ========================');
  logger.info('⏰ SESSION EXPIRÉE:');
  logger.info('⏰ ========================');
  logger.info('- Session ID:'+ session.id);
  logger.info('- Customer Email:'+ session.customer_details?.email);
  logger.info('- Metadata:'+ JSON.stringify(session.metadata, null, 2));

  // Optionnel : nettoyer les enregistrements pending expirés
  // ou envoyer un email de rappel à l'utilisateur
}