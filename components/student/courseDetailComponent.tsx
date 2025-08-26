// components/student/courseDetailComponent.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernVideoPlayer } from './ModernVideoPlayer';
import { QuizComponent } from './QuizComponent';
import { LessonContentDisplay } from './LessonContentDisplay';
import { LessonProgressComponent } from './LessonProgressComponent';
import { ProgressService } from '@/lib/services/progressService';
import { checkLessonAccess } from '@/lib/course/lesson-sequencing';
import logger from '@/lib/logger/logger';
import {
  Play, Lock, CheckCircle, Clock, Users, Award, BookOpen,
  ChevronDown, ChevronRight, Leaf, TreePine, Sprout, Globe, Star
} from 'lucide-react';

// Types
interface CourseWithContent {
  id: number;
  title: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  author: { id: number; name: string | null; email: string | null; };
  chapters: ChapterWithLessons[];
  userProgress?: UserCourseProgress;
  isPurchased?: boolean;
}

interface ChapterWithLessons {
  id: number;
  title: string;
  description: string | null;
  position: number;
  lessons: LessonWithQuiz[];
}

interface LessonWithQuiz {
  id: number;
  title: string;
  duration: number | null;
  videoUrl: string | null;
  position: number;
  content: string | null;
  isCompleted?: boolean;
  quiz?: {
    id: number;
    title: string;
    questions: any[];
    isCompleted?: boolean;
    passingScore: number;
  };
}

interface UserCourseProgress {
  completedLessons: number[];
  totalWatchTime: number;
  lastAccessedAt: Date;
}

interface CourseStats {
  totalChapters: number;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  totalDuration: number;
  totalQuizzes: number;
  completedQuizzes: number;
  totalWatchTime: number;
}

interface CourseDetailComponentProps {
  course: CourseWithContent;
  hasAccess: boolean;
  stats: CourseStats;
  user: any;
  onLessonComplete?: (lessonId: number) => void;
  onQuizComplete?: (lessonId: number, quizId: number, score: number) => void;
}

