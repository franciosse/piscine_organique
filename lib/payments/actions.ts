'use server';

import { redirect } from 'next/navigation';
import { createCheckoutSession } from './stripe';

export const checkoutAction = async (formData: FormData) => {
  const priceId = formData.get('priceId') as string;
  if (!priceId) {
    throw new Error('Price ID manquant');
  }

  await createCheckoutSession({ team: null, priceId });
};

export const customerPortalAction = async () => {
    redirect('/pricing');

};
