// /app/courses/[courseId]/lessons/[lessonId]/page.tsx
import { LessonPlayerComponent } from '@/components/student/lessonPlayerComponent';
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
  users,
  lessonAttachments
} from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getUser } from '@/lib/auth/session';
import { notFound, redirect } from 'next/navigation';
import type { 
  Lesson, 
  CourseChapter, 
  Course,
  Quiz, 
  QuizQuestion, 
  QuizAnswer,
  StudentProgress,
  LessonAttachment
} from '@/lib/db/schema';
import logger from '@/lib/logger/logger';


export interface LessonWithDetails extends Lesson {
  chapter: CourseChapter & {
    course: Course & {
      author: { name: string | null; email: string };
    };
  };
  quiz?: QuizWithQuestions | null;
  attachments: LessonAttachment[];
  progress?: StudentProgress | null;
  nextLesson?: { id: number; title: string; position: number; chapterId: number } | null;
  previousLesson?: { id: number; title: string; position: number; chapterId: number } | null;
}

export interface QuizWithQuestions extends Quiz {
  questions: (QuizQuestion & { answers: QuizAnswer[] })[];
}

async function getLessonWithDetails(lessonId: number, userId?: number): Promise<LessonWithDetails | null> {
  try {
    // 1. Récupérer la leçon avec chapitre et cours
    const lessonData = await db
      .select({
        // Lesson fields
        lessonId: lessons.id,
        lessonTitle: lessons.title,
        lessonSlug: lessons.slug,
        lessonContent: lessons.content,
        lessonVideoUrl: lessons.videoUrl,
        lessonPosition: lessons.position,
        lessonDuration: lessons.duration,
        lessonPublished: lessons.published,
        lessonCreatedAt: lessons.createdAt,
        lessonUpdatedAt: lessons.updatedAt,
        lessonChapterId: lessons.chapterId,
        // Chapter fields
        chapterId: courseChapters.id,
        chapterTitle: courseChapters.title,
        chapterDescription: courseChapters.description,
        chapterPosition: courseChapters.position,
        chapterPublished: courseChapters.published,
        chapterCourseId: courseChapters.courseId,
        // Course fields
        courseId: courses.id,
        courseTitle: courses.title,
        courseSlug: courses.slug,
        courseDescription: courses.description,
        coursePrice: courses.price,
        coursePublished: courses.published,
        courseImageUrl: courses.imageUrl,
        courseDifficultyLevel: courses.difficultyLevel,
        courseEstimatedDuration: courses.estimatedDuration,
        courseAuthorId: courses.authorId,
        // Author fields
        authorName: users.name,
        authorEmail: users.email,
      })
      .from(lessons)
      .innerJoin(courseChapters, eq(lessons.chapterId, courseChapters.id))
      .innerJoin(courses, eq(courseChapters.courseId, courses.id))
      .leftJoin(users, eq(courses.authorId, users.id))
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (!lessonData.length) {
      return null;
    }

    const data = lessonData[0];

    // 2. Récupérer le quiz s'il existe
    const quizData = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.lessonId, lessonId))
      .limit(1);

    let quiz: QuizWithQuestions | null = null;
    if (quizData.length > 0) {
      const questionsData = await db
        .select()
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, quizData[0].id))
        .orderBy(asc(quizQuestions.position));

      const questionsWithAnswers = await Promise.all(
        questionsData.map(async (question) => {
          const answers = await db
            .select()
            .from(quizAnswers)
            .where(eq(quizAnswers.questionId, question.id))
            .orderBy(asc(quizAnswers.position));

          return { ...question, answers };
        })
      );

      quiz = {
        ...quizData[0],
        questions: questionsWithAnswers,
      };
    }

    // 3. Récupérer les attachments
    const attachments = await db
      .select()
      .from(lessonAttachments)
      .where(eq(lessonAttachments.lessonId, lessonId));

    // 4. Récupérer le progrès utilisateur
    let progress: StudentProgress | null = null;
    if (userId) {
      const progressData = await db
        .select()
        .from(studentProgress)
        .where(
          and(
            eq(studentProgress.userId, userId),
            eq(studentProgress.lessonId, lessonId)
          )
        )
        .limit(1);

      progress = progressData[0] || null;
    }

    // 5. Récupérer les leçons précédente et suivante
    const allLessonsInChapter = await db
      .select({
        id: lessons.id,
        title: lessons.title,
        position: lessons.position,
        chapterId: lessons.chapterId,
      })
      .from(lessons)
      .where(eq(lessons.chapterId, data.chapterId))
      .orderBy(asc(lessons.position));

    const currentIndex = allLessonsInChapter.findIndex(l => l.id === lessonId);
    const previousLesson = currentIndex > 0 ? allLessonsInChapter[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessonsInChapter.length - 1 ? allLessonsInChapter[currentIndex + 1] : null;

    // Si pas de leçon suivante dans le chapitre, chercher dans le chapitre suivant
    let finalNextLesson = nextLesson;
    if (!nextLesson) {
      const nextChapterLessons = await db
        .select({
          id: lessons.id,
          title: lessons.title,
          position: lessons.position,
          chapterId: lessons.chapterId,
        })
        .from(lessons)
        .innerJoin(courseChapters, eq(lessons.chapterId, courseChapters.id))
        .where(
          and(
            eq(courseChapters.courseId, data.courseId),
            eq(courseChapters.position, data.chapterPosition + 1)
          )
        )
        .orderBy(asc(lessons.position))
        .limit(1);

      finalNextLesson = nextChapterLessons[0] || null;
    }

    return {
      id: data.lessonId,
      chapterId: data.lessonChapterId,
      title: data.lessonTitle,
      slug: data.lessonSlug,
      content: data.lessonContent,
      videoUrl: data.lessonVideoUrl,
      position: data.lessonPosition,
      duration: data.lessonDuration,
      published: data.lessonPublished,
      createdAt: data.lessonCreatedAt,
      updatedAt: data.lessonUpdatedAt,
      chapter: {
        id: data.chapterId,
        courseId: data.chapterCourseId,
        title: data.chapterTitle,
        description: data.chapterDescription,
        position: data.chapterPosition,
        published: data.chapterPublished,
        createdAt: new Date(), // Ces dates ne sont pas récupérées, à ajuster si nécessaire
        updatedAt: new Date(),
        course: {
          id: data.courseId,
          title: data.courseTitle,
          slug: data.courseSlug,
          description: data.courseDescription,
          price: data.coursePrice,
          stripePriceId: null,
          published: data.coursePublished,
          imageUrl: data.courseImageUrl,
          difficultyLevel: data.courseDifficultyLevel,
          estimatedDuration: data.courseEstimatedDuration,
          authorId: data.courseAuthorId,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {
            name: data.authorName,
            email: data.authorEmail!,
          },
        },
      },
      quiz,
      attachments,
      progress,
      nextLesson: finalNextLesson,
      previousLesson,
    };
  } catch (error) {
    logger.error('Error fetching lesson details:'+ error);
    throw new Error('Erreur lors du chargement de la leçon');
  }
}

