// /components/pages/CourseDetailComponent.tsx
'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { 
  Play, 
  CheckCircle, 
  Clock, 
  Users, 
  BookOpen, 
  Award,
  ChevronDown,
  ChevronRight,
  Lock,
  PlayCircle,
  Star,
  DollarSign
} from 'lucide-react';
import { CourseWithContent } from '@/app/[locale]/(student)/dashboard/courses/[courseId]/page'
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DifficultyLevel } from '@/lib/db/schema';

interface CourseDetailComponentProps {
  course: CourseWithContent;
  hasAccess: boolean;
  stats: {
    totalChapters: number;
    totalLessons: number;
    completedLessons: number;
    progressPercentage: number;
    totalDuration: number;
    totalQuizzes: number;
    completedQuizzes: number;
    totalWatchTime: number;
  };
  user: any;
}

export function CourseDetailComponent({ 
  course, 
  hasAccess, 
  stats, 
  user 
}: CourseDetailComponentProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set([1]));
  const [currentLesson, setCurrentLesson] = useState<{chapterId: number, lessonId: number} | null>(null);

  const toggleChapter = useCallback((chapterId: number) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  }, []);

  const startCourse = () => {
    if (course.chapters.length > 0 && course.chapters[0].lessons.length > 0) {
      setCurrentLesson({
        chapterId: course.chapters[0].id,
        lessonId: course.chapters[0].lessons[0].id
      });
    }
  };

  const getDifficultyColor = (level: string | null) => {
    switch (level) {
      case DifficultyLevel.BEGINNER:
        return 'bg-green-100 text-green-800';
      case DifficultyLevel.INTERMEDIATE:
        return 'bg-yellow-100 text-yellow-800';
      case DifficultyLevel.ADVANCED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (priceInCents: number) => {
    if (priceInCents === 0) return 'Gratuit';
    return `${(priceInCents / 100).toFixed(2)}€`;
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Non spécifié';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header du cours */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Informations principales */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                {course.difficultyLevel && (
                  <Badge className={getDifficultyColor(course.difficultyLevel)}>
                    {course.difficultyLevel}
                  </Badge>
                )}
                <Badge variant="outline">
                  Par {course.author.name || course.author.email}
                </Badge>
              </div>
              
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                {course.title}
              </h1>
              
              {course.description && (
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  {course.description}
                </p>
              )}

              {/* Statistiques du cours */}
              <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{stats.totalChapters} chapitre{stats.totalChapters > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-4 w-4" />
                  <span>{stats.totalLessons} leçon{stats.totalLessons > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(stats.totalDuration)}</span>
                </div>
                {stats.totalQuizzes > 0 && (
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    <span>{stats.totalQuizzes} quiz</span>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail et actions */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  {course.imageUrl && (
                    <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                      <Image
                        src={course.imageUrl}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {hasAccess ? (
                    <div className="space-y-4">
                      {/* Progrès */}
                      {user && (
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progression</span>
                            <span>{stats.progressPercentage}%</span>
                          </div>
                          <Progress value={stats.progressPercentage} className="h-2" />
                          <p className="text-xs text-gray-500 mt-1">
                            {stats.completedLessons} sur {stats.totalLessons} leçons terminées
                          </p>
                          {stats.totalWatchTime > 0 && (
                            <p className="text-xs text-gray-500">
                              Temps de visionnage: {Math.round(stats.totalWatchTime / 60)}min
                            </p>
                          )}
                        </div>
                      )}

                      <Button 
                        onClick={startCourse} 
                        className="w-full" 
                        size="lg"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        {stats.progressPercentage > 0 ? 'Continuer le cours' : 'Commencer le cours'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          {formatPrice(course.price)}
                        </div>
                        <p className="text-sm text-gray-600">
                          Accès à vie • Certificat inclus
                        </p>
                      </div>
                      
                      <Button className="w-full" size="lg">
                        <DollarSign className="mr-2 h-4 w-4" />
                        {course.price === 0 ? 'Accéder gratuitement' : 'Acheter le cours'}
                      </Button>

                      <div className="text-xs text-gray-500 text-center">
                        Garantie satisfait ou remboursé 30 jours
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="content" className="space-y-6">
          <TabsList>
            <TabsTrigger value="content">Contenu du cours</TabsTrigger>
            <TabsTrigger value="about">À propos</TabsTrigger>
            <TabsTrigger value="instructor">Instructeur</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            {/* Liste des chapitres */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Programme du cours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.chapters.map((chapter, chapterIndex) => (
                  <div key={chapter.id} className="border rounded-lg">
                    <button
                      onClick={() => toggleChapter(chapter.id)}
                      className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {expandedChapters.has(chapter.id) ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          )}
                          <div>
                            <h3 className="font-medium text-gray-900">
                              Chapitre {chapter.position}: {chapter.title}
                            </h3>
                            {chapter.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {chapter.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {chapter.lessons.length} leçon{chapter.lessons.length > 1 ? 's' : ''}
                        </div>
                      </div>
                    </button>

                    {/* Leçons du chapitre */}
                    {expandedChapters.has(chapter.id) && (
                      <div className="border-t bg-gray-50">
                        {chapter.lessons.map((lesson, lessonIndex) => (
                          <div 
                            key={lesson.id} 
                            className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {hasAccess ? (
                                lesson.isCompleted ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <PlayCircle className="h-4 w-4 text-blue-500" />
                                )
                              ) : (
                                <Lock className="h-4 w-4 text-gray-400" />
                              )}
                              
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {lesson.position}. {lesson.title}
                                </h4>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  {lesson.duration && (
                                    <span>{formatDuration(Math.round(lesson.duration / 60))}</span>
                                  )}
                                  {lesson.quiz && (
                                    <span className="flex items-center gap-1">
                                      <Award className="h-3 w-3" />
                                      Quiz inclus
                                    </span>
                                  )}
                                  {lesson.videoUrl && (
                                    <span>📹 Vidéo</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {hasAccess && (
                              <Button
                                variant="ghost" 
                                size="sm"
                                onClick={() => setCurrentLesson({
                                  chapterId: chapter.id,
                                  lessonId: lesson.id
                                })}
                              >
                                {lesson.isCompleted ? 'Revoir' : 'Commencer'}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>À propos de ce cours</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Description</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {course.description || 'Aucune description disponible.'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Ce que vous apprendrez</h3>
                    <ul className="space-y-2">
                      {course.chapters.map((chapter) => (
                        <li key={chapter.id} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                          <span>{chapter.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Prérequis</h3>
                    <p className="text-gray-600">
                      {course.difficultyLevel === DifficultyLevel.BEGINNER 
                        ? 'Aucun prérequis particulier n\'est nécessaire pour suivre ce cours.'
                        : 'Des connaissances de base sont recommandées.'
                      }
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Détails du cours</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Niveau:</span> {course.difficultyLevel || 'Non spécifié'}
                      </div>
                      <div>
                        <span className="font-medium">Durée estimée:</span> {formatDuration(course.estimatedDuration)}
                      </div>
                      <div>
                        <span className="font-medium">Chapitres:</span> {stats.totalChapters}
                      </div>
                      <div>
                        <span className="font-medium">Leçons:</span> {stats.totalLessons}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="instructor">
            <Card>
              <CardHeader>
                <CardTitle>Instructeur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {course.author.name?.[0] || course.author.email[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {course.author.name || course.author.email}
                    </h3>
                    <p className="text-gray-600 mb-3">Instructeur certifié</p>
                    <p className="text-sm text-gray-600">
                      Expert dans le domaine avec plusieurs années d'expérience. 
                      Passionné par le partage de connaissances et l'accompagnement des étudiants 
                      dans leur parcours d'apprentissage.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}