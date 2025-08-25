import { desc, and, eq, isNull, like, or, ilike, count, sum, avg, gte, sql, isNotNull } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, users, coursePurchases, courses, lessons, courseChapters, studentProgress } from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/session';
import logger from '../logger/logger';

export async function getUser() {
  try {
    // ✅ Await sur cookies() - CRITIQUE pour Next.js 15+
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    const sessionData = await verifyToken(sessionCookie.value);
    if (
      !sessionData ||
      !sessionData.user ||
      typeof sessionData.user.id !== 'number'
    ) {
      return null;
    }

    if (new Date(sessionData.expires) < new Date()) {
      return null;
    }

    const user = await db
      .select()
      .from(users)
      .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
      .limit(1);

    if (user.length === 0) {
      return null;
    }

    return user[0];
    
  } catch (error) {
    console.warn('Invalid session in getUser:', error);
    return null;
  }
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

 /**
 * Récupérer tous les utilisateurs avec filtres et pagination
 */
export async function getAllUsersWithFilters(options: {
  role?: string;
  isVerified?: boolean;
  search?: string;
  page?: number;
  limit?: number;
} = {}) {
  const { role, isVerified, search, page = 1, limit = 10 } = options;
  
  // Construction des conditions WHERE
  const conditions = [isNull(users.deletedAt)];
  
  if (role) {
    conditions.push(eq(users.role, role));
  }
  
  if (isVerified !== undefined) {
    conditions.push(eq(users.isVerified, isVerified));
  }
  
  if (search && search.trim()) {
    const searchCondition = or(
      ilike(users.name, `%${search}%`),
      ilike(users.email, `%${search}%`)
    );
  
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }
  
  // Compter le total pour la pagination
  const totalCountResult = await db
    .select({ count: count() })
    .from(users)
    .where(and(...conditions));
  
  const totalCount = totalCountResult[0].count;
  
  // Récupérer les utilisateurs avec pagination
  const offset = (page - 1) * limit;
  const usersResult = await db
    .select()
    .from(users)
    .where(and(...conditions))
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);
  
  return {
    data: usersResult,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page * limit < totalCount,
      hasPrev: page > 1
    }
  };
}

/**
 * Récupérer un utilisateur par ID
 */
