// app/dashboard/courses/[courseId]/page.tsx
import { CourseDetailComponent } from '@/components/student/courseDetailComponent';
import { db } from '@/lib/db/drizzle';
import { 
  courses, 
  courseChapters, 
  lessons, 
  quizzes, 
  quizQuestions,
  quizAnswers,
  coursePurchases, 
  studentProgress,
  users
} from '@/lib/db/schema';
import { eq, and, asc, isNotNull } from 'drizzle-orm';
import { getUser } from '@/lib/auth/session';
import { notFound, redirect } from 'next/navigation';
import type { 
  Course, 
  CourseChapter, 
  Lesson, 
  Quiz, 
  QuizQuestion, 
  QuizAnswer,
  StudentProgress,
  User 
} from '@/lib/db/schema';

// Types étendus pour la page
export interface CourseWithContent extends Course {
  author: Pick<User, 'id' | 'name' | 'email'>;
  chapters: ChapterWithLessons[];
  userProgress?: UserCourseProgress;
  isPurchased?: boolean;
}

export interface ChapterWithLessons extends CourseChapter {
  lessons: LessonWithQuiz[];
}

export interface LessonWithQuiz extends Lesson {
  quiz?: QuizWithQuestions | null;
  isCompleted?: boolean;
  watchTime?: number;
}

export interface QuizWithQuestions extends Quiz {
  questions: QuestionWithAnswers[];
  userAttempts?: any[];
}

export interface QuestionWithAnswers extends QuizQuestion {
  answers: QuizAnswer[];
}

export interface UserCourseProgress {
  completedLessons: number[];
  totalWatchTime: number;
  lastAccessedAt: Date;
}

