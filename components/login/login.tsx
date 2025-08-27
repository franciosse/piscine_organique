'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleIcon, Loader2, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import logger from '@/lib/logger/logger';
import { isValidRedirectUrl } from '@/lib/security/redirect';

// Hook pour détecter comportement humain
function useHumanBehavior(mode : string) {
  const [interactions, setInteractions] = useState({
    mouseMovements: 0,
    keystrokes: 0,
    focusEvents: 0,
    startTime: Date.now(),
  });

  const trackMouseMove = () => {
    setInteractions(prev => ({ ...prev, mouseMovements: prev.mouseMovements + 1 }));
  };

  const trackKeystroke = () => {
    setInteractions(prev => ({ ...prev, keystrokes: prev.keystrokes + 1 }));
  };

  const trackFocus = () => {
    setInteractions(prev => ({ ...prev, focusEvents: prev.focusEvents + 1 }));
  };

  const isLikelyHuman = () => {
    const timeSinceStart = Date.now() - interactions.startTime;
    
    if (mode === 'signin') {
      // Plus permissif pour signin (les utilisateurs peuvent se connecter rapidement)
      return (
        timeSinceStart > 3000 && // Au moins 3 secondes
        interactions.keystrokes > 4 &&
        interactions.focusEvents > 1
      );
    } else {
      // Plus strict pour signup
      return (
        timeSinceStart > 10000 && // Au moins 10 secondes
        interactions.mouseMovements > 5 &&
        interactions.keystrokes > 8 &&
        interactions.focusEvents > 2
      );
    }
  };

  return { trackMouseMove, trackKeystroke, trackFocus, isLikelyHuman, interactions };
}

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || 
                  searchParams.get('callbackUrl') || 
                  searchParams.get('callback') || ''; 
  const priceId = searchParams.get('priceId') || '';
  const inviteId = searchParams.get('inviteId') || '';
  const router = useRouter();

  // États formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [pending, setPending] = useState(false);

  // Sécurité
  const { trackMouseMove, trackKeystroke, trackFocus, isLikelyHuman, interactions } = useHumanBehavior(mode);
  const pageLoadTime = useRef(Date.now());
  const submitAttempts = useRef(0);

  // Countdown pour retry
  useEffect(() => {
    if (retryAfter && retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter(prev => {
          if (prev && prev > 1) {
            return prev - 1;
          } else {
            setError(''); // Clear error when countdown ends
            return null;
          }
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [retryAfter]);

  // Validation côté client
  const validateForm = () => {
    const errors: string[] = [];
    
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Email invalide');
    }
    
    if (!password || password.length < 8) {
      errors.push('Mot de passe requis (min 8 caractères)');
    }
    
    // Pour signup, vérifier comportement humain
    if (mode === 'signup' && !isLikelyHuman()) {
      errors.push('Veuillez prendre le temps de remplir le formulaire');
    }
    
    return errors;
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    // Limite tentatives côté client
    submitAttempts.current++;
    if (submitAttempts.current > 5) {
      setError('Trop de tentatives. Veuillez actualiser la page.');
      return;
    }

    // Validation client
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }

    setError('');
    setRetryAfter(null);
    setPending(true);

    const callbackUrl = searchParams.get('callbackUrl') || 
                     searchParams.get('redirect') || 
                     searchParams.get('callback') || '';

    // Préparer les données avec métadonnées de sécurité
    const body: any = { 
      email: email.toLowerCase().trim(), 
      password,
      callbackUrl,
      redirect,
      // Métadonnées de sécurité
      timestamp: pageLoadTime.current,
      userAgent: navigator.userAgent,
      timeOnPage: Date.now() - pageLoadTime.current,
    };
    
    if (inviteId) body.inviteId = inviteId;
    if (redirect) body.redirect = redirect;
    if (priceId) body.priceId = priceId;

    try {
      const endpoint = mode === 'signin' ? '/api/auth/signin' : '/api/auth/signup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const json = await res.json();

      if (!res.ok) {
        // Gestion des erreurs spécifiques
        if (res.status === 429) {
          // Rate limiting
          setError(json.error || 'Trop de tentatives. Veuillez patienter.');
          if (json.retryAfter) {
            setRetryAfter(json.retryAfter);
          }
        } else if (res.status === 423) {
          // Account locked
          setError(json.error || 'Compte temporairement verrouillé.');
          if (json.retryAfter) {
            setRetryAfter(json.retryAfter);
          }
        } else if (res.status === 403) {
          // Blocked
          setError('Accès refusé. Contactez le support si le problème persiste.');
        } else {
          setError(json.error || 'Une erreur est survenue');
        }
      } else {
        // ✅ Connexion réussie
        submitAttempts.current = 0;
        
        if (mode === 'signup') {
          // Inscription réussie
          alert('Compte créé avec succès ! Un email de vérification a été envoyé.');
          const signinUrl = callbackUrl 
            ? `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`
            : '/sign-in';
          router.push(signinUrl);
        } else {
          // ✅ Connexion réussie - Redirection IMMÉDIATE sans mutate
          logger.info('✅ Connexion réussie côté client');
          
          let redirectUrl = json.redirect || callbackUrl || '/dashboard';
          
          if (redirectUrl && redirectUrl.includes('%')) {
            redirectUrl = decodeURIComponent(redirectUrl);
          }
          
          logger.info('🚀 Redirection immédiate vers:', redirectUrl);
          
          // ❌ PAS de mutate - cause des problèmes
          // await mutate('/api/account/user');
          
          // ✅ Redirection directe avec un petit délai pour laisser le serveur traiter
          setTimeout(() => {
            if (isValidRedirectUrl(redirectUrl)) {
              router.push(redirectUrl);
            } else {
              console.warn('URL de redirection non autorisée:', redirectUrl);
              router.push('/dashboard');
            }
          }, 100);
        }
      }
    } catch (e) {
      logger.error('Network error:'+ e);
      setError('Erreur de connexion. Vérifiez votre connexion internet.');
    } finally {
      setPending(false);
    }
  }

  const isFormValid = () => {
    const basicValid = email.trim() && password.length >= 8;
    if (mode === 'signup') {
      return basicValid && isLikelyHuman();
    }
    return basicValid;
  };

  return (
    <div 
      className="min-h-[100dvh] flex flex-col justify-top py-12 px-4 sm:px-6 lg:px-8 bg-gray-50"
      onMouseMove={trackMouseMove}
    >      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <CircleIcon className="h-12 w-12 text-green-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {mode === 'signin' ? 'Connexion' : 'Créer un compte'}
        </h2>
        
        {/* Indicateur de sécurité */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">
            <Shield className="w-3 h-3 mr-1" />
            Connexion sécurisée
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <input type="hidden" name="redirect" value={redirect} />
          <input type="hidden" name="callbackUrl" value={redirect} />
          <input type="hidden" name="priceId" value={priceId} />
          <input type="hidden" name="inviteId" value={inviteId} />

          {/* Email */}
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </Label>
            <div className="mt-1">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  trackKeystroke();
                }}
                onFocus={trackFocus}
                required
                maxLength={100}
                placeholder="votre@email.com"
                className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mot de passe
            </Label>
            <div className="mt-1 relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  trackKeystroke();
                }}
                onFocus={trackFocus}
                required
                minLength={8}
                maxLength={100}
                placeholder="••••••••"
                className="appearance-none rounded-full relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Indicateur de comportement humain pour signup */}
          {mode === 'signup' && (
            <div className="text-xs text-gray-500">
              <div className="flex items-center justify-between">
                <span>Détection humaine:</span>
                <span className={`font-medium ${isLikelyHuman() ? 'text-green-600' : 'text-gray-400'}`}>
                  {isLikelyHuman() ? '✓ Validée' : 'En cours...'}
                </span>
              </div>
              {!isLikelyHuman() && (
                <p className="text-yellow-600 text-xs mt-1">
                  ⏳ Prenez le temps de remplir le formulaire (sécurité anti-bot)
                </p>
              )}
            </div>
          )}

          {/* Messages d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-red-700 text-sm">{error}</p>
                  {retryAfter && retryAfter > 0 && (
                    <p className="text-red-600 text-xs mt-1">
                      Réessayez dans {retryAfter} seconde{retryAfter > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <Button
              type="submit"
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={pending || !isFormValid() || (retryAfter !== null && retryAfter > 0)}
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  {mode === 'signin' ? 'Connexion...' : 'Création...'}
                </>
              ) : mode === 'signin' ? (
                'Se connecter'
              ) : (
                'Créer mon compte'
              )}
            </Button>
          </div>

          {/* Forgot Password pour signin */}
          {mode === 'signin' && (
            <div className="mt-4 text-right">
              <Link
                href="/password-reset"
                className="text-sm text-green-600 hover:text-green-800 font-medium"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          )}
        </form>

        {/* Toggle between signin/signup */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                {mode === 'signin' ? 'Nouveau sur notre plateforme ?' : 'Vous avez déjà un compte ?'}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href={
                mode === 'signin' 
                  ? `/sign-up${redirect ? `?callbackUrl=${encodeURIComponent(redirect)}` : ''}${priceId ? `&priceId=${priceId}` : ''}`
                  : `/sign-in${redirect ? `?callbackUrl=${encodeURIComponent(redirect)}` : ''}${priceId ? `&priceId=${priceId}` : ''}`
              }
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {mode === 'signin' ? 'Créer un compte' : 'Se connecter'}
            </Link>
          </div>
        </div>

        {/* Debug info en développement */}
        {process.env.NODE_ENV === 'development' && mode === 'signup' && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
            <div>Mouvements souris: {interactions.mouseMovements}</div>
            <div>Touches: {interactions.keystrokes}</div>
            <div>Focus: {interactions.focusEvents}</div>
            <div>Temps: {Math.round((Date.now() - interactions.startTime) / 1000)}s</div>
          </div>
        )}
      </div>
    </div>
  );
}