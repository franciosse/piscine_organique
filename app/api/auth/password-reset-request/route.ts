// /app/api/password-reset-request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { generatePasswordResetToken } from '@/lib/auth/passwordReset';
import { sendPasswordResetEmail } from '@/lib/email/emailService';

const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const data = passwordResetRequestSchema.parse(json);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (!user) {
      // Ne pas divulguer que l'email n'existe pas
      return NextResponse.json({ success: 'If your email exists, you will receive a reset link.' });
    }

    const token = await generatePasswordResetToken(user.id);
    await sendPasswordResetEmail(user.email, token);

    return NextResponse.json({ success: 'If your email exists, you will receive a reset link.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Invalid input' }, { status: 400 });
  }
}
