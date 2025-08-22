
// /components/public/PublicCoursesComponent.tsx
'use client';

import { Course } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';

interface PublicCoursesComponentProps {
  courses: Course[];
}

export function PublicCoursesComponent({ courses }: PublicCoursesComponentProps) {
  const router = useRouter();

  const handleCourseAction = async (course: Course) => {
    if (course.price === 0) {
      // Cours gratuit - rediriger vers la connexion puis vers le cours
      const callbackUrl = encodeURIComponent(`/courses/${course.id}/start`);
      router.push(`/auth/signin?callbackUrl=${callbackUrl}`);
    } else {
      // Cours payant - rediriger vers checkout
      try {
        const response = await fetch(`/api/courses/${course.id}/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();

        if (data.success && data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          // Si pas connecté pour un achat, rediriger vers signin
          if (response.status === 401) {
            const callbackUrl = encodeURIComponent(`/courses/${course.id}`);
            router.push(`/auth/signin?callbackUrl=${callbackUrl}`);
          } else {
            alert('Erreur lors de la création du paiement');
          }
        }
      } catch (error) {
        console.error('Erreur checkout:', error);
        alert('Erreur lors de la création du paiement');
      }
    }
  };

  if (courses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Aucun cours disponible pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <Card key={course.id} className="hover:shadow-lg transition-shadow">
          {course.imageUrl && (
            <div className="relative h-48 w-full">
              <Image
                src={course.imageUrl}
                alt={course.title}
                fill
                className="object-cover rounded-t-lg"
              />
            </div>
          )}
          
          <CardHeader>
            <div className="flex justify-between items-start mb-2">
              <CardTitle className="text-lg line-clamp-2">
                {course.title}
              </CardTitle>
              
              {course.price === 0 ? (
                <Badge variant="secondary">Gratuit</Badge>
              ) : (
                <Badge variant="default">
                  {formatPrice(course.price)}
                </Badge>
              )}
            </div>
            
            {course.description && (
              <p className="text-sm text-gray-600 line-clamp-3">
                {course.description}
              </p>
            )}
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {/* Informations du cours */}
              <div className="text-sm text-gray-500">
                <p>Créé le {new Date(course.createdAt).toLocaleDateString()}</p>
              </div>
              
              {/* Actions */}
              <div className="space-y-2">
                <Button
                  onClick={() => handleCourseAction(course)}
                  className="w-full"
                  variant={course.price === 0 ? "outline" : "default"}
                >
                  {course.price === 0 ? (
                    "Se connecter pour commencer"
                  ) : (
                    `Acheter maintenant - ${formatPrice(course.price)}`
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/courses/${course.id}`)}
                  className="w-full"
                >
                  Voir les détails
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}