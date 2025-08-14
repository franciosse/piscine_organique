import { getUserById, updateUser, deleteUser } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/app/api/_lib/route-helpers';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'student', 'teacher']).optional(),
  isVerified: z.boolean().optional()
});

interface RouteParams {
  id: string;
}

// GET - Détails d'un utilisateur
export const GET = withAdminAuth(async (req, adminUser, context) => {
  try {
    const params = await context?.params;
    const userId = parseInt(params?.id);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID utilisateur invalide' },
        { status: 400 }
      );
    }
    
    const user = await getUserById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }
    
    // Ne pas retourner le mot de passe
    const { passwordHash, ...sanitizedUser } = user;
    
    return NextResponse.json({
      user: sanitizedUser,
      requestedBy: adminUser.email
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'utilisateur' },
      { status: 500 }
    );
  }
});

// PUT - Mise à jour d'un utilisateur
export const PUT = withAdminAuth(async (req, adminUser, context) => {
  try {
    const params = await context?.params;
    const userId = parseInt(params?.id);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID utilisateur invalide' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const updateData = updateUserSchema.parse(body);

    // Empêcher l'auto-modification du rôle admin
    if (userId === adminUser.id && body?.role && body.role !== adminUser.role) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas modifier votre propre rôle' },
        { status: 403 }
      );
    }
    
    const updatedUser = await updateUser(userId, {
      ...updateData,
      updatedBy: adminUser.id,
      updatedAt: new Date()
    });
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }
    
    const { passwordHash, ...sanitizedUser } = updatedUser;
    
    return NextResponse.json({
      user: sanitizedUser,
      message: 'Utilisateur mis à jour avec succès',
      updatedBy: adminUser.email
    });
    
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'utilisateur' },
      { status: 500 }
    );
  }
});

// DELETE - Suppression d'un utilisateur (soft delete)
export const DELETE = withAdminAuth(async (req, adminUser, context) => {
  try {
    const params = await context?.params;
    const userId = parseInt(params?.id);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID utilisateur invalide' },
        { status: 400 }
      );
    }
    
    // Empêcher l'auto-suppression
    if (userId === adminUser.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 403 }
      );
    }
    
    const deletedUser = await deleteUser(userId, {
      deletedBy: adminUser.id,
      deletedAt: new Date()
    });
    
    if (!deletedUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Utilisateur supprimé avec succès',
      deletedUser: { id: deletedUser.id, name: deletedUser.name, email: deletedUser.email },
      deletedBy: adminUser.email
    });
    
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'utilisateur' },
      { status: 500 }
    );
  }
});