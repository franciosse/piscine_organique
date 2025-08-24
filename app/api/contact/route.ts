// /app/api/contact/route.ts - Version simplifiée
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendContactEmail } from '@/lib/email/emailService';
import { getSecurityContext, validateSecurity } from '@/lib/security/antiSpam';
import logger from '@/lib/logger/logger';


const contactSchema = z.object({
  name: z.string().min(2).max(50).trim(),
  email: z.string().email().max(100).toLowerCase().trim(),
  message: z.string().min(10).max(1000).trim(),
  timestamp: z.number().optional(),
  userAgent: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = contactSchema.parse(body);
    
    // 🛡️ Validation de sécurité centralisée
    const context = getSecurityContext(request, 'contact', body);
    const securityCheck = validateSecurity(context, data, {
      checkRateLimitBool: true,
      checkEmail: true,
      checkContent: true,
      checkTiming: true,
      minTimeOnPage: 5000
    });

    if (!securityCheck.isValid) {
      console.warn(`🚫 Contact bloqué - IP: ${context.ip}, Raison: ${securityCheck.reason}`);
      return NextResponse.json(
        { 
          error: securityCheck.reason,
          code: securityCheck.code,
          ...(securityCheck.retryAfter && { retryAfter: securityCheck.retryAfter })
        },
        { status: securityCheck.code === 'RATE_LIMIT_EXCEEDED' ? 429 : 400 }
      );
    }

    // ✅ Envoyer l'email
    await sendContactEmail(data.name, data.email, data.message);
    
    logger.info(`✅ Contact envoyé - IP: ${context.ip}, Email: ${data.email}`);
    
    return NextResponse.json({
      success: true,
      message: 'Message envoyé avec succès'
    });

  } catch (error: any) {
    const context = getSecurityContext(request, 'contact');
    logger.error(`❌ Erreur contact - IP: ${context.ip}`, error);
    
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