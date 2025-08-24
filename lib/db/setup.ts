import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { promisify } from 'node:util';
import readline from 'node:readline';
import crypto from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import logger from '@/lib/logger/logger';


const execAsync = promisify(exec);

function question(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

async function checkStripeCLI() {
  logger.info(
    'Step 1: Checking if Stripe CLI is installed and authenticated...'
  );
  try {
    await execAsync('stripe --version');
    logger.info('Stripe CLI is installed.');

    // Check if Stripe CLI is authenticated
    try {
      await execAsync('stripe config --list');
      logger.info('Stripe CLI is authenticated.');
    } catch (error) {
      logger.info(
        'Stripe CLI is not authenticated or the authentication has expired.'
      );
      logger.info('Please run: stripe login');
      const answer = await question(
        'Have you completed the authentication? (y/n): '
      );
      if (answer.toLowerCase() !== 'y') {
        logger.info(
          'Please authenticate with Stripe CLI and run this script again.'
        );
        process.exit(1);
      }

      // Verify authentication after user confirms login
      try {
        await execAsync('stripe config --list');
        logger.info('Stripe CLI authentication confirmed.');
      } catch (error) {
        logger.error(
          'Failed to verify Stripe CLI authentication. Please try again.'
        );
        process.exit(1);
      }
    }
  } catch (error) {
    logger.error(
      'Stripe CLI is not installed. Please install it and try again.'
    );
    logger.info('To install Stripe CLI, follow these steps:');
    logger.info('1. Visit: https://docs.stripe.com/stripe-cli');
    logger.info(
      '2. Download and install the Stripe CLI for your operating system'
    );
    logger.info('3. After installation, run: stripe login');
    logger.info(
      'After installation and authentication, please run this setup script again.'
    );
    process.exit(1);
  }
}

async function getPostgresURL(): Promise<string> {
  logger.info('Step 2: Setting up Postgres');
  const dbChoice = await question(
    'Do you want to use a local Postgres instance with Docker (L) or a remote Postgres instance (R)? (L/R): '
  );

  if (dbChoice.toLowerCase() === 'l') {
    logger.info('Setting up local Postgres instance with Docker...');
    await setupLocalPostgres();
    return 'postgres://postgres:postgres@localhost:54322/postgres';
  } else {
    logger.info(
      'You can find Postgres databases at: https://vercel.com/marketplace?category=databases'
    );
    return await question('Enter your POSTGRES_URL: ');
  }
}

async function setupLocalPostgres() {
  logger.info('Checking if Docker is installed...');
  try {
    await execAsync('docker --version');
    logger.info('Docker is installed.');
  } catch (error) {
    logger.error(
      'Docker is not installed. Please install Docker and try again.'
    );
    logger.info(
      'To install Docker, visit: https://docs.docker.com/get-docker/'
    );
    process.exit(1);
  }

  logger.info('Creating docker-compose.yml file...');
  const dockerComposeContent = `
services:
  postgres:
    image: postgres:16.4-alpine
    container_name: next_saas_starter_postgres
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "54322:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
`;

  await fs.writeFile(
    path.join(process.cwd(), 'docker-compose.yml'),
    dockerComposeContent
  );
  logger.info('docker-compose.yml file created.');

  logger.info('Starting Docker container with `docker compose up -d`...');
  try {
    await execAsync('docker compose up -d');
    logger.info('Docker container started successfully.');
  } catch (error) {
    logger.error(
      'Failed to start Docker container. Please check your Docker installation and try again.'
    );
    process.exit(1);
  }
}

async function getStripeSecretKey(): Promise<string> {
  logger.info('Step 3: Getting Stripe Secret Key');
  logger.info(
    'You can find your Stripe Secret Key at: https://dashboard.stripe.com/test/apikeys'
  );
  return await question('Enter your Stripe Secret Key: ');
}

async function createStripeWebhook(): Promise<string> {
  logger.info('Step 4: Creating Stripe webhook...');
  try {
    const { stdout } = await execAsync('stripe listen --print-secret');
    const match = stdout.match(/whsec_[a-zA-Z0-9]+/);
    if (!match) {
      throw new Error('Failed to extract Stripe webhook secret');
    }
    logger.info('Stripe webhook created.');
    return match[0];
  } catch (error) {
    logger.error(
      'Failed to create Stripe webhook. Check your Stripe CLI installation and permissions.'
    );
    if (os.platform() === 'win32') {
      logger.info(
        'Note: On Windows, you may need to run this script as an administrator.'
      );
    }
    throw error;
  }
}

function generateAuthSecret(): string {
  logger.info('Step 5: Generating AUTH_SECRET...');
  return crypto.randomBytes(32).toString('hex');
}

async function writeEnvFile(envVars: Record<string, string>) {
  logger.info('Step 6: Writing environment variables to .env');
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  await fs.writeFile(path.join(process.cwd(), '.env'), envContent);
  logger.info('.env file created with the necessary variables.');
}

async function main() {
  await checkStripeCLI();

  const POSTGRES_URL = await getPostgresURL();
  const STRIPE_SECRET_KEY = await getStripeSecretKey();
  const STRIPE_WEBHOOK_SECRET = await createStripeWebhook();
  const BASE_URL = 'http://localhost:3000';
  const AUTH_SECRET = generateAuthSecret();

  await writeEnvFile({
    POSTGRES_URL,
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
    BASE_URL,
    AUTH_SECRET,
  });

  logger.info('🎉 Setup completed successfully!');
}

main().catch(console.error);
