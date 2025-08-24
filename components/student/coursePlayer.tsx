
// components/student/CoursePlayer.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Course, 
  CourseChapter, 
  Lesson, 
  LessonAttachment,
  StudentProgress 
} from '@/lib/db/schema';
import logger from '@/lib/logger/logger';


interface LessonWithDetails extends Lesson {
  attachments: LessonAttachment[];
  progress?: StudentProgress;
}

interface ChapterWithLessons extends CourseChapter {
  lessons: LessonWithDetails[];
}

interface CoursePlayerProps {
  course: Course;
  chapters: ChapterWithLessons[];
  currentLessonId: number;
}

export default function CoursePlayer({ course, chapters, currentLessonId }: CoursePlayerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentLesson, setCurrentLesson] = useState<LessonWithDetails | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [watchTime, setWatchTime] = useState(0);
  const [lastProgressUpdate, setLastProgressUpdate] = useState(0);

  // Trouver la leçon courante
  useEffect(() => {
    let foundLesson: LessonWithDetails | null = null;
    
    for (const chapter of chapters) {
      foundLesson = chapter.lessons.find(lesson => lesson.id === currentLessonId) || null;
      if (foundLesson) break;
    }
    
    setCurrentLesson(foundLesson);
    if (foundLesson?.progress) {
      setWatchTime(foundLesson.progress.watchTime || 0);
    }
  }, [currentLessonId, chapters]);

  // Mise à jour du progrès vidéo
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentLesson) return;

    const handleTimeUpdate = () => {
      const currentTime = Math.floor(video.currentTime);
      setWatchTime(currentTime);

      // Sauvegarder le progrès toutes les 10 secondes
      if (currentTime - lastProgressUpdate >= 10) {
        updateProgress(currentTime, false);
        setLastProgressUpdate(currentTime);
      }
    };

    const handleEnded = () => {
      updateProgress(Math.floor(video.duration), true);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentLesson, lastProgressUpdate]);

  const updateProgress = async (watchTime: number, completed: boolean) => {
    if (!currentLesson) return;

    try {
      await fetch(`/api/lessons/${currentLesson.id}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          watchTime,
          completed,
        }),
      });
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du progrès:'+ error);
    }
  };

  const navigateToLesson = (lessonId: number) => {
    router.push(`/courses/${course.id}/learn/${lessonId}`);
  };

  const getNextLesson = () => {
    let foundCurrent = false;
    
    for (const chapter of chapters) {
      for (const lesson of chapter.lessons) {
        if (foundCurrent) {
          return lesson;
        }
        if (lesson.id === currentLessonId) {
          foundCurrent = true;
        }
      }
    }
    
    return null;
  };

  const getPreviousLesson = () => {
    let previousLesson: LessonWithDetails | null = null;
    
    for (const chapter of chapters) {
      for (const lesson of chapter.lessons) {
        if (lesson.id === currentLessonId) {
          return previousLesson;
        }
        previousLesson = lesson;
      }
    }
    
    return null;
  };

  const nextLesson = getNextLesson();
  const previousLesson = getPreviousLesson();

  if (!currentLesson) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement de la leçon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Contenu principal */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'mr-80' : 'mr-0'}`}>
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{currentLesson.title}</h1>
            <p className="text-sm text-gray-600">{course.title}</p>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Contenu de la leçon */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-6">
            {/* Vidéo */}
            {currentLesson.videoUrl && (
              <div className="mb-8">
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    src={currentLesson.videoUrl}
                    controls
                    className="w-full h-full"
                    preload="metadata"
                  >
                    Votre navigateur ne supporte pas la lecture vidéo.
                  </video>
                </div>
              </div>
            )}

            {/* Contenu textuel */}
            {currentLesson.content && (
              <div className="mb-8">
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                />
              </div>
            )}

            {/* Ressources attachées */}
            {currentLesson.attachments.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Ressources</h3>
                <div className="space-y-2">
                  {currentLesson.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{attachment.filename}</p>
                        <p className="text-xs text-gray-500">{attachment.fileType}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation entre leçons */}
            <div className="flex justify-between items-center pt-8 border-t">
              <div>
                {previousLesson && (
                  <button
                    onClick={() => navigateToLesson(previousLesson.id)}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Leçon précédente
                  </button>
                )}
              </div>
              <div>
                {nextLesson && (
                  <button
                    onClick={() => navigateToLesson(nextLesson.id)}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    Leçon suivante
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`fixed right-0 top-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Contenu du cours</h2>
        </div>
        
        <div className="overflow-auto h-full pb-20">
          {chapters.map((chapter, chapterIndex) => (
            <div key={chapter.id} className="border-b">
              <div className="p-4 bg-gray-50">
                <h3 className="font-medium text-gray-900">
                  {chapterIndex + 1}. {chapter.title}
                </h3>
              </div>
              
              <div className="divide-y">
                {chapter.lessons.map((lesson, lessonIndex) => (
                  <button
                    key={lesson.id}
                    onClick={() => navigateToLesson(lesson.id)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      lesson.id === currentLessonId ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          lesson.id === currentLessonId ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          {chapterIndex + 1}.{lessonIndex + 1} {lesson.title}
                        </p>
                        {lesson.duration && (
                          <p className="text-xs text-gray-500 mt-1">
                            {Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, '0')}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex-shrink-0 ml-2">
                        {lesson.progress?.completed ? (
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : lesson.progress?.watchTime ? (
                          <div className="w-5 h-5 bg-yellow-500 rounded-full"></div>
                        ) : (
                          <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
