// /app/courses/page.tsx - Liste publique des cours
import { db } from '@/lib/db/drizzle';
import { courses } from '@/lib/db/schema';
import { eq, isNotNull } from 'drizzle-orm';
import { Course } from '@/lib/db/schema';
import { PublicCoursesComponent } from '@/components/public/publicCourseComponent';

// Service - récupère tous les cours publiés (sans info d'achat)
async function getPublicCourses(): Promise<Course[]> {
  try {
    console.log('Fetching public courses...');
    const publicCourses = await db
      .select()
      .from(courses)
      .where(isNotNull(courses.published)) 
      .orderBy(courses.createdAt);
    
    console.log(`Found ${publicCourses.length} public courses`);
    return publicCourses;
  } catch (error) {
    console.error('Error fetching public courses:', error);
    throw new Error('Erreur lors du chargement des cours');
  }
}

// Page publique - aucune authentification requise
export default async function PublicCoursesPage() {
  try {
    const coursesData = await getPublicCourses();
    
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Nos Cours</h1>
          <p className="text-gray-600">
            Découvrez notre sélection de cours. 
            Connectez-vous pour accéder aux cours gratuits ou achetez directement les cours payants.
          </p>
        </div>
        
        <PublicCoursesComponent courses={coursesData} />
      </div>
    );
  } catch (error) {
    console.error('Error in PublicCoursesPage:', error);
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Erreur</h1>
          <p className="text-red-600">
            Impossible de charger les cours. Veuillez réessayer plus tard.
          </p>
        </div>
      </div>
    );
  }
}