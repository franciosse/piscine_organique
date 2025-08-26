// /lib/services/purchaseService.ts
import { db } from '@/lib/db/drizzle';
import { coursePurchases, courses } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import logger from '@/lib/logger/logger';


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
  userEmail: string;
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
    logger.error('Erreur recherche achat par session:' + error);
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
    logger.error('Erreur recherche achat utilisateur:' +  error);
    return null;
  }
}

/**
 * Crée ou met à jour un achat
 */
export async function createOrUpdatePurchase(data: CreatePurchaseData): Promise<PurchaseResult> {
  const { userId, courseId, stripeSessionId, stripePaymentIntentId, amount } = data;

  try {
    logger.info('💰 Traitement achat:' + { userId, courseId, stripeSessionId });

    // Vérifier si l'achat existe déjà par session
    const existingBySession = await findPurchaseBySession(stripeSessionId);
    if (existingBySession) {
      logger.info('ℹ️ Achat déjà enregistré pour cette session');
      return {
        success: true,
        isNewPurchase: false,
        purchaseId: existingBySession.id,
        userEmail:existingBySession.customerEmail,
      };
    }

    // Vérifier si l'utilisateur a déjà acheté ce cours
    const existingByUser = await findUserPurchase(userId, courseId);
    
    if (existingByUser) {
      logger.info('🔄 Mise à jour achat existant avec infos Stripe');
      
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
        userEmail: existingByUser.customerEmail,
      };
    }

    const getCustomerEmail = (purchase: any) => {
      return purchase?.customerEmail;
    };
    const userEmail = getCustomerEmail(existingBySession) || getCustomerEmail(existingByUser);

    // Créer un nouvel achat
    logger.info('🆕 Création d\'un nouvel achat');
    
    const newPurchase = await db
      .insert(coursePurchases)
      .values({
        userId,
        courseId,
        customerEmail: userEmail,
        stripeSessionId,
        stripePaymentIntentId,
        amount,
        purchasedAt: new Date(),
      })
      .returning();

    logger.info('✅ Achat créé avec ID:' +  newPurchase[0].id);

    return {
      success: true,
      isNewPurchase: true,
      purchaseId: newPurchase[0].id,
      userEmail : userEmail,
    };

  } catch (error) {
    logger.error('❌ Erreur lors de la création/mise à jour de l\'achat:' + error);
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
    logger.error('Erreur récupération cours:' + error);
    return null;
  }
}