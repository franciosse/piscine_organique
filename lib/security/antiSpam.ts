// /lib/security/antiSpam.ts
import { NextRequest } from 'next/server';

// Types
export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  identifier?: string; // 'ip' | 'email' | 'ip+email'
}

export interface SecurityValidation {
  isValid: boolean;
  reason?: string;
  retryAfter?: number;
  code?: string;
}

export interface SecurityContext {
  ip: string;
  userAgent: string;
  timestamp?: number;
  timeOnPage?: number;
  endpoint: string;
}

// Maps centralisées pour rate limiting
const rateLimitMaps = {
  contact: new Map<string, { count: number; resetTime: number }>(),
  signup: new Map<string, { count: number; resetTime: number; emails: Set<string> }>(),
  login: new Map<string, { count: number; resetTime: number; emails: Set<string> }>(),
  accountLockouts: new Map<string, { lockedUntil: number; attempts: number }>(),
};

// Listes noires centralisées
const SECURITY_LISTS = {
  blockedIPs: new Set<string>(['127.0.0.1']),
  blockedEmails: new Set<string>(['test@example.com', 'spam@spam.com']),
  tempEmailDomains: new Set<string>([
    'tempmail.org', '10minutemail.com', 'guerrillamail.com',
    'mailinator.com', 'throwaway.email', 'temp-mail.org',
    'yopmail.com', 'sharklasers.com', 'grr.la'
  ]),
  suspiciousPatterns: [
    /\b(viagra|casino|crypto|bitcoin|loan|debt|forex|investment|pharmacy)\b/i,
    /\b(click here|visit now|buy now|limited time|act now)\b/i,
    /(https?:\/\/[^\s]+){3,}/, // Plus de 3 liens
    /(.)\1{15,}/, // Caractères répétés excessivement
  ],
  suspiciousEmailPatterns: [
    /[0-9]{8,}/, // Trop de chiffres consécutifs
    /(.)\1{4,}/, // Caractères répétés
    /^[a-z]+[0-9]+@/, // Pattern bot classique
    /^[a-z]{1,3}[0-9]+@/, // Très court + chiffres
  ]
};

// Configuration par endpoint
const ENDPOINT_CONFIGS: Record<string, RateLimitConfig> = {
  contact: { maxAttempts: 3, windowMs: 60000 }, // 3/minute
  signup: { maxAttempts: 5, windowMs: 300000 }, // 5/5min
  login: { maxAttempts: 10, windowMs: 900000 }, // 10/15min
};

/**
 * Extraire l'IP client de la requête
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = forwarded?.split(',')[0] || realIP || 'unknown';
  return clientIP.trim();
}

/**
 * Extraire le contexte de sécurité de la requête
 */
export function getSecurityContext(request: NextRequest, endpoint: string, body?: any): SecurityContext {
  return {
    ip: getClientIP(request),
    userAgent: request.headers.get('user-agent') || '',
    timestamp: body?.timestamp,
    timeOnPage: body?.timeOnPage,
    endpoint,
  };
}

/**
 * Vérifier si une IP est bloquée
 */
export function isIPBlocked(ip: string): boolean {
  return SECURITY_LISTS.blockedIPs.has(ip);
}

/**
 * Vérifier si un email est bloqué
 */
export function isEmailBlocked(email: string): boolean {
  return SECURITY_LISTS.blockedEmails.has(email.toLowerCase());
}

/**
 * Vérifier si un domaine email est temporaire/suspect
 */
export function isTempEmailDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? SECURITY_LISTS.tempEmailDomains.has(domain) : false;
}

/**
 * Valider le format et contenu d'un email
 */
export function validateEmail(email: string): SecurityValidation {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { isValid: false, reason: 'Format email invalide', code: 'INVALID_EMAIL_FORMAT' };
  }

  if (isEmailBlocked(email)) {
    return { isValid: false, reason: 'Email non autorisé', code: 'BLOCKED_EMAIL' };
  }

  if (isTempEmailDomain(email)) {
    return { isValid: false, reason: 'Domaine email temporaire non autorisé', code: 'TEMP_EMAIL_DOMAIN' };
  }

  // Vérifier patterns suspects
  if (SECURITY_LISTS.suspiciousEmailPatterns.some(pattern => pattern.test(email))) {
    return { isValid: false, reason: 'Format email suspect', code: 'SUSPICIOUS_EMAIL_PATTERN' };
  }

  return { isValid: true };
}

/**
 * Valider le contenu d'un texte (message, nom, etc.)
 */
