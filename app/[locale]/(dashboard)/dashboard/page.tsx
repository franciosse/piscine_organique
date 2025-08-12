// app/dashboard/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { CourseCard } from '@/app/[locale]/components/student/courseCard';
import { Course, CoursePurchase, User } from '@/lib/db/schema';
import useSWR from 'swr';
import { Suspense } from 'react';
import Link from 'next/link';

interface DashboardData {
  user: User;
  purchasedCourses: (Course & {
    progress?: {
      completed_lessons: number;
      total_lessons: number;
      completion_percentage: number;
      last_accessed?: Date;
    };
  })[];
  recentPurchases: CoursePurchase[];
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
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="h-[100px] animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Courses Skeleton */}
      <Card className="h-[300px] animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Cours achetés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCourses}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Cours terminés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.completedCourses}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            En cours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.inProgressCourses}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Temps d'apprentissage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {formatTime(stats.totalWatchTime)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MyCourses({ courses }: { courses: DashboardData['purchasedCourses'] }) {
  if (courses.length === 0) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Mes cours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun cours acheté
            </h3>
            <p className="text-gray-500 mb-4">
              Commencez votre apprentissage en explorant notre catalogue de cours.
            </p>
            <Link href="/courses">
              <Button>Parcourir les cours</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Séparer les cours par statut
  const inProgressCourses = courses.filter(
    course => course.progress && course.progress.completion_percentage > 0 && course.progress.completion_percentage < 100
  );
  const completedCourses = courses.filter(
    course => course.progress && course.progress.completion_percentage === 100
  );
  const notStartedCourses = courses.filter(
    course => !course.progress || course.progress.completion_percentage === 0
  );

  return (
    <div className="space-y-8">
      {/* Cours en cours */}
      {inProgressCourses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Continuer l'apprentissage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inProgressCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  showProgress={true}
                  progressData={course.progress}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cours non commencés */}
      {notStartedCourses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prêt à commencer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notStartedCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  showProgress={false}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cours terminés */}
      {completedCourses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cours terminés ({completedCourses.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  showProgress={true}
                  progressData={course.progress}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DashboardContent() {
  const { data: dashboardData, error } = useSWR<DashboardData>('/api/dashboard', fetcher);

  if (error) {
    return (
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Une erreur est survenue lors du chargement des données.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dashboardData) {
    return <DashboardSkeleton />;
  }

  return (
    <div>
      <StatsCards stats={dashboardData.stats} />
      <MyCourses courses={dashboardData.purchasedCourses} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">Tableau de bord</h1>
        <p className="text-gray-600">
          Suivez votre progression et continuez votre apprentissage
        </p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>

      {/* Actions rapides */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/courses">
              <Button variant="outline" className="w-full">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Découvrir des cours
              </Button>
            </Link>
            
            <Link href="/certificates">
              <Button variant="outline" className="w-full">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Mes certificats
              </Button>
            </Link>
            
            <Link href="/profile">
              <Button variant="outline" className="w-full">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Mon profil
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}