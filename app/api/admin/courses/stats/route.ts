// app/api/admin/courses/stats/route.ts
import { getCourseStats } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/app/api/_lib/route-helpers';
import logger from '@/lib/logger/logger';

// GET - Statistiques des cours
export const GET = withAdminAuth(async (req, adminUser) => {
  try {
    logger.info('📊 Récupération des statistiques de cours par admin:', adminUser.email);
    
    const stats = await getCourseStats();
    
    return NextResponse.json({
      stats: {
        total: stats.total,
        published: stats.published,
        unpublished: stats.unpublished,
        byDifficulty: stats.byDifficulty,
        revenue: stats.revenue,
        recentlyCreated: stats.recentlyCreated,
        structure: stats.structure
      },
      requestedBy: adminUser.email,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Erreur lors de la génération des statistiques de cours:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération des statistiques de cours' },
      { status: 500 }
    );
  }
});