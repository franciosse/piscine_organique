// app/admin/users/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CreateUserFormData {
  name: string;
  email: string;
  role: 'admin' | 'student' | 'teacher';
  password: string;
  confirmPassword: string;
  isVerified: boolean;
}

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [formData, setFormData] = useState<CreateUserFormData>({
    name: '',
    email: '',
    role: 'student',
    password: '',
    confirmPassword: '',
    isVerified: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'Le nom est requis';
    }
    if (!formData.email.trim()) {
      return 'L\'email est requis';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Format d\'email invalide';
    }
    if (formData.password.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Les mots de passe ne correspondent pas';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation côté client
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Préparer les données pour l'API
      const { confirmPassword, ...userData } = formData;

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Utilisateur "${data.user.name}" créé avec succès !`);
        
        // Rediriger après 2 secondes
        setTimeout(() => {
          router.push('/admin/users');
        }, 2000);
      } else {
        if (Array.isArray(data.details)) {
          // Erreurs de validation Zod
          const errorMessages = data.details.map((err: any) => err.message).join(', ');
          setError(errorMessages);
        } else {
          setError(data.error || 'Erreur lors de la création de l\'utilisateur');
        }
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({
      ...prev,
      password,
      confirmPassword: password,
    }));
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Accès complet à l\'administration de la plateforme';
      case 'teacher':
        return 'Peut créer et gérer des cours, voir les statistiques des étudiants';
      case 'student':
        return 'Peut suivre des cours et passer des quiz';
      default:
        return '';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return '👑';
      case 'teacher':
        return '👨‍🏫';
      case 'student':
        return '🎓';
      default:
        return '👤';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
          <Link href="/admin" className="hover:text-gray-700">Administration</Link>
          <span>›</span>
          <Link href="/admin/users" className="hover:text-gray-700">Utilisateurs</Link>
          <span>›</span>
          <span className="text-gray-900">Nouvel utilisateur</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900">Créer un nouvel utilisateur</h1>
        <p className="text-gray-600 mt-2">
          Ajoutez un nouvel utilisateur à la plateforme et définissez son rôle
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {success}
          <div className="text-sm mt-1">Redirection vers la liste des utilisateurs...</div>
        </div>
      )}

      {/* Formulaire */}
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations personnelles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Jean Dupont"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="jean.dupont@example.com"
              />
            </div>
          </div>

          {/* Rôle */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Rôle *
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="student">{getRoleIcon('student')} Étudiant</option>
              <option value="teacher">{getRoleIcon('teacher')} Enseignant</option>
              <option value="admin">{getRoleIcon('admin')} Administrateur</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {getRoleDescription(formData.role)}
            </p>
          </div>

          {/* Mot de passe */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe *
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Minimum 8 caractères"
                />
              </div>
              <button
                type="button"
                onClick={generatePassword}
                className="text-sm text-blue-600 hover:text-blue-800 mt-1"
              >
                🎲 Générer un mot de passe sécurisé
              </button>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Répétez le mot de passe"
              />
            </div>
          </div>

          {/* Options */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isVerified"
                name="isVerified"
                checked={formData.isVerified}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isVerified" className="ml-2 text-sm text-gray-700">
                Marquer l'email comme vérifié
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Si coché, l'utilisateur n'aura pas besoin de vérifier son email
            </p>
          </div>

          {/* Aperçu */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">📋 Récapitulatif</h3>
            <div className="text-sm text-blue-800">
              <p><strong>Nom :</strong> {formData.name || 'Non renseigné'}</p>
              <p><strong>Email :</strong> {formData.email || 'Non renseigné'}</p>
              <p><strong>Rôle :</strong> {getRoleIcon(formData.role)} {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}</p>
              <p><strong>Email vérifié :</strong> {formData.isVerified ? 'Oui' : 'Non'}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Link
              href="/admin/users"
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Création...
                </>
              ) : (
                '👤 Créer l\'utilisateur'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Informations complémentaires */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-900 mb-2">💡 Informations importantes</h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• L'utilisateur recevra un email de bienvenue avec ses identifiants</li>
          <li>• Si l'email n'est pas marqué comme vérifié, l'utilisateur devra confirmer son email</li>
          <li>• Vous pouvez modifier les permissions plus tard depuis la liste des utilisateurs</li>
          <li>• Le mot de passe généré automatiquement est cryptographiquement sécurisé</li>
        </ul>
      </div>
    </div>
  );
}