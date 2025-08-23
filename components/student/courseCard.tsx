// /components/pages/courseCard.tsx - Version mise à jour
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
  // Nouvelle prop pour l'état du cours
  courseStatus?: {
    isPurchased: boolean;
    isFree: boolean;
    canAccess: boolean;
    buttonText: string;
    buttonAction: 'access' | 'purchase';
  };
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
  userId,
  courseStatus
}: CourseCardProps) {
  const router = useRouter();

  // Utiliser courseStatus en priorité, sinon fallback sur les anciennes props
  const actualIsPurchased = courseStatus?.isPurchased ?? isPurchased;
  const actualIsFree = courseStatus?.isFree ?? (course.price === 0);
  const actualCanAccess = courseStatus?.canAccess ?? canAccess ?? actualIsFree ?? actualIsPurchased;
  const actualButtonAction = courseStatus?.buttonAction ?? (actualCanAccess ? 'access' : 'purchase');

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
    // Si on peut accéder au cours (acheté ou gratuit), rediriger directement
    if (actualButtonAction === 'access') {
      router.push(`/dashboard/courses/${course.id}`);
      return;
    }

    // Sinon, gérer l'achat selon le mode
    if (mode === 'public') {
      // Mode public - logique pour visiteurs
      if (actualIsFree) {
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
              alert('Erreur lors de la création du paiement :' + {response});
            }
          }
        } catch (error) {
          console.error('Erreur checkout:', error);
          alert('Erreur lors de la création du paiement :' + {error});
        }
      }
    } else {
      // Mode dashboard - logique pour utilisateurs connectés
      if (actualIsFree) {
        // Cours gratuit - accès direct
        router.push(`/dashboard/courses/${course.id}`);
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
            alert('Erreur lors de la création du paiement :' + {response});
          }
        } catch (error) {
          console.error('Erreur checkout:', error);
          alert('Erreur lors de la création du paiement :' + {error});
        }
      }
    }
  };

  // Déterminer le texte du bouton principal
  const getMainButtonText = () => {
    // Priorité aux props courseStatus
    if (courseStatus?.buttonText) {
      return courseStatus.buttonText;
    }

    // Priorité au buttonText passé directement
    if (buttonText) {
      return buttonText;
    }

    // Logique par défaut
    if (mode === 'public') {
      if (actualIsFree) {
        return "Se connecter pour commencer";
      } else if (actualIsPurchased) {
        return "Se connecter pour accéder";
      } else {
        return `Acheter maintenant - ${formatPrice(course.price)}`;
      }
    } else {
      // Mode dashboard
      if (progressData?.completion_percentage === 100) {
        return 'Revoir le cours';
      } else if (hasProgress) {
        return 'Continuer le cours';
      } else if (actualCanAccess) {
        return 'Accéder au cours';
      } else if (actualIsFree) {
        return 'Commencer gratuitement'
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

    if (actualIsPurchased && !actualIsFree) {
      return <Badge variant="secondary">Acheté</Badge>;
    }

    return actualIsFree ? (
      <Badge variant="secondary">Gratuit</Badge>
    ) : (
      <Badge variant="default">
        {formatPrice(course.price)}
      </Badge>
    );
  };

  // Déterminer la couleur du bouton selon l'action
  const getButtonClassName = () => {
    const baseClass = "w-full font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-0";
    
    if (actualButtonAction === 'access') {
      return `${baseClass} bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white`;
    } else {
      return `${baseClass} bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white`;
    }
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
        {actualIsPurchased && !actualIsFree && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-green-500 text-white shadow-lg">
              ✓ Acheté
            </Badge>
          </div>
        )}

        {/* Badge cours gratuit */}
        {actualIsFree && (
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
              className={getButtonClassName()}
              variant="default"
            >
              <span className="flex items-center justify-center gap-2">
                {actualButtonAction === 'access' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-7 4h12l-5 5-5-5z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 3H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                  </svg>
                )}
                {getMainButtonText()}
              </span>
            </Button>
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