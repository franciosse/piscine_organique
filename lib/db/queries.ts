import { desc, and, eq, isNull, like, or, count, sql, ilike } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, users } from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/session';

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
  // Total utilisateurs actifs
  const totalResult = await db
    .select({ count: count() })
    .from(users)
    .where(isNull(users.deletedAt));
  
  // Par rôle
  const byRoleResult = await db
    .select({
      role: users.role,
      count: count()
    })
    .from(users)
    .where(isNull(users.deletedAt))
    .groupBy(users.role);
  
  // Vérifiés vs non-vérifiés
  const verifiedResult = await db
    .select({ count: count() })
    .from(users)
    .where(and(isNull(users.deletedAt), eq(users.isVerified, true)));
  
  const unverifiedResult = await db
    .select({ count: count() })
    .from(users)
    .where(and(isNull(users.deletedAt), eq(users.isVerified, false)));
  
  // Créés dans les 7 derniers jours
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentResult = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(
        isNull(users.deletedAt),
        sql`${users.createdAt} >= ${sevenDaysAgo}`
      )
    );
  
  // Supprimés (soft deleted)
  const deletedResult = await db
    .select({ count: count() })
    .from(users)
    .where(sql`${users.deletedAt} IS NOT NULL`);
  
  return {
    total: totalResult[0].count,
    byRole: byRoleResult.reduce((acc, item) => {
      acc[item.role] = item.count;
      return acc;
    }, {} as Record<string, number>),
    verified: verifiedResult[0].count,
    unverified: unverifiedResult[0].count,
    recentlyCreated: recentResult[0].count,
    deletedCount: deletedResult[0].count
  };
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