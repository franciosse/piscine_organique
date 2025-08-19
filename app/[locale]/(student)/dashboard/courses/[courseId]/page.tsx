// app/dashboard/courses/[courseId]/page.tsx
import { CourseDetailComponent } from '@/components/student/courseDetailComponent';
import { getCourseWithContentOptimized } from '@/lib/db/courseQueries'; // Version optimisée
import { getUser } from '@/lib/auth/session';
import { notFound, redirect } from 'next/navigation';

export default async function CourseDetailPage({
  params
}: {
  params: Promise<{ courseId: string }>
}) {
  const resolvedParams = await params;
  const courseId = parseInt(resolvedParams.courseId);
  
  if (isNaN(courseId)) {
    console.log(`❌ Invalid courseId: ${resolvedParams.courseId}`);
    notFound();
  }

  try {
    const user = await getUser();
    
    if (!user) {
      redirect(`/sign-in?redirect=/dashboard/courses/${courseId}`);
    }

    console.log(`🌱 Loading course ${courseId} for user ${user.id}`);
    
    // OPTIMISATION : Une seule requête au lieu de multiples
    const course = await getCourseWithContentOptimized(courseId, user.id);
    
    if (!course) {
      console.log(`❌ Course ${courseId} not found or not published`);
      notFound();
    }

    const hasAccess = course.isPurchased || course.price === 0;

    if (!hasAccess && course.price > 0) {
      redirect(`/dashboard/courses/${courseId}/purchase`);
    }

    const stats = calculateCourseStats(course);

    return (
      <CourseDetailComponent
        course={course}
        hasAccess={hasAccess}
        stats={stats}
        user={user}
      />
    );

  } catch (error) {
    console.error('❌ Error in CourseDetailPage:', error);
    return <CourseErrorPage />;
  }
}

// Composant d'erreur réutilisable
function CourseErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center border border-emerald-100">
          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Oups ! Problème de chargement 🌱
          </h1>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            Nous rencontrons des difficultés pour charger ce cours.
          </p>
          
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Réessayer 🔄
            </button>
            
            <button 
              onClick={() => window.history.back()}
              className="w-full border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold py-3 px-6 rounded-xl transition-all duration-300"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateCourseStats(course: any) {
  const totalLessons = course.chapters.reduce((total: number, chapter: any) => 
    total + chapter.lessons.length, 0);
  const completedLessons = course.userProgress?.completedLessons.length || 0;
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  
  const totalQuizzes = course.chapters.reduce((total: number, chapter: any) => {
    return total + chapter.lessons.filter((lesson: any) => lesson.quiz).length;
  }, 0);

  const completedQuizzes = course.chapters.reduce((total: number, chapter: any) => {
    return total + chapter.lessons.filter((lesson: any) => 
      lesson.quiz && lesson.isCompleted
    ).length;
  }, 0);

  return {
    totalChapters: course.chapters.length,
    totalLessons,
    completedLessons,
    progressPercentage,
    totalDuration: course.estimatedDuration || 0,
    totalQuizzes,
    completedQuizzes,
    totalWatchTime: course.userProgress?.totalWatchTime || 0,
  };
}