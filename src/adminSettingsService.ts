import { collection, doc, getDoc, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { GOVERNORATE_RATES, ALL_GOVERNORATES } from './data/governorates';
import type { Unsubscribe } from 'firebase/firestore';

export interface GovernoratePricingSetting {
  governorate: string;
  region: 'north' | 'south';
  sarToYerRate: number;
  usdToYerRate: number;
  markupType: 'percentage' | 'fixed';
  markupValue: number;
  deliveryFeeYer: number;
  deliveryFeeSar: number;
  freeDeliveryIncluded: boolean;
  deliveryNote: string;
  isActive: boolean;
  updatedAt?: string;
}

export interface IntegrationSettings {
  whatsappSendUrl: string;
  whatsappApiKey: string;
  whatsappApiKeyHeader: string;
  whatsappApiKeyPrefix: string;
  otpHashSecret: string;
  adminPhones: string[];
  apiBaseUrl: string;
  updatedAt?: string;
}

const pricingCollection = collection(db, 'pricing_settings');
const integrationRef = doc(db, 'app_settings', 'integrations');

const fallbackPricing = (governorate: string): GovernoratePricingSetting => {
  const item = GOVERNORATE_RATES[governorate] || GOVERNORATE_RATES['أمانة العاصمة'];
  return {
    governorate: item.governorate,
    region: item.region,
    sarToYerRate: Number(item.sarToYerRate) || 140,
    usdToYerRate: Number(item.usdToYerRate) || 535,
    markupType: item.markupType === 'fixed' ? 'fixed' : 'percentage',
    markupValue: Number(item.markupValue) || 0,
    deliveryFeeYer: item.freeDeliveryIncluded ? 0 : Number(item.deliveryFeeYer || item.deliveryFee || 0),
    deliveryFeeSar: item.freeDeliveryIncluded ? 0 : Number(item.deliveryFeeSar || 0),
    freeDeliveryIncluded: Boolean(item.freeDeliveryIncluded),
    deliveryNote: String(item.deliveryNote || ''),
    isActive: item.isActive !== false,
  };
};

export const normalizePricing = (data: Partial<GovernoratePricingSetting>, governorate: string): GovernoratePricingSetting => ({
  ...fallbackPricing(governorate),
  ...data,
  governorate,
  sarToYerRate: Math.max(0.01, Number(data.sarToYerRate ?? fallbackPricing(governorate).sarToYerRate) || 0),
  usdToYerRate: Math.max(0.01, Number(data.usdToYerRate ?? fallbackPricing(governorate).usdToYerRate) || 0),
  markupValue: Math.max(0, Number(data.markupValue ?? 0) || 0),
  deliveryFeeYer: Math.max(0, Number(data.deliveryFeeYer ?? 0) || 0),
  deliveryFeeSar: Math.max(0, Number(data.deliveryFeeSar ?? 0) || 0),
  markupType: data.markupType === 'fixed' ? 'fixed' : 'percentage',
  freeDeliveryIncluded: Boolean(data.freeDeliveryIncluded),
  isActive: data.isActive !== false,
  updatedAt: String(data.updatedAt || new Date().toISOString()),
});

export async function getPricingSettings(): Promise<GovernoratePricingSetting[]> {
  const snapshot = await getDocs(pricingCollection);
  const byName = new Map(snapshot.docs.map((item) => [item.id, normalizePricing(item.data() as Partial<GovernoratePricingSetting>, item.id)]));
  return ALL_GOVERNORATES.map((name) => byName.get(name) || fallbackPricing(name));
}

export function subscribeToPricingSettings(onChange: (settings: GovernoratePricingSetting[]) => void): Unsubscribe {
  return onSnapshot(pricingCollection, (snapshot) => {
    const byName = new Map(snapshot.docs.map((item) => [item.id, normalizePricing(item.data() as Partial<GovernoratePricingSetting>, item.id)]));
    onChange(ALL_GOVERNORATES.map((name) => byName.get(name) || fallbackPricing(name)));
  }, (error) => {
    console.error('Pricing settings subscription failed:', error);
    onChange(ALL_GOVERNORATES.map(fallbackPricing));
  });
}

export async function savePricingSetting(setting: GovernoratePricingSetting): Promise<void> {
  const normalized = normalizePricing(setting, setting.governorate);
  await setDoc(doc(pricingCollection, normalized.governorate), normalized, { merge: true });
}

export async function seedPricingSettings(): Promise<void> {
  const snapshot = await getDocs(pricingCollection);
  if (!snapshot.empty) return;
  await Promise.all(ALL_GOVERNORATES.map((name) => savePricingSetting(fallbackPricing(name))));
}

export async function getIntegrationSettings(): Promise<IntegrationSettings | null> {
  const snapshot = await getDoc(integrationRef);
  return snapshot.exists() ? (snapshot.data() as IntegrationSettings) : null;
}

export async function saveIntegrationSettings(settings: IntegrationSettings): Promise<void> {
  await setDoc(integrationRef, {
    ...settings,
    adminPhones: settings.adminPhones.map((phone) => phone.replace(/\D/g, '')).filter(Boolean),
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}
