// components/courses/CourseCard.tsx
// Version Server Component (sans hooks) - Améliorée

import Link from 'next/link';
import { Course } from '@/lib/db/schema';
import { PurchaseButtonWrapper } from './purchaseButtonWrapper';

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
  isPurchased?: boolean;
  isFree?: boolean;        // Nouveau
  hasAccess?: boolean;     // Nouveau
  needsPurchase?: boolean; // Nouveau
  userId?: number;
}

export function CourseCard({ 
  course, 
  showPurchaseButton = false, 
  showProgress = false,
  progressData,
  isPurchased = false,
  isFree = false,
  hasAccess = false,
  needsPurchase = false,
  userId
}: CourseCardProps) {
  
  // Debug logs (à retirer en production)
  if (process.env.NODE_ENV === 'development') {
    console.log(`CourseCard Debug:`, {
      courseId: course.id,
      courseTitle: course.title,
      price: course.price,
      isPurchased,
      isFree,
      hasAccess,
      needsPurchase,
      userId,
      showPurchaseButton,
      showProgress
    });
  }

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
        return 'bg-emerald-100 text-emerald-800';
      case 'intermediate':
        return 'bg-amber-100 text-amber-800';
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
  const hasProgress = showProgress && progressData;
  
  // Calcul automatique des statuts si pas fournis
  const computedIsFree = isFree || course.price === 0;
  const computedHasAccess = hasAccess || computedIsFree || isPurchased;
  const computedNeedsPurchase = needsPurchase || (!computedHasAccess && course.price > 0);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-emerald-100">
      {/* Image de couverture */}
      <div className="relative">
        {course.imageUrl ? (
          <img
            src={course.imageUrl}
            alt={course.title}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-course.jpg';
            }}
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-emerald-100 to-green-200 flex items-center justify-center">
            <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}
        
        {/* Badge du prix avec logique améliorée */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold shadow-lg ${
            computedIsFree 
              ? 'bg-emerald-500 text-white' 
              : isPurchased
                ? 'bg-green-500 text-white'
                : 'bg-white/90 text-gray-800'
          }`}>
            {computedIsFree ? 'Gratuit' : formatPrice(course.price)}
          </span>
        </div>

        {/* Badge de statut d'achat */}
        {isPurchased && !computedIsFree && (
          <div className="absolute top-3 left-3">
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
              ✓ Acheté
            </span>
          </div>
        )}

        {/* Badge cours gratuit */}
        {computedIsFree && (
          <div className="absolute top-3 left-3">
            <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
              🌱 Gratuit
            </span>
          </div>
        )}

        {/* Badge de statut pour l'admin */}
        {!isPublished && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Brouillon
            </span>
          </div>
        )}
      </div>
      
      <div className="p-6">
        {/* En-tête avec titre */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-2 mb-3">
            {course.title}
          </h3>
          
          {course.description && (
            <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
              {course.description}
            </p>
          )}
        </div>

        {/* Métadonnées du cours */}
        <div className="flex items-center justify-between mb-4">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(course.difficultyLevel || 'beginner')}`}>
            {getDifficultyLabel(course.difficultyLevel || 'beginner')}
          </span>
          
          {course.estimatedDuration && (
            <span className="text-sm text-gray-500 flex items-center bg-gray-50 px-2 py-1 rounded-lg">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatDuration(course.estimatedDuration)}
            </span>
          )}
        </div>

        {/* Barre de progression (si applicable) */}
        {hasProgress && (
          <div className="mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-emerald-800">Progression</span>
              <span className="text-sm font-bold text-emerald-600">
                {progressData.completion_percentage}%
              </span>
            </div>
            <div className="w-full bg-emerald-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressData.completion_percentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2 text-xs text-emerald-700">
              <span>{progressData.completed_lessons} / {progressData.total_lessons} leçons</span>
              {progressData.last_accessed && (
                <span>
                  Dernier accès: {new Date(progressData.last_accessed).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions avec logique complète */}
        <div className="space-y-3">
          {/* Bouton principal - Logique pour tous les cas */}
          {(computedHasAccess || hasProgress) ? (
            <Link
              href={`/dashboard/courses/${course.id}`}
              className="block w-full text-center py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-10v20m0 0l3-3m-3 3l-3-3" />
                </svg>
                {progressData?.completion_percentage === 100 ? 'Revoir le cours' : 
                 hasProgress ? 'Continuer le cours' : 
                 computedIsFree ? 'Commencer gratuitement' :
                 'Accéder au cours'}
              </span>
            </Link>
          ) : (
            <Link
              href={`/dashboard/courses/${course.id}/purchase`}
              className="block w-full text-center py-3 px-4 border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-xl font-semibold transition-all duration-300"
            >
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Voir les détails
              </span>
            </Link>
          )}

          {/* Wrapper du bouton d'achat - Seulement pour cours payants non achetés */}
          {showPurchaseButton && isPublished && computedNeedsPurchase && (
            <PurchaseButtonWrapper
              courseId={course.id}
              price={course.price}
              title={course.title}
              initialPurchaseStatus={isPurchased}
            />
          )}

          {/* Debug info (development only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              Debug: isFree={computedIsFree.toString()}, isPurchased={isPurchased.toString()}, 
              hasAccess={computedHasAccess.toString()}, needsPurchase={computedNeedsPurchase.toString()}
            </div>
          )}

          {/* Cours non publié */}
          {!isPublished && (
            <div className="flex items-center justify-center py-3 px-4 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
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