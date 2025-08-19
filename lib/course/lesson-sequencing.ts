// utils/lesson-sequencing.ts

export interface LessonAccess {
  isAccessible: boolean;
  reason?: 'not_purchased' | 'previous_incomplete' | 'quiz_required' | 'accessible';
  requiredLesson?: {
    id: number;
    title: string;
    chapterTitle: string;
  };
}

export function checkLessonAccess(
  lesson: any,
  course: any,
  userProgress: any,
  hasAccess: boolean
): LessonAccess {
  
  // 1. Vérifier si l'utilisateur a accès au cours
  if (!hasAccess) {
    return {
      isAccessible: false,
      reason: 'not_purchased'
    };
  }

  // 2. Pour les cours gratuits ou achetés, vérifier la séquence
  const allLessons = course.chapters.flatMap((chapter: any) => 
    chapter.lessons.map((l: any) => ({
      ...l,
      chapterTitle: chapter.title,
      chapterPosition: chapter.position
    }))
  ).sort((a: any, b: any) => {
    // Trier par chapitre puis par position de leçon
    if (a.chapterPosition !== b.chapterPosition) {
      return a.chapterPosition - b.chapterPosition;
    }
    return a.position - b.position;
  });

  const currentLessonIndex = allLessons.findIndex((l: any) => l.id === lesson.id);
  
  // 3. La première leçon est toujours accessible
  if (currentLessonIndex === 0) {
    return {
      isAccessible: true,
      reason: 'accessible'
    };
  }

  // 4. Vérifier que toutes les leçons précédentes sont complétées
  for (let i = 0; i < currentLessonIndex; i++) {
    const previousLesson = allLessons[i];
    const isCompleted = userProgress?.completedLessons?.includes(previousLesson.id) || false;
    
    if (!isCompleted) {
      return {
        isAccessible: false,
        reason: 'previous_incomplete',
        requiredLesson: {
          id: previousLesson.id,
          title: previousLesson.title,
          chapterTitle: previousLesson.chapterTitle
        }
      };
    }

    // 5. Si la leçon précédente a un quiz, vérifier qu'il est réussi
    if (previousLesson.quiz) {
      // Ici vous pouvez ajouter la logique pour vérifier le quiz
      // Pour l'instant, on considère que compléter la leçon = réussir le quiz
    }
  }

  return {
    isAccessible: true,
    reason: 'accessible'
  };
}

export function getNextLesson(currentLessonId: number, course: any) {
  const allLessons = course.chapters.flatMap((chapter: any) => 
    chapter.lessons.map((l: any) => ({
      ...l,
      chapterTitle: chapter.title
    }))
  ).sort((a: any, b: any) => {
    if (a.chapterPosition !== b.chapterPosition) {
      return a.chapterPosition - b.chapterPosition;
    }
    return a.position - b.position;
  });

  const currentIndex = allLessons.findIndex((l: { id: number; }) => l.id === currentLessonId);
  return currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
}

export function getPreviousLesson(currentLessonId: number, course: any) {
  const allLessons = course.chapters.flatMap((chapter: any) => 
    chapter.lessons.map((l: any) => ({
      ...l,
      chapterTitle: chapter.title
    }))
  ).sort((a: any, b: any) => {
    if (a.chapterPosition !== b.chapterPosition) {
      return a.chapterPosition - b.chapterPosition;
    }
    return a.position - b.position;
  });

  const currentIndex = allLessons.findIndex((l: { id: number; }) => l.id === currentLessonId);
  return currentIndex > 0 ? allLessons[currentIndex - 1] : null;
}