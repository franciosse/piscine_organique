// components/student/QuizComponent.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, PlayCircle, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface QuizComponentProps {
  quiz: {
    id: number;
    title: string;
    questions: Array<{
      id: number;
      question: string;
      answers: Array<{
        id: number;
        answerText: string;
        isCorrect: boolean;
      }>;
    }>;
    passingScore: number;
  };
  lessonId: number;
  onComplete: (score: number) => void;
}

export function QuizComponent({ quiz, lessonId, onComplete }: QuizComponentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [isStarted, setIsStarted] = useState(false);

  const handleSubmitQuiz = () => {
    let correctAnswers = 0;
    quiz.questions.forEach((question) => {
      const userAnswer = answers[question.id];
      const correctAnswer = question.answers.find((a) => a.isCorrect);
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
          <p className="text-gray-600 mb-6">{quiz.questions.length} questions • Testez vos connaissances</p>
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
            {passed ? <CheckCircle className="h-8 w-8 text-white" /> : <AlertCircle className="h-8 w-8 text-white" />}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {passed ? 'Félicitations !' : 'Score insuffisant'}
          </h3>
          <p className="text-gray-600 mb-4">Votre score : <span className="font-bold text-2xl">{score}%</span></p>
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
          {question.answers.map((answer) => (
            <button
              key={answer.id}
              onClick={() => setAnswers(prev => ({ ...prev, [question.id]: answer }))}
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