// Service pour récupérer le cours complet
async function getCourseWithContent(courseId: number, userId?: number): Promise<CourseWithContent | null> {
  try {
    console.log(`🌱 Fetching course ${courseId} with full content...`);

    // 1. Récupérer le cours principal avec son auteur
    const courseData = await db
      .select({
        // Champs du cours
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        description: courses.description || 'Description à venir',
        price: courses.price,
        stripePriceId: courses.stripePriceId,
        published: courses.published,
        imageUrl: courses.imageUrl,
        difficultyLevel: courses.difficultyLevel,
        estimatedDuration: courses.estimatedDuration,
        authorId: courses.authorId,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
        // Champs de l'auteur avec protection null
        authorName: users.name || 'Non défini',
        authorEmail: users.email || 'Non défini',
      })
      .from(courses)
      .leftJoin(users, eq(courses.authorId, users.id))
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!courseData.length) {
      console.log(`❌ Course ${courseId} not found`);
      return null;
    }

    const course = courseData[0];

    // Vérifier si le cours est publié
    if (!course.published || new Date(course.published) > new Date()) {
      console.log(`📅 Course ${courseId} not published yet`);
      return null;
    }

    // Protection contre les auteurs null
    if (!course.authorId || !course.authorName || !course.authorEmail) {
      console.warn(`⚠️ Course ${courseId} has missing author information`);
      // Assigner des valeurs par défaut ou un auteur système
    }

    // 2. Récupérer les chapitres publiés
    const chaptersData = await db
      .select()
      .from(courseChapters)
      .where(
        and(
          eq(courseChapters.courseId, courseId),
          isNotNull(courseChapters.published)
        )
      )
      .orderBy(asc(courseChapters.position));

    console.log(`📚 Found ${chaptersData.length} chapters for course ${courseId}`);

    // 3. Pour chaque chapitre, récupérer ses leçons avec quiz
    const chaptersWithLessons: ChapterWithLessons[] = await Promise.all(
      chaptersData.map(async (chapter) => {
        // Récupérer les leçons du chapitre
        const lessonsData = await db
          .select()
          .from(lessons)
          .where(eq(lessons.chapterId, chapter.id))
          .orderBy(asc(lessons.position));

        // Pour chaque leçon, récupérer son quiz potentiel
        const lessonsWithQuiz: LessonWithQuiz[] = await Promise.all(
          lessonsData.map(async (lesson) => {
            // Récupérer le quiz de la leçon s'il existe
            const [quizData] = await db
              .select()
              .from(quizzes)
              .where(eq(quizzes.lessonId, lesson.id))
              .limit(1);

            let quiz: QuizWithQuestions | null = null;
            if (quizData) {
              // Récupérer les questions du quiz
              const questionsData = await db
                .select()
                .from(quizQuestions)
                .where(eq(quizQuestions.quizId, quizData.id))
                .orderBy(asc(quizQuestions.position));

              // Pour chaque question, récupérer ses réponses
              const questionsWithAnswers: QuestionWithAnswers[] = await Promise.all(
                questionsData.map(async (question) => {
                  const answersData = await db
                    .select()
                    .from(quizAnswers)
                    .where(eq(quizAnswers.questionId, question.id))
                    .orderBy(asc(quizAnswers.position));

                  return {
                    ...question,
                    answers: answersData,
                  };
                })
              );

              quiz = {
                ...quizData,
                questions: questionsWithAnswers,
              };
            }

            // Vérifier si l'utilisateur a terminé cette leçon
            let isCompleted = false;
            let watchTime = 0;
            if (userId) {
              const [progress] = await db
                .select()
                .from(studentProgress)
                .where(
                  and(
                    eq(studentProgress.userId, userId),
                    eq(studentProgress.lessonId, lesson.id)
                  )
                )
                .limit(1);

              if (progress) {
                isCompleted = progress.completed || false;
                watchTime = progress.watchTime || 0;
              }
            }

            return {
              ...lesson,
              quiz,
              isCompleted,
              watchTime,
            };
          })
        );

        return {
          ...chapter,
          lessons: lessonsWithQuiz,
        };
      })
    );

    // 4. Récupérer le progrès global de l'utilisateur
    let userProgress: UserCourseProgress | undefined;
    if (userId) {
      const progressData = await db
        .select({
          lessonId: studentProgress.lessonId,
          completed: studentProgress.completed,
          watchTime: studentProgress.watchTime,
          updatedAt: studentProgress.updatedAt,
        })
        .from(studentProgress)
        .where(
          and(
            eq(studentProgress.userId, userId),
            eq(studentProgress.courseId, courseId),
            eq(studentProgress.completed, true)
          )
        );

      const completedLessons = progressData.map(p => p.lessonId);
      const totalWatchTime = progressData.reduce((total, p) => total + (p.watchTime || 0), 0);
      const lastAccess = progressData.reduce((latest, p) => {
        return p.updatedAt > latest ? p.updatedAt : latest;
      }, new Date(0));

      userProgress = {
        completedLessons,
        totalWatchTime,
        lastAccessedAt: lastAccess,
      };
    }

    // 5. Vérifier si l'utilisateur a acheté le cours
    let isPurchased = false;
    if (userId) {
      const [purchase] = await db
        .select()
        .from(coursePurchases)
        .where(
          and(
            eq(coursePurchases.userId, userId),
            eq(coursePurchases.courseId, courseId)
          )
        )
        .limit(1);

      isPurchased = !!purchase;
    }

    console.log(`✅ Course ${courseId} loaded successfully`);

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      price: course.price,
      stripePriceId: course.stripePriceId,
      published: course.published,
      imageUrl: course.imageUrl,
      difficultyLevel: course.difficultyLevel,
      estimatedDuration: course.estimatedDuration,
      authorId: course.authorId!,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      author: {
        id: course.authorId || 0,
        name: course.authorName || 'Équipe Piscine Organique',
        email: course.authorEmail || 'contact@piscineorganique.com',
      },
      chapters: chaptersWithLessons,
      userProgress,
      isPurchased,
    };
  } catch (error) {
    console.error('❌ Error fetching course with content:', error);
    throw new Error('Erreur lors du chargement du cours');
  }
}

