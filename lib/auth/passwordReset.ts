import { SignJWT, jwtVerify } from 'jose';
import { jwtKey } from './jwtKey';

export async function generatePasswordResetToken(userId: number) {
  return await new SignJWT({ userId, type: 'password-reset' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(jwtKey);
}

export async function verifyPasswordResetToken(token: string) {
  const { payload } = await jwtVerify(token, jwtKey, { algorithms: ['HS256'] });
  if (payload.type !== 'password-reset') throw new Error('Type de token invalide');
  return payload.userId as number;
}
