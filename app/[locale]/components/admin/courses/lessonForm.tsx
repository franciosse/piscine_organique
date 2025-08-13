
// components/admin/LessonForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lesson, LessonAttachment } from '@/lib/db/schema';

interface LessonFormProps {
  courseId: number;
  chapterId: number;
  lessonId?: number;
  initialData?: Lesson & { attachments?: LessonAttachment[] };
}

interface FormData {
  title: string;
  content: string;
  videoUrl: string;
  duration: number;
}

export default function LessonForm({ courseId,chapterId, lessonId, initialData }: LessonFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    videoUrl: initialData?.videoUrl || '',
    duration: initialData?.duration || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = lessonId 
        ? `/api/admin/lessons/${lessonId}` 
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
        router.push(`/dashboard/admin/courses/${courseId}/chapters/${chapterId}/edit`);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {lessonId ? 'Modifier la leçon' : 'Nouvelle leçon'}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* Aperçu du contenu */}
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
      </div>
    </div>
  );
}