// Calculer les statistiques du cours
function calculateCourseStats(course: CourseWithContent) {
  const totalLessons = course.chapters.reduce((total, chapter) => total + chapter.lessons.length, 0);
  const completedLessons = course.userProgress?.completedLessons.length || 0;
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  
  // Calculer le nombre de quiz
  const totalQuizzes = course.chapters.reduce((total, chapter) => {
    return total + chapter.lessons.filter(lesson => lesson.quiz).length;
  }, 0);

  const completedQuizzes = course.chapters.reduce((total, chapter) => {
    return total + chapter.lessons.filter(lesson => 
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

// Page principale
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
    
    // Rediriger vers la connexion si pas d'utilisateur
    if (!user) {
      redirect(`/sign-in?redirect=/dashboard/courses/${courseId}`);
    }

    console.log(`🌱 Loading course ${courseId} for user ${user.id}`);
    
    // Récupérer le cours avec tout son contenu
    const course = await getCourseWithContent(courseId, user.id);
    
    if (!course) {
      console.log(`❌ Course ${courseId} not found or not published`);
      notFound();
    }

    // Déterminer l'accès utilisateur
    const hasAccess = course.isPurchased || course.price === 0;
    
    console.log(`🔐 Access check for user ${user.id}: hasAccess=${hasAccess}, isPurchased=${course.isPurchased}, price=${course.price}`);

    // Si l'utilisateur n'a pas accès à un cours payant, rediriger vers l'achat
    if (!hasAccess && course.price > 0) {
      console.log(`💰 Redirecting to purchase page for course ${courseId}`);
      redirect(`/dashboard/courses/${courseId}/purchase`);
    }

    // Calculer les statistiques
    const stats = calculateCourseStats(course);

    console.log(`📊 Course stats:`, {
      totalLessons: stats.totalLessons,
      completedLessons: stats.completedLessons,
      progressPercentage: stats.progressPercentage
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
    console.error('❌ Error in CourseDetailPage:', error);
    
    // Page d'erreur moderne et écologique
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
              Notre équipe écologique travaille sur le problème !
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
}

// Metadata pour SEO amélioré
export async function generateMetadata({
  params
}: {
  params: Promise<{ courseId: string }>
}) {
  const resolvedParams = await params;
  const courseId = parseInt(resolvedParams.courseId);
  
  if (isNaN(courseId)) {
    return {
      title: 'Cours introuvable | Piscine Organique',
      description: 'Le cours demandé n\'a pas pu être trouvé.',
    };
  }

  try {
    // Requête simplifiée pour les métadonnées
    const [course] = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        imageUrl: courses.imageUrl,
        difficultyLevel: courses.difficultyLevel,
        estimatedDuration: courses.estimatedDuration,
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);
    
    if (!course) {
      return {
        title: 'Cours introuvable | Piscine Organique',
        description: 'Le cours demandé n\'a pas pu être trouvé.',
      };
    }

    const courseDuration = course.estimatedDuration ? ` • ${course.estimatedDuration} minutes` : '';
    const courseLevel = course.difficultyLevel ? ` • Niveau ${course.difficultyLevel}` : '';

    return {
      title: `${course.title} | Formation Écologique - Piscine Organique`,
      description: course.description || `Découvrez ${course.title}, une formation écologique complète pour un avenir plus vert${courseDuration}${courseLevel}`,
      keywords: ['formation écologique', 'cours en ligne', 'développement durable', 'piscine organique', course.title],
      openGraph: {
        title: course.title,
        description: course.description || `Formation écologique: ${course.title}`,
        images: course.imageUrl ? [{ 
          url: course.imageUrl,
          width: 1200,
          height: 630,
          alt: course.title,
        }] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: course.title,
        description: course.description || `Formation écologique: ${course.title}`,
        images: course.imageUrl ? [course.imageUrl] : [],
      },
    };
  } catch (error) {
    console.error('❌ Error in generateMetadata:', error);
    return {
      title: 'Formation Écologique | Piscine Organique',
      description: 'Découvrez nos formations écologiques pour un avenir plus durable.',
    };
  }
}