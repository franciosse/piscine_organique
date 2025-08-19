// components/admin/LessonEditor.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lesson, LessonAttachment, Quiz, QuizQuestion, QuizAnswer } from '@/lib/db/schema';

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
    courseId: number;
  };
}

interface LessonEditorProps {
  lessonId: number;
}

export default function LessonEditor({ lessonId }: LessonEditorProps) {
  const router = useRouter();
  const [lesson, setLesson] = useState<LessonWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchLesson();
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      const response = await fetch(`/api/admin//chapters/${lesson?.chapterId}lessons/${lessonId}`);
      const data = await response.json();
      
      if (response.ok) {
        setLesson(data.lesson);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const toggleLessonPublication = async () => {
    if (!lesson) return;

    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          published: lesson.published ? null : new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLesson(prev => prev ? { ...prev, published: data.lesson.published } : null);
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
      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push(`/admin/admin/courses/${lesson?.chapter.courseId}/chapters/${lesson?.chapter.id}/edit`);
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
        <Link href={`/admin/courses/${lesson.chapter.courseId}`} className="hover:text-gray-700">Course</Link>
        <span>›</span>
        <Link href={`/admin/courses/${lesson.chapter.courseId}/chapters/${lesson.chapter.id}`} className="hover:text-gray-700">{lesson.chapter.title}</Link>
        <span>›</span>
        <span className="text-gray-900">{lesson.title}</span>
      </nav>

      {/* En-tête de la leçon */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
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
          </div>
          <div className="flex space-x-2">
            <Link
              href={`/admin/lessons/${lessonId}/edit`}
              className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Modifier
            </Link>
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
          </div>
        </div>
      </div>

      {/* Contenu de la leçon */}
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
                href={`/admin/lessons/${lessonId}/attachments/new`}
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
              <Link
                href={`/admin/lessons/${lessonId}/quizzes/new`}
                className="text-blue-600 hover:text-blue-900 text-sm"
              >
                + Ajouter
              </Link>
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
                        <Link
                          href={`/admin/quizzes/${quiz.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          Modifier
                        </Link>
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}