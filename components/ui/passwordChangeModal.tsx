// components/ui/PasswordChangeModal.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Loader2, 
  Save, 
  Edit3,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';

interface PasswordChangeModalProps {
  onPasswordChanged: () => void;
}

export function PasswordChangeModal({ onPasswordChanged }: PasswordChangeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [state, setState] = useState<{ error?: string; success?: string }>({});

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setState({});

    const formData = new FormData(event.currentTarget);
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validation côté client
    if (newPassword !== confirmPassword) {
      setState({ error: 'Les mots de passe ne correspondent pas' });
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setState({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setState({ error: data.error || 'Erreur lors du changement de mot de passe' });
      } else {
        setState({ success: 'Mot de passe modifié avec succès' });
        setTimeout(() => {
          setIsOpen(false);
          setState({});
          onPasswordChanged();
          (event.target as HTMLFormElement).reset();
        }, 2000);
      }
    } catch (error) {
      setState({ error: 'Une erreur inattendue s\'est produite' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setState({});
    setShowPasswords({ current: false, new: false, confirm: false });
  };

  return (
    <>
      {/* Bouton pour ouvrir la modal */}
      <Button 
        variant="outline" 
        size="sm" 
        className="border-green-200 text-green-700 hover:bg-green-100"
        onClick={() => setIsOpen(true)}
      >
        <Edit3 className="h-4 w-4 mr-2" />
        Modifier
      </Button>

      {/* Modal overlay et contenu */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          
          {/* Modal content */}
          <div className="relative z-10 w-full max-w-md mx-4">
            <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Lock className="h-5 w-5 text-green-600" />
                    Changer le mot de passe
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-gray-200 hover:bg-gray-100"
                    onClick={handleClose}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Mot de passe actuel */}
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                      Mot de passe actuel
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        placeholder="Entrez votre mot de passe actuel"
                        required
                        className="pr-10 h-11 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-xl"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        onClick={() => togglePasswordVisibility('current')}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Nouveau mot de passe */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                      Nouveau mot de passe
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        placeholder="Entrez un nouveau mot de passe"
                        required
                        className="pr-10 h-11 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-xl"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        onClick={() => togglePasswordVisibility('new')}
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Le mot de passe doit contenir au moins 8 caractères
                    </p>
                  </div>

                  {/* Confirmer le mot de passe */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Confirmer le mot de passe
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        placeholder="Confirmez votre nouveau mot de passe"
                        required
                        className="pr-10 h-11 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-xl"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Messages d'état */}
                  {state.error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-red-700 text-sm">{state.error}</p>
                    </div>
                  )}

                  {state.success && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-green-700 text-sm">{state.success}</p>
                    </div>
                  )}

                  {/* Boutons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 rounded-xl h-11 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Modification...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Modifier
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isLoading}
                      className="border-2 border-gray-200 hover:border-gray-300 rounded-xl h-11 px-6 font-semibold bg-white hover:bg-gray-50 transition-all duration-300"
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}