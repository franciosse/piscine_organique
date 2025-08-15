// /lib/auth/activity.ts (nouveau fichier)
import { db } from '@/lib/db/drizzle';
import { activityLogs, ActivityType } from '@/lib/db/schema';

export async function logActivity(
  userId: number,
  type: ActivityType,
  ipAddress?: string
) {
  await db.insert(activityLogs).values({
    userId, 
    action: type,
    ipAddress: ipAddress || '',
  });
}

export { ActivityType };
