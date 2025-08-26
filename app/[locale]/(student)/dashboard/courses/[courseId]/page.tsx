// app/dashboard/courses/[courseId]/page.tsx 
import { CourseDetailComponent } from '@/components/student/courseDetailComponent';
import { CourseErrorPage } from '@/components/student/courseErrorPage'; 
import { getCourseWithContentOptimized } from '@/lib/db/courseQueries';
import { getUser } from '@/lib/auth/session';
import { notFound, redirect } from 'next/navigation';
import logger from '@/lib/logger/logger';


export default async function CourseDetailPage({
  params
}: {
  params: Promise<{ locale: string; courseId: string }>
}) {
  const resolvedParams = await params;
  logger.debug('resolvedParams: ' + JSON.stringify(resolvedParams));

  const courseId = parseInt(resolvedParams.courseId);
  
  logger.debug('Course page, courseId : ' + courseId);

  // Valider le courseId plus strictement
  if (isNaN(courseId) || courseId <= 0) {
    logger.info(`❌ Invalid courseId: ${resolvedParams.courseId}`);
    notFound();
  }

  // Filtrer les fichiers de développement
  if (resolvedParams.courseId.includes('.js') || resolvedParams.courseId.includes('.map')) {
    logger.info(`❌ Invalid courseId (dev file): ${resolvedParams.courseId}`);
    notFound();
  }

  try {
    const user = await getUser();
    
    if (!user) {
      redirect(`/sign-in?redirect=/dashboard/courses/${courseId}`);
    }

    logger.info(`🌱 Loading course ${courseId} for user ${user.id}`);
    
    // OPTIMISATION : Une seule requête au lieu de multiples
    const course = await getCourseWithContentOptimized(courseId, user.id);
    
    if (!course) {
      logger.info(`❌ Course ${courseId} not found or not published`);
      notFound();
    }

    const hasAccess = course.isPurchased || course.price === 0;

    // Redirection vers page d'achat si pas d'accès
    if (!hasAccess && course.price > 0) {
      logger.info(`🔒 No access to course ${courseId}, redirecting to purchase`);
      redirect(`/dashboard/courses/${courseId}/purchase`);
    }

    const stats = calculateCourseStats(course);

    logger.info(`✅ Course ${courseId} loaded successfully for user ${user.id}`+ {
      hasAccess,
      isPurchased: course.isPurchased,
      price: course.price,
      chaptersCount: course.chapters?.length || 0
    });

    return (
      <CourseDetailComponent
        course={course}
        hasAccess={hasAccess}
        stats={stats}
        user={user}
      />
    );

  } catch (error) {
    logger.error('❌ Error in CourseDetailPage:'+ error);
    
    // Si c'est une redirection Next.js, la laisser passer
    if (error && typeof error === 'object' && 'digest' in error && 
        typeof (error as any).digest === 'string' && 
        (error as any).digest.includes('NEXT_REDIRECT')) {
      throw error;
    }
    
    // Sinon retourner la page d'erreur
    return <CourseErrorPage />;
  }
}

function calculateCourseStats(course: any) {
  const totalLessons = course.chapters?.reduce((total: number, chapter: any) => 
    total + (chapter.lessons?.length || 0), 0) || 0;
  
  const completedLessons = course.userProgress?.completedLessons?.length || 0;
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  
  const totalQuizzes = course.chapters?.reduce((total: number, chapter: any) => {
    return total + (chapter.lessons?.filter((lesson: any) => lesson.quiz)?.length || 0);
  }, 0) || 0;

  const completedQuizzes = course.chapters?.reduce((total: number, chapter: any) => {
    return total + (chapter.lessons?.filter((lesson: any) => 
      lesson.quiz && lesson.isCompleted
    )?.length || 0);
  }, 0) || 0;

  return {
    totalChapters: course.chapters?.length || 0,
    totalLessons,
    completedLessons,
    progressPercentage,
    totalDuration: course.estimatedDuration || 0,
    totalQuizzes,
    completedQuizzes,
    totalWatchTime: course.userProgress?.totalWatchTime || 0,
  };
}