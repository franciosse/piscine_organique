// app/dashboard/courses/page.tsx
import { CourseCard } from '@/app/[locale]/components/student/courseCard';
import { Course } from '@/lib/db/schema';

// Cette fonction récupère les cours depuis votre API
async function getCourses(): Promise<Course[]> {
  const response = await fetch('/api/admin/courses', {
    // Important : pour Next.js 15, ajoutez ces options pour les requêtes côté serveur
    cache: 'no-store', // ou 'force-cache' selon vos besoins
  });
  
  console.log('Fetching courses from API:', response);
  
  if (!response.ok) {
    throw new Error('Erreur lors du chargement des cours');
  }
  
  const data = await response.json();
  return data.courses;
}

// Optionnel : fonction pour récupérer les cours achetés côté serveur
async function getPurchasedCourses(): Promise<number[]> {
  try {
    // Cette fonction devrait vérifier les cours achetés côté serveur
    // Vous pouvez l'implémenter selon votre logique d'authentification
    const response = await fetch('/api/user/purchased-courses', {
      cache: 'no-store',
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.courseIds || [];
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des cours achetés:', error);
  }
  
  return [];
}

export default async function CoursesPage() {
  const courses = await getCourses();
  const purchasedCourseIds = await getPurchasedCourses();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Tous les cours</h1>
        <p className="text-gray-600">
          Découvrez notre catalogue de formations et développez vos compétences
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun cours disponible
            </h3>
            <p className="text-gray-500">
              Les cours seront bientôt disponibles. Revenez plus tard !
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              showPurchaseButton={true}
              isPurchased={purchasedCourseIds.includes(course.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}