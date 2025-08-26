// components/admin/UserDetailsCard.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { User, Edit2, Save, X, Mail, Calendar, Shield } from 'lucide-react';
import { User as UserType } from '@/lib/services/adminService';

interface UserDetailsCardProps {
  user: UserType;
  isEditing: boolean;
  editForm: Partial<UserType>;
  actionLoading: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onFormChange: (field: keyof UserType, value: string | boolean) => void;
}

export function UserDetailsCard({
  user,
  isEditing,
  editForm,
  actionLoading,
  onEdit,
  onSave,
  onCancel,
  onFormChange
}: UserDetailsCardProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <User className="h-5 w-5" />
            Informations utilisateur
          </CardTitle>
          {!isEditing ? (
            <Button onClick={onEdit} variant="outline" size="sm">
              <Edit2 className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={onSave} size="sm" disabled={actionLoading}>
                <Save className="h-4 w-4 mr-2" />
                {actionLoading ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
              <Button onClick={onCancel} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Nom
              </label>
              {isEditing ? (
                <Input
                  value={editForm.name || ''}
                  onChange={(e) => onFormChange('name', e.target.value)}
                  placeholder="Nom de l'utilisateur"
                />
              ) : (
                <p className="text-gray-900 font-medium">{user.name}</p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                <Mail className="h-4 w-4 inline mr-2" />
                Email
              </label>
              {isEditing ? (
                <Input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => onFormChange('email', e.target.value)}
                  placeholder="Email de l'utilisateur"
                />
              ) : (
                <p className="text-gray-900">{user.email}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                <Shield className="h-4 w-4 inline mr-2" />
                Rôle
              </label>
              {isEditing ? (
                <select
                  value={editForm.role || ''}
                  onChange={(e) => onFormChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USER">Utilisateur</option>
                  <option value="ADMIN">Administrateur</option>
                  <option value="INSTRUCTOR">Instructeur</option>
                </select>
              ) : (
                <Badge variant={user.role === 'ADMIN' ? 'destructive' : user.role === 'INSTRUCTOR' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Statut
              </label>
              <div className="flex items-center gap-2">
                <Badge variant={user.isVerified ? 'default' : 'secondary'}>
                  {user.isVerified ? 'Vérifié' : 'Non vérifié'}
                </Badge>
                {isEditing && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editForm.isVerified || false}
                      onChange={(e) => onFormChange('isVerified', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Vérifié
                  </label>
                )}
              </div>
            </div>
            
            {user.createdAt && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Membre depuis
                </label>
                <p className="text-gray-600 text-sm">
                  {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}