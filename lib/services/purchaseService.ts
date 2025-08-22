// /lib/services/purchaseService.ts
import { db } from '@/lib/db/drizzle';
import { coursePurchases, courses } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export interface CreatePurchaseData {
  userId: number;
  courseId: number;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  amount: number;
}

export interface PurchaseResult {
  success: boolean;
  isNewPurchase: boolean;
  purchaseId: number;
}

/**
 * Vérifie si un achat existe déjà par session Stripe
 */
export async function findPurchaseBySession(sessionId: string) {
  try {
    const purchase = await db
      .select()
      .from(coursePurchases)
      .where(eq(coursePurchases.stripeSessionId, sessionId))
      .limit(1);

    return purchase[0] || null;
  } catch (error) {
    console.error('Erreur recherche achat par session:', error);
    return null;
  }
}

/**
 * Vérifie si un utilisateur a déjà acheté un cours
 */
export async function findUserPurchase(userId: number, courseId: number) {
  try {
    const purchase = await db
      .select()
      .from(coursePurchases)
      .where(
        and(
          eq(coursePurchases.userId, userId),
          eq(coursePurchases.courseId, courseId)
        )
      )
      .limit(1);

    return purchase[0] || null;
  } catch (error) {
    console.error('Erreur recherche achat utilisateur:', error);
    return null;
  }
}

/**
 * Crée ou met à jour un achat
 */
export async function createOrUpdatePurchase(data: CreatePurchaseData): Promise<PurchaseResult> {
  const { userId, courseId, stripeSessionId, stripePaymentIntentId, amount } = data;

  try {
    console.log('💰 Traitement achat:', { userId, courseId, stripeSessionId });

    // Vérifier si l'achat existe déjà par session
    const existingBySession = await findPurchaseBySession(stripeSessionId);
    if (existingBySession) {
      console.log('ℹ️ Achat déjà enregistré pour cette session');
      return {
        success: true,
        isNewPurchase: false,
        purchaseId: existingBySession.id,
      };
    }

    // Vérifier si l'utilisateur a déjà acheté ce cours
    const existingByUser = await findUserPurchase(userId, courseId);
    
    if (existingByUser) {
      console.log('🔄 Mise à jour achat existant avec infos Stripe');
      
      // Mettre à jour l'achat existant avec les infos Stripe
      await db
        .update(coursePurchases)
        .set({
          stripeSessionId,
          stripePaymentIntentId,
          amount,
        })
        .where(eq(coursePurchases.id, existingByUser.id));

      return {
        success: true,
        isNewPurchase: false,
        purchaseId: existingByUser.id,
      };
    }

    // Créer un nouvel achat
    console.log('🆕 Création d\'un nouvel achat');
    
    const newPurchase = await db
      .insert(coursePurchases)
      .values({
        userId,
        courseId,
        stripeSessionId,
        stripePaymentIntentId,
        amount,
        purchasedAt: new Date(),
      })
      .returning();

    console.log('✅ Achat créé avec ID:', newPurchase[0].id);

    return {
      success: true,
      isNewPurchase: true,
      purchaseId: newPurchase[0].id,
    };

  } catch (error) {
    console.error('❌ Erreur lors de la création/mise à jour de l\'achat:', error);
    throw new Error('Erreur lors de l\'enregistrement de l\'achat');
  }
}

/**
 * Récupère les détails d'un cours
 */
export async function getCourseById(courseId: number) {
  try {
    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    return course[0] || null;
  } catch (error) {
    console.error('Erreur récupération cours:', error);
    return null;
  }
}