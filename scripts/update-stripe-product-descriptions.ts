/**
 * Script to update Stripe product descriptions with bullet points
 * Run with: npx tsx scripts/update-stripe-product-descriptions.ts
 */

import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { PLAN_CONFIGS } from '../src/lib/subscription-utils';

// Load .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  console.error('❌ STRIPE_SECRET_KEY not found in .env file');
  process.exit(1);
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2024-12-18.acacia',
});

// Product IDs to update
const PRODUCTS = {
  STARTER: stripeKey.startsWith('sk_test_') ? 'prod_Tm4ZdFEkDzjaDu' : 'prod_TlzO4T1mBuhTsX',
  PRO: stripeKey.startsWith('sk_test_') ? 'prod_Tm4ZYjbWmcei7K' : 'prod_TlzOZVbtlpjdcS',
  BUSINESS: stripeKey.startsWith('sk_test_') ? 'prod_Tm4Zo8w4CKW58V' : 'prod_TlzO22HeJyoy61',
};

function formatDescription(features: string[]): string {
  return features.map(feature => `• ${feature}`).join('\n');
}

async function updateProductDescriptions() {
  const mode = stripeKey?.startsWith('sk_test_') ? 'TEST' : 'LIVE';
  console.log(`🚀 Updating Stripe ${mode} product descriptions with bullet points...\n`);

  try {
    // Update Starter product
    console.log('📝 Updating Starter product...');
    const starterDescription = formatDescription(PLAN_CONFIGS.STARTER.features);
    await stripe.products.update(PRODUCTS.STARTER, {
      description: starterDescription,
    });
    console.log('✅ Starter product updated\n');
    console.log('Description:');
    console.log(starterDescription);
    console.log('\n');

    // Update Pro product
    console.log('📝 Updating Pro product...');
    const proDescription = formatDescription(PLAN_CONFIGS.PRO.features);
    await stripe.products.update(PRODUCTS.PRO, {
      description: proDescription,
    });
    console.log('✅ Pro product updated\n');
    console.log('Description:');
    console.log(proDescription);
    console.log('\n');

    // Update Business product
    console.log('📝 Updating Business product...');
    const businessDescription = formatDescription(PLAN_CONFIGS.BUSINESS.features);
    await stripe.products.update(PRODUCTS.BUSINESS, {
      description: businessDescription,
    });
    console.log('✅ Business product updated\n');
    console.log('Description:');
    console.log(businessDescription);
    console.log('\n');

    console.log('🎉 All product descriptions updated successfully!');

  } catch (error) {
    console.error('❌ Error updating products:', error);
    process.exit(1);
  }
}

updateProductDescriptions();
