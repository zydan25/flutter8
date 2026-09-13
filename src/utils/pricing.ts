/**
 * Pricing and currency formatting utility for Altakhfid Alsah
 */

export const formatCurrencyPrice = (
  price?: number | null,
  currency: 'YER' | 'SAR' = 'YER',
  rate: number = 140
): string => {
  if (price === undefined || price === null || isNaN(Number(price))) {
    return currency === 'SAR' ? '0 ر.س' : '0 ر.ي';
  }
  const num = Number(price);
  if (currency === 'SAR') {
    const sarVal = num > 1000 ? Math.round(num / 140) : num;
    const formatted = sarVal % 1 === 0 ? sarVal.toString() : sarVal.toFixed(2);
    return `${formatted} ر.س`;
  }
  // YER: if base price is in SAR (< 1000), multiply by exchange rate (default 140)
  const yerVal = num < 1000 ? Math.round(num * rate) : Math.round(num);
  return `${yerVal.toLocaleString('ar-YE')} ر.ي`;
};

export const safeFormatNumber = (
  val?: number | null,
  defaultStr: string = '0',
  locale: string = 'ar-YE'
): string => {
  if (val === undefined || val === null || isNaN(Number(val))) {
    return defaultStr;
  }
  return Number(val).toLocaleString(locale);
};