// Composant d'une leçon dans le curriculum
function LessonItem({ 
  lesson, 
  course,
  userProgress,
  hasAccess, 
  isActive, 
  onClick 
}: { 
  lesson: LessonWithQuiz; 
  course: CourseWithContent;
  userProgress?: UserCourseProgress;
  hasAccess: boolean; 
  isActive: boolean;
  onClick: () => void;
}) {
  const accessCheck = checkLessonAccess(lesson, course, userProgress, hasAccess);
  
  return (
    <div
      onClick={accessCheck.isAccessible ? onClick : undefined}
      className={`
        p-4 rounded-xl border-2 transition-all duration-300
        ${isActive 
          ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50 shadow-lg' 
          : accessCheck.isAccessible 
            ? 'border-emerald-200 hover:border-emerald-300 bg-white hover:bg-emerald-50 cursor-pointer'
            : 'border-gray-200 bg-gray-50'
        }
        ${!accessCheck.isAccessible ? 'opacity-60 cursor-not-allowed' : ''}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center
            ${lesson.isCompleted 
              ? 'bg-emerald-500 text-white' 
              : accessCheck.isAccessible 
                ? 'bg-emerald-100 text-emerald-600' 
                : 'bg-gray-100 text-gray-400'
            }
          `}>
            {lesson.isCompleted ? (
              <CheckCircle className="h-5 w-5" />
            ) : accessCheck.isAccessible ? (
              <Play className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
          </div>
          
          <div>
            <h4 className={`font-medium ${accessCheck.isAccessible ? 'text-gray-900' : 'text-gray-500'}`}>
              {lesson.title}
            </h4>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              {lesson.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {Math.floor(lesson.duration / 60)}min
                </span>
              )}
              {lesson.quiz && (
                <span className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  Quiz
                </span>
              )}
            </div>
            
            {!accessCheck.isAccessible && accessCheck.reason === 'previous_incomplete' && accessCheck.requiredLesson && (
              <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                Terminez d'abord : {accessCheck.requiredLesson.title}
              </div>
            )}
          </div>
        </div>
        
        {!accessCheck.isAccessible && <Lock className="h-4 w-4 text-gray-400" />}
      </div>
    </div>
  );
}

// Composant chapitre avec ses leçons
function ChapterSection({ 
  course,
  chapter, 
  hasAccess, 
  activeLesson, 
  onLessonSelect 
}: { 
  course : CourseWithContent;
  chapter: ChapterWithLessons; 
  hasAccess: boolean;
  activeLesson?: LessonWithQuiz;
  onLessonSelect: (lesson: LessonWithQuiz) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const completedLessons = chapter.lessons.filter(l => l.isCompleted).length;
  
  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
      <CardHeader 
        className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-xl">
              <TreePine className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-emerald-800">{chapter.title}</CardTitle>
              <p className="text-sm text-emerald-600 mt-1">
                {completedLessons}/{chapter.lessons.length} leçons terminées
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-emerald-600" />
          ) : (
            <ChevronRight className="h-5 w-5 text-emerald-600" />
          )}
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="p-6">
          <div className="space-y-3">
            {chapter.lessons.map((lesson) => (
              <LessonItem
                key={lesson.id}
                lesson={lesson}
                course={course}
                userProgress={course.userProgress}
                hasAccess={hasAccess}
                isActive={activeLesson?.id === lesson.id}
                onClick={() => onLessonSelect(lesson)}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Fonction utilitaire pour trouver l'ID du chapitre d'une leçon
function getChapterIdByLesson(courseChapters: ChapterWithLessons[], lessonId: number): number | null {
  for (const chapter of courseChapters) {
    if (chapter.lessons.some(l => l.id === lessonId)) {
      return chapter.id;
    }
  }
  return null;
}

// Composant principal
export function CourseDetailComponent({ 
  course, 
  hasAccess, 
  stats, 
  user,
  onLessonComplete,
  onQuizComplete 
}: CourseDetailComponentProps) {
  const [activeLesson, setActiveLesson] = useState<LessonWithQuiz | undefined>(
    course.chapters[0]?.lessons[0] || undefined
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [currentStats, setCurrentStats] = useState<CourseStats>(stats);
  const [isLoading, setIsLoading] = useState(true);
  
  // Charger les progrès depuis votre API
  useEffect(() => {
    const loadProgress = async () => {
      if (!hasAccess || !user) {
        setIsLoading(false);
        return;
      }
      
      try {
        const progressData = await ProgressService.getCourseProgress(course.id);
        
        if (progressData) {
          // Créer un map des progrès par lesson ID
          const progressMap = new Map();
          progressData.lessons.forEach(lessonProgress => {
            progressMap.set(lessonProgress.lessonId, lessonProgress);
          });
          
          // Mettre à jour les leçons avec les données de progression
          const completedLessonIds: number[] = [];
          
          course.chapters.forEach(chapter => {
            chapter.lessons.forEach(lesson => {
              const progress = progressMap.get(lesson.id);
              if (progress?.completed) {
                lesson.isCompleted = true;
                completedLessonIds.push(lesson.id);
                
                // Marquer le quiz comme terminé si applicable
                if (lesson.quiz && progress.completed) {
                  lesson.quiz.isCompleted = true;
                }
              }
            });
          });
          
          // Mettre à jour userProgress
          if (course.userProgress) {
            course.userProgress.completedLessons = completedLessonIds;
            course.userProgress.totalWatchTime = progressData.progress.totalWatchTime;
          } else {
            course.userProgress = {
              completedLessons: completedLessonIds,
              totalWatchTime: progressData.progress.totalWatchTime,
              lastAccessedAt: new Date(progressData.progress.lastAccessed)
            };
          }
          
          // Mettre à jour les stats avec les données de l'API
          setCurrentStats({
            ...currentStats,
            completedLessons: progressData.progress.completedLessons,
            progressPercentage: progressData.progress.completionPercentage,
            totalWatchTime: progressData.progress.totalWatchTime
          });
          
          setUpdateTrigger(prev => prev + 1);
        }
      } catch (error) {
        logger.error('Erreur lors du chargement de la progression:', error);
        
        // Fallback vers localStorage en cas d'erreur API
        try {
          const savedProgress = localStorage.getItem(`course_${course.id}_progress`);
          if (savedProgress) {
            const { completedLessons } = JSON.parse(savedProgress);
            
            course.chapters.forEach(chapter => {
              chapter.lessons.forEach(lesson => {
                if (completedLessons.includes(lesson.id)) {
                  lesson.isCompleted = true;
                }
              });
            });
            
            if (course.userProgress) {
              course.userProgress.completedLessons = completedLessons;
            } else {
              course.userProgress = {
                completedLessons,
                totalWatchTime: 0,
                lastAccessedAt: new Date()
              };
            }
            
            // Recalculer les stats localement
            const allLessons = course.chapters.flatMap(ch => ch.lessons);
            const completedLessonsCount = allLessons.filter(l => l.isCompleted).length;
            const progressPercentage = allLessons.length > 0 
              ? Math.round((completedLessonsCount / allLessons.length) * 100) 
              : 0;
            
            setCurrentStats({
              ...currentStats,
              completedLessons: completedLessonsCount,
              progressPercentage
            });
            
            setUpdateTrigger(prev => prev + 1);
          }
        } catch (localError) {
          logger.error('Erreur lors du chargement depuis localStorage:', localError);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProgress();
  }, [course.id, hasAccess, user]);

  const handleLessonSelect = (lesson: LessonWithQuiz) => {
    if (hasAccess) {
      setActiveLesson(lesson);
      setIsMobileMenuOpen(false);
    }
  };

  const handleLessonCompleteClick = () => {
    if (activeLesson) {
      activeLesson.isCompleted = true;
      
      if (course.userProgress) {
        if (!course.userProgress.completedLessons.includes(activeLesson.id)) {
          course.userProgress.completedLessons.push(activeLesson.id);
        }
      } else {
        course.userProgress = {
          completedLessons: [activeLesson.id],
          totalWatchTime: 0,
          lastAccessedAt: new Date()
        };
      }
      
      // Sauvegarder en cache local également
      try {
        const progressData = {
          completedLessons: course.userProgress.completedLessons,
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(`course_${course.id}_progress`, JSON.stringify(progressData));
      } catch (error) {
        logger.error('Erreur lors de la sauvegarde locale:', error);
      }
      
      // Recalculer les stats
      const allLessons = course.chapters.flatMap(ch => ch.lessons);
      const completedLessonsCount = allLessons.filter(l => l.isCompleted).length;
      const totalQuizzesCount = allLessons.filter(l => l.quiz).length;
      const completedQuizzesCount = allLessons.filter(l => l.quiz?.isCompleted).length;
      const progressPercentage = allLessons.length > 0 
        ? Math.round((completedLessonsCount / allLessons.length) * 100) 
        : 0;
      
      setCurrentStats({
        ...currentStats,
        completedLessons: completedLessonsCount,
        progressPercentage,
        totalQuizzes: totalQuizzesCount,
        completedQuizzes: completedQuizzesCount
      });
      
      setActiveLesson({ ...activeLesson });
      setUpdateTrigger(prev => prev + 1);
      
      if (onLessonComplete) {
        onLessonComplete(activeLesson.id);
      }
      
      // Passer à la leçon suivante automatiquement
      const currentChapter = course.chapters.find(ch => 
        ch.lessons.some(l => l.id === activeLesson.id)
      );
      
      if (currentChapter) {
        const currentLessonIndex = currentChapter.lessons.findIndex(l => l.id === activeLesson.id);
        const nextLesson = currentChapter.lessons[currentLessonIndex + 1];
        
        if (nextLesson) {
          setTimeout(() => {
            setActiveLesson(nextLesson);
          }, 1500);
        } else {
          const currentChapterIndex = course.chapters.findIndex(ch => ch.id === currentChapter.id);
          const nextChapter = course.chapters[currentChapterIndex + 1];
          
          if (nextChapter && nextChapter.lessons.length > 0) {
            setTimeout(() => {
              setActiveLesson(nextChapter.lessons[0]);
            }, 1500);
          }
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">Chargement de votre progression...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="max-w-8xl mx-auto p-3 sm:p-6">
        {/* Header du cours */}
        <div className="mb-6 sm:mb-8">
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-4 sm:p-8 text-white">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                {course.imageUrl ? (
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="w-16 h-16 sm:w-24 sm:h-24 object-cover rounded-2xl shadow-lg border-4 border-white/20"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Leaf className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
                  </div>
                )}
                
                <div className="flex-1">
                  <h1 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-3">{course.title}</h1>
                  <p className="text-emerald-100 mb-3 sm:mb-4 text-sm sm:text-lg leading-relaxed">
                    {course.description}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <Sprout className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="font-medium">{course.author.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>Formation piscine organique</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>Impact positif</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Barre de progression */}
            {hasAccess && user && (
              <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-50 to-green-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-emerald-800">
                    Votre progression
                  </span>
                  <span className="text-emerald-600 font-bold">
                    {currentStats.progressPercentage}%
                  </span>
                </div>
                <div className="w-full bg-emerald-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${currentStats.progressPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-3 text-sm text-emerald-700">
                  <span>{currentStats.completedLessons}/{currentStats.totalLessons} leçons</span>
                  <span>{currentStats.totalChapters} chapitres</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Layout responsive avec curriculum à gauche */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Menu mobile */}
          <div className="xl:hidden mb-4">
            <Button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {isMobileMenuOpen ? 'Masquer le curriculum' : 'Voir le curriculum'}
            </Button>
          </div>

          {/* Curriculum à gauche */}
          <div className={`xl:col-span-1 space-y-4 sm:space-y-6 ${
            isMobileMenuOpen ? 'block' : 'hidden xl:block'
          }`}>
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden sticky top-6">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <TreePine className="h-5 w-5" />
                  Curriculum
                </CardTitle>
                <p className="text-sm text-emerald-600">
                  {stats.totalLessons} leçons • {stats.totalChapters} chapitres
                </p>
              </CardHeader>
              
              <CardContent className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  {course.chapters.map((chapter) => (
                    <ChapterSection
                      key={`${chapter.id}-${updateTrigger}`}
                      chapter={chapter}
                      course={course}
                      hasAccess={hasAccess}
                      activeLesson={activeLesson}
                      onLessonSelect={handleLessonSelect}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contenu principal à droite */}
          <div className="xl:col-span-3 space-y-4 sm:space-y-6">
            {hasAccess && activeLesson ? (
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                      {activeLesson.title}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {activeLesson.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {Math.floor(activeLesson.duration / 60)} minutes
                        </span>
                      )}
                      {activeLesson.quiz && (
                        <span className="flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          Quiz inclus
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <ModernVideoPlayer 
                    videoUrl={activeLesson.videoUrl!} 
                    title={activeLesson.title}
                    onProgress={(progress) => logger.info(`Video progress: ${progress}%`)}
                    onComplete={() => logger.info('Video completed')}
                  />
                  
                  <LessonContentDisplay lesson={activeLesson} />
                  
                  <LessonProgressComponent 
                    lesson={activeLesson}
                    courseId={course.id}
                    chapterId={getChapterIdByLesson(course.chapters, activeLesson.id) || 0}
                    onComplete={handleLessonCompleteClick}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardContent className="p-8 sm:p-12 text-center">
                  <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-emerald-500 mx-auto mb-6" />
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                    Sélectionnez une leçon
                  </h3>
                  <p className="text-gray-600">
                    Choisissez une leçon dans le curriculum pour commencer votre apprentissage
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Statistiques détaillées */}
            {hasAccess && user && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-green-500 text-white rounded-2xl">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <Clock className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" />
                    <div className="text-lg sm:text-2xl font-bold">{Math.floor(currentStats.totalWatchTime / 60)}</div>
                    <div className="text-xs opacity-90">Minutes regardées</div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-2xl">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" />
                    <div className="text-lg sm:text-2xl font-bold">{currentStats.completedLessons}</div>
                    <div className="text-xs opacity-90">Leçons terminées</div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-lg bg-gradient-to-br from-lime-500 to-green-500 text-white rounded-2xl">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <Award className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" />
                    <div className="text-lg sm:text-2xl font-bold">{currentStats.completedQuizzes}</div>
                    <div className="text-xs opacity-90">Quiz réussis</div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-2xl">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <Star className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" />
                    <div className="text-lg sm:text-2xl font-bold">{currentStats.progressPercentage}</div>
                    <div className="text-xs opacity-90">% Terminé</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}