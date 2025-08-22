import { CoursePageComponent } from '@/components/student/coursePageComponent';
import { db } from '@/lib/db/drizzle';
import { courses, coursePurchases } from '@/lib/db/schema';
import { eq, isNotNull } from 'drizzle-orm';
import { getUser } from '@/lib/auth/session';
import { Course } from '@/lib/db/schema';
import { redirect } from 'next/navigation';

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
      redirect('/auth/signin');
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

export default async function DashboardCoursesPage() {
  try {
    const [coursesData, purchasedCourseIds] = await Promise.all([
      getCourses(),
      getPurchasedCourseIds(),
    ]);

    return (
      <CoursePageComponent
        courses={coursesData}
        purchasedCourseIds={purchasedCourseIds}
        mode="dashboard"
        title="Tous les cours"
        description="Découvrez notre catalogue de formation à l'autoconstruction de piscine organique et développez vos compétences"
      />
    );
  } catch (error) {
    console.error('Error in DashboardCoursesPage:', error);
    return (
      <CoursePageComponent
        courses={[]}
        mode="dashboard"
        error="Impossible de charger les cours. Veuillez réessayer plus tard."
      />
    );
  }
}