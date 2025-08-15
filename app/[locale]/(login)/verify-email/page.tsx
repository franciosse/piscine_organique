// /app/verify-email/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type VerificationState = 'loading' | 'success' | 'error' | 'missing-token';

export default function VerifyEmailPage() {
  const [state, setState] = useState<VerificationState>('loading');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setState('missing-token');
      setMessage('Token de vérification manquant dans l\'URL.');
      return;
    }

    // Vérifier le token via l'API
    verifyEmail(token);
  }, [token]);

  // Redirection automatique après succès
  useEffect(() => {
    if (state === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (state === 'success' && countdown === 0) {
      router.push('/dashboard');
    }
  }, [state, countdown, router]);

  const verifyEmail = async (token: string) => {
    try {
      setState('loading');
      
      const response = await fetch(`/api/verify-email?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setState('success');
        setMessage('Votre adresse email a été vérifiée avec succès !');
      } else {
        setState('error');
        setMessage(data.error || 'Erreur lors de la vérification.');
      }
    } catch (error) {
      setState('error');
      setMessage('Une erreur inattendue s\'est produite.');
      console.error('Erreur vérification email:', error);
    }
  };

  const resendVerificationEmail = async () => {
    try {
      // Optionnel : ajouter une API pour renvoyer l'email
      const response = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        setMessage('Email de vérification renvoyé !');
      }
    } catch (error) {
      console.error('Erreur renvoi email:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card principale */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          
          {/* Loading State */}
          {state === 'loading' && (
            <>
              <div className="animate-spin mx-auto mb-6 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Vérification en cours...
              </h1>
              <p className="text-gray-600">
                Nous vérifions votre adresse email, veuillez patienter.
              </p>
            </>
          )}

          {/* Success State */}
          {state === 'success' && (
            <>
              <div className="mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                🎉 Email vérifié !
              </h1>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 text-sm">
                  Redirection automatique vers votre tableau de bord dans {countdown} seconde{countdown > 1 ? 's' : ''}...
                </p>
              </div>
              <div className="space-y-3">
                <Link 
                  href="/dashboard"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 inline-block"
                >
                  Accéder au tableau de bord
                </Link>
                <Link 
                  href="/"
                  className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 px-4 transition-colors duration-200 inline-block"
                >
                  Retour à l'accueil
                </Link>
              </div>
            </>
          )}

          {/* Error State */}
          {state === 'error' && (
            <>
              <div className="mx-auto mb-6 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                ❌ Vérification échouée
              </h1>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">
                  Le lien de vérification peut être expiré ou invalide.
                </p>
              </div>
              <div className="space-y-3">
                <button 
                  onClick={resendVerificationEmail}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  Renvoyer l'email de vérification
                </button>
                <Link 
                  href="/signup"
                  className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 px-4 transition-colors duration-200 inline-block"
                >
                  Créer un nouveau compte
                </Link>
                <Link 
                  href="/login"
                  className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 px-4 transition-colors duration-200 inline-block"
                >
                  Se connecter
                </Link>
              </div>
            </>
          )}

          {/* Missing Token State */}
          {state === 'missing-token' && (
            <>
              <div className="mx-auto mb-6 w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                ⚠️ Lien invalide
              </h1>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 text-sm">
                  Vérifiez que vous avez cliqué sur le bon lien dans votre email.
                </p>
              </div>
              <div className="space-y-3">
                <Link 
                  href="/signup"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 inline-block"
                >
                  Créer un compte
                </Link>
                <Link 
                  href="/login"
                  className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 px-4 transition-colors duration-200 inline-block"
                >
                  Se connecter
                </Link>
              </div>
            </>
          )}

        </div>

        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Besoin d'aide ? Contactez-nous à{' '}
            <a href="mailto:contact@piscineorganique.com" className="text-blue-600 hover:text-blue-700">
              contact@piscineorganique.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}