export async function getUserById(id: number) {
  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

/**
 * Créer un nouvel utilisateur
 */
export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
  role?: string;
  isVerified?: boolean;
  createdBy?: number;
}) {
  const hashedPassword = await hashPassword(userData.password);
  
  const result = await db
    .insert(users)
    .values({
      name: userData.name,
      email: userData.email,
      passwordHash: hashedPassword,
      role: userData.role || 'student',
      isVerified: userData.isVerified || false,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();
  
  return result[0];
}

/**
 * Mettre à jour un utilisateur
 */
export async function updateUser(
  id: number, 
  updateData: {
    name?: string;
    email?: string;
    role?: string;
    isVerified?: boolean;
    updatedBy?: number;
    updatedAt?: Date;
  }
) {
  const result = await db
    .update(users)
    .set({
      ...updateData,
      updatedAt: updateData.updatedAt || new Date()
    })
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .returning();
  
  return result.length > 0 ? result[0] : null;
}

/**
 * Supprimer un utilisateur (soft delete)
 */
export async function deleteUser(
  id: number, 
  deleteData: {
    deletedBy?: number;
    deletedAt?: Date;
  }
) {
  const result = await db
    .update(users)
    .set({
      deletedAt: deleteData.deletedAt || new Date(),
      updatedAt: new Date()
    })
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .returning();
  
  return result.length > 0 ? result[0] : null;
}

/**
 * Toggle le statut de vérification d'un utilisateur
 */
export async function toggleUserVerification(
  id: number,
  metadata: {
    verifiedBy?: number;
    verifiedAt?: Date;
  }
) {
  // D'abord récupérer l'état actuel
  const currentUser = await getUserById(id);
  if (!currentUser) return null;
  
  const result = await db
    .update(users)
    .set({
      isVerified: !currentUser.isVerified,
      updatedAt: new Date()
    })
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .returning();
  
  return result.length > 0 ? result[0] : null;
}

/**
 * Changer le rôle d'un utilisateur
 */
export async function updateUserRole(
  id: number,
  newRole: string,
  metadata: {
    roleChangedBy?: number;
    roleChangedAt?: Date;
  }
) {
  const result = await db
    .update(users)
    .set({
      role: newRole,
      updatedAt: new Date()
    })
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .returning();
  
  return result.length > 0 ? result[0] : null;
}

/**
 * Actions en masse sur les utilisateurs
 */
export async function bulkUpdateUsers(
  userIds: number[],
  updateData: {
    isVerified?: boolean;
    role?: string;
    updatedBy?: number;
  }
) {
  const result = await db
    .update(users)
    .set({
      ...updateData,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(users.id, sql`ANY(${userIds})`),
        isNull(users.deletedAt)
      )
    )
    .returning();
  
  return {
    count: result.length,
    updatedUsers: result
  };
}

/**
 * Suppression en masse (soft delete)
 */
export async function bulkDeleteUsers(
  userIds: number[],
  deleteData: {
    deletedBy?: number;
    deletedAt?: Date;
  }
) {
  const result = await db
    .update(users)
    .set({
      deletedAt: deleteData.deletedAt || new Date(),
      updatedAt: new Date()
    })
    .where(
      and(
        eq(users.id, sql`ANY(${userIds})`),
        isNull(users.deletedAt)
      )
    )
    .returning();
  
  return {
    count: result.length,
    deletedUsers: result
  };
}

/**
 * Statistiques des utilisateurs
 */
export async function getUserStats() {
  try {
    logger.info('📊 Début de la récupération des statistiques utilisateurs');

    // 1. Total d'utilisateurs (non supprimés)
    logger.info('🔍 Récupération du total d\'utilisateurs...');
    const [totalResult] = await db
      .select({ count: count() })
      .from(users)
      .where(isNull(users.deletedAt));

    const total = Number(totalResult.count);
    logger.info(`✅ Total utilisateurs: ${total}`);

    // 2. Distribution par rôle
    logger.info('🔍 Récupération de la distribution par rôle...');
    const roleDistribution = await db
      .select({ 
        role: users.role, 
        count: count() 
      })
      .from(users)
      .where(isNull(users.deletedAt))
      .groupBy(users.role);

    const byRole = {
      admin: Number(roleDistribution.find(r => r.role === 'admin')?.count || 0),
      student: Number(roleDistribution.find(r => r.role === 'student')?.count || 0),
    };
    logger.info(`✅ Distribution par rôle:`, byRole);

    // 3. Utilisateurs vérifiés
    logger.info('🔍 Récupération des utilisateurs vérifiés...');
    const [verifiedResult] = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          isNull(users.deletedAt),
          eq(users.isVerified, true)
        )
      );

    const verified = Number(verifiedResult.count);
    logger.info(`✅ Utilisateurs vérifiés: ${verified}`);

    // 4. Utilisateurs non vérifiés
    logger.info('🔍 Récupération des utilisateurs non vérifiés...');
    const [unverifiedResult] = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          isNull(users.deletedAt),
          eq(users.isVerified, false)
        )
      );

    const unverified = Number(unverifiedResult.count);
    logger.info(`✅ Utilisateurs non vérifiés: ${unverified}`);

    // 5. Utilisateurs récemment créés (7 derniers jours)
    logger.info('🔍 Récupération des utilisateurs récents...');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentResult] = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          isNull(users.deletedAt),
          gte(users.createdAt, sevenDaysAgo)
        )
      );

    const recentlyCreated = Number(recentResult.count);
    logger.info(`✅ Utilisateurs créés dans les 7 derniers jours: ${recentlyCreated}`);

    // 6. Utilisateurs supprimés (avec deletedAt non null)
    logger.info('🔍 Récupération des utilisateurs supprimés...');
    const [deletedResult] = await db
      .select({ count: count() })
      .from(users)
      .where(sql`${users.deletedAt} IS NOT NULL`);

    const deletedCount = Number(deletedResult.count);
    logger.info(`✅ Utilisateurs supprimés: ${deletedCount}`);

    const stats = {
      total,
      byRole,
      verified,
      unverified,
      recentlyCreated,
      deletedCount,
    };

    logger.info('✅ Statistiques générées avec succès:', stats);
    return stats;

  } catch (error) {
    logger.error('❌ Erreur dans getUserStats:', error);
    
    // Log détaillé de l'erreur pour debug
    if (error instanceof Error) {
      logger.error('❌ Message d\'erreur:', error.message);
      logger.error('❌ Stack trace:', error.stack);
    }
    
    // Retourner des valeurs par défaut en cas d'erreur
    logger.warn('⚠️ Retour de valeurs par défaut pour les statistiques');
    return {
      total: 0,
      byRole: {
        admin: 0,
        student: 0,
      },
      verified: 0,
      unverified: 0,
      recentlyCreated: 0,
      deletedCount: 0,
    };
  }
}

