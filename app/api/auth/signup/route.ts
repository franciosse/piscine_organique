// /app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { hashPassword, setSession } from '@/lib/auth/session';
import { generateEmailVerificationToken } from '@/lib/auth/emailVerification';
import { sendVerificationEmail } from '@/lib/email/emailService';
import { getSecurityContext, validateSecurity } from '@/lib/security/antiSpam';

const signUpSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(100),
  redirect: z.string().optional(),
  priceId: z.string().optional(),
  // Champs de sécurité (ajoutés par le frontend)
  timestamp: z.number().optional(),
  userAgent: z.string().optional(),
  timeOnPage: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = signUpSchema.parse(body);

    console.log(`📝 Tentative d'inscription pour: ${data.email}`);

    // 🛡️ VALIDATION DE SÉCURITÉ CENTRALISÉE
    const context = getSecurityContext(request, 'signup', body);
    const securityCheck = validateSecurity(context, data, {
      checkRateLimitBool: true,
      checkEmail: true,
      checkContent: false, // Pas de contenu texte à vérifier pour signup
      checkTiming: true,
      minTimeOnPage: 15000 // 15 secondes minimum sur la page
    });

    if (!securityCheck.isValid) {
      console.warn(`🚫 Signup bloqué - IP: ${context.ip}, Email: ${data.email}, Raison: ${securityCheck.reason}`);
      
      // Retourner une erreur avec les détails appropriés
      const statusCode = securityCheck.code?.includes('RATE_LIMIT') ? 429 : 
                         securityCheck.code === 'BLOCKED_IP' ? 403 : 400;
      
      return NextResponse.json(
        { 
          error: securityCheck.reason,
          code: securityCheck.code,
          ...(securityCheck.retryAfter && { retryAfter: securityCheck.retryAfter })
        },
        { status: statusCode }
      );
    }

    console.log(`✅ Validation sécurité réussie - IP: ${context.ip}, Email: ${data.email}`);

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
        { status: 409 }
      );
    }

    // 🔒 Hachage du mot de passe
    const passwordHash = await hashPassword(data.password);

    // 📝 Préparer les données utilisateur (SANS l'ID)
    const newUserData = {
      email: data.email,
      passwordHash,
      role: 'student' as const,
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

    console.log(`🎉 Inscription réussie pour ${data.email} depuis IP: ${context.ip}`);

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
    const context = getSecurityContext(request, 'signup');
    console.error(`❌ Erreur lors de l'inscription - IP: ${context.ip}`, error);

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