// app/admin/users/[userId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserDetailsCard } from '@/components/admin/userDetailsCard';
import { UserCoursesManagement } from '@/components/admin/userCoursesManagement';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { 
  adminService, 
  User, 
  Course, 
  Purchase, 
} from '@/lib/services/adminService';
import logger from '@/lib/logger/logger';

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = parseInt(params.userId as string);

  // États principaux
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userPurchases, setUserPurchases] = useState<Purchase[]>([]);
  // const [userProgress, setUserProgress] = useState<Progress[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  
  // États de l'interface
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // États d'édition
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  useEffect(() => {
    if (userId && !isNaN(userId)) {
      fetchUserData();
    } else {
      setError('ID utilisateur invalide');
      setLoading(false);
    }
  }, [userId]);

  const fetchUserData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [userData, coursesData, purchasesData] = await Promise.all([
        adminService.getUserById(userId),
        adminService.getAllCourses(),
        adminService.getUserPurchases(userId)
      ]);
      
      // Récupération optionnelle du progrès
      // let progressData: Progress[] = [];
      // try {
      //   progressData = await adminService.getUserProgress(userId);
      // } catch (progressError) {
      //   logger.warn('Impossible de récupérer les progrès utilisateur:', progressError);
      // }
      
      setUser(userData);
      setEditForm(userData);
      setCourses(coursesData);
      setUserPurchases(purchasesData);
      // setUserProgress(progressData);
      
      // Calculer les cours disponibles (non achetés et publiés)
      const purchasedCourseIds = purchasesData.map(p => p.courseId);
      const available = coursesData.filter(course => 
        !purchasedCourseIds.includes(course.id) && course.published
      );
      setAvailableCourses(available);
      
    } catch (error) {
      logger.error('Erreur lors du chargement:', error);
      setError('Erreur lors du chargement des données utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!user) return;
    
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const updatedUser = await adminService.updateUser(user.id, editForm);
      setUser(updatedUser);
      setIsEditing(false);
      setSuccess('Utilisateur modifié avec succès');
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      logger.error('Erreur lors de la modification:', error);
      setError('Erreur lors de la modification de l\'utilisateur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCourse = async (courseId: number) => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const newPurchase = await adminService.addCoursePurchase(userId, courseId);
      
      // Mettre à jour les états locaux
      setUserPurchases(prev => [...prev, newPurchase]);
      setAvailableCourses(prev => prev.filter(course => course.id !== courseId));
      
      setSuccess('Cours ajouté avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      logger.error('Erreur lors de l\'ajout du cours:', error);
      setError('Erreur lors de l\'ajout du cours');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveCourse = async (courseId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
      return;
    }
    
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await adminService.removeCoursePurchase(userId, courseId);
      
      // Mettre à jour les états locaux
      const removedPurchase = userPurchases.find(p => p.courseId === courseId);
      if (removedPurchase) {
        setUserPurchases(prev => prev.filter(p => p.courseId !== courseId));
        setAvailableCourses(prev => [...prev, removedPurchase.course]);
      }
      
      setSuccess('Cours supprimé avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      logger.error('Erreur lors de la suppression:', error);
      setError('Erreur lors de la suppression du cours');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFormChange = (field: keyof User, value: string | boolean) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données utilisateur...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Utilisateur non trouvé</h2>
            <p className="text-gray-600 mb-6">L&apos;utilisateur demandé n&apos;existe pas ou n&apos;est pas accessible.</p>
            <Button onClick={() => router.push('/admin/users')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/admin/users')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la liste
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600">Gestion du profil utilisateur</p>
            </div>
          </div>

          {/* Messages d'état */}
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Colonne de gauche - Informations utilisateur */}
          <div className="xl:col-span-1">
            <UserDetailsCard
              user={user}
              isEditing={isEditing}
              editForm={editForm}
              actionLoading={actionLoading}
              onEdit={() => setIsEditing(true)}
              onSave={handleEditUser}
              onCancel={() => {
                setIsEditing(false);
                setEditForm(user);
              }}
              onFormChange={handleFormChange}
            />

            {/* Statistiques rapides */}
            {/* {userProgress.length > 0 && (
              <Card className="border-0 shadow-lg mt-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Progression rapide
                  </h3>
                  <div className="space-y-3">
                    {userProgress.slice(0, 3).map((progress) => (
                      <div key={progress.courseId} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm text-gray-900">{progress.courseTitle}</p>
                          <p className="text-xs text-gray-600">
                            {progress.completedLessons}/{progress.totalLessons} leçons
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-green-600">
                            {progress.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                    {userProgress.length > 3 && (
                      <p className="text-xs text-gray-500 text-center pt-2">
                        +{userProgress.length - 3} autres cours
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )} */}
          </div>

          {/* Colonne de droite - Gestion des cours */}
          <div className="xl:col-span-2">
            <UserCoursesManagement
              userPurchases={userPurchases}
              availableCourses={availableCourses}
              actionLoading={actionLoading}
              onAddCourse={handleAddCourse}
              onRemoveCourse={handleRemoveCourse}
            />

            {/* Progression détaillée */}
            {/* {userProgress.length > 0 && (
              <Card className="border-0 shadow-lg mt-6">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <TrendingUp className="h-5 w-5" />
                    Progression détaillée ({userProgress.length} cours)
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {userProgress.map((progress) => (
                      <div
                        key={progress.courseId}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{progress.courseTitle}</h4>
                            <p className="text-sm text-gray-600">
                              {progress.completedLessons} sur {progress.totalLessons} leçons terminées
                            </p>
                          </div>
                          <span className="text-lg font-bold text-purple-600">
                            {progress.percentage}%
                          </span>
                        </div>
                        
                        {/* Barre de progression */}
                        {/* <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Dernière activité : {new Date(progress.lastActivity).toLocaleDateString('fr-FR')}</span>
                          <span>{progress.percentage === 100 ? 'Terminé' : 'En cours'}</span>
                        </div>
                      </div>
                    ))} 
                  </div>
                </CardContent>
              </Card>
            )} */}
          </div>
        </div>
      </div>
    </div>
  );
}