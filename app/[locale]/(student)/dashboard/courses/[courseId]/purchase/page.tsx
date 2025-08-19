// app/dashboard/courses/[courseId]/purchase/page.tsx
'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ArrowLeft,
  Check,
  Clock,
  Users,
  Star,
  CreditCard,
  Shield,
  Loader2,
  AlertCircle,
  BookOpen,
  Award,
  Download
} from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  duration: string;
  level: string;
  instructor: string;
  studentsCount: number;
  rating: number;
  reviewsCount: number;
  features: string[];
  imageUrl?: string;
  category: string;
}

interface PurchaseState {
  isLoading: boolean;
  error?: string;
  success?: boolean;
}

export default function CoursePurchasePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [purchaseState, setPurchaseState] = useState<PurchaseState>({
    isLoading: false
  });

  // Récupération des données du cours
  const { data: course, error } = useSWR<Course>(
    courseId ? `/api/courses/${courseId}` : null,
    fetcher
  );

  const handlePurchase = async () => {
    setPurchaseState({ isLoading: true });

    try {
      if (course === undefined) {
        setPurchaseState({
        isLoading: false,
        error: 'Erreur lors de la récupération du cours'
        });
        return;
      }
      // Déterminer quelle route utiliser selon le prix
      if (course.price <= 0) {
        // Cours gratuit - utiliser l'inscription directe
        const enrollResponse = await fetch(`/api/account/courses/${courseId}/enroll`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const enrollData = await enrollResponse.json();
        
        if (!enrollResponse.ok) {
          setPurchaseState({
            isLoading: false,
            error: enrollData.error || 'Erreur lors de l\'inscription'
          });
          return;
        }
        
        // Inscription gratuite réussie
        setPurchaseState({
          isLoading: false,
          success: true
        });

        // Redirection vers le cours après 2 secondes
        setTimeout(() => {
          router.push(`/dashboard/courses/${courseId}`);
        }, 2000);

      } else {
        // Cours payant - créer une session Stripe
        const response = await fetch(`/api/courses/${courseId}/purchase`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (!response.ok) {
          setPurchaseState({
            isLoading: false,
            error: data.error || 'Erreur lors de la création du paiement'
          });
          return;
        }

        // Rediriger vers Stripe Checkout
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          setPurchaseState({
            isLoading: false,
            error: 'URL de paiement non disponible'
          });
        }
      }

    } catch (error) {
      setPurchaseState({
        isLoading: false,
        error: 'Une erreur inattendue s\'est produite'
      });
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (error) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Cours introuvable
            </h2>
            <p className="text-gray-600 mb-4">
              Le cours que vous cherchez n'existe pas ou n'est plus disponible : {error}
            </p>
            <Button onClick={() => router.push('/dashboard/courses')}>
              Retour aux cours
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  const discount = course.originalPrice ? 
    Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100) : 0;

  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header avec bouton retour */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="mb-4 border-green-200 text-green-700 hover:bg-green-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Finaliser votre achat
            </h1>
            <p className="text-gray-600">
              Vous êtes sur le point d'acheter ce cours
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations du cours */}
          <div className="lg:col-span-2 space-y-6">
            {/* Aperçu du cours */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-start gap-4">
                  {course.imageUrl ? (
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="w-20 h-20 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-xl text-gray-900 mb-2">
                      {course.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {course.studentsCount} étudiants
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        {course.rating} ({course.reviewsCount} avis)
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      {course.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Ce que vous obtenez */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Award className="h-5 w-5" />
                  Ce que vous obtenez
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                  
                  {/* Fonctionnalités par défaut */}
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Accès à vie au contenu</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Certificat de completion</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Support communautaire</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Mises à jour gratuites</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sécurité */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="h-6 w-6 text-green-600" />
                  <h3 className="font-semibold text-green-800">Achat sécurisé</h3>
                </div>
                <p className="text-green-700 text-sm">
                  Vos informations de paiement sont protégées par un cryptage SSL de niveau bancaire. 
                  Garantie satisfait ou remboursé sous 30 jours.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Résumé de commande */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg sticky top-6">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="text-green-800">Résumé de commande</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                                  <div className="space-y-4">
                  {/* Prix */}
                  <div className="border-b border-gray-200 pb-4">
                    {course.price > 0 ? (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-600">Prix du cours</span>
                          <div className="text-right">
                            {course.originalPrice && (
                              <span className="text-gray-400 line-through text-sm block">
                                {course.originalPrice}€
                              </span>
                            )}
                            <span className="text-2xl font-bold text-gray-900">
                              {course.price}€
                            </span>
                          </div>
                        </div>
                        
                        {discount > 0 && (
                          <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-medium">
                            🎉 Économisez {discount}% !
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          GRATUIT
                        </div>
                        <p className="text-gray-600 text-sm">
                          Ce cours est entièrement gratuit !
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Détails */}
                  {course.price > 0 && (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">TVA (20%)</span>
                        <span className="text-gray-900">Incluse</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span className="text-gray-900">Total</span>
                        <span className="text-green-600 text-lg">{course.price}€</span>
                      </div>
                    </div>
                  )}

                  {/* Messages d'état */}
                  {purchaseState.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-red-700 text-sm">{purchaseState.error}</p>
                      </div>
                    </div>
                  )}

                  {purchaseState.success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-green-700 text-sm font-medium">Achat réussi !</p>
                          <p className="text-green-600 text-xs">Redirection vers le cours...</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bouton d'achat/inscription */}
                  <Button
                    onClick={handlePurchase}
                    disabled={purchaseState.isLoading || purchaseState.success}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 rounded-xl h-12 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {purchaseState.isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {course.price > 0 ? 'Traitement...' : 'Inscription...'}
                      </>
                    ) : purchaseState.success ? (
                      <>
                        <Check className="mr-2 h-5 w-5" />
                        {course.price > 0 ? 'Acheté !' : 'Inscrit !'}
                      </>
                    ) : (
                      <>
                        {course.price > 0 ? (
                          <>
                            <CreditCard className="mr-2 h-5 w-5" />
                            Acheter maintenant
                          </>
                        ) : (
                          <>
                            <BookOpen className="mr-2 h-5 w-5" />
                            S'inscrire gratuitement
                          </>
                        )}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    En achetant ce cours, vous acceptez nos{' '}
                    <a href="/terms" className="text-green-600 hover:underline">
                      conditions d'utilisation
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}