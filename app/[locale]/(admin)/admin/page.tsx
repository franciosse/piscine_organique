// app/admin/page.tsx
'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Course, CoursePurchase, User } from '@/lib/db/schema';
import useSWR from 'swr';
import { Suspense } from 'react';
import Link from 'next/link';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Leaf, 
  Zap,
  Globe,
  ArrowUpRight,
  Activity
} from 'lucide-react';

interface AdminDashboardData {
  userStats: {
    total: number;
    byRole: { [key: string]: number };
    verified: number;
    unverified: number;
    recentlyCreated: number;
    deletedCount: number;
  };
  courseStats: {
    total: number;
    published: number;
    draft: number;
    free: number;
    paid: number;
    totalPurchases: number;
    totalRevenue: number;
    averagePrice: number;
    recentlyCreated: number;
    completionRate: number;
    popularCourses: Array<{
      id: number;
      title: string;
      purchases: number;
      revenue: number;
    }>;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminDashboardPage() {
  const { data: userStatsData, error: userStatsError } = useSWR('/api/admin/users/stats', fetcher);
  const { data: courseStatsData, error: courseStatsError } = useSWR('/api/admin/courses/stats', fetcher);

  const userStats = userStatsData?.stats;
  const courseStats = courseStatsData?.stats;

  const isLoading = !userStatsData || !courseStatsData;
  const hasError = userStatsError || courseStatsError;

  return (
    <div className="flex-1 min-h-full bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header avec hero section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-600/10 rounded-2xl"></div>
          <div className="relative p-8 bg-white/60 backdrop-blur-sm rounded-2xl border border-green-200/50 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
                  Administration Piscine Organique
                </h1>
                <p className="text-lg text-gray-600 mt-1">
                  Panneau de configuration
                </p>
              </div>
            </div>
            
            {/* Stats en preview dans le header */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">
                  {isLoading ? '...' : userStats?.total || 0}
                </div>
                <div className="text-sm text-gray-600">Utilisateurs totaux</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-700">
                  {isLoading ? '...' : courseStats?.published || 0}
                </div>
                <div className="text-sm text-gray-600">Cours publiés</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-700">
                  {isLoading ? '...' : courseStats?.completionRate || 0}%
                </div>
                <div className="text-sm text-gray-600">Taux de completion</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">
                  +{isLoading ? '...' : (userStats?.recentlyCreated || 0)}
                </div>
                <div className="text-sm text-gray-600">Nouveaux cette semaine</div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white overflow-hidden relative">
            {/* <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="rgb(255 255 255 / 0.1)"%3e%3cpath d="m0 2 30 0 0 30-30 0z"/%3e%3c/svg%3e')] opacity-20"></div> */}
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Utilisateurs totaux</CardTitle>
                <Users className="w-6 h-6 opacity-80" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold mb-2">
                {isLoading ? '...' : userStats?.total.toLocaleString() || 0}
              </div>
              <div className="flex items-center gap-2 text-green-100">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">+{userStats?.recentlyCreated || 0} cette semaine</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative">
            {/* <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="rgb(255 255 255 / 0.1)"%3e%3cpath d="m0 2 30 0 0 30-30 0z"/%3e%3c/svg%3e')] opacity-20"></div> */}
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Cours actifs</CardTitle>
                <BookOpen className="w-6 h-6 opacity-80" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold mb-2">
                {isLoading ? '...' : courseStats?.published || 0}
              </div>
              <div className="flex items-center gap-2 text-emerald-100">
                <Zap className="w-4 h-4" />
                <span className="text-sm">+{courseStats?.recentlyCreated || 0} cette semaine</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-teal-500 to-cyan-600 text-white overflow-hidden relative md:col-span-2 lg:col-span-1">
            {/* <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="rgb(255 255 255 / 0.1)"%3e%3cpath d="m0 2 30 0 0 30-30 0z"/%3e%3c/svg%3e')] opacity-20"></div> */}
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Chiffre d'affaires</CardTitle>
                <Globe className="w-6 h-6 opacity-80" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold mb-2">
                {isLoading ? '...' : `€${((courseStats?.totalRevenue || 0) / 100).toLocaleString()}`}
              </div>
              <div className="flex items-center gap-2 text-teal-100">
                <Leaf className="w-4 h-4" />
                <span className="text-sm">{courseStats?.totalPurchases || 0} achats</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides modernes */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-xl text-gray-800">Actions rapides</CardTitle>
            </div>
            <p className="text-gray-600 text-sm">Accédez rapidement aux fonctionnalités essentielles</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Link href="/admin/courses" className="group">
                <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
                  <div className="p-3 bg-green-500 rounded-lg group-hover:bg-green-600 transition-colors">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 group-hover:text-green-700">Gérer les cours</h3>
                    <p className="text-sm text-gray-600">Créer, modifier et organiser le contenu</p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                </div>
              </Link>

              <Link href="/admin/users" className="group">
                <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
                  <div className="p-3 bg-emerald-500 rounded-lg group-hover:bg-emerald-600 transition-colors">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 group-hover:text-emerald-700">Gérer les utilisateurs</h3>
                    <p className="text-sm text-gray-600">Superviser la communauté apprenante</p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                </div>
              </Link>
            </div>

            {/* Actions secondaires */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Aperçu rapide
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {isLoading ? '...' : userStats?.verified || 0}
                  </div>
                  <div className="text-xs text-gray-600">Utilisateurs vérifiés</div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-700">
                    {isLoading ? '...' : `${courseStats?.completionRate || 0}%`}
                  </div>
                  <div className="text-xs text-gray-600">Taux de completion</div>
                </div>
                <div className="p-4 bg-teal-50 rounded-lg">
                  <div className="text-2xl font-bold text-teal-700">
                    {isLoading ? '...' : courseStats?.free || 0}
                  </div>
                  <div className="text-xs text-gray-600">Cours gratuits</div>
                </div>
                <div className="p-4 bg-cyan-50 rounded-lg">
                  <div className="text-2xl font-bold text-cyan-700">
                    {isLoading ? '...' : courseStats?.paid || 0}
                  </div>
                  <div className="text-xs text-gray-600">Cours payants</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}