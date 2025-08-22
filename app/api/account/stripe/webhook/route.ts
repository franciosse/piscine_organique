// /app/api/stripe/webhook/route.ts - Version avec debug renforcé
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import { handlePaymentSuccess } from '@/lib/payments/stripe';

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

    // Traiter l'événement de paiement réussi
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      
      console.log('💳 ======================');
      console.log('💳 SESSION DE CHECKOUT:');
      console.log('💳 ======================');
      console.log('- Session ID:', session.id);
      console.log('- Payment Status:', session.payment_status);
      console.log('- Customer Email:', session.customer_details?.email);
      console.log('- Amount Total:', session.amount_total);
      console.log('- Currency:', session.currency);
      console.log('- Metadata:', JSON.stringify(session.metadata, null, 2));
      console.log('- Customer Details:', JSON.stringify(session.customer_details, null, 2));

      if (session.payment_status === 'paid') {
        console.log('💰 PAIEMENT CONFIRMÉ - Début du traitement...');
        
        try {
          await handlePaymentSuccess(session);
          console.log('✅ TRAITEMENT DU PAIEMENT TERMINÉ AVEC SUCCÈS');
        } catch (processError) {
          console.error('💥 ERREUR LORS DU TRAITEMENT DU PAIEMENT:');
          console.error(processError);
          throw processError; // Re-throw pour que Stripe reessaie
        }
      } else {
        console.log('⚠️ PAIEMENT NON CONFIRMÉ:', session.payment_status);
      }
    } else {
      console.log(`ℹ️ Événement non traité: ${event.type}`);
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