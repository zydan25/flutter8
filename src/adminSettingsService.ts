import { apiFetch } from './api';
import { GOVERNORATE_RATES, ALL_GOVERNORATES } from './data/governorates';

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
  try {
    const result = await apiFetch<{ success: boolean; pricing: Record<string, Partial<GovernoratePricingSetting>> }>('/takhfid/admin/api/pricing');
    return ALL_GOVERNORATES.map((name) => normalizePricing(result.pricing?.[name] || fallbackPricing(name), name));
  } catch (error) {
    console.error('Flask pricing settings load failed:', error);
    return ALL_GOVERNORATES.map(fallbackPricing);
  }
}

export function subscribeToPricingSettings(onChange: (settings: GovernoratePricingSetting[]) => void): () => void {
  let active = true;
  const load = async () => {
    const settings = await getPricingSettings();
    if (active) onChange(settings);
  };
  void load();
  return () => { active = false; };
}

export async function savePricingSetting(setting: GovernoratePricingSetting): Promise<void> {
  const normalized = normalizePricing(setting, setting.governorate);
  await apiFetch(`/takhfid/admin/api/pricing/${encodeURIComponent(normalized.governorate)}`, {
    method: 'PUT',
    body: JSON.stringify(normalized),
  });
}

export async function seedPricingSettings(): Promise<void> {
  const existing = await getPricingSettings();
  await Promise.all(existing.map((setting) => savePricingSetting(setting)));
}

export async function getIntegrationSettings(): Promise<IntegrationSettings | null> {
  try {
    const result = await apiFetch<{ success: boolean; settings: Record<string, string> }>('/takhfid/admin/api/integrations');
    const values = result.settings || {};
    return {
      whatsappSendUrl: values.whatsapp_send_url || '',
      whatsappApiKey: values.whatsapp_api_key || '',
      whatsappApiKeyHeader: values.whatsapp_api_key_header || '',
      whatsappApiKeyPrefix: values.whatsapp_api_key_prefix || '',
      otpHashSecret: values.otp_hash_secret || '',
      adminPhones: (values.admin_phones || '').split(',').map((x) => x.trim()).filter(Boolean),
      apiBaseUrl: values.api_base_url || '',
    };
  } catch (error) {
    console.error('Flask integration settings load failed:', error);
    return null;
  }
}

export async function saveIntegrationSettings(settings: IntegrationSettings): Promise<void> {
  await apiFetch('/takhfid/admin/api/integrations', {
    method: 'PUT',
    body: JSON.stringify({
      whatsapp_session: 'basheer',
      whatsapp_send_url: settings.whatsappSendUrl,
      whatsapp_api_key: settings.whatsappApiKey,
      whatsapp_api_key_header: settings.whatsappApiKeyHeader,
      whatsapp_api_key_prefix: settings.whatsappApiKeyPrefix,
      otp_hash_secret: settings.otpHashSecret,
      admin_phones: settings.adminPhones.join(','),
    }),
  });
}
