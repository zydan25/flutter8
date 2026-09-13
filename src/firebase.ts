import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, onSnapshot, query, setDoc, updateDoc, where, writeBatch, orderBy, limit } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import type { Order, Product, User, ChatMessage } from './types';
import { deleteFlaskCustomer, fetchCurrentUser, getFlaskCustomers, mirrorCustomersToFlask, updateMyProfileApi, apiFetch, getAccessToken } from './api';

export const firebaseConfig = {
  apiKey: "AIzaSyAKilRP9uw5l9ZPIw54zMXuLcKU-9yzxOI",
  authDomain: "valued-leaf-npthm.firebaseapp.com",
  projectId: "valued-leaf-npthm",
  storageBucket: "valued-leaf-npthm.firebasestorage.app",
  messagingSenderId: "997677160395",
  appId: "1:997677160395:web:290d4c5364d08ddc11084e"
};

export const FIRESTORE_DATABASE_ID = "ai-studio-3cbe8e72-8545-44eb-90af-bac8612b6c5c";
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, FIRESTORE_DATABASE_ID);
export const storage = getStorage(app);

const toUser = (data: Record<string, unknown>, id: string): User => ({ ...(data as unknown as User), uid: String(data.uid ?? id) });
const toOrder = (data: Record<string, unknown>, id: string): Order => ({ ...(data as unknown as Order), id: String(data.id ?? id) });
const toMessage = (data: Record<string, unknown>, id: string): ChatMessage => ({ ...(data as unknown as ChatMessage), id: String(data.id ?? id) });

// Compatibility names retained while the app migrates away from Firebase. User/profile data is now served by Flask.
export async function fetchUserProfile(uid: string): Promise<User | null> {
  const current = await fetchCurrentUser();
  return current && current.uid === uid ? current as User : null;
}

export async function syncUserToFirestore(user: User): Promise<void> {
  await updateMyProfileApi({ firstName: user.firstName, secondName: user.secondName, thirdName: user.thirdName, lastName: user.lastName, governorate: user.governorate });
}

export async function deleteUserFromFirestore(uid: string): Promise<void> { await deleteFlaskCustomer(uid); }

export async function fetchAllUsersFromFirestore(): Promise<User[]> {
  const flaskUsers = await getFlaskCustomers();
  if (flaskUsers.length > 0) return flaskUsers as User[];
  const snapshot = await getDocs(collection(db, 'users'));
  if (snapshot.empty) return [];
  const users = snapshot.docs.map((d) => toUser(d.data(), d.id));
  await mirrorCustomersToFlask(users);
  return users;
}

export async function migrateLegacyUsersToFlask(): Promise<void> {
  const snapshot = await getDocs(collection(db, 'users'));
  if (snapshot.empty) return;
  const users = snapshot.docs.map((d) => toUser(d.data(), d.id));
  await mirrorCustomersToFlask(users);
}

// Orders now use Flask as the active source. These function names remain temporarily for compatibility.
export async function updateOrderStatusInFirestore(orderId: string, status: Order['status'], isPaid?: boolean): Promise<void> {
  await apiFetch(`/takhfid/api/v2/orders/${encodeURIComponent(orderId)}/status`, { method: 'PATCH', body: JSON.stringify({ status, ...(typeof isPaid === 'boolean' ? { isPaid } : {}) }) });
}

export async function fetchAllOrdersFromFirestore(): Promise<Order[]> {
  const snapshot = await getDocs(collection(db, 'orders'));
  return snapshot.docs.map((d) => toOrder(d.data(), d.id));
}

export function subscribeToOrdersForUser(uid: string, onChange: (orders: Order[]) => void): Unsubscribe {
  let active = true;
  const load = async () => {
    if (!active || !getAccessToken()) return;
    try {
      const result = await apiFetch<{ success: boolean; orders: Order[] }>('/takhfid/api/v2/orders');
      if (active) onChange((result.orders || []).filter((order) => order.customerId === uid).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))));
    } catch (error) {
      console.error('Flask user orders load failed:', error);
      if (active) onChange([]);
    }
  };
  void load();
  const timer = window.setInterval(load, 5000);
  return () => { active = false; window.clearInterval(timer); };
}

export function subscribeToAllOrders(onChange: (orders: Order[]) => void): Unsubscribe {
  let active = true;
  const load = async () => {
    if (!active || !getAccessToken()) return;
    try {
      const result = await apiFetch<{ success: boolean; orders: Order[] }>('/takhfid/api/v2/orders');
      if (active) onChange((result.orders || []).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))));
    } catch (error) {
      console.error('Flask admin orders load failed:', error);
      if (active) onChange([]);
    }
  };
  void load();
  const timer = window.setInterval(load, 5000);
  return () => { active = false; window.clearInterval(timer); };
}

export async function markPaymentSubmitted(orderId: string, proofUrl: string, note?: string): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), { status: 'payment_submitted', paymentProofUrl: proofUrl, paymentNote: note || '', updatedAt: new Date().toISOString() });
}

// Legacy product functions remain temporarily for the one-time migration only.
export function subscribeToProducts(onChange: (products: Product[]) => void): Unsubscribe { return onSnapshot(collection(db, 'products'), (snapshot) => onChange(snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Product))), (error) => { console.error('Products subscription failed:', error); onChange([]); }); }
export async function saveProductToFirestore(product: Product): Promise<void> { await setDoc(doc(db, 'products', product.id), product, { merge: true }); }
export async function deleteProductFromFirestore(productId: string): Promise<void> { await deleteDoc(doc(db, 'products', productId)); }
export async function seedProductsToFirestore(products: Product[]): Promise<void> { const existing = await getDocs(collection(db, 'products')); if (!existing.empty) return; for (let offset = 0; offset < products.length; offset += 400) { const batch = writeBatch(db); for (const product of products.slice(offset, offset + 400)) batch.set(doc(db, 'products', product.id), product, { merge: true }); await batch.commit(); } }

// Chat/storage functions remain legacy until those migration stages are completed.
export async function createOrUpdateOrderChat(order: Order): Promise<void> { await setDoc(doc(db, 'chats', order.id), { id: order.id, orderId: order.id, customerId: order.customerId, orderNumber: order.orderNumber, total: order.total, currency: order.currency, updatedAt: new Date().toISOString() }, { merge: true }); }
export async function sendOrderChatMessage(orderId: string, message: Omit<ChatMessage, 'id'>): Promise<void> { const ref = doc(collection(db, 'chats', orderId, 'messages')); await setDoc(ref, { ...message, id: ref.id }); await setDoc(doc(db, 'chats', orderId), { updatedAt: new Date().toISOString() }, { merge: true }); }
export function subscribeToOrderChat(orderId: string, onChange: (messages: ChatMessage[]) => void): Unsubscribe { const q = query(collection(db, 'chats', orderId, 'messages'), orderBy('createdAt', 'asc'), limit(300)); return onSnapshot(q, (snapshot) => onChange(snapshot.docs.map((d) => toMessage(d.data(), d.id))), (error) => { console.error('Chat subscription failed:', error); onChange([]); }); }
