import { toggleUserVerification } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/app/api/_lib/route-helpers';

// PATCH - Toggle le statut de vérification
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
    
    const updatedUser = await toggleUserVerification(userId, {
      verifiedBy: adminUser.id,
      verifiedAt: new Date()
    });
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: `Utilisateur ${updatedUser.isVerified ? 'vérifié' : 'non-vérifié'}`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        isVerified: updatedUser.isVerified
      },
      actionBy: adminUser.email
    });
    
  } catch (error) {
    console.error('Erreur lors du toggle de vérification:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la modification du statut de vérification' },
      { status: 500 }
    );
  }
});