import { getAllUsersWithFilters, createUser } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/app/api/_lib/route-helpers';
import { z } from 'zod';
import logger from '@/lib/logger/logger';


// Schéma de validation pour création d'utilisateur
const createUserSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  email: z.string().email('Email invalide'),
  role: z.enum(['admin', 'student', 'teacher']).default('student'),
  password: z.string().min(8, 'Mot de passe minimum 8 caractères'),
  isVerified: z.boolean().default(false)  
});

// Schéma pour filtres/recherche
const getUsersQuerySchema = z.object({
  role: z.enum(['admin', 'student']).optional(),
  verified: z.enum(['true', 'false']).optional(),
  search: z.string().optional(), // Recherche par nom/email
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 100)).optional()
});

// GET - Liste des utilisateurs avec filtres
export const GET = withAdminAuth(async (req, adminUser) => {
  try {
    const { searchParams } = new URL(req.url);
    const query = getUsersQuerySchema.parse(Object.fromEntries(searchParams));
    
    const result = await getAllUsersWithFilters({
      role: query.role,
      isVerified: query.verified === 'true' ? true : query.verified === 'false' ? false : undefined,
      search: query.search,
      page: query.page || 1,
      limit: query.limit || 10
    });
    
    const sanitizedUsers = result.data.map(({ passwordHash, ...user }) => user);
    
    return NextResponse.json({
      users: sanitizedUsers,
      pagination: result.pagination, // ✅ Plus d'erreur !
      requestedBy: adminUser.email,
      filters: query
    });
    
  } catch (error: any) {
    logger.error('Erreur lors de la récupération des utilisateurs:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Paramètres de requête invalides', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs' },
      { status: 500 }
    );
  }
});

// POST - Création d'un nouvel utilisateur
export const POST = withAdminAuth(async (req, adminUser) => {
  try {
    const body = await req.json();
    const userData = createUserSchema.parse(body);
    
    const newUser = await createUser({
      ...userData,
      createdBy: adminUser.id
    });
    
    // Ne pas retourner le mot de passe
    const { passwordHash, ...sanitizedUser } = newUser;
    
    return NextResponse.json({
      user: sanitizedUser,
      message: 'Utilisateur créé avec succès',
      createdBy: adminUser.email
    }, { status: 201 });
    
  } catch (error: any) {
    logger.error('Erreur lors de la création d\'utilisateur:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error.code === '23505') { // PostgreSQL unique constraint
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'utilisateur' },
      { status: 500 }
    );
  }
});