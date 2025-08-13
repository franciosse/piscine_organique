import { z } from 'zod';
import { User } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';

export type ActionState = {
  error?: string;
  success?: string;
  [key: string]: any; // This allows for additional properties
};

type ValidatedActionFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData
) => Promise<T>;

export function validatedAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    return action(result.data, formData);
  };
}

type ValidatedActionWithUserFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
  user: User
) => Promise<T>;

export function validatedActionWithUser<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionWithUserFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    const user = await getUser();
    if (!user) {
      throw new Error('User is not authenticated');
    }

    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    return action(result.data, formData, user);
  };
}


// Routes et rôles autorisés
const roleProtectedRoutes: Record<string, string[]> = {
  // '/admin': ['admin'],
  // '/courses/create': ['admin'],
  // '/courses/manage': ['admin'],
  // '/courses': ['admin', 'student'],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Ignorer certaines routes publiques
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/public') ||
    pathname === '/login' ||
    pathname === '/register'
  ) {
    return NextResponse.next();
  }

  // Récupération utilisateur
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Vérification du rôle pour les routes protégées
  for (const [routePrefix, allowedRoles] of Object.entries(roleProtectedRoutes)) {
    if (pathname.startsWith(routePrefix)) {
      if (!allowedRoles.includes(user.role)) {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }
  }

  return NextResponse.next();
}