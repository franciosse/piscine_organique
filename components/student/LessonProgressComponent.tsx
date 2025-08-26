// components/student/LessonProgressComponent.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Award, Check } from 'lucide-react';
import { QuizComponent } from './QuizComponent';
import { ProgressService } from '@/lib/services/progressService';
import logger from '@/lib/logger/logger';

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

interface LessonProgressComponentProps {
  lesson: LessonWithQuiz;
  courseId: number;
  chapterId: number;
  onComplete: () => void;
}

export function LessonProgressComponent({ 
  lesson, 
  courseId, 
  chapterId, 
  onComplete 
}: LessonProgressComponentProps) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [quizAttempted, setQuizAttempted] = useState(false);

  const handleCompleteLesson = async () => {
    setIsCompleting(true);
    try {
      const success = await ProgressService.updateLessonProgress(
        courseId, 
        chapterId, 
        lesson.id, 
        { completed: true }
      );
      if (success) {
        setTimeout(() => {
          onComplete();
          setIsCompleting(false);
        }, 800);
      } else {
        setIsCompleting(false);
        logger.error('Échec de la mise à jour du progrès');
      }
    } catch (error) {
      setIsCompleting(false);
      logger.error('Erreur lors de la completion de la leçon:', error);
    }
  };

  const handleQuizComplete = (score: number) => {
    const passingScore = lesson.quiz?.passingScore || 70;
    const passed = score >= passingScore;
    
    setQuizAttempted(true);
    
    if (passed) {
      if (lesson.quiz) {
        lesson.quiz.isCompleted = true;
      }
      handleCompleteLesson();
    } else {
      if (lesson.quiz) {
        lesson.quiz.isCompleted = false;
      }
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