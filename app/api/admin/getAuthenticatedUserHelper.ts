import type { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';

export async function getAuthenticatedUser(request: NextRequest) {
  const user = await getUserFromRequest(request);
  console.log('Authenticated user:', user);
  if (!user) {
    throw new Error('Non authentifié');
  }

  return user;
}