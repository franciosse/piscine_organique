// /app/courses/[courseId]/success/page.tsx - Version corrigée
import { db } from '@/lib/db/drizzle';
import { courses, users, coursePurchases } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { stripe } from '@/lib/payments/stripe';
import { AutoLoginComponent } from '@/components/auth/AutoLoginComponent';
import { Suspense } from 'react';
import logger from '@/lib/logger/logger';


interface PageProps {
  params: Promise<{ courseId: string; locale?: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

// ⚠️ IMPORTANT: Cette page n'est PAS protégée car l'utilisateur peut ne pas être connecté

async function SuccessContent({ courseId, sessionId }: { courseId: number; sessionId: string }) {
  try {
    logger.info('🎉 Page de succès - Session ID:'+ sessionId);

    // Récupérer les détails de la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    logger.info('💳 Session Stripe récupérée:'+ JSON.stringify({
      id: session.id,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email
    }));

    if (session.payment_status !== 'paid') {
      return <AutoLoginComponent 
        status="pending" 
        message="Paiement en cours de traitement..." 
        courseId={courseId}
      />;
    }

    // Récupérer le cours
    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (course.length === 0) {
      throw new Error('Cours introuvable');
    }

    // Récupérer l'achat pour vérifier le statut et l'utilisateur
    const purchase = await db
      .select({
        userId: coursePurchases.userId,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
          createdViaStripe: users.createdViaStripe,
        }
      })
      .from(coursePurchases)
      .leftJoin(users, eq(coursePurchases.userId, users.id))
      .where(eq(coursePurchases.stripeSessionId, sessionId))
      .limit(1);

    logger.info('🔍 Achat trouvé:'+ purchase[0] ? 'Oui' : 'Non');

    if (purchase.length === 0) {
      // L'achat n'est pas encore traité par le webhook
      return <AutoLoginComponent 
        status="processing" 
        message="Traitement de votre achat en cours..." 
        courseId={courseId}
        sessionId={sessionId}
        userEmail={session.customer_details?.email? session.customer_details?.email : 'email unknow'}
      />;
    }

    const user = purchase[0].user;
    if (!user) {
      logger.error('Utilisateur introuvable:' + session.customer_details?.email)
      throw new Error('Utilisateur introuvable');
    }

    logger.info('👤 Utilisateur trouvé:'+ {
      id: user.id,
      email: user.email,
      createdViaStripe: user.createdViaStripe
    });

    const isNewAccount = user.createdViaStripe || false;
    const userEmail = user.email || session.customer_details?.email;

    // ✅ Passer les données utilisateur au composant client pour la connexion automatique
    return <AutoLoginComponent 
      status="success" 
      course={course[0]}
      user={user}
      isNewAccount={isNewAccount}
      userEmail={userEmail!}
      sessionId={sessionId}
      courseId={courseId}
    />;

  } catch (error) {
    logger.error('❌ Erreur page de succès:'+ error);
    return <AutoLoginComponent 
      status="error" 
      message="Erreur lors de la récupération des informations de paiement"
      courseId={courseId}
    />;
  }
}

export default async function CourseSuccessPage({ params, searchParams }: PageProps) {
  // ✅ Await les params et searchParams dans Next.js 15
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const courseId = parseInt(resolvedParams.courseId);
  const sessionId = resolvedSearchParams.session_id;

  if (!sessionId) {
    return <AutoLoginComponent 
      status="error" 
      message="Session de paiement invalide"
      courseId={courseId}
    />;
  }

  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={
        <div className="max-w-md mx-auto text-center">
          <p>Chargement des informations de paiement...</p>
        </div>
      }>
        <SuccessContent courseId={courseId} sessionId={sessionId} />
      </Suspense>
    </div>
  );
}