// /app/api/contact/route.ts
import { NextResponse } from 'next/server';
import { sendContactEmail } from '@/lib/email/emailService'; 
import { withUserAuth } from '@/app/api/_lib/route-helpers';



export const POST = withUserAuth(async (req, user) => {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    await sendContactEmail(name, email, message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur envoi email contact:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
});
