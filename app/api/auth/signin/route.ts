import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { comparePasswords, setSession } from '@/lib/auth/session';
import { logActivity, ActivityType } from '@/lib/auth/activity'; // adapte selon ta structure
import { getUser } from '@/lib/db/queries';

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
  redirect: z.string().optional(),
  priceId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = signInSchema.parse(body);

    // Chercher user par email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password. Please try again.' },
        { status: 400 }
      );
    }

    // Vérifier password
    const valid = await comparePasswords(data.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid email or password. Please try again.' },
        { status: 400 }
      );
    }

    // Enregistrer session (cookie)
    await setSession(user);

    // Log activité (tu adapteras la fonction selon ta structure)
    await logActivity(user.id, ActivityType.SIGN_IN);

    // Réponse OK + éventuellement url redirect (tu peux personnaliser)
    return NextResponse.json({
      success: true,
      redirect: data.redirect || '/dashboard',
      priceId: data.priceId || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to sign in.' },
      { status: 400 }
    );
  }
}
