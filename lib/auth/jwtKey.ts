// /lib/auth/jwtKey.ts
export const jwtKey = new TextEncoder().encode(process.env.AUTH_SECRET);

if (!process.env.AUTH_SECRET) {
  throw new Error('❌ AUTH_SECRET manquant dans .env');
}