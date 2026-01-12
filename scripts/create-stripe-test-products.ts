/**
 * Script to create Stripe products and prices in TEST mode
 * Run with: npx tsx scripts/create-stripe-test-products.ts
 */

import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  console.error('❌ STRIPE_SECRET_KEY not found in .env file');
  process.exit(1);
}

if (!stripeKey.startsWith('sk_test_')) {
  console.error('❌ This script requires a TEST mode Stripe key (starts with sk_test_)');
  console.error('   Current key starts with:', stripeKey.substring(0, 8));
  process.exit(1);
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2024-12-18.acacia',
});

async function createTestProducts() {
  console.log('🚀 Creating Stripe TEST products and prices...\n');

  try {
    // Create Starter product
    const starterProduct = await stripe.products.create({
      name: 'Moderateur Bedones - Starter',
      description: '1,000 moderation credits/month, 100 FAQ credits/month, AI-powered spam detection',
    });
    console.log('✅ Created Starter product:', starterProduct.id);

    const starterPrice = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 900, // $9.00 USD
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    console.log('✅ Created Starter price:', starterPrice.id, '($9/month)\n');

    // Create Pro product
    const proProduct = await stripe.products.create({
      name: 'Moderateur Bedones - Pro',
      description: '5,000 moderation credits/month, 500 FAQ credits/month, Advanced AI moderation',
    });
    console.log('✅ Created Pro product:', proProduct.id);

    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 1500, // $15.00 USD
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    console.log('✅ Created Pro price:', proPrice.id, '($15/month)\n');

    // Create Business product
    const businessProduct = await stripe.products.create({
      name: 'Moderateur Bedones - Business',
      description: '20,000 moderation credits/month, 2,000 FAQ credits/month, Enterprise AI moderation',
    });
    console.log('✅ Created Business product:', businessProduct.id);

    const businessPrice = await stripe.prices.create({
      product: businessProduct.id,
      unit_amount: 2500, // $25.00 USD
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    console.log('✅ Created Business price:', businessPrice.id, '($25/month)\n');

    // Print environment variables to add to .env
    console.log('📋 Add these to your .env file:\n');
    console.log(`STRIPE_PRICE_STARTER=${starterPrice.id}`);
    console.log(`STRIPE_PRICE_PRO=${proPrice.id}`);
    console.log(`STRIPE_PRICE_BUSINESS=${businessPrice.id}`);

  } catch (error) {
    console.error('❌ Error creating products:', error);
    process.exit(1);
  }
}

createTestProducts();