export function validateTextContent(content: string, fieldName: string = 'contenu'): SecurityValidation {
  if (!content?.trim()) {
    return { isValid: false, reason: `${fieldName} requis`, code: 'REQUIRED_FIELD' };
  }

  // Vérifier patterns suspects
  if (SECURITY_LISTS.suspiciousPatterns.some(pattern => pattern.test(content))) {
    return { isValid: false, reason: `${fieldName} suspect détecté`, code: 'SUSPICIOUS_CONTENT' };
  }

  // Vérifier ratio de caractères spéciaux
  const specialCharsCount = (content.match(/[^a-zA-Z0-9\s\.\,\!\?\-]/g) || []).length;
  if (specialCharsCount > content.length * 0.3) {
    return { isValid: false, reason: `Trop de caractères spéciaux dans ${fieldName}`, code: 'TOO_MANY_SPECIAL_CHARS' };
  }

  return { isValid: true };
}

/**
 * Valider le User-Agent
 */
export function validateUserAgent(userAgent: string): SecurityValidation {
  if (!userAgent || userAgent.length < 10) {
    return { isValid: false, reason: 'User-Agent suspect', code: 'SUSPICIOUS_USER_AGENT' };
  }

  // Patterns de bots communs
  const botPatterns = [
    /bot|crawler|spider|scraper/i,
    /curl|wget|python|php/i,
  ];

  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    return { isValid: false, reason: 'Bot détecté', code: 'BOT_DETECTED' };
  }

  return { isValid: true };
}

/**
 * Valider la vitesse d'interaction (temps sur page, etc.)
 */
export function validateTiming(context: SecurityContext, minTimeOnPage: number = 5000): SecurityValidation {
  if (context.timeOnPage && context.timeOnPage < minTimeOnPage) {
    return { 
      isValid: false, 
      reason: 'Interaction trop rapide', 
      code: 'TOO_FAST_INTERACTION' 
    };
  }

  if (context.timestamp) {
    const timeSincePageLoad = Date.now() - context.timestamp;
    if (timeSincePageLoad < minTimeOnPage) {
      return { 
        isValid: false, 
        reason: 'Soumission trop rapide', 
        code: 'TOO_FAST_SUBMISSION' 
      };
    }
  }

  return { isValid: true };
}

/**
 * Rate limiting générique
 */
export function checkRateLimit(
  endpoint: string, 
  identifier: string, 
  email?: string
): SecurityValidation {
  const config = ENDPOINT_CONFIGS[endpoint];
  if (!config) {
    return { isValid: true }; // Pas de config = pas de limite
  }

  const now = Date.now();
  const key = identifier;

  switch (endpoint) {
    case 'contact':
      return checkSimpleRateLimit('contact', key, config, now);
    
    case 'signup':
      return checkSignupRateLimit(key, email || '', config, now);
    
    case 'login':
      return checkLoginRateLimit(key, email || '', config, now);
    
    default:
      return checkSimpleRateLimit(endpoint, key, config, now);
  }
}

/**
 * Rate limiting simple (pour contact, etc.)
 */
function checkSimpleRateLimit(
  endpoint: string, 
  key: string, 
  config: RateLimitConfig, 
  now: number
): SecurityValidation {
  const map = rateLimitMaps[endpoint as keyof typeof rateLimitMaps] as Map<string, any>;
  const limit = map.get(key);

  if (!limit || now > limit.resetTime) {
    map.set(key, { count: 1, resetTime: now + config.windowMs });
    return { isValid: true };
  }

  if (limit.count >= config.maxAttempts) {
    const retryAfter = Math.ceil((limit.resetTime - now) / 1000);
    return { 
      isValid: false, 
      reason: 'Trop de tentatives. Veuillez patienter.', 
      retryAfter,
      code: 'RATE_LIMIT_EXCEEDED'
    };
  }

  limit.count++;
  return { isValid: true };
}

/**
 * Rate limiting pour signup
 */
function checkSignupRateLimit(ip: string, email: string, config: RateLimitConfig, now: number): SecurityValidation {
  const attempts = rateLimitMaps.signup.get(ip);

  if (!attempts || now > attempts.resetTime) {
    rateLimitMaps.signup.set(ip, {
      count: 1,
      resetTime: now + config.windowMs,
      emails: new Set([email])
    });
    return { isValid: true };
  }

  // Vérifier si même email déjà tenté
  if (attempts.emails.has(email)) {
    return { 
      isValid: false, 
      reason: 'Email déjà tenté récemment', 
      code: 'DUPLICATE_EMAIL_ATTEMPT' 
    };
  }

  if (attempts.count >= config.maxAttempts) {
    const retryAfter = Math.ceil((attempts.resetTime - now) / 1000);
    return { 
      isValid: false, 
      reason: 'Trop de tentatives d\'inscription', 
      retryAfter,
      code: 'SIGNUP_RATE_LIMIT_EXCEEDED'
    };
  }

  attempts.count++;
  attempts.emails.add(email);
  return { isValid: true };
}

