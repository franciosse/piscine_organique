// /lib/auth/emailVerification.ts
import { SignJWT, jwtVerify } from 'jose';

const key = new TextEncoder().encode(process.env.AUTH_SECRET);

export async function generateEmailVerificationToken(userId: number) {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(key);
}

export async function verifyEmailToken(token: string) {
  const { payload } = await jwtVerify(token, key);
  return payload.userId as number;
}