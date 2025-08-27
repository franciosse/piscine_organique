import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { logActivity, ActivityType } from '@/lib/auth/activity'; // si tu utilises ça
import { withUserAuth } from '@/app/api/_lib/route-helpers';


const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  role: z.string().optional(), // Assuming role is optional, adjust as necessary
});

export const POST = withUserAuth(async (req, user) => {
  try {
    const body = await req.json();
    const data = updateAccountSchema.parse(body);

    await db.update(users).set({
      name: data.name,
      email: data.email,
    }).where(eq(users.id, user.id));

    await logActivity(user.id, ActivityType.UPDATE_ACCOUNT);

    return NextResponse.json({ success: 'Account updated successfully.', name: data.name });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Something went wrong.' }, { status: 400 });
  }
});
