// lib/services/progressService.ts
import logger from '@/lib/logger/logger';

export interface CourseProgressData {
  progress: {
    totalLessons: number;
    completedLessons: number;
    completionPercentage: number;
    totalWatchTime: number;
    lastAccessed: Date;
  };
  lessons: Array<{
    lessonId: number;
    lessonTitle: string;
    chapterTitle: string;
    completed: boolean | null;
    completedAt: Date | null;
    watchTime: number | null;
  }>;
}

export class ProgressService {
  static async getCourseProgress(courseId: number): Promise<CourseProgressData | null> {
    try {
      const response = await fetch(`/api/account/courses/${courseId}/progress`);
      
      logger.debug('getCourse Progress API response:' + JSON.stringify(response));

      if (!response.ok) {
        if (response.status === 403) {
          logger.error('Accès refusé - vérifiez l\'authentification');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      logger.error('Erreur lors du chargement des progrès:', error);
      return null;
    }
  }

  static async updateLessonProgress(
    courseId: number, 
    chapterId: number, 
    lessonId: number, 
    data: { completed?: boolean; watchTime?: number }
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `/api/account/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/progress`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      return response.ok;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour:', error);
      return false;
    }
  }
}