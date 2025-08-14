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
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // États pour les champs éditables
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: 0,
    difficultyLevel: '',
    estimatedDuration: 0,
  });

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  useEffect(() => {
    if (course) {
      setEditForm({
        title: course.title,
        description: course.description || '',
        price: course.price,
        difficultyLevel: course.difficultyLevel || 'Débutant',
        estimatedDuration: course.estimatedDuration || 0,
      });
    }
  }, [course]);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const data = await response.json();
        setCourse(prev => prev ? { ...prev, ...data.course } : null);
        setIsEditing(false);
        setError('');
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (course) {
      setEditForm({
        title: course.title,
        description: course.description || '',
        price: course.price,
        difficultyLevel: course.difficultyLevel || 'Débutant',
        estimatedDuration: course.estimatedDuration || 0,
      });
    }
    setIsEditing(false);
    setError('');
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

  if (error && !course) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error || 'Cours non trouvé'}
      </div>
    );
  }

  if (!course) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        Cours non trouvé
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* En-tête du cours */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre du cours
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Titre du cours"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Description du cours"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix (en centimes)
                    </label>
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) => setEditForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {(editForm.price / 100).toFixed(2)} €
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Niveau de difficulté
                    </label>
                    <select
                      value={editForm.difficultyLevel}
                      onChange={(e) => setEditForm(prev => ({ ...prev, difficultyLevel: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="beginner">Débutant</option>
                      <option value="intermediate">Intermédiaire</option>
                      <option value="advanced">Avancé</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durée estimée (minutes)
                    </label>
                    <input
                      type="number"
                      value={editForm.estimatedDuration}
                      onChange={(e) => setEditForm(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
                <p className="text-gray-600 mb-4">{course.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Prix: {(course.price / 100).toFixed(2)} €</span>
                  <span>Niveau: {course.difficultyLevel}</span>
                  {course.estimatedDuration && (
                    <span>Durée: {course.estimatedDuration} min</span>
                  )}
                </div>
              </>
            )}
          </div>
          
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {saving && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Modifier
                </button>
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Contenu du cours */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Contenu du cours</h2>
          <Link
            href={`/admin/courses/${courseId}/chapters/new`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Ajouter un chapitre
          </Link>
        </div>

        {course.chapters.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-4">Aucun chapitre créé pour ce cours</p>
            <Link
              href={`/admin/courses/${courseId}/chapters/new`}
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
                        href={`/admin/courses/${courseId}/chapters/${chapter.id}/edit`}
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
                              href={`/admin/courses/${courseId}/chapters/${chapter.id}/lessons/${lesson.id}/edit`}
                              className="text-xs text-blue-600 hover:text-blue-900"
                            >
                              Modifier
                            </Link>
                          </div>
                        </div>
                      ))}
                    
                    <Link
                      href={`/admin/courses/${courseId}/chapters/${chapter.id}/lessons/new`}
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