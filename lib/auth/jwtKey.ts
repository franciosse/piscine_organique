// lib/auth/jwtKey.ts - Version améliorée
const SECRET = process.env.AUTH_SECRET;
if (!SECRET || SECRET.length < 32) {
  throw new Error('AUTH_SECRET doit faire au minimum 32 caractères');
}

export const jwtKey = new TextEncoder().encode(SECRET);

// Différentes clés pour différents usages
export const emailVerificationKey = new TextEncoder().encode(
  process.env.EMAIL_VERIFICATION_SECRET || SECRET + '_email'
);