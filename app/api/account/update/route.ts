import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { getUser } from '@/lib/auth/session';
import { logActivity, ActivityType } from '@/lib/auth/activity'; // si tu utilises ça

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  role: z.string().optional(), // Assuming role is optional, adjust as necessary
});

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = updateAccountSchema.parse(body);

    await db.update(users).set({
      name: data.name,
      email: data.email,
      role: data.role || user.role, // Assuming role is optional and can be updated
    }).where(eq(users.id, user.id));

    await logActivity(null, user.id, ActivityType.UPDATE_ACCOUNT, undefined);

    return NextResponse.json({ success: 'Account updated successfully.', name: data.name });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Something went wrong.' }, { status: 400 });
  }
}
