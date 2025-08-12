'use server';

import { redirect } from 'next/navigation';
import { createCheckoutSession } from './stripe';
import { getUser } from '@/lib/db/queries';

export const purchaseCourseAction = async (formData: FormData) => {
  const courseId = formData.get('courseId') as string;
  
  if (!courseId) {
    throw new Error('Course ID manquant');
  }

  const user = await getUser();
  if (!user) {
    redirect(`/sign-in?redirect=/courses/${courseId}`);
  }

  await createCheckoutSession({ courseId: parseInt(courseId), userId: user.id });
};

export const checkoutAction = async (formData: FormData) => {
  const priceId = formData.get('priceId') as string;
  const courseId = formData.get('courseId') as string;
  
  if (!priceId || !courseId) {
    throw new Error('Price ID ou Course ID manquant');
  }

  const user = await getUser();
  if (!user) {
    redirect(`/sign-in?redirect=/courses/${courseId}`);
  }

  await createCheckoutSession({ 
    courseId: parseInt(courseId), 
    userId: user.id,
    priceId 
  });
};