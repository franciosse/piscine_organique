// components/admin/QuizForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Quiz, QuizQuestion, QuizAnswer } from '@/lib/db/schema';

interface QuizFormProps {
  lessonId: number;
  quizId?: number;
  initialData?: Quiz & {
    questions: (QuizQuestion & {
      answers: QuizAnswer[];
    })[];
  };
}

interface QuestionFormData {
  question: string;
  questionType: 'multiple_choice' | 'true_false' | 'open_ended';
  points: number;
  explanation: string;
  answers: {
    answerText: string;
    isCorrect: boolean;
  }[];
}

interface FormData {
  title: string;
  description: string;
  passingScore: number;
  maxAttempts: number;
  questions: QuestionFormData[];
}

export default function QuizForm({ lessonId, quizId, initialData }: QuizFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    passingScore: initialData?.passingScore || 70,
    maxAttempts: initialData?.maxAttempts || 3,
    questions: initialData?.questions.map(q => ({
      question: q.question,
      questionType: q.questionType as 'multiple_choice' | 'true_false' | 'open_ended',
      points: q.points || 1, // Valeur par défaut si null
      explanation: q.explanation || '',
      answers: q.answers.map(a => ({
        answerText: a.answerText,
        isCorrect: a.isCorrect ?? false, // Valeur par défaut si null
      })),
    })) || [],
  });

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, {
        question: '',
        questionType: 'multiple_choice',
        points: 1,
        explanation: '',
        answers: [
          { answerText: '', isCorrect: true },
          { answerText: '', isCorrect: false },
        ],
      }],
    }));
  };

  const removeQuestion = (questionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, index) => index !== questionIndex),
    }));
  };

  const updateQuestion = (questionIndex: number, field: keyof QuestionFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((question, index) => 
        index === questionIndex ? { ...question, [field]: value } : question
      ),
    }));
  };

  const addAnswer = (questionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((question, index) => 
        index === questionIndex 
          ? { 
              ...question, 
              answers: [...question.answers, { answerText: '', isCorrect: false }]
            }
          : question
      ),
    }));
  };

  const removeAnswer = (questionIndex: number, answerIndex: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((question, index) => 
        index === questionIndex 
          ? { 
              ...question, 
              answers: question.answers.filter((_, aIndex) => aIndex !== answerIndex)
            }
          : question
      ),
    }));
  };

  const updateAnswer = (questionIndex: number, answerIndex: number, field: 'answerText' | 'isCorrect', value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((question, index) => 
        index === questionIndex 
          ? { 
              ...question, 
              answers: question.answers.map((answer, aIndex) => 
                aIndex === answerIndex ? { ...answer, [field]: value } : answer
              )
            }
          : question
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.questions.length === 0) {
      setError('Ajoutez au moins une question');
      setLoading(false);
      return;
    }

    for (let i = 0; i < formData.questions.length; i++) {
      const question = formData.questions[i];
      if (!question.question.trim()) {
        setError(`La question ${i + 1} ne peut pas être vide`);
        setLoading(false);
        return;
      }

      if (question.questionType === 'multiple_choice' && question.answers.length < 2) {
        setError(`La question ${i + 1} doit avoir au moins 2 réponses`);
        setLoading(false);
        return;
      }

      if (question.questionType !== 'open_ended' && !question.answers.some(a => a.isCorrect)) {
        setError(`La question ${i + 1} doit avoir au moins une réponse correcte`);
        setLoading(false);
        return;
      }
    }

    try {
      const url = quizId 
        ? `/api/admin/quizzes/${quizId}` 
        : `/api/admin/lessons/${lessonId}/quizzes`;
      const method = quizId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/admin/lessons/${lessonId}`);
        router.refresh();
      } else {
        setError(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {quizId ? 'Modifier le quiz' : 'Nouveau quiz'}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informations générales du quiz */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Titre du quiz *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Quiz sur les composants React"
              />
            </div>

            <div>
              <label htmlFor="passingScore" className="block text-sm font-medium text-gray-700 mb-2">
                Score minimum (%)
              </label>
              <input
                type="number"
                id="passingScore"
                value={formData.passingScore}
                onChange={(e) => setFormData(prev => ({ ...prev, passingScore: parseInt(e.target.value) }))}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Décrivez ce que ce quiz va évaluer..."
              />
            </div>

            <div>
              <label htmlFor="maxAttempts" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de tentatives
              </label>
              <input
                type="number"
                id="maxAttempts"
                value={formData.maxAttempts}
                onChange={(e) => setFormData(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) }))}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Questions */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Questions</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Ajouter une question
              </button>
            </div>

            <div className="space-y-6">
              {formData.questions.map((question, questionIndex) => (
                <div key={questionIndex} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-md font-medium text-gray-900">
                      Question {questionIndex + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeQuestion(questionIndex)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Supprimer
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de question
                      </label>
                      <select
                        value={question.questionType}
                        onChange={(e) => updateQuestion(questionIndex, 'questionType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="multiple_choice">Choix multiple</option>
                        <option value="true_false">Vrai/Faux</option>
                        <option value="open_ended">Question ouverte</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Points
                      </label>
                      <input
                        type="number"
                        value={question.points}
                        onChange={(e) => updateQuestion(questionIndex, 'points', parseInt(e.target.value))}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question *
                    </label>
                    <textarea
                      value={question.question}
                      onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Posez votre question..."
                    />
                  </div>

                  {/* Réponses */}
                  {question.questionType !== 'open_ended' && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Réponses
                        </label>
                        {question.questionType === 'multiple_choice' && (
                          <button
                            type="button"
                            onClick={() => addAnswer(questionIndex)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            + Ajouter une réponse
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {question.answers.map((answer, answerIndex) => (
                          <div key={answerIndex} className="flex items-center space-x-3">
                            <input
                              type={question.questionType === 'true_false' ? 'radio' : 'checkbox'}
                              name={`question-${questionIndex}-correct`}
                              checked={answer.isCorrect}
                              onChange={(e) => {
                                if (question.questionType === 'true_false') {
                                  // Pour vrai/faux, une seule réponse peut être correcte
                                  updateQuestion(questionIndex, 'answers', question.answers.map((a, i) => ({
                                    ...a,
                                    isCorrect: i === answerIndex
                                  })));
                                } else {
                                  updateAnswer(questionIndex, answerIndex, 'isCorrect', e.target.checked);
                                }
                              }}
                              className="h-4 w-4 text-blue-600"
                            />
                            <input
                              type="text"
                              value={answer.answerText}
                              onChange={(e) => updateAnswer(questionIndex, answerIndex, 'answerText', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Texte de la réponse..."
                            />
                            {question.questionType === 'multiple_choice' && question.answers.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeAnswer(questionIndex, answerIndex)}
                                className="text-red-600 hover:text-red-800"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {question.questionType === 'true_false' && question.answers.length < 2 && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              const newAnswers = [
                                { answerText: 'Vrai', isCorrect: false },
                                { answerText: 'Faux', isCorrect: false }
                              ];
                              updateQuestion(questionIndex, 'answers', newAnswers);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Ajouter les réponses Vrai/Faux
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Explication (optionnel)
                    </label>
                    <textarea
                      value={question.explanation}
                      onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Expliquez pourquoi cette réponse est correcte..."
                    />
                  </div>
                </div>
              ))}
            </div>

            {formData.questions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">Aucune question ajoutée</p>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Créer la première question
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Sauvegarde...' : quizId ? 'Mettre à jour' : 'Créer le quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}