// /app/api/auth/signin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { comparePasswords, setSession } from '@/lib/auth/session';
import { logActivity, ActivityType } from '@/lib/auth/activity';
import { getUser } from '@/lib/db/queries';
import { 
  getSecurityContext, 
  validateSecurity, 
  handleFailedLogin, 
  handleSuccessfulLogin 
} from '@/lib/security/antiSpam';

const signInSchema = z.object({
  email: z.string().email().min(3).max(255).toLowerCase().trim(),
  password: z.string().min(8).max(100),
  redirect: z.string().optional(),
  priceId: z.string().optional(),
  // Champs de sécurité (optionnels pour signin - peut être plus rapide)
  timestamp: z.number().optional(),
  userAgent: z.string().optional(),
  timeOnPage: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = signInSchema.parse(body);

    console.log(`🔑 Tentative de connexion pour: ${data.email}`);

    // 🛡️ VALIDATION DE SÉCURITÉ CENTRALISÉE
    const context = getSecurityContext(request, 'login', body);
    const securityCheck = validateSecurity(context, data, {
      checkRateLimitBool: true,    // Rate limiting strict pour login
      checkEmail: true,        // Email valide et domaine autorisé
      checkContent: false,     // Pas de contenu à vérifier
      checkTiming: false,      // Login peut être rapide (pas de timeOnPage requis)
      minTimeOnPage: 0
    });

    if (!securityCheck.isValid) {
      console.warn(`🚫 Login bloqué - IP: ${context.ip}, Email: ${data.email}, Raison: ${securityCheck.reason}`);
      
      // Gestion spéciale pour verrouillage de compte
      if (securityCheck.code === 'ACCOUNT_LOCKED') {
        return NextResponse.json(
          { 
            error: 'Compte temporairement verrouillé suite à trop de tentatives incorrectes. Veuillez réessayer plus tard.',
            code: securityCheck.code,
            retryAfter: securityCheck.retryAfter
          },
          { status: 423 } // 423 Locked
        );
      }
      
      // Autres erreurs de sécurité
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

    // 🐌 Délai artificiel pour ralentir les attaques brute force
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 🔍 Chercher user par email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (!user) {
      console.warn(`👤 Utilisateur inexistant - IP: ${context.ip}, Email: ${data.email}`);
      
      // 🔒 Enregistrer la tentative échouée pour cet email
      handleFailedLogin(data.email);
      
      return NextResponse.json(
        { 
          error: 'Email ou mot de passe incorrect. Veuillez réessayer.',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    // 🔒 Vérifier password
    const isPasswordValid = await comparePasswords(data.password, user.passwordHash);
    
    if (!isPasswordValid) {
      console.warn(`🔑 Mot de passe incorrect - IP: ${context.ip}, Email: ${data.email}, UserID: ${user.id}`);
      
      // 🔒 Enregistrer la tentative échouée
      handleFailedLogin(data.email);
      
      return NextResponse.json(
        { 
          error: 'Email ou mot de passe incorrect. Veuillez réessayer.',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    // ✅ Connexion réussie - Réinitialiser les tentatives échouées
    handleSuccessfulLogin(data.email);

    console.log(`✅ Connexion réussie - IP: ${context.ip}, Email: ${data.email}, UserID: ${user.id}`);

    // 🍪 Enregistrer session (cookie)
    await setSession(user);

    // 📊 Log activité
    try {
      await logActivity(user.id, ActivityType.SIGN_IN);
    } catch (activityError) {
      console.error('⚠️ Erreur log activité:', activityError);
      // Ne pas faire échouer la connexion si le log échoue
    }

    // 🎉 Réponse de succès
    return NextResponse.json({
      success: true,
      message: 'Connexion réussie',
      redirect: data.redirect || '/dashboard',
      priceId: data.priceId || null,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });

  } catch (error: any) {
    const context = getSecurityContext(request, 'login');
    console.error(`❌ Erreur lors de la connexion - IP: ${context.ip}`, error);

    // 🔍 Gestion d'erreurs spécifiques
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Données invalides. Vérifiez votre email et mot de passe.',
          details: error.errors,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // Erreur générique (ne pas exposer les détails)
    return NextResponse.json(
      { 
        error: 'Une erreur inattendue s\'est produite. Veuillez réessayer.',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}