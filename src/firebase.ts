import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, onSnapshot, query, setDoc, updateDoc, where, writeBatch, orderBy, limit } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import type { Order, Product, User, ChatMessage } from './types';

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

export async function fetchUserProfile(uid: string): Promise<User | null> { const snapshot = await getDoc(doc(db, 'users', uid)); return snapshot.exists() ? toUser(snapshot.data(), snapshot.id) : null; }
export async function syncUserToFirestore(user: User): Promise<void> { await setDoc(doc(db, 'users', user.uid), { ...user, updatedAt: new Date().toISOString() } as Record<string, unknown>, { merge: true }); }
export async function deleteUserFromFirestore(uid: string): Promise<void> { await deleteDoc(doc(db, 'users', uid)); }
export async function updateOrderStatusInFirestore(orderId: string, status: Order['status'], isPaid?: boolean): Promise<void> { const payload: { status: Order['status']; updatedAt: string; isPaid?: boolean; paymentConfirmedAt?: string } = { status, updatedAt: new Date().toISOString() }; if (typeof isPaid === 'boolean') payload.isPaid = isPaid; if (isPaid) payload.paymentConfirmedAt = new Date().toISOString(); await updateDoc(doc(db, 'orders', orderId), payload); }
export async function markPaymentSubmitted(orderId: string, proofUrl: string, note?: string): Promise<void> { await updateDoc(doc(db, 'orders', orderId), { status: 'payment_submitted', paymentProofUrl: proofUrl, paymentNote: note || '', updatedAt: new Date().toISOString() }); }
export async function fetchAllUsersFromFirestore(): Promise<User[]> { const snapshot = await getDocs(collection(db, 'users')); return snapshot.docs.map((d) => toUser(d.data(), d.id)); }
export async function fetchAllOrdersFromFirestore(): Promise<Order[]> { const snapshot = await getDocs(collection(db, 'orders')); return snapshot.docs.map((d) => toOrder(d.data(), d.id)); }
export function subscribeToOrdersForUser(uid: string, onChange: (orders: Order[]) => void): Unsubscribe { const q = query(collection(db, 'orders'), where('customerId', '==', uid)); return onSnapshot(q, (snapshot) => onChange(snapshot.docs.map((d) => toOrder(d.data(), d.id)).sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt)))), (error) => { console.error('User orders subscription failed:', error); onChange([]); }); }
export function subscribeToAllOrders(onChange: (orders: Order[]) => void): Unsubscribe { return onSnapshot(collection(db, 'orders'), (snapshot) => onChange(snapshot.docs.map((d) => toOrder(d.data(), d.id)).sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt)))), (error) => { console.error('Admin orders subscription failed:', error); onChange([]); }); }
export function subscribeToProducts(onChange: (products: Product[]) => void): Unsubscribe { return onSnapshot(collection(db, 'products'), (snapshot) => onChange(snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Product))), (error) => { console.error('Products subscription failed:', error); onChange([]); }); }
export async function saveProductToFirestore(product: Product): Promise<void> { await setDoc(doc(db, 'products', product.id), product, { merge: true }); }
export async function deleteProductFromFirestore(productId: string): Promise<void> { await deleteDoc(doc(db, 'products', productId)); }
export async function seedProductsToFirestore(products: Product[]): Promise<void> { const existing = await getDocs(collection(db, 'products')); if (!existing.empty) return; for (let offset = 0; offset < products.length; offset += 400) { const batch = writeBatch(db); for (const product of products.slice(offset, offset + 400)) batch.set(doc(db, 'products', product.id), product, { merge: true }); await batch.commit(); } }
export async function createOrUpdateOrderChat(order: Order): Promise<void> { await setDoc(doc(db, 'chats', order.id), { id: order.id, orderId: order.id, customerId: order.customerId, orderNumber: order.orderNumber, total: order.total, currency: order.currency, updatedAt: new Date().toISOString() }, { merge: true }); }
export async function sendOrderChatMessage(orderId: string, message: Omit<ChatMessage, 'id'>): Promise<void> { const ref = doc(collection(db, 'chats', orderId, 'messages')); await setDoc(ref, { ...message, id: ref.id }); await setDoc(doc(db, 'chats', orderId), { updatedAt: new Date().toISOString() }, { merge: true }); }
export function subscribeToOrderChat(orderId: string, onChange: (messages: ChatMessage[]) => void): Unsubscribe { const q = query(collection(db, 'chats', orderId, 'messages'), orderBy('createdAt', 'asc'), limit(300)); return onSnapshot(q, (snapshot) => onChange(snapshot.docs.map((d) => toMessage(d.data(), d.id))), (error) => { console.error('Chat subscription failed:', error); onChange([]); }); }
