// /components/auth/AutoLoginComponent.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, Book, Key, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface AutoLoginComponentProps {
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
  course?: any;
  user?: any;
  isNewAccount?: boolean;
  userEmail?: string;
  sessionId?: string;
  courseId: number;
}

export function AutoLoginComponent({
  status,
  message,
  course,
  user,
  isNewAccount = false,
  userEmail,
  sessionId,
  courseId
}: AutoLoginComponentProps) {
  const router = useRouter();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // ✅ Auto-refresh pour les statuts en attente - LIMITÉ
  useEffect(() => {
    if (status === 'pending' || status === 'processing') {
      // ✅ LIMITE : Maximum 10 tentatives (50 secondes)
      if (retryCount >= 10) {
        console.log('❌ Limite d\'auto-refresh atteinte');
        return;
      }

      const interval = setInterval(() => {
        console.log(`🔄 Auto-refresh ${retryCount + 1}/10 de la page...`);
        setRetryCount(prev => prev + 1);
        window.location.reload();
      }, 5000); // Refresh toutes les 5 secondes

      return () => clearInterval(interval);
    }
  }, [status, retryCount]); // ✅ Ajouter retryCount dans les deps

  // ✅ Connexion automatique côté client quand on a un utilisateur
  useEffect(() => {
    if (status === 'success' && user && !isLoggingIn) {
      performAutoLogin();
    }
  }, [status, user]);

  const performAutoLogin = async () => {
    if (!user) return;

    setIsLoggingIn(true);
    setLoginError('');

    try {
      console.log('🔐 Tentative de connexion automatique pour:', user.email);

      // ✅ Appeler une API pour créer la session côté client
      const response = await fetch('/api/auth/auto-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          sessionId: sessionId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Connexion automatique réussie');
        
        // Redirection automatique vers le cours après 2 secondes
        setTimeout(() => {
          console.log('🚀 Redirection vers le cours...');
          router.push(`/dashboard/courses/${courseId}`);
        }, 2000);
        
      } else {
        console.error('❌ Erreur connexion automatique:', data.error);
        setLoginError('Erreur de connexion automatique');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la connexion automatique:', error);
      setLoginError('Erreur réseau lors de la connexion');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    // Attendre un peu puis recharger
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleManualLogin = () => {
    const loginUrl = `/sign-in?callbackUrl=${encodeURIComponent(`/dashboard/courses/${courseId}`)}`;
    router.push(loginUrl);
  };

  if (status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-12 h-12 text-yellow-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-yellow-800 mb-2">
              Paiement en cours...
            </h3>
            <p className="text-yellow-700">{message}</p>
            <p className="text-sm text-yellow-600 mt-2">
              Cette page se mettra à jour automatiquement.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-blue-800 mb-2">
              Traitement en cours...
            </h3>
            <p className="text-blue-700">{message}</p>
            <p className="text-sm text-blue-600 mt-2">
              Votre paiement a été confirmé, nous préparons votre accès.
            </p>
            
            {retryCount > 2 && (
              <div className="mt-4">
                <Button 
                  onClick={handleRetry}
                  disabled={isRetrying}
                  variant="outline"
                  size="sm"
                >
                  {isRetrying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Actualisation...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Actualiser
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Erreur
            </h3>
            <p className="text-red-700">{message}</p>
            
            <div className="mt-6 space-y-3">
              <Button onClick={handleRetry} disabled={isRetrying}>
                {isRetrying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Actualisation...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Réessayer
                  </>
                )}
              </Button>
              
              <Button variant="outline" onClick={handleManualLogin}>
                Se connecter manuellement
              </Button>
              
              <Button variant="ghost" asChild>
                <Link href="/courses">
                  Retour aux cours
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Status = success
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Confirmation de paiement */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">
            🎉 Paiement réussi !
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-green-700">
            Votre achat du cours <strong>"{course?.title}"</strong> a été confirmé.
          </p>
          
          {isLoggingIn ? (
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Connexion en cours...</span>
            </div>
          ) : loginError ? (
            <p className="text-red-600 text-sm">{loginError}</p>
          ) : (
            <p className="text-green-600">
              ✅ Connexion automatique en cours...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Informations compte */}
      {isNewAccount ? (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Key className="w-5 h-5" />
              🆕 Compte créé automatiquement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">
                  📧 Vérifiez votre email
                </p>
                <p className="text-sm text-blue-700">
                  Un compte a été créé automatiquement pour <strong>{userEmail}</strong>.
                  Vous recevrez un email avec vos informations de connexion.
                </p>
              </div>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>📝 Important :</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Vérifiez votre boîte email (et spam)</li>
                <li>• Changez votre mot de passe lors de votre prochaine connexion</li>
                <li>• Vous serez connecté automatiquement</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p>
                ✅ Connexion en tant que <strong>{userEmail}</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-3">
            <Book className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium">🚀 Accédez à votre cours</p>
              <p className="text-sm text-gray-600">
                {isLoggingIn 
                  ? "Redirection automatique après connexion..." 
                  : loginError 
                    ? "Utilisez les boutons ci-dessous pour accéder à votre cours"
                    : "Redirection automatique dans quelques secondes..."
                }
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="flex-1">
              <Link href={`/dashboard/courses/${courseId}`}>
                📚 Commencer maintenant
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="flex-1">
              <Link href="/dashboard/courses">
                📖 Voir tous mes cours
              </Link>
            </Button>
          </div>
          
          {loginError && (
            <div className="mt-4">
              <Button 
                onClick={handleManualLogin}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Se connecter manuellement
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Support */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-gray-600">
            Des questions ? Contactez notre support à{' '}
            <a href="mailto:support@piscineorganique.com" className="text-blue-600 hover:underline">
              support@piscineorganique.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}