// /lib/services/userService.ts
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';

export interface CreateUserResult {
  userId: number;
  isNewUser: boolean;
  temporaryPassword?: string;
}

export interface CreateUserOptions {
  email: string;
  name?: string;
  createdViaStripe?: boolean;
  isVerified?: boolean;
}

/**
 * Trouve un utilisateur par email ou le crée s'il n'existe pas
 */
export async function findOrCreateUser(options: CreateUserOptions): Promise<CreateUserResult> {
  const { email, name, createdViaStripe = false, isVerified = false } = options;

  try {
    console.log('🔍 Recherche utilisateur avec email:', email);

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      console.log('✅ Utilisateur existant trouvé:', existingUser[0].id);
      return {
        userId: existingUser[0].id,
        isNewUser: false,
      };
    }

    // Créer un nouveau compte
    console.log('🆕 Création d\'un nouveau compte pour:', email);
    
    const temporaryPassword = randomBytes(16).toString('hex');
    const hashedPassword = await hash(temporaryPassword, 12);
    
    // Générer un nom à partir de l'email si pas fourni
    const userName = name || email.split('@')[0];
    
    const newUser = await db
      .insert(users)
      .values({
        email,
        name: userName,
        passwordHash: hashedPassword,
        isVerified: isVerified,
        createdViaStripe,
        needsPasswordReset: createdViaStripe, // Besoin de changer le mot de passe si créé via Stripe
      })
      .returning();

    console.log('✅ Nouveau compte créé avec ID:', newUser[0].id);

    return {
      userId: newUser[0].id,
      isNewUser: true,
      temporaryPassword: createdViaStripe ? temporaryPassword : undefined,
    };

  } catch (error) {
    console.error('❌ Erreur lors de la création/recherche utilisateur:', error);
    throw new Error('Erreur lors de la gestion du compte utilisateur');
  }
}

/**
 * Trouve un utilisateur par ID
 */
export async function findUserById(userId: number) {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user[0] || null;
  } catch (error) {
    console.error('Erreur lors de la recherche utilisateur par ID:', error);
    return null;
  }
}

/**
 * Met à jour le flag needsPasswordReset pour un utilisateur
 */
export async function updatePasswordResetFlag(userId: number, needsReset: boolean) {
  try {
    await db
      .update(users)
      .set({ needsPasswordReset: needsReset })
      .where(eq(users.id, userId));
  } catch (error) {
    console.error('Erreur mise à jour flag password reset:', error);
  }
}