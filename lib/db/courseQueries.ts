// lib/db/queries/course-queries.ts
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
  Lesson
} from '@/lib/db/schema';
import { eq, and, asc, isNotNull, sql } from 'drizzle-orm';
import logger from '@/lib/logger/logger';


// Service optimisé avec une seule requête principale
export async function getCourseWithContentOptimized(courseId: number, userId?: number) {
  try {
    logger.info(`🌱 Fetching course ${courseId} with optimized query...`);

    // Requête principale avec tous les JOINs nécessaires
    const courseData = await db
      .select({
        // Course fields
        courseId: courses.id,
        courseTitle: courses.title,
        courseSlug: courses.slug,
        courseDescription: courses.description,
        coursePrice: courses.price,
        courseStripePriceId: courses.stripePriceId,
        coursePublished: courses.published,
        courseImageUrl: courses.imageUrl,
        courseDifficultyLevel: courses.difficultyLevel,
        courseEstimatedDuration: courses.estimatedDuration,
        courseAuthorId: courses.authorId,
        courseCreatedAt: courses.createdAt,
        courseUpdatedAt: courses.updatedAt,
        
        // Author fields
        authorName: users.name,
        authorEmail: users.email,
        
        // Chapter fields
        chapterId: courseChapters.id,
        chapterTitle: courseChapters.title,
        chapterDescription: courseChapters.description,
        chapterPosition: courseChapters.position,
        chapterPublished: courseChapters.published,
        
        // Lesson fields
        lessonId: lessons.id,
        lessonTitle: lessons.title,
        lessonSlug: lessons.slug,
        lessonContent: lessons.content,
        lessonVideoUrl: lessons.videoUrl,
        lessonPosition: lessons.position,
        lessonDuration: lessons.duration,
        lessonPublished: lessons.published,
        
        // Quiz fields
        quizId: quizzes.id,
        quizTitle: quizzes.title,
        quizDescription: quizzes.description,
        quizPassingScore: quizzes.passingScore,
        quizMaxAttempts: quizzes.maxAttempts,
        
        // Progress fields (si userId fourni)
        progressCompleted: userId ? studentProgress.completed : sql`NULL`,
        progressWatchTime: userId ? studentProgress.watchTime : sql`NULL`,
        progressCompletedAt: userId ? studentProgress.completedAt : sql`NULL`,
      })
      .from(courses)
      .leftJoin(users, eq(courses.authorId, users.id))
      .leftJoin(courseChapters, and(
        eq(courseChapters.courseId, courses.id),
        isNotNull(courseChapters.published)
      ))
      .leftJoin(lessons, and(
        eq(lessons.chapterId, courseChapters.id)
      ))
      .leftJoin(quizzes, eq(quizzes.lessonId, lessons.id))
      .leftJoin(studentProgress, userId ? and(
        eq(studentProgress.userId, userId),
        eq(studentProgress.lessonId, lessons.id)
      ) : sql`false`)
      .where(and(
        eq(courses.id, courseId),
        isNotNull(courses.published)
      ))
      .orderBy(
        asc(courseChapters.position),
        asc(lessons.position)
      );

    if (!courseData.length) {
      return null;
    }

    // Requête séparée pour les questions/réponses des quiz
    const quizIds = [...new Set(courseData
      .filter(row => row.quizId)
      .map(row => row.quizId!)
    )];

    let questionsData: any[] = [];
    if (quizIds.length > 0) {
      questionsData = await db
        .select({
          quizId: quizQuestions.quizId,
          questionId: quizQuestions.id,
          question: quizQuestions.question,
          questionType: quizQuestions.questionType,
          points: quizQuestions.points,
          position: quizQuestions.position,
          explanation: quizQuestions.explanation,
          answerId: quizAnswers.id,
          answerText: quizAnswers.answerText,
          isCorrect: quizAnswers.isCorrect,
          answerPosition: quizAnswers.position,
        })
        .from(quizQuestions)
        .leftJoin(quizAnswers, eq(quizAnswers.questionId, quizQuestions.id))
        .where(sql`${quizQuestions.quizId} IN ${quizIds}`)
        .orderBy(
          asc(quizQuestions.position),
          asc(quizAnswers.position)
        );
    }

    // Vérifier l'achat si userId fourni
    let isPurchased = false;
    if (userId) {
      const [purchase] = await db
        .select({ id: coursePurchases.id })
        .from(coursePurchases)
        .where(and(
          eq(coursePurchases.userId, userId),
          eq(coursePurchases.courseId, courseId),
          eq(coursePurchases.status, 'completed')
        ))
        .limit(1);
      
      isPurchased = !!purchase;
    }

    // Construire la structure de données
    return buildCourseStructure(courseData, questionsData, isPurchased);
    
  } catch (error) {
    logger.error('❌ Error in optimized course query:'+ error);
    throw error;
  }
}

