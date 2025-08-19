// components/student/courseDetailComponent.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as LucideIcons from 'lucide-react';
import { checkLessonAccess } from '@/lib/course/lesson-sequencing';

// Import explicite des icônes pour éviter les conflits
const {
  Play,
  Lock,
  CheckCircle,
  Clock,
  Users,
  Award,
  BookOpen,
  FileText,
  ChevronDown,
  ChevronRight,
  Leaf,
  TreePine,
  Sprout,
  Globe,
  Star
} = LucideIcons;

// Types
interface CourseWithContent {
  id: number;
  title: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  author: {
    id: number;
    name: string | null;
    email: string | null;
  };
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
  content: Text,
  isCompleted?: boolean;
  quiz?: any;
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
}

// Composant lecteur vidéo moderne
function ModernVideoPlayer({ 
  videoUrl, 
  title, 
  onProgress, 
  onComplete 
}: { 
  videoUrl?: string; 
  title: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}) {
  if (!videoUrl) {
    return (
      <div className="aspect-video bg-gradient-to-br from-emerald-100 to-green-200 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <LucideIcons.Video className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
          <p className="text-emerald-800 font-medium">Vidéo non disponible</p>
          <p className="text-emerald-600 text-sm">Contenu en cours de préparation</p>
        </div>
      </div>
    );
  }

  // Fonction pour détecter et convertir les URLs YouTube
  const getEmbedUrl = (url: string) => {
    // YouTube patterns
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);
    
    if (match) {
      // URL d'embed YouTube qui évite les problèmes de cookies
      return `https://www.youtube.com/embed/${match[1]}?enablejsapi=1&rel=0&modestbranding=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;
    }

    // Vimeo patterns
    const vimeoRegex = /vimeo\.com\/(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?byline=0&portrait=0`;
    }

    // Direct video URLs
    return url;
  };

  const embedUrl = getEmbedUrl(videoUrl);
  const isEmbedVideo = embedUrl && (embedUrl.includes('youtube.com') || embedUrl.includes('vimeo.com'));

  return (
    <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
      {isEmbedVideo ? (
        // Iframe pour YouTube/Vimeo - résout les problèmes de cookies
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          onLoad={() => {
            // Simuler le progress pour les vidéos embed
            console.log('Iframe video loaded');
          }}
        />
      ) : (
        // Lecteur HTML5 pour vidéos directes
        <video
          controls
          className="w-full h-full"
          src={embedUrl}
          onTimeUpdate={(e) => {
            const video = e.target as HTMLVideoElement;
            if (video.duration && onProgress) {
              const progress = (video.currentTime / video.duration) * 100;
              onProgress(progress);
            }
          }}
          onEnded={() => onComplete?.()}
          onError={(e) => {
            console.error('Video error:', e);
          }}
        >
          <source src={embedUrl} type="video/mp4" />
          <p className="text-white p-4">
            Votre navigateur ne supporte pas la lecture vidéo.
          </p>
        </video>
      )}
    </div>
  );
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
  // Vérifier l'accès séquentiel à la leçon
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
                  <FileText className="h-3 w-3" />
                  Quiz
                </span>
              )}
            </div>
            
            {/* Message d'accès si restreint */}
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

// Ajoutez ce composant dans votre fichier, après ModernVideoPlayer :

