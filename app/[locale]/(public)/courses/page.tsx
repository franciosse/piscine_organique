// /app/courses/page.tsx - Page publique des cours
import { db } from '@/lib/db/drizzle';
import { courses } from '@/lib/db/schema';
import { isNotNull } from 'drizzle-orm';
import { Course } from '@/lib/db/schema';
import { CoursePageComponent } from '@/components/student/coursePageComponent';
import logger from '@/lib/logger/logger';


async function getPublicCourses(): Promise<Course[]> {
  try {
    logger.info('Fetching public courses...');
    const publicCourses = await db
      .select()
      .from(courses)
      .where(isNotNull(courses.published)) 
      .orderBy(courses.createdAt);
    
    logger.info(`Found ${publicCourses.length} public courses`);
    return publicCourses;
  } catch (error) {
    logger.error('Error fetching public courses:'+ error);
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
    logger.error('Error in PublicCoursesPage:'+ error);
    return (
      <CoursePageComponent
        courses={[]}
        mode="public"
        error="Impossible de charger les cours. Veuillez réessayer plus tard."
      />
    );
  }
}