function buildCourseStructure(courseData: any[], questionsData: any[], isPurchased: boolean) {
  if (!courseData.length) return null;

  const firstRow = courseData[0];
  
  // Grouper les questions par quiz
  const questionsByQuiz = questionsData.reduce((acc, row) => {
    if (!acc[row.quizId]) {
      acc[row.quizId] = {};
    }
    if (!acc[row.quizId][row.questionId]) {
      acc[row.quizId][row.questionId] = {
        id: row.questionId,
        question: row.question,
        questionType: row.questionType,
        points: row.points,
        position: row.position,
        explanation: row.explanation,
        answers: []
      };
    }
    if (row.answerId) {
      acc[row.quizId][row.questionId].answers.push({
        id: row.answerId,
        answerText: row.answerText,
        isCorrect: row.isCorrect,
        position: row.answerPosition
      });
    }
    return acc;
  }, {});

  // Grouper les données par chapitre et leçon
  const chaptersMap = new Map();
  
  courseData.forEach(row => {
    if (!row.chapterId) return;
    
    if (!chaptersMap.has(row.chapterId)) {
      chaptersMap.set(row.chapterId, {
        id: row.chapterId,
        title: row.chapterTitle,
        description: row.chapterDescription,
        position: row.chapterPosition,
        published: row.chapterPublished,
        lessons: new Map()
      });
    }
    
    const chapter = chaptersMap.get(row.chapterId);
    
    if (row.lessonId && !chapter.lessons.has(row.lessonId)) {
      const quiz = row.quizId ? {
        id: row.quizId,
        title: row.quizTitle,
        description: row.quizDescription,
        passingScore: row.quizPassingScore,
        maxAttempts: row.quizMaxAttempts,
        questions: Object.values(questionsByQuiz[row.quizId] || {})
      } : null;
      
      chapter.lessons.set(row.lessonId, {
        id: row.lessonId,
        title: row.lessonTitle,
        slug: row.lessonSlug,
        content: row.lessonContent,
        videoUrl: row.lessonVideoUrl,
        position: row.lessonPosition,
        duration: row.lessonDuration,
        published: row.lessonPublished,
        quiz,
        isCompleted: row.progressCompleted || false,
        watchTime: row.progressWatchTime || 0,
        completedAt: row.progressCompletedAt
      });
    }
  });

  // Convertir en arrays et trier
  const chapters = Array.from(chaptersMap.values()).map(chapter => ({
    ...chapter,
    lessons: Array.from(chapter.lessons.values() as Lesson[]).sort((a, b) => a.position - b.position)
  })).sort((a, b) => a.position - b.position);

  // Calculer le progrès utilisateur
  const allLessons = chapters.flatMap(ch => ch.lessons);
  const completedLessons = allLessons.filter(lesson => lesson.isCompleted);
  const totalWatchTime = allLessons.reduce((sum, lesson) => sum + (lesson.watchTime || 0), 0);

  return {
    id: firstRow.courseId,
    title: firstRow.courseTitle,
    slug: firstRow.courseSlug,
    description: firstRow.courseDescription,
    price: firstRow.coursePrice,
    stripePriceId: firstRow.courseStripePriceId,
    published: firstRow.coursePublished,
    imageUrl: firstRow.courseImageUrl,
    difficultyLevel: firstRow.courseDifficultyLevel,
    estimatedDuration: firstRow.courseEstimatedDuration,
    authorId: firstRow.courseAuthorId,
    createdAt: firstRow.courseCreatedAt,
    updatedAt: firstRow.courseUpdatedAt,
    author: {
      id: firstRow.courseAuthorId,
      name: firstRow.authorName || 'Équipe Piscine Organique',
      email: firstRow.authorEmail || 'contact@piscineorganique.com'
    },
    chapters,
    isPurchased,
    userProgress: {
      completedLessons: completedLessons.map(l => l.id),
      totalWatchTime,
      lastAccessedAt: completedLessons.length > 0 
        ? new Date(Math.max(...completedLessons.map(l => new Date(l.completedAt).getTime())))
        : new Date()
    }
  };
}