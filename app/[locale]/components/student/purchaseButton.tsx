// components/courses/purchaseButton.tsx
'use client';

import { useState } from 'react';

interface PurchaseButtonProps {
  courseId: number;
  price: number;
  title: string;
  isPurchased: boolean;
  disabled?: boolean;
  onPurchaseSuccess?: () => void; // Nouvelle prop callback
}

export function PurchaseButton({ 
  courseId, 
  price, 
  title, 
  isPurchased, 
  disabled = false,
  onPurchaseSuccess // Nouvelle prop
}: PurchaseButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const formatPrice = (priceInCents: number) => {
    if (priceInCents === 0) return 'Gratuit';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(priceInCents / 100);
  };

  const handlePurchase = async () => {
    if (isLoading || disabled || isPurchased) return;

    setIsLoading(true);
    
    try {
      // Si le cours est gratuit, pas besoin de paiement
      if (price === 0) {
        const response = await fetch(`/api/courses/${courseId}/enroll`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // Appeler le callback de succès
          onPurchaseSuccess?.();
        } else {
          throw new Error('Erreur lors de l\'inscription');
        }
      } else {
        // Pour les cours payants, rediriger vers Stripe ou votre système de paiement
        const response = await fetch(`/api/courses/${courseId}/checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseId,
            price,
            title,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          
          // Rediriger vers Stripe Checkout ou votre système de paiement
          if (data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
          } else {
            // Si c'est un paiement immédiat (par exemple avec un solde)
            onPurchaseSuccess?.();
          }
        } else {
          throw new Error('Erreur lors de la création du checkout');
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'achat:', error);
      // Vous pouvez ajouter une notification d'erreur ici
      alert('Une erreur est survenue lors de l\'achat. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Si le cours est déjà acheté, ne pas afficher le bouton
  if (isPurchased) {
    return null;
  }

  return (
    <button
      onClick={handlePurchase}
      disabled={disabled || isLoading}
      className={`
        w-full py-2 px-4 rounded-lg font-medium transition-colors
        ${price === 0 
          ? 'bg-green-600 hover:bg-green-700 text-white' 
          : 'bg-blue-600 hover:bg-blue-700 text-white'
        }
        ${(disabled || isLoading) 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:shadow-md'
        }
      `}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Traitement...
        </span>
      ) : (
        <span className="flex items-center justify-center">
          {price === 0 ? (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              S'inscrire gratuitement
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293A1 1 0 005 16h1.5M7 13v4a2 2 0 002 2h4a2 2 0 002-2v-4m-6 0h6" />
              </svg>
              Acheter - {formatPrice(price)}
            </>
          )}
        </span>
      )}
    </button>
  );
}