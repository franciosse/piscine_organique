// components/admin/ChapterEditor.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CourseChapter, Lesson, Quiz } from '@/lib/db/schema';
import logger from '@/lib/logger/logger';


interface ChapterWithDetails extends CourseChapter {
  lessons: (Lesson & {
    quizzes: Quiz[];
  })[];
}

interface ChapterEditorProps {
  chapterId: number;
  courseId: number;
}

interface FormData {
  title: string;
  description: string;
}

export default function ChapterEditor({ chapterId, courseId }: ChapterEditorProps) {
  const router = useRouter();
  const [chapter, setChapter] = useState<ChapterWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'chapter' | 'lessons'>('chapter');
  const [savingChapter, setSavingChapter] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
  });

  useEffect(() => {
    fetchChapter();
  }, [chapterId]);

  useEffect(() => {
    if (chapter) {
      setFormData({
        title: chapter.title || '',
        description: chapter.description || '',
      });
    }
  }, [chapter]);

  const fetchChapter = async () => {
    try {
      const response = await fetch(`/api/admin/chapters/${chapterId}`);
      const data = await response.json();
      
      if (response.ok) {
        setChapter(data.chapter);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChapter = async () => {
    if (!chapter) return;
    
    setSavingChapter(true);
    try {
      const response = await fetch(`/api/admin/chapters/${chapterId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        await fetchChapter(); // Recharger les données
        setError('');
        // Message de succès optionnel
      } else {
        setError(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setSavingChapter(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleChapterPublication = async () => {
    if (!chapter) return;

    try {
      const response = await fetch(`/api/admin/chapters/${chapterId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          published: chapter.published ? false : true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setChapter(prev => prev ? { ...prev, published: data.chapter.published } : null);
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour');
    }
  };

  const deleteChapter = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce chapitre ? Cette action est irréversible.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/chapters/${chapterId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push(`/admin/courses/${courseId}`);
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  const reorderLessons = async (lessonId: number, newPosition: number) => {
    if (!chapter) return;

    logger.info(`Déplacement de la leçon ${lessonId} vers la position ${newPosition}`);

    // Créer une copie des leçons triées par position actuelle
    const sortedLessons = [...chapter.lessons].sort((a, b) => a.position - b.position);
    
    // Trouver l'index de la leçon à déplacer
    const lessonIndex = sortedLessons.findIndex(l => l.id === lessonId);
    if (lessonIndex === -1) {
      setError('Leçon introuvable');
      return;
    }

    // Retirer la leçon de sa position actuelle
    const [movedLesson] = sortedLessons.splice(lessonIndex, 1);
    
    // L'insérer à la nouvelle position
    sortedLessons.splice(newPosition, 0, movedLesson);

    // Créer le payload avec les nouvelles positions
    const updatedLessons = sortedLessons.map((lesson, index) => ({
      id: lesson.id,
      position: index + 1,
    }));

    logger.info('Payload envoyé:'+ { lessons: updatedLessons });

    try {
      const response = await fetch(`/api/admin/chapters/${chapterId}/lessons/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lessons: updatedLessons }),
      });

      logger.info('Status:'+ response.status);
      const data = await response.json();
      logger.info('Réponse API:', data);

      if (response.ok) {
        fetchChapter(); // Recharger les données
      } else {
        setError(data.error || 'Erreur lors de la réorganisation');
      }
    } catch (err) {
      logger.error('Erreur de connexion:'+ err);
      setError('Erreur de connexion');
    }
  };

  const deleteLesson = async (lessonId: number, lessonTitle: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la leçon "${lessonTitle}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/chapters/${chapterId}/lessons/${lessonId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchChapter(); // Recharger les données
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors de la suppression de la leçon');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error || 'Chapitre non trouvé'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500">
        <Link href="/admin/courses" className="hover:text-gray-700">Cours</Link>
        <span>›</span>
        <Link href={`/admin/courses/${courseId}`} className="hover:text-gray-700">Course</Link>
        <span>›</span>
        <span className="text-gray-900">
          {isEditing ? `Modifier: ${chapter.title}` : chapter.title}
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
              {isEditing ? 'Mode édition' : chapter.title}
            </h1>
            {!isEditing && chapter.description && (
              <p className="text-gray-600 mb-4">{chapter.description}</p>
            )}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Position: {chapter.position}</span>
              <span>Leçons: {chapter.lessons.length}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                chapter.published
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {chapter.published ? 'Publié' : 'Brouillon'}
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
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
                  onClick={toggleChapterPublication}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    chapter.published
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {chapter.published ? 'Dépublier' : 'Publier'}
                </button>
                <button
                  onClick={deleteChapter}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Supprimer
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ✅ NOUVEAU : Mode édition avec onglets */}
      {isEditing ? (
        <div className="bg-white shadow rounded-lg">
          {/* Onglets */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('chapter')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'chapter'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Chapitre
              </button>
              <button
                onClick={() => setActiveTab('lessons')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'lessons'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Leçons ({chapter.lessons.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Contenu de l'onglet Chapitre */}
            {activeTab === 'chapter' && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Titre du chapitre *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Introduction aux bases"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description du chapitre
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Décrivez le contenu de ce chapitre..."
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveChapter}
                    disabled={savingChapter}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {savingChapter ? 'Sauvegarde...' : 'Sauvegarder le chapitre'}
                  </button>
                </div>
              </div>
            )}

            {/* Contenu de l'onglet Leçons */}
            {activeTab === 'lessons' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Gestion des leçons ({chapter.lessons.length})
                  </h3>
                  <Link
                    href={`/admin/courses/${courseId}/chapters/${chapterId}/lessons/new`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    + Ajouter une leçon
                  </Link>
                </div>

                {chapter.lessons.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="mb-4">Aucune leçon dans ce chapitre</p>
                    <Link
                      href={`/admin/courses/${courseId}/chapters/${chapterId}/lessons/new`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Créer la première leçon
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chapter.lessons
                      .sort((a, b) => a.position - b.position)
                      .map((lesson, index) => (
                        <div key={lesson.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="text-sm text-gray-500">#{lesson.position}</span>
                                <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  lesson.published
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {lesson.published ? 'Publié' : 'Brouillon'}
                                </span>
                              </div>

                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                {lesson.duration && (
                                  <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, '0')}
                                  </span>
                                )}
                                {lesson.videoUrl && (
                                  <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Vidéo
                                  </span>
                                )}
                                {lesson.quizzes?.length > 0 && (
                                  <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    {lesson.quizzes?.length} quiz
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {/* Boutons de réorganisation */}
                              <button
                                onClick={() => reorderLessons(lesson.id, Math.max(0, index - 1))}
                                disabled={index === 0}
                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                title="Monter"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => reorderLessons(lesson.id, Math.min(chapter.lessons.length - 1, index + 1))}
                                disabled={index === chapter.lessons.length - 1}
                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                title="Descendre"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              <Link
                                href={`/admin/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.id}/edit`}
                                className="text-sm text-blue-600 hover:text-blue-900 px-2 py-1"
                              >
                                Modifier
                              </Link>
                              <button
                                onClick={() => deleteLesson(lesson.id, lesson.title)}
                                className="text-sm text-red-600 hover:text-red-900 px-2 py-1"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    onClick={() => setActiveTab('chapter')}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Retour au chapitre
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Terminer l'édition
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ✅ Mode visualisation normal */
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Leçons ({chapter.lessons.length})</h2>
            <Link
              href={`/admin/courses/${courseId}/chapters/${chapterId}/lessons/new`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Ajouter une leçon
            </Link>
          </div>

          {chapter.lessons.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="mb-4">Aucune leçon dans ce chapitre</p>
              <Link
                href={`/admin/courses/${courseId}/chapters/${chapterId}/lessons/new`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Créer la première leçon
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {chapter.lessons
                .sort((a, b) => a.position - b.position)
                .map((lesson, index) => (
                  <div key={lesson.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm text-gray-500">#{lesson.position}</span>
                          <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            lesson.published
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {lesson.published ? 'Publié' : 'Brouillon'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {lesson.duration && (
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, '0')}
                            </span>
                          )}
                          {lesson.videoUrl && (
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Vidéo
                            </span>
                          )}
                          {lesson.quizzes?.length > 0 && (
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {lesson.quizzes?.length} quiz
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/admin/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.id}/edit`}
                          className="text-sm text-blue-600 hover:text-blue-900 px-2 py-1"
                        >
                          Modifier
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
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
              ✏️ Modifier le chapitre
            </button>
            
            <button
              onClick={() => {
                setIsEditing(true);
                setActiveTab('lessons');
              }}
              className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
            >
              📚 Gérer les leçons
            </button>
            
            <Link
              href={`/admin/courses/${courseId}/chapters/${chapterId}/lessons/new`}
              className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
            >
              ➕ Ajouter une leçon
            </Link>
            
            <button
              onClick={toggleChapterPublication}
              className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                chapter.published
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {chapter.published ? '👁️ Dépublier' : '🚀 Publier'}
            </button>
            
            <Link
              href={`/admin/courses/${courseId}`}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              ← Retour au cours
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}