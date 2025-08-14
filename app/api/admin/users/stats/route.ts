import { getUserStats } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/app/api/_lib/route-helpers';

// GET - Statistiques des utilisateurs
export const GET = withAdminAuth(async (req, adminUser) => {
  try {
    const stats = await getUserStats();
    
    return NextResponse.json({
      stats: {
        total: stats.total,
        byRole: stats.byRole,
        verified: stats.verified,
        unverified: stats.unverified,
        recentlyCreated: stats.recentlyCreated, // 7 derniers jours
        deletedCount: stats.deletedCount
      },
      requestedBy: adminUser.email,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erreur lors de la génération des statistiques:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération des statistiques' },
      { status: 500 }
    );
  }
});