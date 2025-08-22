// /components/pages/courseCard.tsx - Version avec votre style préféré
'use client';

import { Course } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';

interface CourseCardProps {
  course: Course;
  showPurchaseButton?: boolean;
  mode?: 'public' | 'dashboard';
  showProgress?: boolean;
  progressData?: {
    completed_lessons: number;
    total_lessons: number;
    completion_percentage: number;
    last_accessed?: Date;
  };
  // Props du getCourseProps
  isPurchased?: boolean;
  canAccess?: boolean;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'ghost';
  statusBadge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  userId?: number;
}

export function CourseCard({ 
  course, 
  showPurchaseButton = true,
  mode = 'dashboard',
  showProgress = false,
  progressData,
  isPurchased = false,
  canAccess = false,
  buttonText,
  buttonVariant = 'default',
  statusBadge,
  userId
}: CourseCardProps) {
  const router = useRouter();

  // Logique calculée
  const computedIsFree = course.price === 0;
  const computedHasAccess = canAccess || computedIsFree || isPurchased;
  const computedNeedsPurchase = !computedHasAccess && course.price > 0;
  const isPublished = course.published !== null;
  const hasProgress = showProgress && progressData;

  // Fonctions utilitaires (comme dans votre ancien composant)
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

  const handleCourseAction = async () => {
    if (mode === 'public') {
      // Mode public - logique pour visiteurs
      if (course.price === 0) {
        // Cours gratuit - rediriger vers la connexion puis vers le cours
        const callbackUrl = encodeURIComponent(`/dashboard/courses/${course.id}`);
        router.push(`/sign-in?callbackUrl=${callbackUrl}`);
      } else {
        // Cours payant - rediriger vers checkout
        try {
          const response = await fetch(`/api/account/courses/${course.id}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          const data = await response.json();

          if (data.success && data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
          } else {
            // Si pas connecté pour un achat, rediriger vers signin
            if (response.status === 401) {
              const callbackUrl = encodeURIComponent(`/dashboard/courses/${course.id}`);
              router.push(`/sign-in?callbackUrl=${callbackUrl}`);
            } else {
              alert('Erreur lors de la création du paiement');
            }
          }
        } catch (error) {
          console.error('Erreur checkout:', error);
          alert('Erreur lors de la création du paiement');
        }
      }
    } else {
      // Mode dashboard - logique pour utilisateurs connectés
      if (computedHasAccess || hasProgress) {
        router.push(`/dashboard/courses/${course.id}`);
      } else if (course.price === 0) {
        // Cours gratuit - inscription directe ou démarrer
        router.push(`/dashboard/courses/${course.id}/`);
      } else {
        // Cours payant - aller au checkout
        try {
          const response = await fetch(`/api/account/courses/${course.id}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          const data = await response.json();

          if (data.success && data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
          } else {
            alert('Erreur lors de la création du paiement');
          }
        } catch (error) {
          console.error('Erreur checkout:', error);
          alert('Erreur lors de la création du paiement');
        }
      }
    }
  };

  // const handleViewDetails = () => {
  //   router.push(`/dashboard/courses/${course.id}`);
  // };

  // Déterminer le texte du bouton principal selon le mode
  const getMainButtonText = () => {
    if (buttonText) return buttonText;

    if (mode === 'public') {
      return course.price === 0 
        ? "Se connecter pour commencer"
        : `Acheter maintenant - ${formatPrice(course.price)}`;
    } else {
      if (progressData?.completion_percentage === 100) {
        return 'Revoir le cours';
      } else if (hasProgress) {
        return 'Continuer le cours';
      } else if (computedHasAccess) {
        return computedIsFree ? 'Commencer gratuitement' : 'Accéder au cours';
      } else {
        return `Acheter - ${formatPrice(course.price)}`;
      }
    }
  };

  // Déterminer le badge de prix/statut
  const getPriceBadge = () => {
    if (statusBadge) {
      return (
        <Badge variant={statusBadge.variant}>
          {statusBadge.text}
        </Badge>
      );
    }

    if (isPurchased && !computedIsFree) {
      return <Badge variant="secondary">Acheté</Badge>;
    }

    return course.price === 0 ? (
      <Badge variant="secondary">Gratuit</Badge>
    ) : (
      <Badge variant="default">
        {formatPrice(course.price)}
      </Badge>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-emerald-100">
      {/* Image de couverture avec badges overlay */}
      <div className="relative">
        {course.imageUrl ? (
          <Image
            src={course.imageUrl}
            alt={course.title}
            width={400}
            height={192}
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
        
        {/* Badge du prix dans le coin */}
        <div className="absolute top-3 right-3">
          {getPriceBadge()}
        </div>

        {/* Badge de statut d'achat */}
        {isPurchased && !computedIsFree && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-green-500 text-white shadow-lg">
              ✓ Acheté
            </Badge>
          </div>
        )}

        {/* Badge cours gratuit */}
        {computedIsFree && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-emerald-500 text-white shadow-lg">
              🌱 Gratuit
            </Badge>
          </div>
        )}

        {/* Badge brouillon */}
        {!isPublished && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="outline" className="bg-amber-500 text-white border-amber-600">
              Brouillon
            </Badge>
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
        {hasProgress && progressData && (
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

        {/* Date de création */}
        <div className="text-sm text-gray-500 mb-4">
          <p>Créé le {new Date(course.createdAt).toLocaleDateString()}</p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* Bouton principal */}
          {showPurchaseButton && isPublished && (
            <Button
              onClick={handleCourseAction}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-0"
              variant="default"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                {getMainButtonText()}
              </span>
            </Button>
          )}
          
          {/* Bouton voir les détails */}
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={handleViewDetails}
            className="w-full border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 font-medium py-2.5 px-4 rounded-xl transition-all duration-300 hover:shadow-md"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Voir les détails
            </span>
          </Button> */}

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