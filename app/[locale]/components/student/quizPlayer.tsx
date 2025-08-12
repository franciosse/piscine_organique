
// components/student/QuizPlayer.tsx
'use client';

import { useState, useEffect } from 'react';
import { Quiz, QuizQuestion, QuizAnswer } from '@/lib/db/schema';

interface QuizPlayerProps {
  quiz: Quiz & {
    questions: (QuizQuestion & {
      answers: QuizAnswer[];
    })[];
  };
  onComplete: (score: number, passed: boolean) => void;
}

interface UserAnswer {
  questionId: number;
  selectedAnswerIds: number[];
  openAnswer?: string;
}

export default function QuizPlayer({ quiz, onComplete }: QuizPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [timeStarted, setTimeStarted] = useState<Date>(new Date());
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  const getUserAnswer = (questionId: number): UserAnswer | undefined => {
    return userAnswers.find(answer => answer.questionId === questionId);
  };

  const updateUserAnswer = (questionId: number, selectedAnswerIds: number[], openAnswer?: string) => {
    setUserAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      if (existing) {
        return prev.map(a => 
          a.questionId === questionId 
            ? { ...a, selectedAnswerIds, openAnswer }
            : a
        );
      } else {
        return [...prev, { questionId, selectedAnswerIds, openAnswer }];
      }
    });
  };

  const handleAnswerChange = (answerId: number, checked: boolean, openAnswer?: string) => {
    const userAnswer = getUserAnswer(currentQuestion.id);
    let newSelectedIds: number[] = [];

    if (currentQuestion.questionType === 'multiple_choice') {
      newSelectedIds = checked 
        ? [...(userAnswer?.selectedAnswerIds || []), answerId]
        : (userAnswer?.selectedAnswerIds || []).filter(id => id !== answerId);
    } else if (currentQuestion.questionType === 'true_false') {
      newSelectedIds = checked ? [answerId] : [];
    }

    updateUserAnswer(currentQuestion.id, newSelectedIds, openAnswer);
  };

  const handleOpenAnswerChange = (openAnswer: string) => {
    updateUserAnswer(currentQuestion.id, [], openAnswer);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    let totalPoints = 0;
    let earnedPoints = 0;

    quiz.questions.forEach(question => {
      if (question.points == null) return; 
      totalPoints += question.points;
      const userAnswer = getUserAnswer(question.id);

      if (!userAnswer) return;

      if (question.questionType === 'open_ended') {
        // Pour les questions ouvertes, on ne peut pas calculer automatiquement
        // Il faudrait une correction manuelle
        return;
      }

      const correctAnswerIds = question.answers
        .filter(answer => answer.isCorrect)
        .map(answer => answer.id);

      const selectedAnswerIds = userAnswer.selectedAnswerIds;

      // Vérifier si la réponse est exactement correcte
      const isCorrect = correctAnswerIds.length === selectedAnswerIds.length &&
        correctAnswerIds.every(id => selectedAnswerIds.includes(id));

      if (isCorrect) {
        earnedPoints += question.points;
      }
    });

    return totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  };

  const submitQuiz = async () => {
    setIsSubmitting(true);
    
    const finalScore = calculateScore();
    if (finalScore < 0 || quiz.passingScore == null) return; // Si le score est invalide, on ne continue pas

    const passed = finalScore >= quiz.passingScore;
    
    setScore(finalScore);
    setShowResults(true);
    
    try {
      // Sauvegarder la tentative de quiz
      await fetch(`/api/quizzes/${quiz.id}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: userAnswers,
          score: finalScore,
          passed,
          startedAt: timeStarted,
          completedAt: new Date(),
        }),
      });

      onComplete(finalScore, passed);
    } catch (error) {
      console.error('Erreur lors de la soumission du quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showResults) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
            score >= quiz.passingScore ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <span className={`text-2xl font-bold ${
              score >= quiz.passingScore ? 'text-green-600' : 'text-red-600'
            }`}>
              {score}%
            </span>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {score >= quiz.passingScore ? 'Félicitations !' : 'Quiz non réussi'}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {score >= quiz.passingScore 
              ? `Vous avez réussi le quiz avec un score de ${score}% (minimum requis: ${quiz.passingScore}%)`
              : `Vous avez obtenu ${score}% mais le minimum requis est de ${quiz.passingScore}%`
            }
          </p>

          <div className="space-y-4">
            {quiz.questions.map((question, index) => {
              const userAnswer = getUserAnswer(question.id);
              const correctAnswers = question.answers.filter(a => a.isCorrect);
              
              return (
                <div key={question.id} className="text-left p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Question {index + 1}: {question.question}
                  </h3>
                  
                  {question.questionType !== 'open_ended' && (
                    <div className="space-y-1 text-sm">
                      <p className="text-green-600">
                        Réponse(s) correcte(s): {correctAnswers.map(a => a.answerText).join(', ')}
                      </p>
                      {userAnswer && userAnswer.selectedAnswerIds.length > 0 && (
                        <p className="text-blue-600">
                          Votre réponse: {question.answers
                            .filter(a => userAnswer.selectedAnswerIds.includes(a.id))
                            .map(a => a.answerText)
                            .join(', ')
                          }
                        </p>
                      )}
                    </div>
                  )}
                  
                  {question.explanation && (
                    <p className="text-gray-600 text-sm mt-2 italic">
                      Explication: {question.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      {/* En-tête du quiz */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
          <span className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} sur {quiz.questions.length}
          </span>
        </div>
        
        {/* Barre de progression */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question courante */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-6">
          {currentQuestion.question}
        </h2>

        {/* Réponses */}
        {currentQuestion.questionType === 'open_ended' ? (
          <textarea
            value={getUserAnswer(currentQuestion.id)?.openAnswer || ''}
            onChange={(e) => handleOpenAnswerChange(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Tapez votre réponse ici..."
          />
        ) : (
          <div className="space-y-3">
            {currentQuestion.answers.map((answer) => {
              const userAnswer = getUserAnswer(currentQuestion.id);
              const isSelected = userAnswer?.selectedAnswerIds.includes(answer.id) || false;
              
              return (
                <label
                  key={answer.id}
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type={currentQuestion.questionType === 'true_false' ? 'radio' : 'checkbox'}
                    name={`question-${currentQuestion.id}`}
                    checked={isSelected}
                    onChange={(e) => handleAnswerChange(answer.id, e.target.checked)}
                    className="mr-3 h-4 w-4 text-blue-600"
                  />
                  <span className="text-gray-900">{answer.answerText}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={previousQuestion}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Précédent
        </button>

        {isLastQuestion ? (
          <button
            onClick={submitQuiz}
            disabled={isSubmitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Soumission...' : 'Terminer le quiz'}
          </button>
        ) : (
          <button
            onClick={nextQuestion}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Suivant
          </button>
        )}
      </div>
    </div>
  );
}