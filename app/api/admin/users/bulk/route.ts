import { bulkUpdateUsers, bulkDeleteUsers } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/app/api/_lib/route-helpers';
import { z } from 'zod';

const bulkActionSchema = z.object({
  action: z.enum(['verify', 'unverify', 'delete', 'role_change']),
  userIds: z.array(z.number()).min(1, 'Au moins un utilisateur requis'),
  newRole: z.enum(['admin', 'student', 'teacher']).optional()
});

// POST - Actions en masse
export const POST = withAdminAuth(async (req, adminUser) => {
  try {
    const body = await req.json();
    const { action, userIds, newRole } = bulkActionSchema.parse(body);
    
    // Empêcher les actions sur son propre compte
    if (userIds.includes(adminUser.id)) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas effectuer d\'actions en masse sur votre propre compte' },
        { status: 403 }
      );
    }
    
    let result;
    let message;
    
    switch (action) {
      case 'verify':
        result = await bulkUpdateUsers(userIds, { isVerified: true });
        message = `${result.count} utilisateur(s) vérifié(s)`;
        break;
        
      case 'unverify':
        result = await bulkUpdateUsers(userIds, { isVerified: false });
        message = `${result.count} utilisateur(s) non-vérifié(s)`;
        break;
        
      case 'delete':
        result = await bulkDeleteUsers(userIds, {
          deletedBy: adminUser.id,
          deletedAt: new Date()
        });
        message = `${result.count} utilisateur(s) supprimé(s)`;
        break;
        
      case 'role_change':
        if (!newRole) {
          return NextResponse.json(
            { error: 'Nouveau rôle requis pour le changement de rôle' },
            { status: 400 }
          );
        }
        result = await bulkUpdateUsers(userIds, { role: newRole });
        message = `${result.count} utilisateur(s) ont maintenant le rôle ${newRole}`;
        break;
        
      default:
        return NextResponse.json(
          { error: 'Action non supportée' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      message,
      affectedCount: result.count,
      action,
      performedBy: adminUser.email
    });
    
  } catch (error: any) {
    console.error('Erreur lors de l\'action en masse:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de l\'action en masse' },
      { status: 500 }
    );
  }
});