// /app/api/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { verifyEmailToken } from '@/lib/auth/emailVerification';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token missing' }, { status: 400 });
  }

  try {
    const userId = await verifyEmailToken(token);

    await db
      .update(users)
      .set({ isVerified: true })
      .where(eq(users.id, userId));

    // Ici tu peux faire une redirection ou renvoyer un message
    return NextResponse.json({ success: 'Email verified successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Invalid token' }, { status: 400 });
  }
}
