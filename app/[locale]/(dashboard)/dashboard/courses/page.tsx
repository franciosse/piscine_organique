import { CourseCard } from '@/app/[locale]/components/student/courseCard';
import { Course } from '@/lib/db/schema';

// Cette fonction devrait récupérer les cours depuis votre API
async function getCourses(): Promise<Course[]> {
  // Implémentation à adapter selon votre API
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/courses`, {
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error('Erreur lors du chargement des cours');
  }
  
  const data = await response.json();
  return data.courses;
}

export default async function CoursesPage() {
  const courses = await getCourses();

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
            />
          ))}
        </div>
      )}
    </div>
  );
}