function LessonContentDisplay({ 
  lesson 
}: { 
  lesson: LessonWithQuiz;
}) {
  // Pour l'instant, simuler du contenu - remplacez par lesson.content quand disponible
  const content = lesson.content || null;
  
  if (!content) {
    return (
      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden mt-6">
        <CardContent className="p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <div className="text-amber-600 mb-2">📝</div>
            <p className="text-amber-800 font-medium">Contenu en préparation</p>
            <p className="text-amber-700 text-sm mt-1">
              Le contenu écrit de cette leçon sera bientôt disponible.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Si vous avez du contenu HTML, utilisez DOMPurify
  // Pour l'instant, affichage simple
  return (
    <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden mt-6">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
        <CardTitle className="flex items-center gap-2 text-emerald-800">
          <Sprout className="h-5 w-5" />
          Contenu de la leçon
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="prose prose-lg max-w-none prose-emerald">
          {/* Si vous avez du HTML, utilisez dangerouslySetInnerHTML avec DOMPurify */}
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {content.textContent}
          </div>
        </div>
      </CardContent>
    </Card>
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
                course={course}                    // Ajoutez ceci
                userProgress={course.userProgress} // Ajoutez ceci
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

// Composant principal
export function CourseDetailComponent({ 
  course, 
  hasAccess, 
  stats, 
  user 
}: CourseDetailComponentProps) {
  const [activeLesson, setActiveLesson] = useState<LessonWithQuiz | undefined>(
    course.chapters[0]?.lessons[0] || undefined
  );

  const handleLessonSelect = (lesson: LessonWithQuiz) => {
    if (hasAccess) {
      setActiveLesson(lesson);
    }
  };

  const handleVideoProgress = (progress: number) => {
    console.log(`Video progress: ${progress}%`);
  };

  const handleVideoComplete = () => {
    console.log('Video completed');
    if (activeLesson) {
      // TODO: Marquer la leçon comme terminée
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header du cours */}
        <div className="mb-8">
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-8 text-white">
              <div className="flex items-start gap-6">
                {course.imageUrl ? (
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="w-24 h-24 object-cover rounded-2xl shadow-lg border-4 border-white/20"
                  />
                ) : (
                  <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Leaf className="h-12 w-12 text-white" />
                  </div>
                )}
                
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-3">{course.title}</h1>
                  <p className="text-emerald-100 mb-4 text-lg leading-relaxed">
                    {course.description}
                  </p>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Sprout className="h-5 w-5" />
                      <span className="font-medium">{course.author.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <span>Formation écologique</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      <span>Impact positif</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Barre de progression */}
            {hasAccess && user && (
              <div className="p-6 bg-gradient-to-r from-emerald-50 to-green-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-emerald-800">
                    Votre progression
                  </span>
                  <span className="text-emerald-600 font-bold">
                    {stats.progressPercentage}%
                  </span>
                </div>
                <div className="w-full bg-emerald-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${stats.progressPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-3 text-sm text-emerald-700">
                  <span>{stats.completedLessons}/{stats.totalLessons} leçons</span>
                  <span>{stats.totalChapters} chapitres</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lecteur vidéo et contenu principal */}
          <div className="lg:col-span-2 space-y-6">
            {hasAccess && activeLesson ? (
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {activeLesson.title}
                    </h2>
                  </div>
                  
                  <ModernVideoPlayer 
                    videoUrl={activeLesson.videoUrl!} 
                    title={activeLesson.title}
                    onProgress={handleVideoProgress}
                    onComplete={handleVideoComplete}
                  />
                  
                  {/* Ajoutez le quiz existant */}
                  {activeLesson.quiz && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-5 w-5 text-amber-600" />
                        <span className="font-semibold text-amber-800">
                          Quiz disponible
                        </span>
                      </div>
                      <p className="text-amber-700 text-sm mb-3">
                        Testez vos connaissances sur cette leçon
                      </p>
                      <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                        Commencer le quiz
                      </Button>
                    </div>
                  )}
                  <LessonContentDisplay lesson={activeLesson} />  
                </CardContent>
              </Card>
            ) : !hasAccess ? (
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardContent className="p-12 text-center">
                  <Lock className="h-16 w-16 text-emerald-500 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Accès premium requis
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Débloquez l'accès complet à ce cours écologique pour approfondir 
                    vos connaissances et contribuer à un avenir plus vert.
                  </p>
                  <Button 
                    className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg"
                    onClick={() => window.location.href = `/dashboard/courses/${course.id}/purchase`}
                  >
                    Débloquer le cours - {course.price}€
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-16 w-16 text-emerald-500 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Sélectionnez une leçon
                  </h3>
                  <p className="text-gray-600">
                    Choisissez une leçon dans le menu de droite pour commencer votre apprentissage
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Statistiques détaillées */}
            {hasAccess && user && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-green-500 text-white rounded-2xl">
                  <CardContent className="p-4 text-center">
                    <Clock className="h-8 w-8 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{Math.floor(stats.totalWatchTime / 60)}</div>
                    <div className="text-xs opacity-90">Minutes regardées</div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-2xl">
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{stats.completedLessons}</div>
                    <div className="text-xs opacity-90">Leçons terminées</div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-lg bg-gradient-to-br from-lime-500 to-green-500 text-white rounded-2xl">
                  <CardContent className="p-4 text-center">
                    <Award className="h-8 w-8 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{stats.completedQuizzes}</div>
                    <div className="text-xs opacity-90">Quiz réussis</div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-2xl">
                  <CardContent className="p-4 text-center">
                    <Star className="h-8 w-8 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{stats.progressPercentage}</div>
                    <div className="text-xs opacity-90">% Terminé</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Curriculum - Menu des leçons */}
          <div className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden sticky top-6">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <TreePine className="h-5 w-5" />
                  Curriculum du cours
                </CardTitle>
                <p className="text-sm text-emerald-600">
                  {stats.totalLessons} leçons • {stats.totalChapters} chapitres
                </p>
              </CardHeader>
              
              <CardContent className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  {course.chapters.map((chapter) => (
                    <ChapterSection
                      key={chapter.id}
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
        </div>
      </div>
    </div>
  );
}