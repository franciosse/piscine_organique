// components/admin/LessonForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lesson, LessonAttachment, Quiz, QuizQuestion, QuizAnswer } from '@/lib/db/schema';

interface LessonFormProps {
  courseId: number;
  chapterId: number;
  lessonId?: number;
  initialData?: Lesson & { 
    attachments?: LessonAttachment[];
    quizzes?: (Quiz & {
      questions: (QuizQuestion & {
        answers: QuizAnswer[];
      })[];
    })[];
  };
}

interface FormData {
  title: string;
  content: string;
  videoUrl: string;
  duration: number;
}

interface QuizFormData {
  title: string;
  description: string;
  passingScore: number;
  maxAttempts: number;
  questions: QuestionFormData[];
}

interface QuestionFormData {
  question: string;
  questionType: 'multiple_choice' | 'true_false' | 'open_ended';
  points: number;
  explanation: string;
  answers: AnswerFormData[];
}

interface AnswerFormData {
  answerText: string;
  isCorrect: boolean;
}

export default function LessonForm({ courseId, chapterId, lessonId, initialData }: LessonFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'lesson' | 'quiz'>('lesson');
  
  const [formData, setFormData] = useState<FormData>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    videoUrl: initialData?.videoUrl || '',
    duration: initialData?.duration || 0,
  });

  const [quizData, setQuizData] = useState<QuizFormData>({
    title: initialData?.quizzes?.[0]?.title || '',
    description: initialData?.quizzes?.[0]?.description || '',
    passingScore: initialData?.quizzes?.[0]?.passingScore || 70,
    maxAttempts: initialData?.quizzes?.[0]?.maxAttempts || 3,
    questions: initialData?.quizzes?.[0]?.questions?.map(q => ({
      question: q.question,
      questionType: q.questionType as 'multiple_choice' | 'true_false' | 'open_ended',
      points: q.points || 1,
      explanation: q.explanation || '',
      answers: q.answers.map(a => ({
        answerText: a.answerText,
        isCorrect: a.isCorrect || false,
      }))
    })) || []
  });

  const handleSubmitLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = lessonId 
        ? `/api/admin/chapters/${chapterId}/lessons/${lessonId}` 
        : `/api/admin/chapters/${chapterId}/lessons`;
      const method = lessonId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (!lessonId) {
          // Si c'est une nouvelle leçon, on récupère l'ID pour pouvoir créer le quiz
          const newLessonId = data.lesson?.id;
          if (newLessonId && quizData.questions.length > 0) {
            await handleSubmitQuiz(newLessonId);
          }
        }
        router.push(`/admin/courses/${courseId}/chapters/${chapterId}/edit`);
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

  const handleSubmitQuiz = async (targetLessonId?: number) => {
    const lessonIdToUse = targetLessonId || lessonId;
    if (!lessonIdToUse) return;

    try {
      const response = await fetch(`/api/admin/chapters/${chapterId}/lessons/${lessonIdToUse}/quiz`, {
        method: initialData?.quizzes?.[0] ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la sauvegarde du quiz');
      }
    } catch (err) {
      throw err;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleQuizChange = (field: keyof QuizFormData, value: any) => {
    setQuizData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addQuestion = () => {
    const newQuestion: QuestionFormData = {
      question: '',
      questionType: 'multiple_choice',
      points: 1,
      explanation: '',
      answers: [
        { answerText: '', isCorrect: true },
        { answerText: '', isCorrect: false },
      ]
    };
    setQuizData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const removeQuestion = (index: number) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const updateQuestion = (questionIndex: number, field: keyof QuestionFormData, value: any) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex ? { ...q, [field]: value } : q
      )
    }));
  };

  const addAnswer = (questionIndex: number) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { ...q, answers: [...q.answers, { answerText: '', isCorrect: false }] }
          : q
      )
    }));
  };

  const removeAnswer = (questionIndex: number, answerIndex: number) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { ...q, answers: q.answers.filter((_, ai) => ai !== answerIndex) }
          : q
      )
    }));
  };

  const updateAnswer = (questionIndex: number, answerIndex: number, field: keyof AnswerFormData, value: any) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? {
              ...q,
              answers: q.answers.map((a, ai) => 
                ai === answerIndex ? { ...a, [field]: value } : a
              )
            }
          : q
      )
    }));
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('lesson')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'lesson'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Leçon
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'quiz'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Quiz {quizData.questions.length > 0 && `(${quizData.questions.length})`}
            </button>
          </nav>
        </div>

        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {lessonId ? 'Modifier la leçon' : 'Nouvelle leçon'}
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {activeTab === 'lesson' && (
            <form onSubmit={handleSubmitLesson} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de la leçon *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Introduction aux composants React"
                />
              </div>

              <div>
                <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  URL de la vidéo
                </label>
                <input
                  type="url"
                  id="videoUrl"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/video.mp4"
                />
                {formData.videoUrl && (
                  <div className="mt-2">
                    <video
                      src={formData.videoUrl}
                      controls
                      className="max-w-md h-40 rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    >
                      Aperçu vidéo non disponible
                    </video>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Durée (secondes)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    min="0"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                  {formData.duration > 0 && (
                    <span className="text-sm text-gray-500">
                      ({formatDuration(formData.duration)})
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Contenu de la leçon
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Rédigez le contenu de votre leçon en HTML ou Markdown..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Vous pouvez utiliser du HTML pour la mise en forme.
                </p>
              </div>

              {formData.content && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Aperçu du contenu</h3>
                  <div 
                    className="prose max-w-none p-4 border border-gray-200 rounded-lg bg-gray-50"
                    dangerouslySetInnerHTML={{ __html: formData.content }}
                  />
                </div>
              )}

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
                  {loading ? 'Sauvegarde...' : lessonId ? 'Mettre à jour' : 'Créer la leçon'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'quiz' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre du quiz
                  </label>
                  <input
                    type="text"
                    value={quizData.title}
                    onChange={(e) => handleQuizChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Quiz de validation des connaissances"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Score minimum (%)
                  </label>
                  <input
                    type="number"
                    value={quizData.passingScore}
                    onChange={(e) => handleQuizChange('passingScore', parseInt(e.target.value))}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre maximum de tentatives
                  </label>
                  <input
                    type="number"
                    value={quizData.maxAttempts}
                    onChange={(e) => handleQuizChange('maxAttempts', parseInt(e.target.value))}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description du quiz
                </label>
                <textarea
                  value={quizData.description}
                  onChange={(e) => handleQuizChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Description optionnelle du quiz..."
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Questions ({quizData.questions.length})
                  </h3>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Ajouter une question
                  </button>
                </div>

                {quizData.questions.map((question, questionIndex) => (
                  <div key={questionIndex} className="border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-md font-medium text-gray-800">
                        Question {questionIndex + 1}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeQuestion(questionIndex)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Supprimer
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Question
                        </label>
                        <textarea
                          value={question.question}
                          onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Tapez votre question ici..."
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type de question
                          </label>
                          <select
                            value={question.questionType}
                            onChange={(e) => updateQuestion(questionIndex, 'questionType', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="multiple_choice">Choix multiples</option>
                            <option value="true_false">Vrai/Faux</option>
                            <option value="open_ended">Réponse ouverte</option>
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

                      {question.questionType !== 'open_ended' && (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Réponses
                            </label>
                            <button
                              type="button"
                              onClick={() => addAnswer(questionIndex)}
                              className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              Ajouter réponse
                            </button>
                          </div>
                          
                          {question.answers.map((answer, answerIndex) => (
                            <div key={answerIndex} className="flex items-center space-x-2 mb-2">
                              <input
                                type="checkbox"
                                checked={answer.isCorrect}
                                onChange={(e) => updateAnswer(questionIndex, answerIndex, 'isCorrect', e.target.checked)}
                                className="w-4 h-4 text-blue-600"
                              />
                              <input
                                type="text"
                                value={answer.answerText}
                                onChange={(e) => updateAnswer(questionIndex, answerIndex, 'answerText', e.target.value)}
                                className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Texte de la réponse"
                              />
                              {question.answers.length > 2 && (
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
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Explication (optionnelle)
                        </label>
                        <textarea
                          value={question.explanation}
                          onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Explication de la bonne réponse..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {lessonId && (
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setActiveTab('lesson')}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Retour à la leçon
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmitQuiz()}
                    disabled={loading || quizData.questions.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Sauvegarde...' : 'Sauvegarder le quiz'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}