// app/api/account/change-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { logActivity, ActivityType } from '@/lib/auth/activity';
import { withUserAuth } from '@/app/api/_lib/route-helpers';
import logger from '@/lib/logger/logger';


const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const POST = withUserAuth(async (req, authenticatedUser) => {
  try {
    const body = await req.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    // Récupérer l'utilisateur avec son mot de passe actuel
    const user = await db.select()
      .from(users)
      .where(eq(users.id, authenticatedUser.id))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user[0].passwordHash
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Mot de passe actuel incorrect' },
        { status: 400 }
      );
    }

    // Vérifier que le nouveau mot de passe est différent
    const isSamePassword = await bcrypt.compare(newPassword, user[0].passwordHash);
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit être différent de l\'actuel' },
        { status: 400 }
      );
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Mettre à jour le mot de passe dans la base
    await db.update(users)
      .set({
        passwordHash: hashedNewPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, authenticatedUser.id));

    // Logger l'activité
    await logActivity(
      authenticatedUser.id,
      ActivityType.CHANGE_PASSWORD,
    );

    return NextResponse.json({
      success: 'Mot de passe modifié avec succès'
    });

  } catch (error: any) {
    logger.error('Change password error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Une erreur inattendue s\'est produite' },
      { status: 500 }
    );
  }
});