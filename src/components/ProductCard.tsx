import React from 'react';
import { Heart, ShoppingBag, Star, ChevronLeft } from 'lucide-react';
import type { Product } from '../types';
import { formatCurrencyPrice } from '../utils/pricing';

interface ProductCardProps {
  product: Product;
  currency: 'YER' | 'SAR';
  isWishlisted: boolean;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  onOpenTrendHashtag?: (hashtag: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  isWishlisted,
  onSelect,
  onAddToCart,
  onToggleWishlist,
  onOpenTrendHashtag,
}) => {
  const productPrice = typeof product.price === 'number' ? product.price : (typeof product.discountPrice === 'number' ? product.discountPrice : (typeof product.originalPrice === 'number' ? product.originalPrice : 0));
  const productOriginalPrice = typeof product.originalPrice === 'number' ? product.originalPrice : productPrice;

  // Determine trend hashtag for all products
  const getProductHashtag = (p: Product): string => {
    if (p.trendTag && typeof p.trendTag === 'string' && p.trendTag.trim() && p.trendTag !== 'ترندات') {
      const t = p.trendTag.trim();
      return t.startsWith('#') ? t : `#${t.replace(/\s+/g, '_')}`;
    }
    if (p.trends && Array.isArray(p.trends) && p.trends.length > 0) {
      const t = String(p.trends[0]).trim();
      if (t && t !== 'ترندات') {
        return t.startsWith('#') ? t : `#${t.replace(/\s+/g, '_')}`;
      }
    }
    if (p.brand && typeof p.brand === 'string' && p.brand.trim()) {
      const b = p.brand.replace(/🏪/g, '').replace(/عرض براند/g, '').trim();
      if (b) return `#${b.replace(/\s+/g, '_')}`;
    }
    if (p.subCategory && typeof p.subCategory === 'string' && p.subCategory.trim()) {
      return `#${p.subCategory.trim().replace(/\s+/g, '_')}`;
    }
    if (p.category === 'women') return '#أزياء_الموضة';
    if (p.category === 'men') return '#أناقة_صيفية';
    if (p.category === 'electronics') return '#موديلات_2026';
    if (p.category === 'accessories') return '#رائع_وأنيق';
    return '#ترندات_الموسم';
  };

  const trendTag = getProductHashtag(product);

  const handleTrendClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onOpenTrendHashtag) {
      onOpenTrendHashtag(trendTag);
    } else if (typeof window !== 'undefined') {
      if ((window as any).openTrendHashtag) {
        (window as any).openTrendHashtag(trendTag);
      } else if ((window as any).__openTrendHashtag) {
        (window as any).__openTrendHashtag(trendTag);
      }
      window.dispatchEvent(new CustomEvent('selectTrendTag', { detail: { tag: trendTag, hashtag: trendTag } }));
    }
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className="group bg-white rounded-2xl border border-slate-100/90 shadow-2xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col cursor-pointer active:scale-[0.98]"
    >
      {/* Product Image & Badges */}
      <div className="relative aspect-3/4 w-full overflow-hidden bg-slate-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10">
          {product.discount && product.discount > 0 ? (
            <span className="bg-rose-500 text-white font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-full shadow-xs">
              -{product.discount}%
            </span>
          ) : null}

          {product.isNewBadge && (
            <span className="bg-amber-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full shadow-xs">
              جديد
            </span>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          className="absolute top-2 left-2 p-1.5 rounded-full bg-white/80 hover:bg-white backdrop-blur-xs text-slate-700 hover:text-rose-500 transition-all shadow-xs active:scale-90 z-10"
          aria-label="إضافة للمفضلة"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Clickable Trend Badge: "ترندات" first, then hashtag, then chevron */}
        <div
          onClick={handleTrendClick}
          className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-purple-700 bg-purple-50/95 hover:bg-purple-100 backdrop-blur-xs px-2 py-0.5 rounded-md border border-purple-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
          title={`عرض ترندات ${trendTag}`}
        >
          <span className="bg-purple-600 text-white text-[8px] font-bold px-1 rounded-xs">ترندات</span>
          <span>{trendTag}</span>
          <ChevronLeft className="w-2.5 h-2.5 stroke-[2.5]" />
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          {/* Title */}
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 leading-snug mb-1">
            {product.name}
          </h3>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex items-center text-amber-400">
                <Star className="w-3 h-3 fill-amber-400" />
              </div>
              <span className="text-[10px] font-bold text-slate-600">{product.rating}</span>
              {product.ratingCount && (
                <span className="text-[9px] text-slate-400">({product.ratingCount})</span>
              )}
            </div>
          )}
        </div>

        {/* Pricing & Add to Cart */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-black text-purple-700">
              {formatCurrencyPrice(productPrice, currency)}
            </span>
            {productOriginalPrice > productPrice && (
              <span className="text-[10px] text-slate-400 line-through">
                {formatCurrencyPrice(productOriginalPrice, currency)}
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="p-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs active:scale-95 transition-all"
            aria-label="إضافة إلى السلة"
            title="إضافة للسلة"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
