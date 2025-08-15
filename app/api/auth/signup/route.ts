// /app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { hashPassword, setSession } from '@/lib/auth/session';
import { generateEmailVerificationToken } from '@/lib/auth/emailVerification';
import { sendVerificationEmail } from '@/lib/email/emailService';

const signUpSchema = z.object({
  email: z.string().email().toLowerCase().trim(), // 👈 Normaliser l'email
  password: z.string().min(8).max(100), // 👈 Limite max pour sécurité
  redirect: z.string().optional(),
  priceId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 🛡️ Validation des données d'entrée
    const body = await request.json();
    const data = signUpSchema.parse(body);

    console.log(`📝 Tentative d'inscription pour: ${data.email}`);

    // 🔍 Vérifier si l'utilisateur existe déjà
    const existingUser = await db
      .select({ id: users.id, email: users.email, isVerified: users.isVerified })
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existingUser.length > 0) {
      console.log(`⚠️ Utilisateur existant trouvé: ${data.email}`);
      return NextResponse.json(
        { 
          error: 'Un compte avec cet email existe déjà. Essayez de vous connecter ou de réinitialiser votre mot de passe.',
          code: 'USER_EXISTS'
        },
        { status: 409 } // 409 Conflict
      );
    }

    // 🔒 Hachage du mot de passe
    const passwordHash = await hashPassword(data.password);

    // 📝 Préparer les données utilisateur (SANS l'ID)
    const newUserData = {
      email: data.email,
      passwordHash,
      role: 'student' as const, // 👈 Rôle par défaut: student
      isVerified: false,
    };

    console.log('🔄 Insertion du nouvel utilisateur...');

    // 💾 Créer l'utilisateur (l'ID sera auto-généré)
    const [createdUser] = await db
      .insert(users)
      .values(newUserData)
      .returning();

    if (!createdUser) {
      console.error('❌ Échec de création utilisateur');
      return NextResponse.json(
        { error: 'Impossible de créer le compte. Veuillez réessayer.' },
        { status: 500 }
      );
    }

    console.log(`✅ Utilisateur créé avec ID: ${createdUser.id}`);

    // 📧 Générer token de vérification email
    try {
      const token = await generateEmailVerificationToken(createdUser.id);
      await sendVerificationEmail(data.email, token);
      console.log('📧 Email de vérification envoyé');
    } catch (emailError) {
      console.error('⚠️ Erreur envoi email:', emailError);
      // Ne pas faire échouer l'inscription si l'email échoue
    }

    // 🍪 Définir la session
    console.log('🍪 Création de la session...');
    await setSession(createdUser);

    console.log(`🎉 Inscription réussie pour ${data.email}`);

    return NextResponse.json({
      success: true,
      message: 'Compte créé avec succès ! Un email de vérification a été envoyé.',
      redirect: data.redirect || '/dashboard',
      priceId: data.priceId || null,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        role: createdUser.role,
        isVerified: createdUser.isVerified,
      },
    });

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'inscription:', error);

    // 🔍 Gestion d'erreurs spécifiques
    if (error.code === '23505') { // PostgreSQL unique violation
      return NextResponse.json(
        { 
          error: 'Un compte avec cet email existe déjà.',
          code: 'DUPLICATE_EMAIL'
        },
        { status: 409 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Données invalides.',
          details: error.errors,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Une erreur inattendue s\'est produite. Veuillez réessayer.',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}