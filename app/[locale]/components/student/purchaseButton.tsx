// components/courses/PurchaseButton.tsx
'use client';

import { useState } from 'react';
import { purchaseCourseAction } from '@/lib/payments/actions';

interface PurchaseButtonProps {
  courseId: number;
  price: number;
  title: string;
  isPurchased?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PurchaseButton({ 
  courseId, 
  price, 
  title, 
  isPurchased = false, 
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = ''
}: PurchaseButtonProps) {
  const [loading, setLoading] = useState(false);

  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(priceInCents / 100);
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600';
      case 'secondary':
        return 'bg-gray-600 text-white hover:bg-gray-700 border-gray-600';
      case 'outline':
        return 'bg-white text-blue-600 hover:bg-blue-50 border-blue-600 border';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'py-2 px-4 text-sm';
      case 'md':
        return 'py-3 px-6 text-base';
      case 'lg':
        return 'py-4 px-8 text-lg';
      default:
        return 'py-3 px-6 text-base';
    }
  };

  const handlePurchase = async () => {
    if (isPurchased || disabled) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('courseId', courseId.toString());
      
      await purchaseCourseAction(formData);
    } catch (error) {
      console.error('Erreur lors de l\'achat:', error);
      
      // Afficher l'erreur à l'utilisateur
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Une erreur est survenue lors de l\'achat');
      }
    } finally {
      setLoading(false);
    }
  };

  // Bouton pour cours déjà acheté
  if (isPurchased) {
    return (
      <button
        disabled
        className={`w-full bg-green-100 text-green-800 font-medium rounded-lg cursor-not-allowed ${getSizeClasses()} ${className}`}
      >
        <div className="flex items-center justify-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Cours acheté
        </div>
      </button>
    );
  }

  // Bouton pour cours gratuit
  if (price === 0) {
    return (
      <button
        onClick={handlePurchase}
        disabled={loading || disabled}
        className={`w-full font-medium rounded-lg transition-colors disabled:opacity-50 ${getVariantClasses()} ${getSizeClasses()} ${className}`}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
            Inscription...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            S'inscrire gratuitement
          </div>
        )}
      </button>
    );
  }

  // Bouton d'achat standard
  return (
    <button
      onClick={handlePurchase}
      disabled={loading || disabled}
      className={`w-full font-medium rounded-lg transition-colors disabled:opacity-50 ${getVariantClasses()} ${getSizeClasses()} ${className}`}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          <span>Redirection...</span>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
          </svg>
          Acheter pour {formatPrice(price)}
        </div>
      )}
    </button>
  );
}

// Composant pour afficher un récapitulatif d'achat
export function PurchaseSummary({ 
  courseId, 
  price, 
  title, 
  description
}: {
  courseId: number;
  price: number;
  title: string;
  description?: string;
}) {
  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(priceInCents / 100);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Récapitulatif de l'achat
      </h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-900">{title}</h4>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Prix du cours</span>
            <span className="font-medium text-gray-900">
              {price === 0 ? 'Gratuit' : formatPrice(price)}
            </span>
          </div>
          
          <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
            <span>TVA incluse</span>
            <span>—</span>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total</span>
            <span className="text-blue-600">
              {price === 0 ? 'Gratuit' : formatPrice(price)}
            </span>
          </div>
        </div>
        
        <div className="pt-4">
          <PurchaseButton
            courseId={courseId}
            price={price}
            title={title}
            size="lg"
          />
        </div>
        
        {price > 0 && (
          <div className="text-xs text-gray-500 text-center">
            <p>Paiement sécurisé par Stripe</p>
            <p className="mt-1">Accès immédiat après l'achat</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook pour gérer l'état d'achat global
export function usePurchaseState() {
  const [purchasedCourses, setPurchasedCourses] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const checkPurchaseStatus = async (courseId: number) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/check-purchase`);
      const data = await response.json();
      
      if (data.purchased) {
        setPurchasedCourses(prev => new Set([...prev, courseId]));
      }
      
      return data.purchased;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'achat:', error);
      return false;
    }
  };

  const isPurchased = (courseId: number) => {
    return purchasedCourses.has(courseId);
  };

  const markAsPurchased = (courseId: number) => {
    setPurchasedCourses(prev => new Set([...prev, courseId]));
  };

  return {
    isPurchased,
    markAsPurchased,
    checkPurchaseStatus,
    loading,
  };
}