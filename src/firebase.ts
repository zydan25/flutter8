import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, onSnapshot, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import type { Order, Product, User } from './types';

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

const toUser = (data: Record<string, unknown>, id: string): User => ({
  ...(data as unknown as User),
  uid: String(data.uid ?? id),
});

const toOrder = (data: Record<string, unknown>, id: string): Order => ({
  ...(data as unknown as Order),
  id: String(data.id ?? id),
});

export async function fetchUserProfile(uid: string): Promise<User | null> {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? toUser(snapshot.data(), snapshot.id) : null;
}

export async function syncUserToFirestore(user: User): Promise<void> {
  await setDoc(doc(db, 'users', user.uid), { ...user, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function deleteUserFromFirestore(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid));
}

export async function updateOrderStatusInFirestore(orderId: string, status: Order['status'], isPaid?: boolean): Promise<void> {
  const payload: Record<string, any> = { status, updatedAt: new Date().toISOString() };
  if (typeof isPaid === 'boolean') payload.isPaid = isPaid;
  await updateDoc(doc(db, 'orders', orderId), payload);
}

export async function fetchAllUsersFromFirestore(): Promise<User[]> {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map((d) => toUser(d.data(), d.id));
}

export async function fetchAllOrdersFromFirestore(): Promise<Order[]> {
  const snapshot = await getDocs(collection(db, 'orders'));
  return snapshot.docs.map((d) => toOrder(d.data(), d.id));
}

export function subscribeToOrdersForUser(uid: string, onChange: (orders: Order[]) => void): Unsubscribe {
  const q = query(collection(db, 'orders'), where('customerId', '==', uid));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs
      .map((d) => toOrder(d.data(), d.id))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    onChange(orders);
  }, (error) => {
    console.error('User orders subscription failed:', error);
    onChange([]);
  });
}

export function subscribeToAllOrders(onChange: (orders: Order[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'orders'), (snapshot) => {
    const orders = snapshot.docs
      .map((d) => toOrder(d.data(), d.id))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    onChange(orders);
  }, (error) => {
    console.error('Admin orders subscription failed:', error);
    onChange([]);
  });
}

export function subscribeToProducts(onChange: (products: Product[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'products'), (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Product)));
  }, (error) => {
    console.error('Products subscription failed:', error);
    onChange([]);
  });
}

export async function saveProductToFirestore(product: Product): Promise<void> {
  await setDoc(doc(db, 'products', product.id), product, { merge: true });
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  await deleteDoc(doc(db, 'products', productId));
}

export async function seedProductsToFirestore(products: Product[]): Promise<void> {
  const existing = await getDocs(collection(db, 'products'));
  if (!existing.empty) return;
  for (let offset = 0; offset < products.length; offset += 400) {
    const batch = writeBatch(db);
    for (const product of products.slice(offset, offset + 400)) {
      batch.set(doc(db, 'products', product.id), product, { merge: true });
    }
    await batch.commit();
  }
}
