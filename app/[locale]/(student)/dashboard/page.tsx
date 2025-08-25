// app/dashboard/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CoursePageComponent } from '@/components/student/coursePageComponent';
import { Course, CoursePurchase, User } from '@/lib/db/schema';
import useSWR from 'swr';
import { Suspense } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  TrendingUp, 
  Search, 
  User as UserIcon,
  ArrowRight
} from 'lucide-react';

interface DashboardData {
  user: {
    id: number;
    name: string | null;
    email: string;
    role: string;
  };
  purchasedCourses: (Course & {
    progress: {
      completed_lessons: number;
      total_lessons: number;
      completion_percentage: number;
      total_watch_time: number;
      last_accessed?: Date;
    };
  })[];
  recentPurchases: {
    id: number;
    courseId: number;
    courseTitle: string;
    amount: number;
    currency: string;
    purchasedAt: Date;
  }[];
  stats: {
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    totalWatchTime: number;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCards({ stats }: { stats: DashboardData['stats'] }) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}min`;
    }
    return `${remainingMinutes}min`;
  };

  const statsData = [
    {
      title: 'Cours achetés',
      value: stats.totalCourses,
      icon: BookOpen,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Cours terminés',
      value: stats.completedCourses,
      icon: Trophy,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'En cours',
      value: stats.inProgressCourses,
      icon: TrendingUp,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      title: 'Temps d\'étude',
      value: formatTime(stats.totalWatchTime),
      icon: Clock,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => (
        <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function QuickActions() {
  const actions = [
    {
      title: 'Découvrir des cours',
      description: 'Explorez notre catalogue',
      href: '/dashboard/courses',
      icon: Search,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Mon profil',
      description: 'Gérez vos informations',
      href: '/dashboard/profile',
      icon: UserIcon,
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <div className="bg-white rounded-xl p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Actions rapides</h2>
      <div className="space-y-4">
        {actions.map((action, index) => (
          <Link key={index} href={action.href}>
            <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 group cursor-pointer">
              <div className={`p-3 rounded-lg bg-gradient-to-r ${action.color}`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function DashboardContent() {
  const { data: dashboardData, error } = useSWR<DashboardData>('/api/account/dashboard', fetcher);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="text-red-600 font-medium mb-2">Erreur de chargement</div>
          <div className="text-red-500 text-sm">
            Une erreur est survenue lors du chargement des données.
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Bonjour ! 👋
        </h1>
        <p className="text-gray-600">
          Continuez votre apprentissage et atteignez vos objectifs
        </p>
      </div>

      <StatsCards stats={dashboardData.stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Utilisation du CoursePageComponent unifié */}
          <CoursePageComponent
            courses={dashboardData.purchasedCourses}
            purchasedCourseIds={dashboardData.purchasedCourses.map(course => course.id)}
            mode="dashboard"
            title="Mes cours"
            description="Continuez votre apprentissage là où vous vous êtes arrêté"
            showOnlyPurchased={true}
            showProgressSections={true}
          />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-full overflow-y-auto">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}