import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import { users } from './schema';
import { hashPassword } from '@/lib/auth/session';
import logger from '@/lib/logger/logger';


async function createStripeProducts() {
  logger.info('Creating Stripe products and prices...');

  const baseProduct = await stripe.products.create({
    name: 'Base',
    description: 'Base subscription plan',
  });

  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800, // $8 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Plus subscription plan',
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // $12 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  logger.info('Stripe products and prices created successfully.');
}

async function seed() {
  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values([
      {
        email: email,
        passwordHash: passwordHash,
        role: "owner",
        isVerified: true, // Set to true for testing
      },
    ])
    .returning();

  logger.info('Initial user created.');


  await createStripeProducts();
}

seed()
  .catch((error) => {
    logger.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    logger.info('Seed process finished. Exiting...');
    process.exit(0);
  });
