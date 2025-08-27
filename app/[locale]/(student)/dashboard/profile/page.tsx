// app/dashboard/profile/page.tsx
'use client';

import React, { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Loader2, 
  User, 
  Save, 
  Edit3,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  AccountFormSkeleton,
  AccountFormWithData,
  ProfileHeader,
  SecurityCard,
  StatsCard
} from '@/components/profile/profileComponents';

type ActionState = {
  name?: string;
  error?: string;
  success?: string;
};

export default function ProfilePage() {
  const [state, setState] = useState<ActionState>({});
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setState({});

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
    };

    try {
      const res = await fetch('/api/account/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setState({ error: json.error || 'Impossible de mettre à jour le profil' });
      } else {
        setState({ 
          success: json.success || 'Profil mis à jour avec succès', 
          name: payload.name as string 
        });
      }
    } catch {
      setState({ error: 'Une erreur inattendue s\'est produite.' });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="min-h-full overflow-y-auto">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Mon profil</h1>
          <p className="text-gray-600">
            Gérez vos informations personnelles et paramètres de compte
          </p>
        </div>

        {/* Profile Header Card */}
        <ProfileHeader />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-b-0 pb-8 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
                        Informations personnelles
                      </CardTitle>
                      <CardDescription className="text-green-600 font-medium mt-1">
                        Mettez à jour vos informations de profil et adresse email
                      </CardDescription>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-white/60 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/50">
                    <Edit3 className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400"></div>
              </CardHeader>
              
              <CardContent className="p-8 bg-white/50">
                <form className="space-y-8" onSubmit={handleSubmit}>
                  <Suspense fallback={<AccountFormSkeleton />}>
                    <AccountFormWithData state={state} />
                  </Suspense>

                  {/* Messages d'état */}
                  {state.error && (
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 border-0 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-red-100 rounded-xl">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-red-800 mb-1">Une erreur s&apos;est produite</h4>
                          <p className="text-red-700">{state.error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {state.success && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-0 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-green-100 rounded-xl">
                          <Check className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-green-800 mb-1">Modifications enregistrées</h4>
                          <p className="text-green-700">{state.success}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Boutons d'action */}
                  <div className="flex gap-4 pt-6">
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 rounded-xl px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-5 w-5" />
                          Enregistrer les modifications
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline"
                      className="border-2 border-gray-200 hover:border-gray-300 rounded-xl px-8 py-3 font-semibold bg-white/80 backdrop-blur-sm hover:bg-gray-50 transition-all duration-300"
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <SecurityCard />
            <StatsCard />
          </div>
        </div>
      </div>
    </div>
  );
}