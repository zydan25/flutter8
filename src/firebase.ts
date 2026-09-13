import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import type { User, Order } from './types';

export const firebaseConfig = {
  apiKey: "AIzaSyAKilRP9uw5l9ZPIw54zMXuLcKU-9yzxOI",
  authDomain: "valued-leaf-npthm.firebaseapp.com",
  projectId: "valued-leaf-npthm",
  storageBucket: "valued-leaf-npthm.firebasestorage.app",
  messagingSenderId: "997677160395",
  appId: "1:997677160395:web:290d4c5364d08ddc11084e"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, "ai-studio-3cbe8e72-8545-44eb-90af-bac8612b6c5c");

// Real-time Firestore sync helpers
export async function syncUserToFirestore(user: User): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      ...user,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error syncing user to Firestore:', error);
  }
}

export async function deleteUserFromFirestore(uid: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', uid);
    await deleteDoc(userDocRef);
  } catch (error) {
    console.error('Error deleting user from Firestore:', error);
  }
}

export async function saveOrderToFirestore(order: Order): Promise<void> {
  try {
    const orderDocRef = doc(db, 'orders', order.id);
    await setDoc(orderDocRef, {
      ...order,
      createdAt: order.createdAt || new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving order to Firestore:', error);
  }
}

export async function updateOrderStatusInFirestore(orderId: string, status: Order['status'], isPaid?: boolean): Promise<void> {
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    const updateData: any = { status, updatedAt: new Date().toISOString() };
    if (typeof isPaid === 'boolean') {
      updateData.isPaid = isPaid;
    }
    await updateDoc(orderDocRef, updateData);
  } catch (error) {
    console.error('Error updating order status in Firestore:', error);
  }
}

export async function fetchAllUsersFromFirestore(): Promise<User[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(docSnap => docSnap.data() as User);
  } catch (error) {
    console.error('Error fetching users from Firestore:', error);
    return [];
  }
}

export async function fetchAllOrdersFromFirestore(): Promise<Order[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'orders'));
    return querySnapshot.docs.map(docSnap => docSnap.data() as Order);
  } catch (error) {
    console.error('Error fetching orders from Firestore:', error);
    return [];
  }
}
