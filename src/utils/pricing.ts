import { GOVERNORATE_RATES } from '../data/governorates';

export type Currency = 'YER' | 'SAR';

export const getGovernorateRate = (governorate?: string) =>
  GOVERNORATE_RATES[governorate || 'أمانة العاصمة'] || GOVERNORATE_RATES['أمانة العاصمة'];

export const getGovernorateMarkupMultiplier = (governorate?: string): number => {
  const rate = getGovernorateRate(governorate);
  return 1 + Math.max(0, Number(rate.markupValue) || 0) / 100;
};

export const convertBasePrice = (price: number, currency: Currency, governorate?: string): number => {
  const rate = getGovernorateRate(governorate);
  const markedPrice = (Number(price) || 0) * getGovernorateMarkupMultiplier(governorate);
  if (currency === 'SAR') return markedPrice >= 1000 ? Math.round(markedPrice / rate.sarToYerRate) : Math.round(markedPrice);
  return markedPrice < 1000 ? Math.round(markedPrice * rate.sarToYerRate) : Math.round(markedPrice);
};

export const getDeliveryFee = (governorate?: string): number => Number(getGovernorateRate(governorate).deliveryFee ?? 0);
export const getDeliveryFeeForCurrency = (governorate: string | undefined, currency: Currency): number => {
  const rate = getGovernorateRate(governorate);
  return currency === 'SAR' ? Math.round(getDeliveryFee(governorate) / rate.sarToYerRate) : getDeliveryFee(governorate);
};

export const formatCurrencyPrice = (price?: number | null, currency: Currency = 'YER', governorate?: string): string => {
  if (price === undefined || price === null || Number.isNaN(Number(price))) return currency === 'SAR' ? '0 ر.س' : '0 ر.ي';
  const converted = convertBasePrice(Number(price), currency, governorate);
  return `${converted.toLocaleString('ar-YE')} ${currency === 'SAR' ? 'ر.س' : 'ر.ي'}`;
};

export const safeFormatNumber = (val?: number | null, defaultStr: string = '0', locale: string = 'ar-YE'): string => {
  if (val === undefined || val === null || Number.isNaN(Number(val))) return defaultStr;
  return Number(val).toLocaleString(locale);
};
