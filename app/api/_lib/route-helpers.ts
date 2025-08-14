// lib/auth/route-helpers.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminPermission } from './checkPermissionsHelper';
import {getAuthenticatedUser} from './getAuthenticatedUserHelper'
import { isAuthSuccess } from '@/lib/types/utils';
import type { User } from '@/lib/db/schema';

type AdminRouteHandler = (
  req: NextRequest, 
  adminUser: User,
  context: { params: Promise<any> } 
) => Promise<NextResponse>;

export function withAdminAuth(handler: AdminRouteHandler) {
  return async (req: NextRequest, context: { params: Promise<any> }): Promise<NextResponse> => {
    try {
      const authResult = await checkAdminPermission(req);
      
      if (!isAuthSuccess(authResult)) {
        return NextResponse.json(
          { error: authResult.error.message },
          { status: authResult.error.status }
        );
      }
      
      // ✅ Passer le context avec params au handler
      return await handler(req, authResult.data, context);
      
    } catch (error: any) {
      console.error(`❌ Error in admin route ${req.url}:`, error);
      return NextResponse.json(
        { error: 'Erreur interne du serveur' },
        { status: 500 }
      );
    }
  };
}

// Usage similaire pour les utilisateurs normaux
type UserRouteHandler = (
  req: NextRequest, 
  user: User,
  context: { params: Promise<any> } 
) => Promise<NextResponse>;

export function withUserAuth(handler: UserRouteHandler) {
  return async (req: NextRequest, context: { params: Promise<any> }): Promise<NextResponse> => {
    try {
      const authResult = await getAuthenticatedUser(req);
      if (!isAuthSuccess(authResult)) {
        return NextResponse.json(
          { error: authResult.error.message },
          { status: authResult.error.status }
        );
      }

      return await handler(req, authResult.data, context);

    } catch (error: any) {
      console.error(`❌ Error in user route:`, error);
      return NextResponse.json(
        { error: 'Erreur interne du serveur' },
        { status: 500 }
      );
    }
  };
}