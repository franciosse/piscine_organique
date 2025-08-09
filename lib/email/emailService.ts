// /lib/email.ts
import nodemailer from 'nodemailer';

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
  const verifyUrl = `${process.env.BASE_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: '"Piscine Organique" <noreply@piscineorganique.com>',
    to: email,
    subject: 'Vérifie ton adresse email',
    html: `<p>Merci de t'être inscrit ! Clique sur le lien pour vérifier ton adresse email :</p>
           <a href="${verifyUrl}">${verifyUrl}</a>`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.BASE_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: '"Piscine Organique" <noreply@piscineorganique.com>',
    to: email,
    subject: 'Réinitialisation du mot de passe',
    html: `<p>Clique sur le lien pour réinitialiser ton mot de passe :</p>
           <a href="${resetUrl}">${resetUrl}</a>`,
  });
}

export async function sendContactEmail(name: string, email: string, message: string) {
  await transporter.sendMail({
    from: `"${name}" <${email}>`,
    to: process.env.CONTACT_EMAIL || 'contact@piscineorganique.com',
    subject: 'Nouveau message via le formulaire de contact',
    html: `
      <h2>📩 Nouveau message reçu</h2>
      <p><strong>Nom :</strong> ${name}</p>
      <p><strong>Email :</strong> ${email}</p>
      <p><strong>Message :</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `,
  });
}
