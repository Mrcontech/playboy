export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price?: number;
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'prod_SmYk0g5nGhw0Ol',
    priceId: 'price_1Rqzcr2LosMyIeah0OeDIzvA',
    name: 'Playboi Pro',
    description: 'Full Access to the Playboi Platform',
    mode: 'subscription',
    price: 0.99
  }
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
};

export const getProductById = (id: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.id === id);
};