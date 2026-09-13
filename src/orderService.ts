import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';
import type { Order } from './types';

const functions = getFunctions(app, 'us-central1');

export interface CreateOrderInput {
  customerName: string;
  governorate: string;
  address: string;
  currency: 'YER' | 'SAR';
  paymentMethod: Order['paymentMethod'];
  items: Array<{
    productId: string;
    quantity: number;
    color?: string;
    size?: string;
  }>;
}

const createOrderCallable = httpsCallable<CreateOrderInput, { success: boolean; order: Order }>(functions, 'createOrder');

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const result = await createOrderCallable(input);
  return result.data.order;
}
