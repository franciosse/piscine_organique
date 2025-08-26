// components/admin/UserCoursesManagement.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Euro, 
  Calendar,
  AlertTriangle,
  X
} from 'lucide-react';
import { Purchase, Course } from '@/lib/services/adminService';

interface UserCoursesManagementProps {
  userPurchases: Purchase[];
  availableCourses: Course[];
  actionLoading: boolean;
  onAddCourse: (courseId: number) => void;
  onRemoveCourse: (courseId: number) => void;
}

export function UserCoursesManagement({
  userPurchases,
  availableCourses,
  actionLoading,
  onAddCourse,
  onRemoveCourse
}: UserCoursesManagementProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);

  const handleAddCourse = () => {
    console.log('handleAddCourse called with:', selectedCourse);
    if (selectedCourse) {
      onAddCourse(selectedCourse);
      setSelectedCourse(null);
      setShowAddModal(false);
    }
  };

  const handleCloseModal = () => {
    console.log('Closing modal');
    setShowAddModal(false);
    setSelectedCourse(null);
  };

  const handleCourseClick = (courseId: number) => {
    console.log('Course clicked:', courseId);
    setSelectedCourse(courseId);
  };

  return (
    <div className="space-y-6">
      {/* Cours actuels */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <BookOpen className="h-5 w-5" />
              Cours achetés ({userPurchases.length})
            </CardTitle>
            <Button 
              onClick={() => {
                console.log('Opening modal');
                setShowAddModal(true);
              }} 
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un cours
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {userPurchases.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun cours acheté</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userPurchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900">
                        {purchase.course.title}
                      </h3>
                      <Badge variant={purchase.status === 'completed' ? 'default' : 'secondary'}>
                        {purchase.status}
                      </Badge>
                      {purchase.amount === 0 && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Gratuit
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Euro className="h-3 w-3" />
                        {purchase.amount}€
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(purchase.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => onRemoveCourse(purchase.courseId)}
                    variant="outline"
                    size="sm"
                    disabled={actionLoading}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal d'ajout de cours - VERSION SIMPLIFIÉE */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={(e) => {
            // Fermer si on clique sur le backdrop
            if (e.target === e.currentTarget) {
              console.log('Backdrop clicked');
              handleCloseModal();
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Ajouter un cours</h2>
                <button 
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {availableCourses.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Tous les cours disponibles ont déjà été achetés</p>
                  <Button onClick={handleCloseModal}>
                    Fermer
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Sélectionnez un cours à ajouter ({availableCourses.length} disponibles):
                  </p>
                  
                  {/* Liste des cours - VERSION SIMPLIFIÉE */}
                  <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
                    {availableCourses.map((course) => {
                      const isSelected = selectedCourse === course.id;
                      return (
                        <button
                          key={course.id}
                          type="button"
                          className={`w-full p-4 text-left border-2 rounded-lg transition-all hover:shadow-sm ${
                            isSelected
                              ? 'border-green-500 bg-green-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => handleCourseClick(course.id)}
                          onMouseEnter={() => console.log('Mouse enter:', course.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{course.title}</h4>
                              {course.description && (
                                <p className="text-sm text-gray-600 mt-1 truncate">
                                  {course.description.substring(0, 100)}...
                                </p>
                              )}
                            </div>
                            <div className="ml-4 flex flex-col items-end">
                              <span className={`font-bold ${
                                isSelected ? 'text-green-700' : 'text-green-600'
                              }`}>
                                {course.price === 0 ? 'Gratuit' : `${course.price}€`}
                              </span>
                              {isSelected && (
                                <span className="text-xs text-green-600 font-medium mt-1">
                                  ✓ Sélectionné
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Debug info */}
                  <div className="mb-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
                    Debug: Cours sélectionné = {selectedCourse || 'aucun'}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleAddCourse}
                      disabled={!selectedCourse || actionLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {actionLoading ? 'Ajout en cours...' : 'Ajouter le cours'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCloseModal}
                      className="flex-1"
                      disabled={actionLoading}
                    >
                      Annuler
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}