// /app/dashboard/courses/page.tsx (Page Server Component)
import { CoursesPageComponent } from '@/components/student/coursePageComponent';
import { db } from '@/lib/db/drizzle';
import { courses, coursePurchases } from '@/lib/db/schema';
import { eq, isNotNull } from 'drizzle-orm';
import { getUser } from '@/lib/auth/session';
import { Course } from '@/lib/db/schema';

// Services/Queries - Logique métier pure
async function getCourses(): Promise<Course[]> {
  try {
    console.log('Fetching courses from database...');
    
    const allCourses = await db
      .select()
      .from(courses)
      .where(isNotNull(courses.published)) 
      .orderBy(courses.createdAt);
    
    console.log(`Found ${allCourses.length} courses`);
    return allCourses;
  } catch (error) {
    console.error('Error fetching courses from database:', error);
    throw new Error('Erreur lors du chargement des cours');
  }
}

async function getPurchasedCourseIds(): Promise<number[]> {
  try {
    const user = await getUser();
    
    if (!user) {
      return [];
    }
    
    const purchases = await db
      .select({ courseId: coursePurchases.courseId })
      .from(coursePurchases)
      .where(eq(coursePurchases.userId, user.id));
    
    return purchases.map(p => p.courseId);
  } catch (error) {
    console.error('Erreur lors de la récupération des cours achetés:', error);
    return [];
  }
}

// Page Component (Server) - Orchestration
export default async function CoursesPage() {
  try {
    // Récupération des données côté serveur
    const [coursesData, purchasedCourseIds] = await Promise.all([
      getCourses(),
      getPurchasedCourseIds(),
    ]);

    // Rendu du composant UI avec les données
    return (
      <CoursesPageComponent 
        courses={coursesData}
        purchasedCourseIds={purchasedCourseIds}
      />
    );
  } catch (error) {
    console.error('Error in CoursesPage:', error);
    
    // Composant d'erreur
    return (
      <CoursesPageComponent 
        courses={[]}
        purchasedCourseIds={[]}
        error="Impossible de charger les cours. Veuillez réessayer plus tard."
      />
    );
  }
}