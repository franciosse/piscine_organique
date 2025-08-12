// components/courses/CourseCard.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Course } from '@/lib/db/schema';
import { PurchaseButton } from './purchaseButton';

interface CourseCardProps {
  course: Course;
  showPurchaseButton?: boolean;
  showProgress?: boolean;
  progressData?: {
    completed_lessons: number;
    total_lessons: number;
    completion_percentage: number;
    last_accessed?: Date;
  };
}

export function CourseCard({ 
  course, 
  showPurchaseButton = false, 
  showProgress = false,
  progressData 
}: CourseCardProps) {
  const [isPurchased, setIsPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);

  useEffect(() => {
    if (showPurchaseButton) {
      checkPurchaseStatus();
    }
  }, [course.id, showPurchaseButton]);

  const checkPurchaseStatus = async () => {
    setCheckingPurchase(true);
    try {
      const response = await fetch(`/api/courses/${course.id}/check-purchase`);
      const data = await response.json();
      setIsPurchased(data.purchased);
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'achat:', error);
    } finally {
      setCheckingPurchase(false);
    }
  };

  const formatPrice = (priceInCents: number) => {
    if (priceInCents === 0) return 'Gratuit';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(priceInCents / 100);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'Débutant';
      case 'intermediate':
        return 'Intermédiaire';
      case 'advanced':
        return 'Avancé';
      default:
        return level;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const isPublished = course.published !== null;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Image de couverture */}
      <div className="relative">
        {course.imageUrl ? (
          <img
            src={course.imageUrl}
            alt={course.title}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-course.jpg'; // Image par défaut
            }}
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}
        
        {/* Badge du prix */}
        <div className="absolute top-3 right-3">
          <span className="bg-black bg-opacity-75 text-white px-2 py-1 rounded-full text-sm font-medium">
            {formatPrice(course.price)}
          </span>
        </div>

        {/* Badge de statut pour l'admin */}
        {!isPublished && (
          <div className="absolute top-3 left-3">
            <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Brouillon
            </span>
          </div>
        )}
      </div>
      
      <div className="p-6">
        {/* En-tête avec titre et prix */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
            {course.title}
          </h3>
          
          {course.description && (
            <p className="text-gray-600 text-sm line-clamp-3 mb-3">
              {course.description}
            </p>
          )}
        </div>

        {/* Métadonnées du cours */}
        <div className="flex items-center justify-between mb-4">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(course.difficultyLevel || 'beginner')}`}>
            {getDifficultyLabel(course.difficultyLevel || 'beginner')}
          </span>
          
          {course.estimatedDuration && (
            <span className="text-sm text-gray-500 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatDuration(course.estimatedDuration)}
            </span>
          )}
        </div>

        {/* Barre de progression (si applicable) */}
        {showProgress && progressData && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Progression</span>
              <span className="text-sm font-medium text-gray-900">
                {progressData.completion_percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressData.completion_percentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
              <span>{progressData.completed_lessons} / {progressData.total_lessons} leçons</span>
              {progressData.last_accessed && (
                <span>
                  Dernier accès: {new Date(progressData.last_accessed).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {/* Bouton principal */}
          <Link
            href={
              isPurchased || (showProgress && progressData) 
                ? `/courses/${course.id}/learn` 
                : `/courses/${course.id}`
            }
            className="block w-full text-center py-2 px-4 rounded-lg font-medium transition-colors hover:bg-gray-200 border border-gray-300 text-gray-700 hover:text-gray-900"
          >
            {isPurchased || (showProgress && progressData) ? (
              <span className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-10v20m0 0l3-3m-3 3l-3-3" />
                </svg>
                {progressData?.completion_percentage === 100 ? 'Revoir le cours' : 'Continuer le cours'}
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Voir les détails
              </span>
            )}
          </Link>

          {/* Bouton d'achat */}
          {showPurchaseButton && !isPurchased && isPublished && (
            <PurchaseButton
              courseId={course.id}
              price={course.price}
              title={course.title}
              isPurchased={isPurchased}
              disabled={checkingPurchase}
            />
          )}

          {/* Indicateur d'achat */}
          {isPurchased && (
            <div className="flex items-center justify-center py-2 px-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium">Cours acheté</span>
            </div>
          )}

          {/* Cours non publié */}
          {!isPublished && (
            <div className="flex items-center justify-center py-2 px-4 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm font-medium">Cours en préparation</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Version simplifiée pour les listes rapides
export function CourseCardSimple({ course }: { course: Course }) {
  const formatPrice = (priceInCents: number) => {
    if (priceInCents === 0) return 'Gratuit';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(priceInCents / 100);
  };

  return (
    <Link href={`/courses/${course.id}`} className="block">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="flex">
          {/* Image miniature */}
          <div className="flex-shrink-0 w-24 h-24">
            {course.imageUrl ? (
              <img
                src={course.imageUrl}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Contenu */}
          <div className="flex-1 p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                  {course.title}
                </h3>
                {course.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {course.description}
                  </p>
                )}
              </div>
              <div className="ml-4 flex-shrink-0">
                <span className="text-sm font-medium text-blue-600">
                  {formatPrice(course.price)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Hook personnalisé pour gérer l'état des cours achetés
export function usePurchasedCourses() {
  const [purchasedCourses, setPurchasedCourses] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchasedCourses();
  }, []);

  const fetchPurchasedCourses = async () => {
    try {
      const response = await fetch('/api/user/purchased-courses');
      if (response.ok) {
        const data = await response.json();
        setPurchasedCourses(new Set(data.courseIds));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des cours achetés:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPurchased = (courseId: number) => purchasedCourses.has(courseId);

  const addPurchasedCourse = (courseId: number) => {
    setPurchasedCourses(prev => new Set([...prev, courseId]));
  };

  return {
    isPurchased,
    addPurchasedCourse,
    loading,
    refresh: fetchPurchasedCourses,
  };
}