/**
 * Rate limiting pour login avec gestion de verrouillage de compte
 */
function checkLoginRateLimit(ip: string, email: string, config: RateLimitConfig, now: number): SecurityValidation {
  // 1. Vérifier verrouillage de compte
  const lockout = rateLimitMaps.accountLockouts.get(email);
  if (lockout && now < lockout.lockedUntil) {
    const retryAfter = Math.ceil((lockout.lockedUntil - now) / 1000);
    return {
      isValid: false,
      reason: 'Compte temporairement verrouillé',
      retryAfter,
      code: 'ACCOUNT_LOCKED'
    };
  }

  // 2. Rate limiting par IP
  const attempts = rateLimitMaps.login.get(ip);
  if (!attempts || now > attempts.resetTime) {
    rateLimitMaps.login.set(ip, {
      count: 1,
      resetTime: now + config.windowMs,
      emails: new Set([email])
    });
    return { isValid: true };
  }

  if (attempts.count >= config.maxAttempts) {
    const retryAfter = Math.ceil((attempts.resetTime - now) / 1000);
    return {
      isValid: false,
      reason: 'Trop de tentatives depuis cette adresse IP',
      retryAfter,
      code: 'LOGIN_RATE_LIMIT_EXCEEDED'
    };
  }

  attempts.count++;
  attempts.emails.add(email);
  return { isValid: true };
}

/**
 * Gérer un login échoué (pour verrouillage de compte)
 */
export function handleFailedLogin(email: string): void {
  const now = Date.now();
  const existing = rateLimitMaps.accountLockouts.get(email) || { lockedUntil: 0, attempts: 0 };

  existing.attempts++;

  // Progression exponentielle du verrouillage
  if (existing.attempts >= 5) {
    const lockDuration = Math.min(existing.attempts * 60000, 3600000); // Max 1 heure
    existing.lockedUntil = now + lockDuration;
    console.warn(`🔒 Compte verrouillé: ${email} pour ${lockDuration / 1000} secondes`);
  }

  rateLimitMaps.accountLockouts.set(email, existing);
}

/**
 * Gérer un login réussi (réinitialiser les tentatives)
 */
export function handleSuccessfulLogin(email: string): void {
  rateLimitMaps.accountLockouts.delete(email);
}

/**
 * Validation complète de sécurité (fonction principale)
 */
export function validateSecurity(
  context: SecurityContext,
  data: { email?: string; message?: string; name?: string; password?: string },
  options: {
    checkRateLimitBool?: boolean;
    checkEmail?: boolean;
    checkContent?: boolean;
    checkTiming?: boolean;
    minTimeOnPage?: number;
  } = {}
): SecurityValidation {
  const {
    checkRateLimitBool = true,
    checkEmail = true,
    checkContent = true,
    checkTiming = true,
    minTimeOnPage = 5000
  } = options;

  // 1. IP bloquée
  if (isIPBlocked(context.ip)) {
    return { isValid: false, reason: 'Accès refusé', code: 'BLOCKED_IP' };
  }

  // 2. User-Agent
  const userAgentCheck = validateUserAgent(context.userAgent);
  if (!userAgentCheck.isValid) {
    return userAgentCheck;
  }

  // 3. Rate limiting
  if (checkRateLimitBool) {
    const rateLimitCheck = checkRateLimit(context.endpoint, context.ip, data.email);
    if (!rateLimitCheck.isValid) {
      return rateLimitCheck;
    }
  }

  // 4. Email
  if (checkEmail && data.email) {
    const emailCheck = validateEmail(data.email);
    if (!emailCheck.isValid) {
      return emailCheck;
    }
  }

  // 5. Contenu
  if (checkContent) {
    if (data.message) {
      const messageCheck = validateTextContent(data.message, 'message');
      if (!messageCheck.isValid) {
        return messageCheck;
      }
    }
    if (data.name) {
      const nameCheck = validateTextContent(data.name, 'nom');
      if (!nameCheck.isValid) {
        return nameCheck;
      }
    }
  }

  // 6. Timing
  if (checkTiming) {
    const timingCheck = validateTiming(context, minTimeOnPage);
    if (!timingCheck.isValid) {
      return timingCheck;
    }
  }

  return { isValid: true };
}

/**
 * Nettoyage périodique des maps
 */
export function cleanupRateLimits(): void {
  const now = Date.now();

  // Nettoyer toutes les maps
  Object.values(rateLimitMaps).forEach(map => {
    for (const [key, data] of map.entries()) {
      if ('resetTime' in data && now > data.resetTime) {
        map.delete(key);
      } else if ('lockedUntil' in data && now > data.lockedUntil) {
        map.delete(key);
      }
    }
  });
}

// Nettoyage automatique toutes les 5 minutes
setInterval(cleanupRateLimits, 300000);