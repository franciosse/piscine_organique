// app/api/admin/courses/stats/route.ts
import { getCourseStats } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/app/api/_lib/route-helpers';
import logger from '@/lib/logger/logger';


// GET - Statistiques des cours
export const GET = withAdminAuth(async (req, adminUser) => {
  try {
    const stats = await getCourseStats();
    
    return NextResponse.json({
      stats: {
        total: stats.total,
        published: stats.published,
        draft: stats.draft,
        free: stats.free,
        paid: stats.paid,
        totalPurchases: stats.totalPurchases,
        totalRevenue: stats.totalRevenue, // en centimes
        averagePrice: stats.averagePrice, // en centimes
        recentlyCreated: stats.recentlyCreated, // 7 derniers jours
        completionRate: stats.completionRate, // pourcentage moyen de completion
        popularCourses: stats.popularCourses, // top 5 des cours les plus achetés
      },
      requestedBy: adminUser.email,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erreur lors de la génération des statistiques des cours:'+ error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération des statistiques des cours' },
      { status: 500 }
    );
  }
});