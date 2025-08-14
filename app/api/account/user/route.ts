// app/api/account/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withUserAuth } from '@/app/api/_lib/route-helpers';

export const GET = withUserAuth(async (req, authenticatedUser) => {
  //  authenticatedUser est garanti authentifié et vérifié
  
  const { passwordHash, ...sanitizedUser } = authenticatedUser;
  
  return NextResponse.json({
    user: sanitizedUser,
    message: 'Profil récupéré avec succès'
  });
});