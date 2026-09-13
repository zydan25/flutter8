import { apiFetch, getAccessToken } from './api';
import type { Order } from './types';

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

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  if (!getAccessToken()) throw new Error('يجب تسجيل الدخول قبل إنشاء الطلب');
  const result = await apiFetch<{ success: boolean; order: Order }>('/takhfid/api/v2/orders', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.order;
}

export async function getOrders(): Promise<Order[]> {
  if (!getAccessToken()) return [];
  const result = await apiFetch<{ success: boolean; orders: Order[] }>('/takhfid/api/v2/orders');
  return result.orders || [];
}

export async function updateOrderStatusApi(orderId: string, status: Order['status'], isPaid?: boolean): Promise<Order> {
  const result = await apiFetch<{ success: boolean; order: Order }>(`/takhfid/api/v2/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, ...(typeof isPaid === 'boolean' ? { isPaid } : {}) }),
  });
  return result.order;
}

export async function mirrorOrdersToFlask(orders: unknown[]): Promise<void> {
  if (!getAccessToken()) return;
  await apiFetch('/takhfid/api/v2/orders/bulk', {
    method: 'POST',
    body: JSON.stringify({ orders }),
  });
}
