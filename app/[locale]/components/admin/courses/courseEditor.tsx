
// components/admin/CourseEditor.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Course, CourseChapter, Lesson } from '@/lib/db/schema';

interface CourseWithDetails extends Course {
  chapters: (CourseChapter & {
    lessons: Lesson[];
  })[];
}

interface CourseEditorProps {
  courseId: number;
}

export default function CourseEditor({ courseId }: CourseEditorProps) {
  const [course, setCourse] = useState<CourseWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`);
      const data = await response.json();
      
      if (response.ok) {
        setCourse(data.course);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const toggleCoursePublication = async () => {
    if (!course) return;

    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          published: course.published ? null : new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCourse(prev => prev ? { ...prev, published: data.course.published } : null);
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error || 'Cours non trouvé'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête du cours */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
            <p className="text-gray-600 mb-4">{course.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Prix: {(course.price / 100).toFixed(2)} €</span>
              <span>Niveau: {course.difficultyLevel}</span>
              {course.estimatedDuration && (
                <span>Durée: {course.estimatedDuration} min</span>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Link
              href={`/dashboard/admin/courses/${courseId}/edit`}
              className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Modifier
            </Link>
            <button
              onClick={toggleCoursePublication}
              className={`px-4 py-2 rounded-lg transition-colors ${
                course.published
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {course.published ? 'Dépublier' : 'Publier'}
            </button>
          </div>
        </div>
      </div>

      {/* Contenu du cours */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Contenu du cours</h2>
          <Link
            href={`/dashboard/admin/courses/${courseId}/chapters/new`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Ajouter un chapitre
          </Link>
        </div>

        {course.chapters.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-4">Aucun chapitre créé pour ce cours</p>
            <Link
              href={`/dashboard/admin/courses/${courseId}/chapters/new`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Créer le premier chapitre
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {course.chapters
              .sort((a, b) => a.position - b.position)
              .map((chapter, index) => (
                <div key={chapter.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {index + 1}. {chapter.title}
                      </h3>
                      {chapter.description && (
                        <p className="text-sm text-gray-600 mt-1">{chapter.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        chapter.published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {chapter.published ? 'Publié' : 'Brouillon'}
                      </span>
                      <Link
                        href={`/dashboard/admin/courses/${courseId}/chapters/${chapter.id}/edit`}
                        className="text-sm text-blue-600 hover:text-blue-900"
                      >
                        Modifier
                      </Link>
                    </div>
                  </div>

                  {/* Leçons du chapitre */}
                  <div className="ml-4 mt-3 space-y-2">
                    {chapter.lessons
                      .sort((a, b) => a.position - b.position)
                      .map((lesson, lessonIndex) => (
                        <div key={lesson.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                              {index + 1}.{lessonIndex + 1}
                            </span>
                            <span className="text-sm">{lesson.title}</span>
                            {lesson.duration && (
                              <span className="text-xs text-gray-500">
                                ({Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, '0')})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              lesson.published
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {lesson.published ? 'Publié' : 'Brouillon'}
                            </span>
                            <Link
                              href={`/dashboard/admin/courses/${courseId}/chapters/${chapter.id}/lessons/${lesson.id}/edit`}
                              className="text-xs text-blue-600 hover:text-blue-900"
                            >
                              Modifier
                            </Link>
                          </div>
                        </div>
                      ))}
                    
                    <Link
                      href={`/dashboard/admin/courses/${courseId}/chapters/${chapter.id}/lessons/new`}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-900 py-2 px-3"
                    >
                      + Ajouter une leçon
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}