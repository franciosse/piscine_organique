// /components/pages/LessonPlayerComponent.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  Download,
  Award,
  BookOpen,
} from 'lucide-react';
import { LessonWithDetails } from '@/app/[locale]/(student)/dashboard/courses/[courseId]/lessons/[lessonId]/page';
import { LessonAttachment } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import logger from '@/lib/logger/logger';
import { useSanitizedHTML } from '@/lib/security/sanitizer';


interface LessonPlayerComponentProps {
  lesson: LessonWithDetails;
  user: any;
}

export function LessonPlayerComponent({ lesson }: LessonPlayerComponentProps) {
  const [isCompleted, setIsCompleted] = useState(lesson.progress?.completed || false);
  const [watchTime, setWatchTime] = useState(lesson.progress?.watchTime || 0);
  const [isLoading, setIsLoading] = useState(false);

  // Marquer la leçon comme terminée
  const markAsCompleted = async () => {
    if (isCompleted) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/lessons/${lesson.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setIsCompleted(true);
      }
    } catch (error) {
      logger.error('Error marking lesson as completed:'+ error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre à jour le temps de visionnage
  const updateWatchTime = async (currentTime: number) => {
    try {
      await fetch(`/api/lessons/${lesson.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchTime: Math.round(currentTime) }),
      });
    } catch (error) {
      logger.error('Error updating watch time:'+ error);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Non spécifié';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

    const sanitizedPreview = useSanitizedHTML(lesson.content!, 'LESSON_CONTENT');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={`/courses/${lesson.chapter.course.id}`}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="h-4 w-4" />
                Retour au cours
              </Link>
              
              <div className="hidden md:block text-sm text-gray-500">
                {lesson.chapter.course.title} / {lesson.chapter.title}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isCompleted && (
                <Button 
                  onClick={markAsCompleted}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marquer comme terminé
                </Button>
              )}
              
              {isCompleted && (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Terminé
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Contenu principal */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Titre de la leçon */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {lesson.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Leçon {lesson.position}</span>
                  {lesson.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(lesson.duration)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Lecteur vidéo */}
              {lesson.videoUrl && (
                <Card>
                  <CardContent className="p-0">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        controls
                        className="w-full h-full"
                        poster={lesson.chapter.course.imageUrl || undefined}
                        onTimeUpdate={(e) => {
                          const video = e.target as HTMLVideoElement;
                          setWatchTime(Math.round(video.currentTime));
                          
                          // Mettre à jour le progrès toutes les 10 secondes
                          if (video.currentTime % 10 < 1) {
                            updateWatchTime(video.currentTime);
                          }
                        }}
                        onEnded={markAsCompleted}
                      >
                        <source src={lesson.videoUrl} type="video/mp4" />
                        Votre navigateur ne supporte pas la lecture vidéo.
                      </video>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Onglets contenu */}
              <Tabs defaultValue="content" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="content">Contenu</TabsTrigger>
                  {lesson.attachments.length > 0 && (
                    <TabsTrigger value="resources">
                      Ressources ({lesson.attachments.length})
                    </TabsTrigger>
                  )}
                  {lesson.quiz && (
                    <TabsTrigger value="quiz">
                      Quiz
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="content">
                  <Card>
                    <CardContent className="p-6">
                      {lesson.content ? (
                        <div 
                          className="prose max-w-none"
                          dangerouslySetInnerHTML={{ __html: sanitizedPreview }}
                        />
                      ) : (
                        <p className="text-gray-500 italic">
                          Aucun contenu textuel disponible pour cette leçon.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {lesson.attachments.length > 0 && (
                  <TabsContent value="resources">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Download className="h-5 w-5" />
                          Ressources téléchargeables
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {lesson.attachments.map((attachment: LessonAttachment) => (
                            <div 
                              key={attachment.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Download className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {attachment.filename}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    {attachment.fileType} {formatFileSize(attachment.fileSize)}
                                  </p>
                                </div>
                              </div>
                              
                              <Button asChild variant="outline" size="sm">
                                <a 
                                  href={attachment.fileUrl} 
                                  download={attachment.filename}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Télécharger
                                </a>
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {lesson.quiz && (
                  <TabsContent value="quiz">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="h-5 w-5" />
                          {lesson.quiz.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <p className="text-gray-600">
                            {lesson.quiz.description}
                          </p>
                          
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">Informations du quiz</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Questions:</span> {lesson.quiz.questions.length}
                              </div>
                              <div>
                                <span className="text-gray-600">Note de passage:</span> {lesson.quiz.passingScore}%
                              </div>
                              <div>
                                <span className="text-gray-600">Tentatives max:</span> {lesson.quiz.maxAttempts}
                              </div>
                            </div>
                          </div>

                          <Button className="w-full" size="lg">
                            <Award className="mr-2 h-4 w-4" />
                            Commencer le quiz
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </div>

          {/* Sidebar navigation */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Navigation précédent/suivant */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {lesson.previousLesson && (
                      <Link 
                        href={`/courses/${lesson.chapter.course.id}/lessons/${lesson.previousLesson.id}`}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4 text-gray-400" />
                        <div className="text-sm">
                          <div className="text-gray-500">Précédent</div>
                          <div className="font-medium truncate">{lesson.previousLesson.title}</div>
                        </div>
                      </Link>
                    )}
                    
                    {lesson.nextLesson && (
                      <Link 
                        href={`/courses/${lesson.chapter.course.id}/lessons/${lesson.nextLesson.id}`}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-sm flex-1">
                          <div className="text-gray-500">Suivant</div>
                          <div className="font-medium truncate">{lesson.nextLesson.title}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Informations du cours */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">À propos du cours</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      {lesson.chapter.course.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Par {lesson.chapter.course.author.name || lesson.chapter.course.author.email}
                    </p>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <div>Chapitre {lesson.chapter.position}: {lesson.chapter.title}</div>
                    <div>Leçon {lesson.position} sur X</div>
                  </div>

                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/courses/${lesson.chapter.course.id}`}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Voir le cours complet
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}