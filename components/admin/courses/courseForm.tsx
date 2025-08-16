
// components/admin/CourseForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Course } from '@/lib/db/schema';

interface CourseFormProps {
  courseId?: number;
  initialData?: Course;
}

interface FormData {
  title: string;
  description: string;
  price: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  imageUrl: string;
}

export default function CourseForm({ courseId, initialData }: CourseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData ? initialData.price / 100 : 0,
    difficultyLevel: initialData?.difficultyLevel as 'beginner' | 'intermediate' | 'advanced' || 'beginner',
    estimatedDuration: initialData?.estimatedDuration || 0,
    imageUrl: initialData?.imageUrl || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = courseId ? `/api/admin/courses/${courseId}` : '/api/admin/courses';
      const method = courseId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/admin/courses');
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {courseId ? 'Modifier le cours' : 'Nouveau cours'}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Titre du cours *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Introduction à React"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Décrivez ce que les étudiants vont apprendre..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Prix (€) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="difficultyLevel" className="block text-sm font-medium text-gray-700 mb-2">
                Niveau de difficulté
              </label>
              <select
                id="difficultyLevel"
                name="difficultyLevel"
                value={formData.difficultyLevel}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="beginner">Débutant</option>
                <option value="intermediate">Intermédiaire</option>
                <option value="advanced">Avancé</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="estimatedDuration" className="block text-sm font-medium text-gray-700 mb-2">
              Durée estimée (minutes)
            </label>
            <input
              type="number"
              id="estimatedDuration"
              name="estimatedDuration"
              value={formData.estimatedDuration}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: 120"
            />
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
              URL de l'image de couverture
            </label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/image.jpg"
            />
            {formData.imageUrl && (
              <div className="mt-2">
                <img
                  src={formData.imageUrl}
                  alt="Aperçu"
                  className="h-32 w-48 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-6">
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
              {loading ? 'Sauvegarde...' : courseId ? 'Mettre à jour' : 'Créer le cours'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
