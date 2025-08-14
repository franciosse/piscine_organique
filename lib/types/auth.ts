import type { User } from '@/lib/db/schema';

export type AuthError = {
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'INVALID_TOKEN' | 'SERVER_ERROR';
  message: string;
  status: number;
};

export type AuthResult<T> = 
  | { success: true; data: T }
  | { success: false; error: AuthError };


export type AuthUserResult = AuthResult<User>;
export type AuthVoidResult = AuthResult<void>;