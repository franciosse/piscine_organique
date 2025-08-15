// /lib/email.ts
import nodemailer from 'nodemailer';

// 🛡️ Fonction utilitaire pour récupérer l'URL de base
function getBaseUrl(): string {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  throw new Error('❌ BASE_URL non défini dans les variables d\'environnement');
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(email: string, token: string) {
  try {
    const baseUrl = getBaseUrl();
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
    
    console.log(`📧 Envoi email de vérification à ${email}`);
    console.log(`🔗 URL de vérification: ${verifyUrl}`);
    
    const result = await transporter.sendMail({
      from: '"Piscine Organique" <noreply@piscineorganique.com>',
      to: email,
      subject: 'Vérifie ton adresse email',
      html: `
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
      `,
    });
    
    console.log('✅ Email de vérification envoyé:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('❌ Erreur envoi email de vérification:', error);
    throw new Error(`Impossible d'envoyer l'email de vérification: ${error}`);
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  try {
    const baseUrl = getBaseUrl();
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    
    console.log(`📧 Envoi email de reset à ${email}`);
    
    const result = await transporter.sendMail({
      from: '"Piscine Organique" <noreply@piscineorganique.com>',
      to: email,
      subject: 'Réinitialisation du mot de passe',
      html: `
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
      `,
    });
    
    console.log('✅ Email de reset envoyé:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('❌ Erreur envoi email de reset:', error);
    throw new Error(`Impossible d'envoyer l'email de réinitialisation: ${error}`);
  }
}

export async function sendContactEmail(name: string, email: string, message: string) {
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
    
    // 🛡️ Sanitization du contenu
    const sanitizedName = name.replace(/[<>]/g, '');
    const sanitizedMessage = message.replace(/[<>]/g, '').replace(/\n/g, '<br>');
    
    const result = await transporter.sendMail({
      from: `"Contact Piscine Organique" <noreply@piscineorganique.com>`, // ⚠️ Utilisez toujours votre domaine
      replyTo: email, // 👈 Pour pouvoir répondre directement
      to: process.env.CONTACT_EMAIL || 'contact@piscineorganique.com',
      subject: `📩 Nouveau message de ${sanitizedName}`,
      html: `
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
      `,
    });
    
    console.log('✅ Email de contact envoyé:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('❌ Erreur envoi email de contact:', error);
    throw new Error(`Impossible d'envoyer l'email de contact: ${error}`);
  }
}