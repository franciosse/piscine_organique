// components/admin/ChapterEditor.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CourseChapter, Lesson, Quiz } from '@/lib/db/schema';

interface ChapterWithDetails extends CourseChapter {
  lessons: (Lesson & {
    quizzes: Quiz[];
  })[];
}

interface ChapterEditorProps {
  chapterId: number;
  courseId: number;
}

export default function ChapterEditor({ chapterId, courseId }: ChapterEditorProps) {
  const router = useRouter();
  const [chapter, setChapter] = useState<ChapterWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchChapter();
  }, [chapterId]);

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

  const toggleChapterPublication = async () => {
    if (!chapter) return;

    try {
      const response = await fetch(`/api/admin/chapters/${chapterId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          published: chapter.published ? null : new Date().toISOString(),
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

    const reorderedLessons = [...chapter.lessons];
    const lessonIndex = reorderedLessons.findIndex(l => l.id === lessonId);
    const [movedLesson] = reorderedLessons.splice(lessonIndex, 1);
    reorderedLessons.splice(newPosition, 0, movedLesson);

    // Mettre à jour les positions
    const updatedLessons = reorderedLessons.map((lesson, index) => ({
      id: lesson.id,
      position: index + 1,
    }));

    try {
      const response = await fetch(`/api/admin/chapters/${chapterId}/lessons/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lessons: updatedLessons }),
      });

      if (response.ok) {
        fetchChapter(); // Recharger les données
      } else {
        setError('Erreur lors de la réorganisation');
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
        <span className="text-gray-900">{chapter.title}</span>
      </nav>

      {/* En-tête du chapitre */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{chapter.title}</h1>
            {chapter.description && (
              <p className="text-gray-600 mb-4">{chapter.description}</p>
            )}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Position: {chapter.position}</span>
              <span>Leçons: {chapter.lessons.length}</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link
              href={`/admin/courses/${courseId}/chapters/${chapterId}/edit`}
              className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Modifier
            </Link>
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
          </div>
        </div>
      </div>

      {/* Leçons du chapitre */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Leçons ({chapter.lessons.length})</h2>
          <Link
            href={`//admin/courses/${courseId}/chapters/${chapterId}/lessons/new`}
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
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-10v20m0 0l3-3m-3 3l-3-3" />
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

                      {/* Actions */}
                      <Link
                        href={`/admin/lessons/${lesson.id}`}
                        className="text-sm text-blue-600 hover:text-blue-900 px-2 py-1"
                      >
                        Voir
                      </Link>
                      <Link
                        href={`/admin/lessons/${lesson.id}/edit`}
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
    </div>
  );
}