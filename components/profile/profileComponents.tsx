// components/profile/ProfileComponents.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PasswordChangeModal } from '@/components/ui/passwordChangeModal';
import { 
  User, 
  Mail, 
  Shield, 
  Camera, 
  AlertCircle
} from 'lucide-react';
import useSWR from 'swr';
import { User as UserType } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then(res => res.json()).then(data => data.user);

type ActionState = {
  name?: string;
  error?: string;
  success?: string;
};

type AccountFormProps = {
  state: ActionState;
  nameValue?: string;
  emailValue?: string;
  roleValue?: string;
};

export function AccountFormSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
        <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
        <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
        <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
      </div>
    </div>
  );
}

export function AccountForm({ state, nameValue = '', emailValue = '', roleValue = '' }: AccountFormProps) {
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'student': return 'Étudiant';
      case 'admin': return 'Administrateur';
      default: return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-200 shadow-sm';
      case 'student': return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 shadow-sm';
      default: return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-200 shadow-sm';
    }
  };

  return (
    <div className="space-y-8">
      {/* Champ Nom */}
      <div className="space-y-3">
        <Label htmlFor="name" className="text-sm font-semibold text-gray-800 flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg">
            <User className="h-4 w-4 text-green-600" />
          </div>
          Nom complet
        </Label>
        <div className="relative group">
          <Input
            id="name"
            name="name"
            placeholder="Entrez votre nom complet"
            defaultValue={state.name ?? nameValue}
            required
            className="h-12 pl-4 pr-4 border-2 border-gray-200 hover:border-green-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-300 text-gray-800 placeholder-gray-500 font-medium"
          />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </div>
      </div>

      {/* Champ Email */}
      <div className="space-y-3">
        <Label htmlFor="email" className="text-sm font-semibold text-gray-800 flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg">
            <Mail className="h-4 w-4 text-blue-600" />
          </div>
          Adresse email
        </Label>
        <div className="relative group">
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Entrez votre adresse email"
            defaultValue={emailValue}
            required
            className="h-12 pl-4 pr-4 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-300 text-gray-800 placeholder-gray-500 font-medium"
          />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </div>
      </div>

      {/* Champ Rôle */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-800 flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg">
            <Shield className="h-4 w-4 text-purple-600" />
          </div>
          Rôle
        </Label>
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 ${getRoleBadgeColor(roleValue)}`}>
              {getRoleDisplay(roleValue)}
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/80 px-3 py-2 rounded-lg border border-gray-200">
              <AlertCircle className="h-4 w-4" />
              <span>Contactez l'&apos;administration pour modifier</span>
            </div>
          </div>
          <input type="hidden" name="role" value={roleValue} />
        </div>
      </div>
    </div>
  );
}

export function AccountFormWithData({ state }: { state: ActionState }) {
  const { data, error } = useSWR('/api/account/user', fetcher);
  
  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600 text-sm">Erreur lors du chargement des données</p>
      </div>
    );
  }
  
  if (!data) {
    return <AccountFormSkeleton />;
  }
  
  return (
    <AccountForm 
      state={state} 
      nameValue={data?.name ?? ''} 
      emailValue={data?.email ?? ''} 
      roleValue={data?.role ?? ''} 
    />
  );
}

export function ProfileHeader() {
  const { data } = useSWR('/api/account/user', fetcher);
  
  const getInitials = (name: string | null, email: string | undefined) => {
    if (name && name.trim()) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email && email.length > 0) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <Card className="border-0 bg-gradient-to-r from-green-50 to-emerald-50">
      <CardContent className="pt-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {data ? getInitials(data.name, data.email) : 'U'}
            </div>
            <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <Camera className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {data?.name || 'Utilisateur'}
            </h1>
            <p className="text-gray-600 mt-1">{data?.email || 'Email non défini'}</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Compte actif</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SecurityCard() {
  const { data: user } = useSWR('/api/account/user', fetcher);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const getPasswordAge = () => {
    if (!user?.updatedAt) return 'Inconnu';
    const lastUpdate = new Date(user.updatedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastUpdate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'il y a 1 jour';
    if (diffDays < 30) return `il y a ${diffDays} jours`;
    if (diffDays < 365) return `il y a ${Math.floor(diffDays / 30)} mois`;
    return `il y a ${Math.floor(diffDays / 365)} an(s)`;
  };

  const toggle2FA = () => {
    setIs2FAEnabled(!is2FAEnabled);
    // TODO: Implémenter l'activation/désactivation 2FA
  };

  const handlePasswordChanged = () => {
    // Rafraîchir les données utilisateur après changement de mot de passe
    // Vous pouvez ajouter un mutate SWR ici si nécessaire
  };

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Shield className="h-5 w-5 text-green-600" />
          Sécurité du compte
        </CardTitle>
        <CardDescription className="text-green-700">
          Gérez la sécurité et la confidentialité de votre compte
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl hover:border-green-200 transition-colors">
            <div>
              <h4 className="font-medium text-green-800">Mot de passe</h4>
              <p className="text-sm text-green-600">
                Dernière modification {getPasswordAge()}
              </p>
            </div>
            <PasswordChangeModal onPasswordChanged={handlePasswordChanged} />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl hover:border-green-200 transition-colors">
            <div>
              <h4 className="font-medium text-green-800">Authentification à deux facteurs</h4>
              <p className="text-sm text-green-600">
                {is2FAEnabled ? 'Activée - Votre compte est protégé' : 'Renforcez la sécurité de votre compte'}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className={`border-green-200 hover:bg-green-100 ${
                is2FAEnabled ? 'text-red-700 border-red-200 hover:bg-red-50' : 'text-green-700'
              }`}
              onClick={toggle2FA}
            >
              {is2FAEnabled ? 'Désactiver' : 'Activer'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCard() {
  const { data: user } = useSWR('/api/account/user', fetcher);
  const { data: stats } = useSWR('/api/account/stats', fetcher);

  const formatMemberSince = (createdAt: string | undefined) => {
    if (!createdAt) return 'Inconnu';
    const date = new Date(createdAt);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const formatLastLogin = (lastLoginAt: string | undefined) => {
    if (!lastLoginAt) return 'Inconnu';
    const lastLogin = new Date(lastLoginAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastLogin.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 5) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return lastLogin.toLocaleDateString('fr-FR');
  };

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardTitle className="text-green-800">Statistiques du compte</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
            <span className="text-sm font-medium text-green-700">Membre depuis</span>
            <span className="text-sm font-semibold text-green-800">
              {formatMemberSince(user?.createdAt)}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
            <span className="text-sm font-medium text-green-700">Dernière connexion</span>
            <span className="text-sm font-semibold text-green-800">
              {formatLastLogin(user?.lastLoginAt)}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
            <span className="text-sm font-medium text-green-700">Cours terminés</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-green-800">
                {stats?.completedCourses ?? 0}
              </span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>

          {stats?.totalCourses && (
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
              <span className="text-sm font-medium text-blue-700">Cours inscrits</span>
              <span className="text-sm font-semibold text-blue-800">
                {stats.totalCourses}
              </span>
            </div>
          )}

          {stats?.averageGrade && (
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
              <span className="text-sm font-medium text-purple-700">Moyenne générale</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-purple-800">
                  {stats.averageGrade.toFixed(1)}/20
                </span>
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}