async function checkLessonAccess(courseId: number, userId: number): Promise<boolean> {
  try {
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

    return !!purchase;
  } catch (error) {
    logger.error('Error checking lesson access:'+ error);
    return false;
  }
}

export default async function LessonPage({
  params
}: {
  params: Promise<{ courseId: string; lessonId: string }>
}) {
  const resolvedParams = await params;
  const courseId = parseInt(resolvedParams.courseId);
  const lessonId = parseInt(resolvedParams.lessonId);
  
  if (isNaN(courseId) || isNaN(lessonId)) {
    notFound();
  }

  try {
    const user = await getUser();
    
    if (!user) {
      redirect(`/login?redirect=/courses/${courseId}/lessons/${lessonId}`);
    }

    // Récupérer la leçon avec tous les détails
    const lesson = await getLessonWithDetails(lessonId, user.id);
    
    if (!lesson) {
      notFound();
    }

    // Vérifier l'accès au cours
    const hasAccess = await checkLessonAccess(courseId, user.id) || lesson.chapter.course.price === 0;
    
    if (!hasAccess) {
      redirect(`/courses/${courseId}`);
    }

    return (
      <LessonPlayerComponent
        lesson={lesson}
        user={user}
      />
    );
  } catch (error) {
    logger.error('Error in LessonPage:'+ error);
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Erreur de chargement
          </h1>
          <p className="text-gray-600">
            Impossible de charger cette leçon. Veuillez réessayer plus tard.
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
  params: Promise<{ courseId: string; lessonId: string }>
}) {
  const resolvedParams = await params;
  const lessonId = parseInt(resolvedParams.lessonId);
  
  if (isNaN(lessonId)) {
    return {
      title: 'Leçon introuvable',
    };
  }

  try {
    const lesson = await getLessonWithDetails(lessonId);
    
    if (!lesson) {
      return {
        title: 'Leçon introuvable',
      };
    }

    return {
      title: `${lesson.title} - ${lesson.chapter.course.title} | Piscine Organique`,
      description: `Leçon ${lesson.position} du chapitre "${lesson.chapter.title}"`,
    };
  } catch (error) {
    return {
      title: 'Leçon | Piscine Organique :' + error,
    };
  }
}