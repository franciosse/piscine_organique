import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Search, 
  Filter, 
  RefreshCw, 
  UserCheck, 
  UserX, 
  Crown, 
  GraduationCap,
  Mail,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Badge
} from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription
} from '@/components/ui/alert';
import logger from '@/lib/logger/logger';

const api = {
  getAllUsers: async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      return data.users;
    } catch (error) {
      logger.error('Error fetching users:'+ error);
      throw error;
    }
  },
  
  deleteUser: async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      return true;
    } catch (error) {
      logger.error('Error deleting user:'+ error);
      throw error;
    }
  }
};

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function AllUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  
  // États pour la modal de suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // États pour les actions
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, verificationFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getAllUsers();
      setUsers(data);
    } catch (error) {
      logger.error('Failed to fetch users:'+ error);
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (verificationFilter !== 'all') {
      filtered = filtered.filter(user => 
        verificationFilter === 'verified' ? user.isVerified : !user.isVerified
      );
    }

    setFilteredUsers(filtered);
  };

  const handleViewUser = (userId: number) => {
    router.push(`/admin/users/${userId}`);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setActionLoading(true);
    setError(null);
    
    try {
      await api.deleteUser(userToDelete.id);
      
      // Supprimer de la liste
      setUsers(users.filter(user => user.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
      setSuccess('Utilisateur supprimé avec succès');
      
    } catch (error) {
      setError('Erreur lors de la suppression de l\'utilisateur');
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
    setError(null);
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? Crown : GraduationCap;
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'admin' ? 'destructive' : 'secondary';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const userStats = {
    total: users.length,
    admins: users.filter(user => user.role === 'admin').length,
    students: users.filter(user => user.role === 'student').length,
    verified: users.filter(user => user.isVerified).length,
    unverified: users.filter(user => !user.isVerified).length,
  };

  return (
    <div className="flex-1 min-h-full bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="p-6 lg:p-8 space-y-6">
        {/* Messages d'erreur et de succès */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-600/10 rounded-2xl"></div>
          <div className="relative p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-green-200/50 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
                    Gestion des utilisateurs
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Administrez votre communauté d'apprenants
                  </p>
                </div>
              </div>
              <Button
                onClick={fetchUsers}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{userStats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-700">{userStats.admins}</div>
              <div className="text-sm text-gray-600">Admins</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{userStats.students}</div>
              <div className="text-sm text-gray-600">Étudiants</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{userStats.verified}</div>
              <div className="text-sm text-gray-600">Vérifiés</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-700">{userStats.unverified}</div>
              <div className="text-sm text-gray-600">Non vérifiés</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtres et recherche
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Filtre par rôle */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Tous les rôles</option>
                <option value="admin">Administrateurs</option>
                <option value="student">Étudiants</option>
              </select>

              {/* Filtre par vérification */}
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="verified">Vérifiés</option>
                <option value="unverified">Non vérifiés</option>
              </select>

              {/* Résultats */}
              <div className="flex items-center justify-center bg-gray-50 rounded-lg px-4 py-2">
                <span className="text-sm font-medium text-gray-700">
                  {filteredUsers.length} résultat(s)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table des utilisateurs */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Liste des utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-green-500" />
                <span className="ml-2 text-gray-600">Chargement...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Utilisateur</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Rôle</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Statut</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Inscription</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => {
                      const RoleIcon = getRoleIcon(user.role);
                      return (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-green-50/50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {user.name?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {user.name || 'Nom non défini'}
                                </div>
                                <div className="text-sm text-gray-500">ID: {user.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900">{user.email}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1 w-fit">
                              <RoleIcon className="w-3 h-3" />
                              {user.role === 'admin' ? 'Admin' : 'Étudiant'}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            {user.isVerified ? (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span className="font-medium">Vérifié</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-orange-600">
                                <XCircle className="w-4 h-4" />
                                <span className="font-medium">Non vérifié</span>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(user.createdAt)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewUser(user.id)}
                                className="flex items-center gap-1"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Gérer
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent 
                                  align="end"
                                  className="w-48 mt-2 bg-white/95 backdrop-blur-md border-0 shadow-2xl rounded-2xl overflow-hidden z-[9999]"
                                >
                                  <DropdownMenuItem onClick={() => handleViewUser(user.id)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Voir le profil
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleViewUser(user.id)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => openDeleteModal(user)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun utilisateur trouvé</p>
                    <p className="text-sm text-gray-500">Essayez de modifier vos critères de recherche</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de confirmation de suppression */}
        <Dialog open={showDeleteModal} onOpenChange={closeDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Confirmer la suppression
              </DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
                <span className="font-semibold">{userToDelete?.name || userToDelete?.email}</span> ?
                Cette action est irréversible et supprimera également tous ses achats de cours et sa progression.
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter>
              <Button variant="outline" onClick={closeDeleteModal}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}