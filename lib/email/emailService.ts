// /lib/email.ts
import nodemailer from 'nodemailer';
import { getBaseUrl } from '@/lib/utils';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// === TYPES ===

export interface WelcomeEmailData {
  email: string;
  name: string;
  temporaryPassword: string;
}

export interface PurchaseEmailData {
  email: string;
  course: {
    id: number;
    title: string;
    price: number;
  };
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// === FONCTION GÉNÉRIQUE D'ENVOI ===

/**
 * Fonction générique pour envoyer des emails
 */
async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    console.log(`📧 Envoi email à: ${options.to}`);
    console.log(`📝 Sujet: ${options.subject}`);

    const mailOptions = {
      from: '"Piscine Organique" <noreply@piscineorganique.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      ...(options.replyTo && { replyTo: options.replyTo }),
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email envoyé avec succès:', result.messageId);
    return { 
      success: true, 
      messageId: result.messageId 
    };
    
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

// === TEMPLATES D'EMAIL ===

function generateVerificationEmailHTML(verifyUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">🌊 Bienvenue chez Piscine Organique !</h2>
      <p>Merci de t'être inscrit ! Pour finaliser ton inscription, clique sur le bouton ci-dessous :</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          ✅ Vérifier mon email
        </a>
      </div>
      
      <p>Ou copie ce lien dans ton navigateur :</p>
      <p style="word-break: break-all; color: #6b7280;">${verifyUrl}</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #6b7280;">
        Si tu n'as pas créé de compte, ignore cet email.
      </p>
    </div>
  `;
}

function generatePasswordResetEmailHTML(resetUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">🔒 Réinitialisation du mot de passe</h2>
      <p>Tu as demandé à réinitialiser ton mot de passe. Clique sur le bouton ci-dessous :</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #dc2626; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          🔑 Réinitialiser mon mot de passe
        </a>
      </div>
      
      <p>Ou copie ce lien dans ton navigateur :</p>
      <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #6b7280;">
        Si tu n'as pas demandé cette réinitialisation, ignore cet email. 
        Ce lien expire dans 1 heure.
      </p>
    </div>
  `;
}

function generateContactEmailHTML(name: string, email: string, message: string): string {
  const sanitizedName = name.replace(/[<>]/g, '');
  const sanitizedMessage = message.replace(/[<>]/g, '').replace(/\n/g, '<br>');
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">📩 Nouveau message reçu</h2>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>👤 Nom :</strong> ${sanitizedName}</p>
        <p><strong>📧 Email :</strong> ${email}</p>
      </div>
      
      <div style="background-color: #fefefe; padding: 20px; border-left: 4px solid #2563eb; margin: 20px 0;">
        <h3>💬 Message :</h3>
        <p>${sanitizedMessage}</p>
      </div>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #6b7280;">
        Reçu via le formulaire de contact de piscineorganique.com
      </p>
    </div>
  `;
}

function generateWelcomeEmailHTML(name: string, email: string, temporaryPassword: string): string {
  const baseUrl = getBaseUrl();
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb;">🌊 Bienvenue ${name} chez Piscine Organique !</h1>
      
      <p>Votre compte a été créé automatiquement suite à votre achat. Nous sommes ravis de vous accueillir !</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin-top: 0;">🔑 Vos informations de connexion :</h2>
        <p><strong>📧 Email :</strong> ${email}</p>
        <p><strong>🔒 Mot de passe temporaire :</strong></p>
        <code style="background: #e5e7eb; padding: 8px 12px; border-radius: 4px; font-size: 16px; letter-spacing: 1px;">
          ${temporaryPassword}
        </code>
      </div>
      
      <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0;"><strong>⚠️ Important :</strong> Veuillez vous connecter et changer votre mot de passe dès que possible pour sécuriser votre compte.</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${baseUrl}/auth/signin" 
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; font-weight: bold;">
          🚀 Se connecter maintenant
        </a>
      </div>
      
      <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p>Cordialement,<br><strong>L'équipe Piscine Organique</strong></p>
    </div>
  `;
}

function generatePurchaseEmailHTML(course: { id: number; title: string; price: number }): string {
  const baseUrl = getBaseUrl();
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #16a34a;">🎉 Merci pour votre achat !</h1>
      
      <p>Votre paiement a été confirmé avec succès. Vous pouvez maintenant accéder à votre cours !</p>
      
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="color: #15803d; margin-top: 0;">📚 Cours acheté :</h2>
        <p style="font-size: 18px; font-weight: bold; margin: 10px 0;">${course.title}</p>
        <p style="color: #15803d; font-size: 16px;"><strong>Prix :</strong> ${course.price / 100}€</p>
      </div>
      
      <p>Vous pouvez maintenant accéder à votre cours et commencer votre apprentissage dès maintenant !</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${baseUrl}/courses/${course.id}/start" 
           style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
          🚀 Commencer le cours
        </a>
        <a href="${baseUrl}/dashboard/courses" 
           style="display: inline-block; background: #6b7280; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; font-weight: bold;">
          📖 Voir tous mes cours
        </a>
      </div>
      
      <p>Bon apprentissage ! 🌱</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p>Cordialement,<br><strong>L'équipe Piscine Organique</strong></p>
    </div>
  `;
}

// === FONCTIONS D'EMAIL SPÉCIALISÉES ===

export async function sendVerificationEmail(email: string, token: string): Promise<EmailResult> {
  try {
    const baseUrl = getBaseUrl();
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
    
    return await sendEmail({
      to: email,
      subject: 'Vérifie ton adresse email - Piscine Organique',
      html: generateVerificationEmailHTML(verifyUrl),
    });
    
  } catch (error) {
    console.error('❌ Erreur envoi email de vérification:', error);
    throw new Error(`Impossible d'envoyer l'email de vérification: ${error}`);
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<EmailResult> {
  try {
    const baseUrl = getBaseUrl();
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    
    return await sendEmail({
      to: email,
      subject: 'Réinitialisation du mot de passe - Piscine Organique',
      html: generatePasswordResetEmailHTML(resetUrl),
    });
    
  } catch (error) {
    console.error('❌ Erreur envoi email de reset:', error);
    throw new Error(`Impossible d'envoyer l'email de réinitialisation: ${error}`);
  }
}

export async function sendContactEmail(name: string, email: string, message: string): Promise<EmailResult> {
  try {
    // 🛡️ Validation basique des entrées
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      throw new Error('Tous les champs sont requis');
    }
    
    // 🛡️ Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Format email invalide');
    }
    
    return await sendEmail({
      to: process.env.CONTACT_EMAIL || 'contact@piscineorganique.com',
      subject: `📩 Nouveau message de ${name.replace(/[<>]/g, '')}`,
      html: generateContactEmailHTML(name, email, message),
      replyTo: email,
    });
    
  } catch (error) {
    console.error('❌ Erreur envoi email de contact:', error);
    throw new Error(`Impossible d'envoyer l'email de contact: ${error}`);
  }
}

export async function sendWelcomeEmail({ email, name, temporaryPassword }: WelcomeEmailData): Promise<EmailResult> {
  try {
    return await sendEmail({
      to: email,
      subject: '🌊 Bienvenue chez Piscine Organique ! Votre compte est prêt',
      html: generateWelcomeEmailHTML(name, email, temporaryPassword),
    });
    
  } catch (error) {
    console.error('❌ Erreur envoi email de bienvenue:', error);
    // Ne pas faire échouer le processus pour un email
    return { success: false, error: 'Erreur envoi email de bienvenue' };
  }
}

export async function sendPurchaseConfirmationEmail({ email, course }: PurchaseEmailData): Promise<EmailResult> {
  try {
    return await sendEmail({
      to: email,
      subject: `🎉 Confirmation d'achat - ${course.title}`,
      html: generatePurchaseEmailHTML(course),
    });
    
  } catch (error) {
    console.error('❌ Erreur envoi email de confirmation:', error);
    // Ne pas faire échouer le processus pour un email
    return { success: false, error: 'Erreur envoi email de confirmation' };
  }
}