// /app/courses/[courseId]/page.tsx
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
import { eq, and, asc, desc, isNotNull } from 'drizzle-orm';
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
  userAttempts?: any[]; // On peut typer plus précisément si besoin
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
    console.log(`Fetching course ${courseId} with full content...`);

    // 1. Récupérer le cours principal avec son auteur
    const courseData = await db
      .select({
        // Champs du cours
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        description: courses.description,
        price: courses.price,
        stripePriceId: courses.stripePriceId,
        published: courses.published,
        imageUrl: courses.imageUrl,
        difficultyLevel: courses.difficultyLevel,
        estimatedDuration: courses.estimatedDuration,
        authorId: courses.authorId,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
        // Champs de l'auteur
        authorName: users.name || 'Auteur non disponible',
        authorEmail: users.email || 'Email non disponible',
      })
      .from(courses)
      .leftJoin(users, eq(courses.authorId, users.id))
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!courseData.length) {
      return null;
    }

    const course = courseData[0];

    // Vérifier si le cours est publié
    if (!course.published || new Date(course.published) > new Date()) {
      return null;
    }

    // 2. Récupérer les chapitres publiés
    const chaptersData = await db
      .select()
      .from(courseChapters)
      .where(
        and(
          eq(courseChapters.courseId, courseId),
          isNotNull(courseChapters.published) // published est un timestamp
        )
      )
      .orderBy(asc(courseChapters.position));

    // 3. Pour chaque chapitre, récupérer ses leçons avec quiz
    const chaptersWithLessons: ChapterWithLessons[] = await Promise.all(
      chaptersData.map(async (chapter) => {
        // Récupérer les leçons du chapitre
        const lessonsData = await db
          .select()
          .from(lessons)
          .where(
            and(
              eq(lessons.chapterId, chapter.id),
              // Assuming published is timestamp, adjust if boolean
              // isNotNull(lessons.published)
            )
          )
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
            eq(coursePurchases.courseId, courseId),
            eq(coursePurchases.status, 'completed')
          )
        )
        .limit(1);

      isPurchased = !!purchase;
    }

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
      authorId: course.authorId,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      author: {
        id: course.authorId!,
        name: course.authorName || 'Auteur non disponible',
        email: course.authorEmail! || 'Email non disponible',
      },
      chapters: chaptersWithLessons,
      userProgress,
      isPurchased,
    };
  } catch (error) {
    console.error('Error fetching course with content:', error);
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
      lesson.quiz && lesson.isCompleted // On peut affiner cette logique
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
    notFound();
  }

  try {
    const user = await getUser();
    
    // Récupérer le cours avec tout son contenu
    const course = await getCourseWithContent(courseId, user?.id);
    
    if (!course) {
      notFound();
    }

    // Si l'utilisateur n'a pas acheté le cours et qu'il est payant
    const hasAccess = course.isPurchased || course.price === 0;
    
    if (!hasAccess && user) {
      redirect(`/dashboard/courses/${courseId}/purchase`);
    }

    // Calculer les statistiques
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
    console.error('Error in CourseDetailPage:', error);
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Erreur de chargement
          </h1>
          <p className="text-gray-600">
            Impossible de charger ce cours. Veuillez réessayer plus tard.
          </p>
        </div>
      </div>
    );
  }
}

// Metadata pour SEO
export async function generateMetadata({
  params
}: {
  params: Promise<{ courseId: string }>
}) {
  const resolvedParams = await params;
  const courseId = parseInt(resolvedParams.courseId);
  
  if (isNaN(courseId)) {
    return {
      title: 'Cours introuvable',
    };
  }

  try {
    // Requête simplifiée pour les métadonnées (sans userId)
    const [course] = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        imageUrl: courses.imageUrl,
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);
    
    if (!course) {
      return {
        title: 'Cours introuvable',
      };
    }

    return {
      title: `${course.title} | Piscine Organique`,
      description: course.description || `Apprenez ${course.title} avec Piscine Organique`,
      openGraph: {
        title: course.title,
        description: course.description || undefined,
        images: course.imageUrl ? [{ url: course.imageUrl }] : [],
      },
    };
  } catch (error) {
    console.error('Error in generateMetadata:', error);
    return {
      title: 'Cours | Piscine Organique',
    };
  }
}