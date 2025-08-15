// /app/api/resend-verification/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateEmailVerificationToken } from '@/lib/auth/emailVerification';
import { sendVerificationEmail } from '@/lib/email/emailService';
import { decodeJwt } from 'jose'; // Utiliser jose comme dans votre emailVerification

const resendSchema = z.object({
  email: z.string().email().optional(),
  token: z.string().optional(), // Token expiré pour récupérer l'email
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = resendSchema.parse(body);

    let userEmail: string;
    let userId: number;

    if (data.email) {
      // Recherche par email
      const [user] = await db
        .select({ id: users.id, email: users.email, isVerified: users.isVerified })
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);

      if (!user) {
        return NextResponse.json(
          { error: 'Aucun compte trouvé avec cet email.' },
          { status: 404 }
        );
      }

      if (user.isVerified) {
        return NextResponse.json(
          { error: 'Cet email est déjà vérifié.' },
          { status: 400 }
        );
      }

      userEmail = user.email;
      userId = user.id;
    } else if (data.token) {
      // Essayer de décoder le token expiré pour récupérer l'userId
      try {
        const decodedUserId = await decodeExpiredToken(data.token);
        
        const [user] = await db
          .select({ id: users.id, email: users.email, isVerified: users.isVerified })
          .from(users)
          .where(eq(users.id, decodedUserId))
          .limit(1);

        if (!user) {
          return NextResponse.json(
            { error: 'Utilisateur introuvable.' },
            { status: 404 }
          );
        }

        if (user.isVerified) {
          return NextResponse.json(
            { error: 'Cet email est déjà vérifié.' },
            { status: 400 }
          );
        }

        userEmail = user.email;
        userId = user.id;
      } catch {
        return NextResponse.json(
          { error: 'Token invalide. Veuillez fournir votre email.' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Email ou token requis.' },
        { status: 400 }
      );
    }

    // Générer un nouveau token et envoyer l'email
    const newToken = await generateEmailVerificationToken(userId);
    await sendVerificationEmail(userEmail, newToken);

    console.log(`📧 Email de vérification renvoyé à: ${userEmail}`);

    return NextResponse.json({
      success: true,
      message: 'Email de vérification renvoyé avec succès.',
    });

  } catch (error: any) {
    console.error('❌ Erreur renvoi email:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides.', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Une erreur inattendue s\'est produite.' },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour décoder un token expiré (utilisant jose comme votre service)
async function decodeExpiredToken(token: string): Promise<number> {
  try {
    // Utiliser decodeJwt de jose pour décoder sans vérifier la signature/expiration
    const payload = decodeJwt(token);
    
    if (!payload.userId || typeof payload.userId !== 'number') {
      throw new Error('UserId manquant dans le token');
    }
    
    return payload.userId as number;
  } catch (error) {
    console.error('Erreur décodage token:', error);
    throw new Error('Token invalide');
  }
}