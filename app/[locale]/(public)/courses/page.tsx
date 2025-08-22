// /app/courses/page.tsx - Page publique des cours
import { db } from '@/lib/db/drizzle';
import { courses } from '@/lib/db/schema';
import { isNotNull } from 'drizzle-orm';
import { Course } from '@/lib/db/schema';
import { CoursePageComponent } from '@/components/student/coursePageComponent';

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

export default async function PublicCoursesPage() {
  try {
    const coursesData = await getPublicCourses();
    
    return (
      <CoursePageComponent
        courses={coursesData}
        mode="public"
        title="Nos Cours"
        description="Découvrez notre sélection de cours. Connectez-vous pour accéder aux cours gratuits ou achetez directement les cours payants."
      />
    );
  } catch (error) {
    console.error('Error in PublicCoursesPage:', error);
    return (
      <CoursePageComponent
        courses={[]}
        mode="public"
        error="Impossible de charger les cours. Veuillez réessayer plus tard."
      />
    );
  }
}