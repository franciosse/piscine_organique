import { updateUserRole } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/app/api/_lib/route-helpers';
import { z } from 'zod';
import logger from '@/lib/logger/logger';


const roleUpdateSchema = z.object({
  role: z.enum(['admin', 'student', 'teacher'])
});

// PATCH - Changement de rôle
export const PATCH = withAdminAuth(async (req, adminUser, context) => {
  try {
    const params = await context?.params;
    const userId = parseInt(params?.id);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID utilisateur invalide' },
        { status: 400 }
      );
    }
    
    // Empêcher l'auto-modification de rôle
    if (userId === adminUser.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas modifier votre propre rôle' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { role } = roleUpdateSchema.parse(body);
    
    const updatedUser = await updateUserRole(userId, role, {
      roleChangedBy: adminUser.id,
      roleChangedAt: new Date()
    });
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: `Rôle changé vers ${role}`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      },
      changedBy: adminUser.email
    });
    
  } catch (error: any) {
    logger.error('Erreur lors du changement de rôle:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Rôle invalide', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors du changement de rôle' },
      { status: 500 }
    );
  }
});