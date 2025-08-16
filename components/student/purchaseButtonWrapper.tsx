// components/courses/PurchaseButtonWrapper.tsx
'use client';

import { useState, useEffect } from 'react';
import { PurchaseButton } from './purchaseButton';

interface PurchaseButtonWrapperProps {
  courseId: number;
  price: number;
  title: string;
  initialPurchaseStatus?: boolean;
}

export function PurchaseButtonWrapper({ 
  courseId, 
  price, 
  title, 
  initialPurchaseStatus = false 
}: PurchaseButtonWrapperProps) {
  const [isPurchased, setIsPurchased] = useState(initialPurchaseStatus);
  const [checkingPurchase, setCheckingPurchase] = useState(false);

  useEffect(() => {
    // Si on n'a pas le statut initial, on vérifie
    if (!initialPurchaseStatus) {
      checkPurchaseStatus();
    }
  }, [courseId, initialPurchaseStatus]);

  const checkPurchaseStatus = async () => {
    setCheckingPurchase(true);
    try {
      const response = await fetch(`/api/account/courses/${courseId}/check-purchase`);
      const data = await response.json();
      setIsPurchased(data.purchased);
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'achat:', error);
    } finally {
      setCheckingPurchase(false);
    }
  };

  // Si le cours est déjà acheté, on affiche le badge
  if (isPurchased) {
    return (
      <div className="flex items-center justify-center py-2 px-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm font-medium">Cours acheté</span>
      </div>
    );
  }

  // Sinon, on affiche le bouton d'achat
  return (
    <PurchaseButton
      courseId={courseId}
      price={price}
      title={title}
      isPurchased={isPurchased}
      disabled={checkingPurchase}
      onPurchaseSuccess={() => setIsPurchased(true)}
    />
  );
}