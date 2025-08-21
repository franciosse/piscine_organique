// components/admin/LessonEditor.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lesson, LessonAttachment, Quiz, QuizQuestion, QuizAnswer } from '@/lib/db/schema';
import ImageSelector from '@/components/admin/imageSelector';

interface LessonWithDetails extends Lesson {
  attachments: LessonAttachment[];
  quizzes: (Quiz & {
    questions: (QuizQuestion & {
      answers: QuizAnswer[];
    })[];
  })[];
  chapter: {
    id: number;
    title: string;
    description?: string;
    courseId: number;
  };
  course: {
    id: number;
    title: string;
    slug: string;
  };
}

interface LessonEditorProps {
  lessonId: number;
  chapterId: number;
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

export default function LessonEditor({ chapterId, lessonId }: LessonEditorProps) {
  const router = useRouter();
  const [lesson, setLesson] = useState<LessonWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // États pour le mode édition
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'lesson' | 'quiz'>('lesson');
  const [savingLesson, setSavingLesson] = useState(false);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);
  
  // Refs pour la gestion du contenu
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // États pour les formulaires
  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    videoUrl: '',
    duration: 0,
  });

  const [quizData, setQuizData] = useState<QuizFormData>({
    title: '',
    description: '',
    passingScore: 70,
    maxAttempts: 3,
    questions: []
  });

  useEffect(() => {
    fetchLesson();
  }, [lessonId]);

  // Initialiser les formulaires quand les données arrivent
  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title || '',
        content: lesson.content || '',
        videoUrl: lesson.videoUrl || '',
        duration: lesson.duration || 0,
      });

      // Initialiser les données du quiz s'il existe
      if (lesson.quizzes.length > 0) {
        const quiz = lesson.quizzes[0];
        setQuizData({
          title: quiz.title || '',
          description: quiz.description || '',
          passingScore: quiz.passingScore || 70,
          maxAttempts: quiz.maxAttempts || 3,
          questions: quiz.questions?.map(q => ({
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
      }
    }
  }, [lesson]);

  const fetchLesson = async () => {
    try {
      const response = await fetch(`/api/admin/chapters/${chapterId}/lessons/${lessonId}`);
      const data = await response.json();
      
      if (response.ok) {
        setLesson(data);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour insérer du texte à la position du curseur
  const insertTextAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const textBefore = formData.content.substring(0, startPos);
    const textAfter = formData.content.substring(endPos);
    
    const newContent = textBefore + text + textAfter;
    setFormData(prev => ({ ...prev, content: newContent }));
    
    // Repositionner le curseur après l'insertion
    setTimeout(() => {
      const newCursorPos = startPos + text.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  // Gestion de la sélection d'images
  const handleImageSelect = (imageUrl: string) => {
    const imageHtml = `<img src="${imageUrl}" alt="Image de la leçon" class="max-w-full h-auto rounded-lg my-4" />`;
    insertTextAtCursor(imageHtml);
    
    // Message de succès temporaire
    setError('✅ Image ajoutée avec succès !');
    setTimeout(() => setError(''), 2000);
  };

  // Fonctions pour insérer du HTML rapidement
  const insertHtmlTag = (tag: string, placeholder: string = '') => {
    const html = `<${tag}>${placeholder}</${tag}>`;
    insertTextAtCursor(html);
  };

  // Fonction pour sauvegarder la leçon
  const handleSaveLesson = async () => {
    if (!lesson) return;
    
    setSavingLesson(true);
    try {
      const response = await fetch(`/api/admin/chapters/${chapterId}/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        await fetchLesson(); // Recharger les données
        setError('');
        setIsEditing(false); // Sortir du mode édition après sauvegarde
      } else {
        setError(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setSavingLesson(false);
    }
  };

  // Fonction pour sauvegarder le quiz
  const handleSaveQuiz = async () => {
    if (!lesson) return;
    
    setSavingQuiz(true);
    try {
      const method = lesson.quizzes.length > 0 ? 'PATCH' : 'POST';
      const response = await fetch(`/api/admin/lessons/${lessonId}/quiz`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizData),
      });

      const data = await response.json();
      if (response.ok) {
        await fetchLesson(); // Recharger les données
        setError('');
      } else {
        setError(data.error || 'Erreur lors de la sauvegarde du quiz');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setSavingQuiz(false);
    }
  };

  // Gestion des changements dans le formulaire leçon
  const handleLessonChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  // Gestion des changements dans le formulaire quiz
  const handleQuizChange = (field: keyof QuizFormData, value: any) => {
    setQuizData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Gestion des questions
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

  const toggleLessonPublication = async () => {
    if (!lesson) return;

    try {
      const response = await fetch(`/api/admin/chapters/${chapterId}/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          published: lesson.published ? false : true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLesson(prev => prev ? { 
          ...prev, 
          published: data.lesson.published 
        } : null);
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour');
    }
  };

  const deleteLesson = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette leçon ? Cette action est irréversible.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/chapters/${chapterId}/lessons/${lessonId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push(`/admin/courses/${lesson?.course.id}/chapters/${lesson?.chapter.id}/edit`);
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  const deleteAttachment = async (attachmentId: number) => {
    if (!confirm('Supprimer cette ressource ?')) return;

    try {
      const response = await fetch(`/api/admin/attachments/${attachmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchLesson(); // Recharger les données
      } else {
        setError('Erreur lors de la suppression de la ressource');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  const deleteQuiz = async (quizId: number) => {
    if (!confirm('Supprimer ce quiz ? Cette action est irréversible.')) return;

    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}/quiz`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchLesson(); // Recharger les données
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors de la suppression du quiz');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error || 'Leçon non trouvée'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500">
        <Link href="/admin/courses" className="hover:text-gray-700">Cours</Link>
        <span>›</span>
        <Link href={`/admin/courses/${lesson.course.id}`} className="hover:text-gray-700">
          {lesson.course.title}
        </Link>
        <span>›</span>
        <Link 
          href={`/admin/courses/${lesson.course.id}/chapters/${lesson.chapter.id}/edit`} 
          className="hover:text-gray-700"
        >
          {lesson.chapter.title}
        </Link>
        <span>›</span>
        <span className="text-gray-900">
          {isEditing ? `Modifier: ${lesson.title}` : lesson.title}
        </span>
      </nav>

      {/* Affichage des erreurs */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button 
            onClick={() => setError('')}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* En-tête avec mode édition */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isEditing ? 'Mode édition' : lesson.title}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
              <span>Position: {lesson.position}</span>
              {lesson.duration && <span>Durée: {formatDuration(lesson.duration)}</span>}
              <span className={`px-2 py-1 rounded-full text-xs ${
                lesson.published
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {lesson.published ? 'Publié' : 'Brouillon'}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Cours: <strong>{lesson.course.title}</strong> › 
              Chapitre: <strong>{lesson.chapter.title}</strong>
            </p>
          </div>
          <div className="flex space-x-2">
            {/* Basculer entre visualisation et édition */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isEditing
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : 'text-blue-600 border border-blue-600 hover:bg-blue-50'
              }`}
            >
              {isEditing ? 'Annuler' : 'Modifier'}
            </button>
            
            {!isEditing && (
              <>
                <button
                  onClick={toggleLessonPublication}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    lesson.published
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {lesson.published ? 'Dépublier' : 'Publier'}
                </button>
                <button
                  onClick={deleteLesson}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Supprimer
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mode édition avec onglets */}
      {isEditing ? (
        <div className="bg-white shadow rounded-lg">
          {/* Onglets */}
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
            {/* Contenu de l'onglet Leçon */}
            {activeTab === 'lesson' && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Titre de la leçon *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleLessonChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Introduction aux composants React"
                  />
                </div>

                <div>
                  <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    URL de la vidéo (optionnelle)
                  </label>
                  <input
                    type="url"
                    id="videoUrl"
                    name="videoUrl"
                    value={formData.videoUrl}
                    onChange={handleLessonChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/video.mp4"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Laissez vide si cette leçon n'a pas de vidéo associée.
                  </p>
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
                    Durée (secondes) {!formData.videoUrl && '(optionnelle)'}
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      id="duration"
                      name="duration"
                      value={formData.duration}
                      onChange={handleLessonChange}
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
                  {!formData.videoUrl && (
                    <p className="text-sm text-gray-500 mt-1">
                      Durée estimée de lecture/compréhension du contenu.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                    Contenu de la leçon
                  </label>
                  
                  {/* Barre d'outils pour le contenu */}
                  <div className="bg-gray-50 border border-gray-300 rounded-t-lg p-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowImageSelector(true)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200"
                    >
                      🖼️ Image
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHtmlTag('h2', 'Titre de section')}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHtmlTag('h3', 'Sous-titre')}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                    >
                      H3
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHtmlTag('p', 'Votre paragraphe...')}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                    >
                      ¶ P
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHtmlTag('strong', 'texte en gras')}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 font-bold"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHtmlTag('em', 'texte en italique')}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 italic"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('<ul>\n  <li>Premier élément</li>\n  <li>Deuxième élément</li>\n</ul>')}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                    >
                      • Liste
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('<blockquote class="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4">\n  Citation importante\n</blockquote>')}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                    >
                      " Citation
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('<div class="bg-blue-50 border-l-4 border-blue-400 p-4 my-4">\n  <p class="text-blue-700"><strong>💡 Info :</strong> Information importante à retenir</p>\n</div>')}
                      className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200"
                    >
                      💡 Info
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('<div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">\n  <p class="text-yellow-700"><strong>⚠️ Attention :</strong> Point important à noter</p>\n</div>')}
                      className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded hover:bg-yellow-200"
                    >
                      ⚠️ Warning
                    </button>
                  </div>

                  <textarea
                    ref={textareaRef}
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleLessonChange}
                    rows={12}
                    className="w-full px-3 py-2 border-l border-r border-b border-gray-300 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Rédigez le contenu de votre leçon en HTML ou Markdown..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Vous pouvez utiliser du HTML pour la mise en forme. Utilisez les boutons ci-dessus pour insérer rapidement des éléments.
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
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveLesson}
                    disabled={savingLesson}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {savingLesson ? 'Sauvegarde...' : 'Sauvegarder la leçon'}
                  </button>
                </div>
              </div>
            )}

            {/* Contenu de l'onglet Quiz */}
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

                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    onClick={() => setActiveTab('lesson')}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Retour à la leçon
                  </button>
                  <button
                    onClick={handleSaveQuiz}
                    disabled={savingQuiz || quizData.questions.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {savingQuiz ? 'Sauvegarde...' : 'Sauvegarder le quiz'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Mode visualisation normal */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Colonne gauche : Contenu principal */}
          <div className="space-y-6">
            {/* Vidéo */}
            {lesson.videoUrl && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Vidéo</h2>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    src={lesson.videoUrl}
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
            {lesson.content && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Contenu</h2>
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: lesson.content }}
                />
              </div>
            )}
          </div>

          {/* Colonne droite : Ressources et Quiz */}
          <div className="space-y-6">
            {/* Ressources attachées */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Ressources ({lesson.attachments.length})</h2>
                <Link
                  href={`/admin/courses/${lesson.course.id}/chapters/${lesson.chapter.id}/lessons/${lessonId}/attachments/new`}
                  className="text-blue-600 hover:text-blue-900 text-sm"
                >
                  + Ajouter
                </Link>
              </div>

              {lesson.attachments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune ressource attachée</p>
              ) : (
                <div className="space-y-2">
                  {lesson.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{attachment.filename}</p>
                          <p className="text-xs text-gray-500">
                            {attachment.fileType} • {attachment.fileSize && formatFileSize(attachment.fileSize)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          Voir
                        </a>
                        <button
                          onClick={() => deleteAttachment(attachment.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quiz */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Quiz ({lesson.quizzes.length})</h2>
                {lesson.quizzes.length === 0 && (
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setActiveTab('quiz');
                    }}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    + Ajouter
                  </button>
                )}
              </div>

              {lesson.quizzes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucun quiz créé</p>
              ) : (
                <div className="space-y-4">
                  {lesson.quizzes.map((quiz) => (
                    <div key={quiz.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900">{quiz.title}</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setActiveTab('quiz');
                            }}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => deleteQuiz(quiz.id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                      {quiz.description && (
                        <p className="text-sm text-gray-600 mb-2">{quiz.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{quiz.questions.length} questions</span>
                        <span>Score minimum: {quiz.passingScore}%</span>
                        <span>Tentatives max: {quiz.maxAttempts}</span>
                      </div>
                      
                      {/* Aperçu des questions */}
                      {quiz.questions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-2">Aperçu des questions:</p>
                          <div className="space-y-1">
                            {quiz.questions.slice(0, 3).map((question, index) => (
                              <div key={question.id} className="text-xs text-gray-600">
                                <span className="font-medium">{index + 1}.</span> {question.question.substring(0, 60)}
                                {question.question.length > 60 && '...'}
                                <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                                  {question.questionType === 'multiple_choice' && 'QCM'}
                                  {question.questionType === 'true_false' && 'V/F'}
                                  {question.questionType === 'open_ended' && 'Ouverte'}
                                </span>
                              </div>
                            ))}
                            {quiz.questions.length > 3 && (
                              <p className="text-xs text-gray-400">
                                ... et {quiz.questions.length - 3} autres questions
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Statistiques rapides */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Statistiques</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {lesson.attachments.length}
                  </div>
                  <div className="text-sm text-blue-600">Ressources</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {lesson.quizzes.reduce((total, quiz) => total + quiz.questions.length, 0)}
                  </div>
                  <div className="text-sm text-green-600">Questions</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {lesson.duration ? formatDuration(lesson.duration) : '--'}
                  </div>
                  <div className="text-sm text-purple-600">Durée</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {lesson.position}
                  </div>
                  <div className="text-sm text-yellow-600">Position</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions rapides (seulement en mode visualisation) */}
      {!isEditing && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
            >
              ✏️ Modifier le contenu
            </button>
            
            <Link
              href={`/admin/courses/${lesson.course.id}/chapters/${lesson.chapter.id}/lessons/${lessonId}/attachments/new`}
              className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
            >
              📎 Ajouter une ressource
            </Link>
            
            <button
              onClick={() => {
                setIsEditing(true);
                setActiveTab('quiz');
              }}
              className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
            >
              {lesson.quizzes.length === 0 ? '🧩 Créer un quiz' : '🧩 Modifier le quiz'}
            </button>
            
            <button
              onClick={toggleLessonPublication}
              className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                lesson.published
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {lesson.published ? '👁️ Dépublier' : '🚀 Publier'}
            </button>
            
            <Link
              href={`/admin/courses/${lesson.course.id}/chapters/${lesson.chapter.id}/edit`}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              ← Retour au chapitre
            </Link>
          </div>
        </div>
      )}

      {/* Sélecteur d'images */}
      <ImageSelector
        isOpen={showImageSelector}
        onClose={() => setShowImageSelector(false)}
        onSelect={handleImageSelect}
        filter="all"
      />
    </div>
  );
}