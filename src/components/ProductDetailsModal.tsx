import React, { useEffect, useState } from 'react';
import { X, Heart, ShoppingBag, Star, ChevronLeft, Truck, ShieldCheck } from 'lucide-react';
import type { Product } from '../types';
import { formatCurrencyPrice } from '../utils/pricing';

interface ProductDetailsModalProps {
  product: Product | null;
  currency: 'YER' | 'SAR';
  isWishlisted: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, color?: string, size?: string) => void;
  onToggleWishlist: (productId: string) => void;
  onOpenTrendHashtag?: (hashtag: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, currency, isWishlisted, onClose, onAddToCart, onToggleWishlist, onOpenTrendHashtag, onShowToast }) => {
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setSelectedColor(product?.colors?.[0]?.name);
    setSelectedSize(product?.sizes?.[0]);
    setQuantity(1);
  }, [product?.id]);

  if (!product) return null;

  const price = Number(product.price ?? product.discountPrice ?? product.originalPrice ?? 0);
  const originalPrice = Number(product.originalPrice ?? price);
  const trendTag = product.trendTag || product.trends?.[0] || (product.brand ? `#${product.brand.replace(/\s+/g, '_')}` : '#ترندات_الموسم');
  const openTrend = () => {
    onClose();
    onOpenTrendHashtag?.(trendTag.startsWith('#') ? trendTag : `#${trendTag.replace(/\s+/g, '_')}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-2xl max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-500">تفاصيل المنتج</span><button onClick={openTrend} className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200 text-[10px] font-bold"><span className="bg-purple-600 text-white px-1 rounded">ترندات</span>{trendTag}<ChevronLeft className="w-3 h-3"/></button></div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100"><X className="w-5 h-5"/></button>
        </div>
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100"><img src={product.image} alt={product.name} className="w-full h-full object-cover"/>{product.discount ? <span className="absolute top-3 right-3 bg-rose-500 text-white font-black text-xs px-2.5 py-1 rounded-full">خصم {product.discount}%</span> : null}<button onClick={() => onToggleWishlist(product.id)} className="absolute top-3 left-3 p-2 rounded-full bg-white/90 text-slate-700"><Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`}/></button></div>
          <div><h2 className="text-base sm:text-lg font-bold text-slate-900">{product.name}</h2><div className="flex items-center gap-3 mt-2"><span className="text-xl sm:text-2xl font-black text-purple-700">{formatCurrencyPrice(price, currency)}</span>{originalPrice > price && <span className="text-sm text-slate-400 line-through">{formatCurrencyPrice(originalPrice, currency)}</span>}</div>{product.rating ? <div className="flex items-center gap-1 mt-2 text-xs text-slate-500"><Star className="w-3 h-3 fill-amber-400 text-amber-400"/>{product.rating} {product.reviewsCount ? `(${product.reviewsCount})` : ''}</div> : null}</div>
          {product.colors?.length ? <div><span className="text-xs font-bold text-slate-700 block mb-2">الألوان:</span><div className="flex flex-wrap gap-2">{product.colors.map((color) => <button key={color.name} onClick={() => setSelectedColor(color.name)} className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${selectedColor === color.name ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-200'}`}>{color.name}</button>)}</div></div> : null}
          {product.sizes?.length ? <div><span className="text-xs font-bold text-slate-700 block mb-2">المقاس:</span><div className="flex flex-wrap gap-2">{product.sizes.map((size) => <button key={size} onClick={() => setSelectedSize(size)} className={`min-w-10 px-3 py-1.5 rounded-xl border text-xs font-bold ${selectedSize === size ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-200'}`}>{size}</button>)}</div></div> : null}
          <div className="flex items-center justify-between"><span className="text-xs font-bold">الكمية</span><div className="flex items-center gap-3 bg-slate-100 px-3 py-1 rounded-xl"><button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-7 h-7 rounded-lg bg-white">-</button><span className="font-black text-sm">{quantity}</span><button onClick={() => setQuantity((q) => q + 1)} className="w-7 h-7 rounded-lg bg-white">+</button></div></div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600"><div className="bg-slate-50 p-2 rounded-xl flex items-center gap-1.5"><Truck className="w-4 h-4 text-purple-600"/>توصيل سريع</div><div className="bg-slate-50 p-2 rounded-xl flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600"/>الدفع عند الاستلام</div></div>
        </div>
        <div className="p-4 border-t bg-slate-50"><button onClick={() => { onAddToCart(product, quantity, selectedColor, selectedSize); onClose(); onShowToast('تمت إضافة المنتج إلى السلة ✅'); }} className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center justify-center gap-2"><ShoppingBag className="w-5 h-5"/>إضافة إلى السلة ({formatCurrencyPrice(price * quantity, currency)})</button></div>
      </div>
    </div>
  );
};
