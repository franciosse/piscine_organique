// /app/api/password-reset/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { verifyPasswordResetToken } from '@/lib/auth/passwordReset';
import { hashPassword } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';

const passwordResetSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const data = passwordResetSchema.parse(json);

    if (data.newPassword !== data.confirmPassword) {
      return NextResponse.json(
        { error: 'New password and confirmation do not match' },
        { status: 400 }
      );
    }

    const userId = await verifyPasswordResetToken(data.token);

    const newPasswordHash = await hashPassword(data.newPassword);

    await db
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: 'Password updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Invalid token or input' }, { status: 400 });
  }
}
