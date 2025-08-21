//components/pages/CoursesPageComponent.tsx (Composant UI)
'use client';

import { CourseCard } from './courseCard';
import { Course } from '@/lib/db/schema';
import { useState, useMemo } from 'react';
import { Search, Filter, Grid, List } from 'lucide-react';
import { getCourseProps } from '@/lib/course/courseHelper';


interface CoursesPageComponentProps {
  courses: Course[];
  purchasedCourseIds: number[];
  error?: string;
}

export function CoursesPageComponent({ 
  courses, 
  purchasedCourseIds, 
  error 
}: CoursesPageComponentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filtrage côté client (interactif)
  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [courses, searchTerm, filterCategory]);



  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-red-600 mb-2">
              Erreur de chargement
            </h3>
            <p className="text-gray-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Tous les cours
        </h1>
        <p className="text-gray-600">
          Découvrez notre catalogue de formation à l'autoconstruction de piscine organqiue et développez vos compétences
        </p>
      </div>

      {/* Filtres et recherche */}
      {courses.length > 0 && (
        <div className="mb-8 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
          {/* Recherche */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher un cours..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-4">

            {/* Toggle vue */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques */}
      {courses.length > 0 && (
        <div className="mb-6 text-sm text-gray-600">
          {filteredCourses.length} cours trouvé{filteredCourses.length > 1 ? 's' : ''} 
          {searchTerm && ` pour "${searchTerm}"`}
        </div>
      )}

      {/* Contenu */}
      {courses.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun cours disponible
            </h3>
            <p className="text-gray-500">
              Les cours seront bientôt disponibles. Revenez plus tard !
            </p>
          </div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun cours trouvé
            </h3>
            <p className="text-gray-500">
              Essayez de modifier vos critères de recherche.
            </p>
          </div>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        }>
          {filteredCourses.map((course) => {
            const courseProps = getCourseProps(course, purchasedCourseIds);
            
            return (
              <CourseCard
                key={course.id}
                course={course}
                showPurchaseButton={true}
                {...courseProps}
              />
            );
          })};
        </div>
      )}
    </div>
  );
}