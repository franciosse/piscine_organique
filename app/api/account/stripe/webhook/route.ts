// /app/api/stripe/webhook/route.ts - Version améliorée
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { handlePaymentSuccess, handlePaymentFailed, stripe } from '@/lib/payments/stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  console.log('🔔 =========================');
  console.log('🔔 WEBHOOK STRIPE APPELÉ !');
  console.log('🔔 =========================');
  
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    console.log('📋 Headers reçus:', Object.fromEntries(headersList.entries()));
    console.log('📧 Signature présente:', !!signature);
    console.log('🔑 Webhook secret configuré:', !!webhookSecret);
    console.log('📦 Body length:', body.length);

    if (!signature) {
      console.error('❌ Signature Stripe manquante');
      return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });
    }

    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET non configuré !');
      return NextResponse.json({ error: 'Configuration webhook manquante' }, { status: 500 });
    }

    // Vérifier la signature du webhook
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Signature webhook validée avec succès');
    } catch (err: any) {
      console.error('❌ ERREUR DE VÉRIFICATION WEBHOOK:');
      console.error('- Message:', err.message);
      console.error('- Signature reçue:', signature?.substring(0, 50) + '...');
      console.error('- Secret utilisé:', webhookSecret?.substring(0, 10) + '...');
      return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
    }

    console.log('📦 ÉVÉNEMENT STRIPE:');
    console.log('- Type:', event.type);
    console.log('- ID:', event.id);
    console.log('- Created:', new Date(event.created * 1000).toISOString());

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
        console.log(`ℹ️ Événement non traité: ${event.type}`);
        break;
    }

    console.log('🔔 ===========================');
    console.log('🔔 WEBHOOK TERMINÉ AVEC SUCCÈS');
    console.log('🔔 ===========================');

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('💥 ===============================');
    console.error('💥 ERREUR CRITIQUE WEBHOOK STRIPE:');
    console.error('💥 ===============================');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('💥 ===============================');
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// Gérer les sessions de checkout complétées
async function handleCheckoutCompleted(event: any) {
  const session = event.data.object;
  
  console.log('💳 ======================');
  console.log('💳 SESSION DE CHECKOUT:');
  console.log('💳 ======================');
  console.log('- Session ID:', session.id);
  console.log('- Payment Status:', session.payment_status);
  console.log('- Customer Email:', session.customer_details?.email);
  console.log('- Amount Total:', session.amount_total);
  console.log('- Currency:', session.currency);
  console.log('- Payment Intent:', session.payment_intent);
  console.log('- Metadata:', JSON.stringify(session.metadata, null, 2));

  if (session.payment_status === 'paid') {
    console.log('💰 PAIEMENT CONFIRMÉ VIA CHECKOUT - Traitement...');
    
    try {
      await handlePaymentSuccess(session);
      console.log('✅ CHECKOUT: Traitement terminé avec succès');
    } catch (error) {
      console.error('💥 CHECKOUT: Erreur lors du traitement:', error);
      throw error;
    }
  } else {
    console.log('⚠️ CHECKOUT: Paiement non confirmé:', session.payment_status);
  }
}

// Gérer les payment_intent réussis (confirmation supplémentaire)
async function handlePaymentIntentSucceeded(event: any) {
  const paymentIntent = event.data.object;
  
  console.log('💰 ==========================');
  console.log('💰 PAYMENT INTENT RÉUSSI:');
  console.log('💰 ==========================');
  console.log('- Payment Intent ID:', paymentIntent.id);
  console.log('- Amount:', paymentIntent.amount);
  console.log('- Currency:', paymentIntent.currency);
  console.log('- Status:', paymentIntent.status);
  console.log('- Customer:', paymentIntent.customer);
  console.log('- Metadata:', JSON.stringify(paymentIntent.metadata, null, 2));

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
    console.log('✅ PAYMENT_INTENT: Traitement terminé avec succès');
  } catch (error) {
    console.error('💥 PAYMENT_INTENT: Erreur lors du traitement:', error);
    // Ne pas re-throw car c'est une confirmation supplémentaire
  }
}

// Gérer les échecs de paiement
async function handlePaymentIntentFailed(event: any) {
  const paymentIntent = event.data.object;
  
  console.log('❌ ========================');
  console.log('❌ PAIEMENT ÉCHOUÉ:');
  console.log('❌ ========================');
  console.log('- Payment Intent ID:', paymentIntent.id);
  console.log('- Failure Code:', paymentIntent.last_payment_error?.code);
  console.log('- Failure Message:', paymentIntent.last_payment_error?.message);
  console.log('- Customer:', paymentIntent.customer);

  try {
    if (handlePaymentFailed) {
      await handlePaymentFailed(paymentIntent);
      console.log('✅ Échec de paiement traité');
    }
  } catch (error) {
    console.error('💥 Erreur lors du traitement de l\'échec:', error);
  }
}

// Gérer les sessions expirées
async function handleCheckoutExpired(event: any) {
  const session = event.data.object;
  
  console.log('⏰ ========================');
  console.log('⏰ SESSION EXPIRÉE:');
  console.log('⏰ ========================');
  console.log('- Session ID:', session.id);
  console.log('- Customer Email:', session.customer_details?.email);
  console.log('- Metadata:', JSON.stringify(session.metadata, null, 2));

  // Optionnel : nettoyer les enregistrements pending expirés
  // ou envoyer un email de rappel à l'utilisateur
}