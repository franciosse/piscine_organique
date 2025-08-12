import type { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';

export async function checkAdminPermission(request: NextRequest) {
  const user = await getUserFromRequest(request);

  if (!user) {
    throw new Error('Non authentifié');
  }

  // Uncomment the following lines if you want to enforce admin role check
  // if (user.role !== 'admin') {
  //   throw new Error('Permissions insuffisantes');
  // }

  return user;
}