/**
 * Rechercher des utilisateurs par email ou nom
 */
export async function searchUsers(query: string, limit: number = 10) {
  const searchTerm = `%${query}%`;
  
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isVerified: users.isVerified
    })
    .from(users)
    .where(
      and(
        isNull(users.deletedAt),
        or(
          like(users.name, searchTerm),
          like(users.email, searchTerm)
        )
      )
    )
    .limit(limit)
    .orderBy(users.name);
  
  return result;
}

/**
 * Vérifier si un email existe déjà
 */
export async function emailExists(email: string, excludeUserId?: number) {
  const conditions = [
    eq(users.email, email),
    isNull(users.deletedAt)
  ];
  
  if (excludeUserId) {
    conditions.push(sql`${users.id} != ${excludeUserId}`);
  }
  
  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(and(...conditions))
    .limit(1);
  
  return result.length > 0;
}

/**
 * Récupérer les utilisateurs récemment créés
 */
export async function getRecentUsers(days: number = 7, limit: number = 10) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const result = await db
    .select()
    .from(users)
    .where(
      and(
        isNull(users.deletedAt),
        sql`${users.createdAt} >= ${startDate}`
      )
    )
    .orderBy(desc(users.createdAt))
    .limit(limit);
  
  return result;
}

export async function getCourseStats() {
  try {
    logger.info('📊 Début de la récupération des statistiques de cours');

    // 1. Total de cours
    logger.info('🔍 Récupération du total de cours...');
    const [totalResult] = await db
      .select({ count: count() })
      .from(courses);

    const total = Number(totalResult.count);
    logger.info(`✅ Total cours: ${total}`);

    // 2. Cours publiés vs non publiés
    logger.info('🔍 Récupération du statut de publication...');
    const [publishedResult] = await db
      .select({ count: count() })
      .from(courses)
      .where(isNotNull(courses.published));

    const [unpublishedResult] = await db
      .select({ count: count() })
      .from(courses)
      .where(isNull(courses.published));

    const published = Number(publishedResult.count);
    const unpublished = Number(unpublishedResult.count);
    logger.info(`✅ Cours publiés: ${published}, non publiés: ${unpublished}`);

    // 3. Distribution par niveau de difficulté
    logger.info('🔍 Récupération de la distribution par difficulté...');
    const difficultyDistribution = await db
      .select({ 
        difficulty: courses.difficultyLevel, 
        count: count() 
      })
      .from(courses)
      .groupBy(courses.difficultyLevel);

    const byDifficulty = {
      beginner: Number(difficultyDistribution.find(d => d.difficulty === 'beginner')?.count || 0),
      intermediate: Number(difficultyDistribution.find(d => d.difficulty === 'intermediate')?.count || 0),
      advanced: Number(difficultyDistribution.find(d => d.difficulty === 'advanced')?.count || 0),
    };
    logger.info(`✅ Distribution par difficulté:`, byDifficulty);

    // 4. Revenus totaux (si vous avez la table coursePurchases)
    let totalRevenue = 0;
    let totalPurchases = 0;
    try {
      const [revenueResult] = await db
        .select({ 
          totalRevenue: sum(coursePurchases.amount),
          totalPurchases: count()
        })
        .from(coursePurchases)
        .where(eq(coursePurchases.status, 'completed'));

      totalRevenue = Number(revenueResult.totalRevenue || 0);
      totalPurchases = Number(revenueResult.totalPurchases || 0);
      logger.info(`✅ Revenus totaux: ${totalRevenue / 100}€, Achats: ${totalPurchases}`);
    } catch (error) {
      logger.warn('⚠️ Table coursePurchases non disponible, revenus = 0');
    }

    // 5. Cours récemment créés (7 derniers jours)
    logger.info('🔍 Récupération des cours récents...');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentResult] = await db
      .select({ count: count() })
      .from(courses)
      .where(gte(courses.createdAt, sevenDaysAgo));

    const recentlyCreated = Number(recentResult.count);
    logger.info(`✅ Cours créés dans les 7 derniers jours: ${recentlyCreated}`);

    // 6. Cours avec chapitres vs sans chapitres (si vous avez la table courseChapters)
    let withChapters = 0;
    let withoutChapters = 0;
    try {
      const [withChaptersResult] = await db
        .select({ count: count(sql`DISTINCT ${courses.id}`) })
        .from(courses)
        .innerJoin(courseChapters, eq(courses.id, courseChapters.courseId));

      withChapters = Number(withChaptersResult.count);
      withoutChapters = total - withChapters;
      logger.info(`✅ Cours avec chapitres: ${withChapters}, sans chapitres: ${withoutChapters}`);
    } catch (error) {
      logger.warn('⚠️ Table courseChapters non disponible');
      withChapters = 0;
      withoutChapters = total;
    }

    const stats = {
      total,
      published,
      unpublished,
      byDifficulty,
      revenue: {
        total: totalRevenue,
        totalPurchases,
        averagePrice: totalPurchases > 0 ? Math.round(totalRevenue / totalPurchases) : 0
      },
      recentlyCreated,
      structure: {
        withChapters,
        withoutChapters
      }
    };

    logger.info('✅ Statistiques cours générées avec succès:', stats);
    return stats;

  } catch (error) {
    logger.error('❌ Erreur dans getCourseStats:', error);
    
    // Log détaillé de l'erreur pour debug
    if (error instanceof Error) {
      logger.error('❌ Message d\'erreur:', error.message);
      logger.error('❌ Stack trace:', error.stack);
    }
    
    // Retourner des valeurs par défaut en cas d'erreur
    logger.warn('⚠️ Retour de valeurs par défaut pour les statistiques de cours');
    return {
      total: 0,
      published: 0,
      unpublished: 0,
      byDifficulty: {
        beginner: 0,
        intermediate: 0,
        advanced: 0,
      },
      revenue: {
        total: 0,
        totalPurchases: 0,
        averagePrice: 0
      },
      recentlyCreated: 0,
      structure: {
        withChapters: 0,
        withoutChapters: 0
      }
    };
  }
}

// 🆕 Version simplifiée pour debug si besoin
export async function getCourseStatsSimple() {
  try {
    const allCourses = await db.select().from(courses).limit(5);
    
    return {
      total: allCourses.length,
      sample: allCourses.map(c => ({ 
        id: c.id, 
        title: c.title, 
        published: !!c.published,
        difficulty: c.difficultyLevel 
      }))
    };
  } catch (error) {
    logger.error('❌ Erreur getCourseStatsSimple:', error);
    throw error;
  }
}