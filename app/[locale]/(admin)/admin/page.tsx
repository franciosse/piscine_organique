// app/dashboard/page.tsx
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



export default function DashboardPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">Tableau de bord</h1>
        <p className="text-gray-600">
          Suivez votre progression et continuez votre apprentissage
        </p>
      </div>

      {/* Actions rapides */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/courses">
              <Button variant="outline" className="w-full">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Découvrir des cours
              </Button>
            </Link>
            
            <Link href="/admin/certificates">
              <Button variant="outline" className="w-full">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Gérer les users
              </Button>
            </Link>

          </div>
        </CardContent>
      </Card>
    </section>
  );
}