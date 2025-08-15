// /app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendContactEmail } from '@/lib/email/emailService';

// Rate limiting simple en mémoire (pour production, utilisez Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Liste noire d'IPs/domaines
const BLOCKED_IPS = new Set(['127.0.0.1']); // Ajoutez les IPs malveillantes
const BLOCKED_DOMAINS = new Set(['tempmail.org', '10minutemail.com']); // Domaines email temporaires

const contactSchema = z.object({
  name: z.string().min(2).max(50).trim(),
  email: z.string().email().max(100).toLowerCase().trim(),
  message: z.string().min(10).max(1000).trim(),
  timestamp: z.number(),
  userAgent: z.string().optional(),
});

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = forwarded?.split(',')[0] || realIP || 'unknown';
  return clientIP;
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  
  if (!limit || now > limit.resetTime) {
    // Reset ou nouvelle IP
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 }); // 1 minute
    return false;
  }
  
  if (limit.count >= 3) { // Max 3 messages par minute
    return true;
  }
  
  limit.count++;
  return false;
}

function validateContent(name: string, email: string, message: string): { isValid: boolean; reason?: string } {
  // 1. Patterns suspects
  const suspiciousPatterns = [
    /\b(viagra|casino|crypto|bitcoin|loan|debt|forex|investment|pharmacy)\b/i,
    /\b(click here|visit now|buy now|limited time|act now)\b/i,
    /(https?:\/\/[^\s]+){3,}/, // Plus de 3 liens
    /(.)\1{15,}/, // Caractères répétés excessivement
  ];
  
  const allText = `${name} ${email} ${message}`.toLowerCase();
  
  if (suspiciousPatterns.some(pattern => pattern.test(allText))) {
    return { isValid: false, reason: 'Contenu suspect détecté' };
  }
  
  // 2. Vérification email suspect séparément
  if (/[^\w\s@.-]/g.test(email) && email.length > 50) {
    return { isValid: false, reason: 'Email suspect' };
  }
  
  // 2. Vérifier domaine email
  const emailDomain = email.split('@')[1];
  if (BLOCKED_DOMAINS.has(emailDomain)) {
    return { isValid: false, reason: 'Domaine email non autorisé' };
  }
  
  // 3. Longueur anormale
  if (message.length < 10 || message.length > 1000) {
    return { isValid: false, reason: 'Longueur de message invalide' };
  }
  
  // 4. Caractères spéciaux excessifs
  const specialCharsCount = (message.match(/[^a-zA-Z0-9\s\.\,\!\?]/g) || []).length;
  if (specialCharsCount > message.length * 0.3) {
    return { isValid: false, reason: 'Trop de caractères spéciaux' };
  }
  
  return { isValid: true };
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // 1. Vérifier IP bloquée
    if (BLOCKED_IPS.has(clientIP)) {
      console.warn(`🚫 Tentative depuis IP bloquée: ${clientIP}`);
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }
    
    // 2. Rate limiting
    if (isRateLimited(clientIP)) {
      console.warn(`⏰ Rate limit dépassé pour IP: ${clientIP}`);
      return NextResponse.json(
        { error: 'Trop de tentatives. Veuillez patienter.' },
        { status: 429 }
      );
    }
    
    // 3. Validation des données
    const body = await request.json();
    const data = contactSchema.parse(body);
    
    // 4. Vérification temporelle (pas trop rapide)
    const timeSincePageLoad = Date.now() - data.timestamp;
    if (timeSincePageLoad < 5000) { // Moins de 5 secondes = suspect
      console.warn(`⚡ Soumission trop rapide depuis IP: ${clientIP}`);
      return NextResponse.json(
        { error: 'Soumission trop rapide' },
        { status: 400 }
      );
    }
    
    // 5. Validation du contenu
    const contentValidation = validateContent(data.name, data.email, data.message);
    if (!contentValidation.isValid) {
      console.warn(`🔍 Contenu invalide depuis IP: ${clientIP} - ${contentValidation.reason}`);
      return NextResponse.json(
        { error: 'Contenu non conforme' },
        { status: 400 }
      );
    }
    
    // 6. Vérification User-Agent
    const userAgent = data.userAgent || request.headers.get('user-agent') || '';
    if (!userAgent || userAgent.length < 10) {
      console.warn(`🤖 User-Agent suspect depuis IP: ${clientIP}`);
      return NextResponse.json(
        { error: 'Requête invalide' },
        { status: 400 }
      );
    }
    
    console.log(`📧 Envoi email de contact valide depuis IP: ${clientIP}`);
    
    // 7. Envoyer l'email
    await sendContactEmail(data.name, data.email, data.message);
    
    // 8. Log pour monitoring
    console.log(`✅ Contact envoyé - IP: ${clientIP}, Email: ${data.email}, Nom: ${data.name}`);
    
    return NextResponse.json({
      success: true,
      message: 'Message envoyé avec succès'
    });
    
  } catch (error: any) {
    const clientIP = getClientIP(request);
    console.error(`❌ Erreur contact depuis IP: ${clientIP}`, error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Nettoyage périodique du rate limiting (optionnel)
setInterval(() => {
  const now = Date.now();
  for (const [ip, limit] of rateLimitMap.entries()) {
    if (now > limit.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 300000); // Nettoyage toutes les 5 minutes