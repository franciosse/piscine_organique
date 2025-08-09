import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, invitations, teams, teamMembers, ActivityType } from '@/lib/db/schema';
import { hashPassword, setSession } from '@/lib/auth/session';
import { generateEmailVerificationToken } from '@/lib/auth/emailVerification';
import { sendVerificationEmail } from '@/lib/email/emailService';
import { logActivity } from '@/lib/auth/activity'; // adapte selon ta structure

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  inviteId: z.string().optional(),
  redirect: z.string().optional(),
  priceId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = signUpSchema.parse(body);

    // Vérifier si user existe déjà
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User already exists. Try to reset your password.' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(data.password);

    const newUser = {
      email: data.email,
      passwordHash,
      role: 'owner',
      isVerified: false, // email non vérifié par défaut
    };

    const [createdUser] = await db.insert(users).values(newUser).returning();

    if (!createdUser) {
      return NextResponse.json(
        { error: 'Failed to create user. Please try again.' },
        { status: 500 }
      );
    }

    // Générer token email verification + envoyer mail
    const token = await generateEmailVerificationToken(createdUser.id);
    await sendVerificationEmail(data.email, token);

    // Gestion invitation / team
    let teamId: number;
    let userRole: string;
    let createdTeam = null;

    if (data.inviteId) {
      // vérifier invitation valide
      const [invitation] = await db
        .select()
        .from(invitations)
        .where(
          and(
            eq(invitations.id, parseInt(data.inviteId)),
            eq(invitations.email, data.email),
            eq(invitations.status, 'pending')
          )
        )
        .limit(1);

      if (invitation) {
        teamId = invitation.teamId;
        userRole = invitation.role;

        await db
          .update(invitations)
          .set({ status: 'accepted' })
          .where(eq(invitations.id, invitation.id));

        await logActivity(teamId, createdUser.id, ActivityType.ACCEPT_INVITATION);

        [createdTeam] = await db
          .select()
          .from(teams)
          .where(eq(teams.id, teamId))
          .limit(1);
      } else {
        return NextResponse.json(
          { error: 'Invalid or expired invitation.' },
          { status: 400 }
        );
      }
    } else {
      // Créer équipe
      const newTeam = { name: `${data.email}'s Team` };
      [createdTeam] = await db.insert(teams).values(newTeam).returning();

      if (!createdTeam) {
        return NextResponse.json(
          { error: 'Failed to create team. Please try again.' },
          { status: 500 }
        );
      }

      teamId = createdTeam.id;
      userRole = 'owner';

      await logActivity(teamId, createdUser.id, ActivityType.CREATE_TEAM);
    }

    // Ajouter membre d'équipe
    const newTeamMember = {
      userId: createdUser.id,
      teamId,
      role: userRole,
    };

    await Promise.all([
      db.insert(teamMembers).values(newTeamMember),
      logActivity(teamId, createdUser.id, ActivityType.SIGN_UP),
      setSession(createdUser),
    ]);

    return NextResponse.json({
      success: true,
      redirect: data.redirect || '/dashboard',
      priceId: data.priceId || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to sign up.' },
      { status: 400 }
    );
  }
}
