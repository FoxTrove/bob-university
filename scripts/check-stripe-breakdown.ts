import Stripe from 'stripe';
import 'dotenv/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_LIVE || '', {
  apiVersion: '2024-12-18.acacia',
});

async function getSubscriptionBreakdown() {
  console.log('=== SUBSCRIPTION BREAKDOWN BY PRICE ===\n');

  // First get all prices with products
  const priceToProduct = new Map<string, { amount: number; productName: string; interval: string }>();
  let hasMorePrices = true;
  let priceStartingAfter: string | undefined;

  while (hasMorePrices) {
    const params: Stripe.PriceListParams = { limit: 100, expand: ['data.product'] };
    if (priceStartingAfter) params.starting_after = priceStartingAfter;

    const response = await stripe.prices.list(params);
    for (const price of response.data) {
      const product = price.product as Stripe.Product;
      priceToProduct.set(price.id, {
        amount: price.unit_amount || 0,
        productName: product?.name || 'Unknown',
        interval: price.recurring?.interval || 'one-time',
      });
    }

    hasMorePrices = response.has_more;
    if (response.data.length > 0) {
      priceStartingAfter = response.data[response.data.length - 1].id;
    }
  }

  // Now get subscription breakdown
  const priceBreakdown = new Map<string, {
    amount: number;
    productName: string;
    interval: string;
    count: number;
    active: number;
    canceled: number;
    other: number;
  }>();

  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const params: Stripe.SubscriptionListParams = {
      status: 'all',
      limit: 100,
    };
    if (startingAfter) params.starting_after = startingAfter;

    const response = await stripe.subscriptions.list(params);

    for (const sub of response.data) {
      const priceId = sub.items.data[0]?.price?.id;
      if (!priceId) continue;

      const priceInfo = priceToProduct.get(priceId) || { amount: 0, productName: 'Unknown', interval: 'month' };

      const existing = priceBreakdown.get(priceId) || {
        ...priceInfo,
        count: 0,
        active: 0,
        canceled: 0,
        other: 0
      };
      existing.count++;
      if (sub.status === 'active') existing.active++;
      else if (sub.status === 'canceled') existing.canceled++;
      else existing.other++;
      priceBreakdown.set(priceId, existing);
    }

    hasMore = response.has_more;
    if (response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id;
    }
  }

  const sorted = [...priceBreakdown.entries()].sort((a, b) => b[1].count - a[1].count);

  let totalSubs = 0;
  let totalActive = 0;
  let totalCanceled = 0;

  for (const [priceId, stats] of sorted) {
    console.log(`${stats.productName} @ $${(stats.amount / 100).toFixed(2)}/${stats.interval}`);
    console.log(`  Price ID: ${priceId}`);
    console.log(`  Total: ${stats.count} | Active: ${stats.active} | Canceled: ${stats.canceled}${stats.other > 0 ? ` | Other: ${stats.other}` : ''}`);
    console.log('');

    totalSubs += stats.count;
    totalActive += stats.active;
    totalCanceled += stats.canceled;
  }

  console.log('-'.repeat(60));
  console.log(`TOTALS: ${totalSubs} subscriptions | ${totalActive} active | ${totalCanceled} canceled`);
}

getSubscriptionBreakdown().catch(e => console.error('Error:', e.message));
