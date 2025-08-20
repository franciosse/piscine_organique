// components/student/courseDetailComponent.tsx
'use client';

import React, { useState, useEffect } from 'react';
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
  Star,
  Video,
  AlertCircle,
  Check,
  ArrowRight,
  PlayCircle
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
  content: string | null;
  isCompleted?: boolean;
  quiz?: {
    id: number;
    title: string;
    questions: any[];
    isCompleted?: boolean;
    passingScore : number;
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

// Composant Quiz amélioré
function QuizComponent({ 
  quiz, 
  lessonId, 
  onComplete 
}: { 
  quiz: any; 
  lessonId: number; 
  onComplete: (score: number) => void;
}) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [isStarted, setIsStarted] = useState(false);

  const handleAnswerSelect = (questionId: number, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmitQuiz = () => {
    // Calculer le score
    let correctAnswers = 0;
    quiz.questions.forEach((question: any) => {
      const userAnswer = answers[question.id];
      const correctAnswer = question.answers.find((a: any) => a.isCorrect);
      if (userAnswer?.id === correctAnswer?.id) {
        correctAnswers++;
      }
    });

    const finalScore = Math.round((correctAnswers / quiz.questions.length) * 100);
    setScore(finalScore);
    setShowResults(true);
    onComplete(finalScore);
  };

  if (!isStarted) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl overflow-hidden mt-6">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">{quiz.title}</h3>
          <p className="text-gray-600 mb-6">
            {quiz.questions.length} questions • Testez vos connaissances
          </p>
          <Button 
            onClick={() => setIsStarted(true)}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold"
          >
            <PlayCircle className="h-5 w-5 mr-2" />
            Commencer le quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    const passed = score >= (quiz.passingScore || 70);
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl overflow-hidden mt-6">
        <CardContent className="p-8 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            passed ? 'bg-emerald-500' : 'bg-orange-500'
          }`}>
            {passed ? (
              <CheckCircle className="h-8 w-8 text-white" />
            ) : (
              <AlertCircle className="h-8 w-8 text-white" />
            )}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {passed ? 'Félicitations !' : 'Score insuffisant'}
          </h3>
          <p className="text-gray-600 mb-4">
            Votre score : <span className="font-bold text-2xl">{score}%</span>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            {passed 
              ? 'Vous avez réussi le quiz avec succès !' 
              : `Score minimum requis : ${quiz.passingScore || 70}%. Vous devez recommencer le quiz.`
            }
          </p>
          {!passed && (
            <Button 
              onClick={() => {
                setIsStarted(false);
                setShowResults(false);
                setCurrentQuestion(0);
                setAnswers({});
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Recommencer le quiz
            </Button>
          )}
          {passed && (
            <div className="text-emerald-600 text-sm mt-4">
              ✅ Leçon validée automatiquement
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const question = quiz.questions[currentQuestion];
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;
  const canProceed = answers[question.id] !== undefined;

  return (
    <Card className="border-0 shadow-lg bg-white rounded-2xl overflow-hidden mt-6">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-purple-800">
            Question {currentQuestion + 1} sur {quiz.questions.length}
          </CardTitle>
          <div className="text-sm text-purple-600">
            {Math.round(((currentQuestion + 1) / quiz.questions.length) * 100)}%
          </div>
        </div>
        <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
          <div
            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-6">{question.question}</h3>
        <div className="space-y-3">
          {question.answers.map((answer: any) => (
            <button
              key={answer.id}
              onClick={() => handleAnswerSelect(question.id, answer)}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                answers[question.id]?.id === answer.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
              }`}
            >
              {answer.answerText}
            </button>
          ))}
        </div>
        
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
          >
            Précédent
          </Button>
          
          {isLastQuestion ? (
            <Button
              onClick={handleSubmitQuiz}
              disabled={!canProceed}
              className="bg-purple-500 hover:bg-purple-600"
            >
              Terminer le quiz
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestion(prev => prev + 1)}
              disabled={!canProceed}
              className="bg-purple-500 hover:bg-purple-600"
            >
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Composant lecteur vidéo amélioré avec gestion d'erreur
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
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setIsLoading(true);
  }, []);

  if (!videoUrl) {
    return (
      <div className="aspect-video bg-gradient-to-br from-emerald-100 to-green-200 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <Video className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
          <p className="text-emerald-800 font-medium">Vidéo non disponible</p>
          <p className="text-emerald-600 text-sm">Contenu en cours de préparation</p>
        </div>
      </div>
    );
  }

  const getEmbedUrl = (url: string) => {
    try {
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = url.match(youtubeRegex);
      
      if (match) {
        const origin = isClient && typeof window !== 'undefined' ? window.location.origin : '';
        return `https://www.youtube.com/embed/${match[1]}?enablejsapi=1&rel=0&modestbranding=1&origin=${origin}`;
      }

      const vimeoRegex = /vimeo\.com\/(\d+)/;
      const vimeoMatch = url.match(vimeoRegex);
      
      if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}?byline=0&portrait=0`;
      }

      return url;
    } catch (error) {
      console.error('Error processing video URL:', error);
      setHasError(true);
      return url;
    }
  };

  const embedUrl = getEmbedUrl(videoUrl);
  const isEmbedVideo = embedUrl && (embedUrl.includes('youtube.com') || embedUrl.includes('vimeo.com'));

  const handleVideoError = (error: any) => {
    console.error('Video error:', error);
    setHasError(true);
    setIsLoading(false);
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  if (hasError) {
    return (
      <div className="aspect-video bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl flex items-center justify-center border-2 border-red-200">
        <div className="text-center p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-800 font-medium mb-2">Erreur de chargement vidéo</p>
          <p className="text-red-600 text-sm mb-4">
            La vidéo ne peut pas être lue. Vérifiez votre connexion ou contactez le support.
          </p>
          <Button 
            variant="outline" 
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
            }}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl relative">
      {isClient && isLoading && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-white">Chargement de la vidéo...</p>
          </div>
        </div>
      )}
      
      {isClient && (
        <>
          {isEmbedVideo ? (
            <iframe
              src={embedUrl}
              title={title}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              onLoad={handleVideoLoad}
              onError={handleVideoError}
            />
          ) : (
            <video
              controls
              className="w-full h-full"
              src={embedUrl}
              onLoadedData={handleVideoLoad}
              onTimeUpdate={(e) => {
                const video = e.target as HTMLVideoElement;
                if (video.duration && onProgress) {
                  const progress = (video.currentTime / video.duration) * 100;
                  onProgress(progress);
                }
              }}
              onEnded={() => onComplete?.()}
              onError={handleVideoError}
            >
              <source src={embedUrl} type="video/mp4" />
              <p className="text-white p-4">
                Votre navigateur ne supporte pas la lecture vidéo.
              </p>
            </video>
          )}
        </>
      )}
      
      {!isClient && (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <div className="text-center">
            <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">Préparation du lecteur vidéo...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Composant de contenu de leçon
function LessonContentDisplay({ 
  lesson 
}: { 
  lesson: LessonWithQuiz;
}) {
  const content = lesson.content;
  
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
          <div 
            className="whitespace-pre-wrap text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Composant de progression de leçon
function LessonProgressComponent({ 
  lesson, 
  onComplete 
}: { 
  lesson: LessonWithQuiz; 
  onComplete: () => void;
}) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [quizAttempted, setQuizAttempted] = useState(false); // ✅ Nouvel état pour savoir si le quiz a été tenté
  
  const handleCompleteLesson = async () => {
    setIsCompleting(true);
    
    setTimeout(() => {
      onComplete();
      setIsCompleting(false);
    }, 800);
  };

  const handleQuizComplete = (score: number) => {
    const passingScore = lesson.quiz?.passingScore || 70;
    const passed = score >= passingScore;
    
    setQuizAttempted(true); // ✅ Marquer que le quiz a été tenté
    
    if (passed) {
      // ✅ Quiz réussi : marquer comme terminé et compléter la leçon
      if (lesson.quiz) {
        lesson.quiz.isCompleted = true;
      }
      handleCompleteLesson();
    } else {
      // ❌ Quiz échoué : ne pas terminer la leçon, permettre de recommencer
      if (lesson.quiz) {
        lesson.quiz.isCompleted = false;
      }
      // Le quiz se remettra automatiquement en mode "non commencé" grâce au bouton "Recommencer"
    }
  };

  // Si la leçon est déjà terminée
  if (lesson.isCompleted) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl overflow-hidden mt-6">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-emerald-800 mb-2">Leçon terminée !</h3>
          <p className="text-emerald-600">
            Vous avez terminé cette leçon avec succès.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Si il y a un quiz et qu'il n'est pas encore affiché
  if (lesson.quiz && !showQuiz) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl overflow-hidden mt-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  {quizAttempted ? 'Quiz à recommencer' : 'Quiz disponible'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {quizAttempted 
                    ? `Score minimum requis : ${lesson.quiz.passingScore || 70}%`
                    : 'Terminez le quiz pour valider cette leçon'
                  }
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setShowQuiz(true)}
              className={quizAttempted ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-500 hover:bg-blue-600"}
            >
              {quizAttempted ? 'Recommencer le quiz' : 'Commencer le quiz'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Si le quiz est affiché
  if (lesson.quiz && showQuiz) {
    return (
      <QuizComponent 
        quiz={lesson.quiz}
        lessonId={lesson.id}
        onComplete={handleQuizComplete}
      />
    );
  }

  // Si pas de quiz, juste un bouton terminer
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl overflow-hidden mt-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
              <Check className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Terminer la leçon</h3>
              <p className="text-gray-600 text-sm">
                Marquez cette leçon comme terminée pour continuer
              </p>
            </div>
          </div>
          <Button 
            onClick={handleCompleteLesson}
            disabled={isCompleting}
            className={`transition-all duration-300 ${
              isCompleting 
                ? 'bg-emerald-600 scale-105' 
                : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {isCompleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Validation...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Terminer
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
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
  
  // ✅ État pour forcer les re-renders du curriculum
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  // 🔧 NOUVEAUX États pour les stats dynamiques
  const [currentStats, setCurrentStats] = useState<CourseStats>(stats);
  
  // 🔧 Fonction pour recalculer les stats
  const recalculateStats = () => {
    const allLessons = course.chapters.flatMap(ch => ch.lessons);
    const completedLessonsCount = allLessons.filter(l => l.isCompleted).length;
    const totalQuizzesCount = allLessons.filter(l => l.quiz).length;
    const completedQuizzesCount = allLessons.filter(l => l.quiz?.isCompleted).length;
    const progressPercentage = allLessons.length > 0 
      ? Math.round((completedLessonsCount / allLessons.length) * 100) 
      : 0;
    
    const newStats: CourseStats = {
      ...currentStats,
      completedLessons: completedLessonsCount,
      progressPercentage,
      totalQuizzes: totalQuizzesCount,
      completedQuizzes: completedQuizzesCount
    };
    
    setCurrentStats(newStats);
  };
  
  // 🔧 Charger les données sauvegardées au montage
  useEffect(() => {
    const loadSavedProgress = () => {
      try {
        const savedProgress = localStorage.getItem(`course_${course.id}_progress`);
        if (savedProgress) {
          const { completedLessons } = JSON.parse(savedProgress);
          
          // Marquer les leçons comme terminées
          course.chapters.forEach(chapter => {
            chapter.lessons.forEach(lesson => {
              if (completedLessons.includes(lesson.id)) {
                lesson.isCompleted = true;
              }
            });
          });
          
          // Mettre à jour userProgress
          if (course.userProgress) {
            course.userProgress.completedLessons = completedLessons;
          } else {
            course.userProgress = {
              completedLessons,
              totalWatchTime: 0,
              lastAccessedAt: new Date()
            };
          }
          
          // Recalculer les stats
          recalculateStats();
          setUpdateTrigger(prev => prev + 1);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la progression:', error);
      }
    };
    
    loadSavedProgress();
  }, [course.id]);
  
  // 🔧 Fonction pour sauvegarder la progression
  const saveProgress = () => {
    try {
      const progressData = {
        completedLessons: course.userProgress?.completedLessons || [],
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(`course_${course.id}_progress`, JSON.stringify(progressData));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleLessonSelect = (lesson: LessonWithQuiz) => {
    if (hasAccess) {
      setActiveLesson(lesson);
      setIsMobileMenuOpen(false);
    }
  };

      
  const handleLessonCompleteClick = () => {
    if (activeLesson) {
      // ✅ Marquer la leçon comme terminée localement
      activeLesson.isCompleted = true;
      
      // 🔧 CORRECTION : Mettre à jour aussi userProgress.completedLessons
      if (course.userProgress) {
        // Ajouter l'ID de la leçon aux leçons terminées si pas déjà présent
        if (!course.userProgress.completedLessons.includes(activeLesson.id)) {
          course.userProgress.completedLessons.push(activeLesson.id);
        }
      } else {
        // Créer userProgress s'il n'existe pas
        course.userProgress = {
          completedLessons: [activeLesson.id],
          totalWatchTime: 0,
          lastAccessedAt: new Date()
        };
      }
      
      // 🔧 Sauvegarder la progression et recalculer les stats
      saveProgress();
      recalculateStats();
      
      // ✅ Forcer le re-render du curriculum et de la leçon active
      setActiveLesson({ ...activeLesson });
      setUpdateTrigger(prev => prev + 1);
      
      // ✅ Appeler le callback seulement s'il existe
      if (onLessonComplete) {
        onLessonComplete(activeLesson.id);
      } else {
        // ✅ Fallback : simuler la sauvegarde locale
        console.log(`Leçon ${activeLesson.id} marquée comme terminée`);
      }
      
      // ✅ Passer à la leçon suivante automatiquement
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
          // Chercher la première leçon du chapitre suivant
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

        {/* Layout responsive */}
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

          {/* Curriculum - Sidebar mobile/desktop */}
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
                  {/* ✅ Ajout de key={updateTrigger} pour forcer le re-render */}
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

          {/* Contenu principal - Occupe plus d'espace */}
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
                    onProgress={(progress) => console.log(`Video progress: ${progress}%`)}
                    onComplete={() => console.log('Video completed')}
                  />
                  
                  <LessonContentDisplay lesson={activeLesson} />
                  
                  {/* Composant de progression/quiz */}
                  <LessonProgressComponent 
                    lesson={activeLesson}
                    onComplete={handleLessonCompleteClick}
                  />
                </CardContent>
              </Card>
            ) : !hasAccess ? (
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardContent className="p-8 sm:p-12 text-center">
                  <Lock className="h-12 w-12 sm:h-16 sm:w-16 text-emerald-500 mx-auto mb-6" />
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                    Accès premium requis
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Débloquez l'accès complet à ce cours écologique pour approfondir 
                    vos connaissances et contribuer à un avenir plus vert.
                  </p>
                  <Button 
                    className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold shadow-lg"
                    onClick={() => window.location.href = `/dashboard/courses/${course.id}/purchase`}
                  >
                    Débloquer le cours - {course.price}€
                  </Button>
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