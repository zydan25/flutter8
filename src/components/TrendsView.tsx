import React, { useState, useEffect, useMemo } from 'react';
import { Flame, Clock, Tag, Sparkles } from 'lucide-react';
import type { Product, TrendCampaign } from '../types';
import { ProductCard } from './ProductCard';

interface TrendsViewProps {
  products: Product[];
  campaigns: TrendCampaign[];
  hashtags: string[];
  wishlistIds: string[];
  currency: 'YER' | 'SAR';
  selectedHashtag?: string | null;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const TrendsView: React.FC<TrendsViewProps> = ({
  products,
  campaigns,
  hashtags,
  wishlistIds,
  currency,
  selectedHashtag: propHashtag,
  onSelectProduct,
  onAddToCart,
  onToggleWishlist,
}) => {
  const [activeTag, setActiveTag] = useState<string>(() => {
    return (
      propHashtag ||
      (typeof window !== 'undefined' && (window as any).__targetTrendHashtag) ||
      'all'
    );
  });

  // Listen for custom event or prop changes
  useEffect(() => {
    const handleTagEvent = (e: any) => {
      const tag = (e && e.detail) || (typeof window !== 'undefined' && (window as any).__targetTrendHashtag);
      if (tag) {
        if (typeof window !== 'undefined') (window as any).__targetTrendHashtag = null;
        setActiveTag(tag);
      }
    };

    window.addEventListener('selectTrendTag', handleTagEvent);

    if (propHashtag) {
      setActiveTag(propHashtag);
    } else if (typeof window !== 'undefined' && (window as any).__targetTrendHashtag) {
      handleTagEvent(null);
    }

    return () => {
      window.removeEventListener('selectTrendTag', handleTagEvent);
    };
  }, [propHashtag]);

  // Filter products by active hashtag
  const filteredProducts = useMemo(() => {
    if (!activeTag || activeTag === 'all') return products;
    const cleanTag = activeTag.replace(/^#/, '').toLowerCase().trim();
    return products.filter((p) => {
      const pTag = (p.trendTag || '').replace(/^#/, '').toLowerCase().trim();
      const pStore = (p.storeBadgeTag || '').replace(/🏪/g, '').replace(/عرض براند/g, '').replace(/^#/, '').toLowerCase().trim();
      const pTrends = (p.trends || []).map((t) => t.replace(/^#/, '').toLowerCase().trim());
      const pBrand = (p.brand || '').toLowerCase().trim();
      const pName = (p.name || '').toLowerCase();
      const pSub = (p.subCategory || '').toLowerCase();
      return (
        pTag === cleanTag ||
        (pStore && (pStore.includes(cleanTag) || cleanTag.includes(pStore))) ||
        pTrends.includes(cleanTag) ||
        pBrand === cleanTag ||
        pBrand.replace(/\s+/g, '_') === cleanTag ||
        pSub === cleanTag ||
        (cleanTag.length > 2 && pName.includes(cleanTag))
      );
    });
  }, [products, activeTag]);

  return (
    <div className="space-y-6 pb-12">
      {/* Trends Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-bold mb-3">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>ترندات الموسم الحصرية</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            أقوى صيحات الموضة والتخفيضات الرائجة
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            استكشف أحدث الإطلالات الأكثر طلباً وانتشاراً، مع خصومات استثنائية وعروض يومية متجددة.
          </p>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Campaigns Carousel */}
      {campaigns && campaigns.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>حملات الترند المميزة</span>
            </h2>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pt-1">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                onClick={() => setActiveTag(camp.hashtag)}
                className={`relative shrink-0 w-72 sm:w-80 h-44 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-98 border ${
                  activeTag === camp.hashtag ? 'border-purple-500 ring-2 ring-purple-400/40' : 'border-slate-200/60'
                }`}
              >
                <img
                  src={camp.bgImage}
                  alt={camp.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="bg-purple-600/90 backdrop-blur-xs text-white text-[11px] font-black px-2.5 py-0.5 rounded-full">
                      {camp.badge || 'ترند'}
                    </span>
                    {camp.daysLeft && (
                      <span className="flex items-center gap-1 bg-black/50 backdrop-blur-xs text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        <span>{camp.daysLeft}</span>
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-amber-400 text-xs font-black block mb-0.5">
                      {camp.hashtag}
                    </span>
                    <h3 className="text-white text-sm font-bold line-clamp-1">
                      {camp.title}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hashtag Filter Pills */}
      <div className="space-y-2">
        <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 px-1">
          <Tag className="w-4 h-4 text-purple-600" />
          <span>تصفح حسب الهاشتاج والوسم</span>
        </h2>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => setActiveTag('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTag === 'all'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            جميع الترندات
          </button>
          {hashtags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activeTag === tag
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <span>{tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filtered Products Grid */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs sm:text-sm font-bold text-slate-600">
            {activeTag === 'all' ? 'جميع المنتجات الرائجة' : `المنتجات المرتبطة بـ ${activeTag}`} ({filteredProducts.length})
          </h3>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
            <Flame className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">لا توجد منتجات مسجلة بهذا الوسم حالياً</p>
            <button
              onClick={() => setActiveTag('all')}
              className="mt-3 px-4 py-2 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold hover:bg-purple-100 transition-all"
            >
              عرض جميع الأصناف
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currency={currency}
                isWishlisted={wishlistIds.includes(product.id)}
                onSelect={onSelectProduct}
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
                onOpenTrendHashtag={(tag) => setActiveTag(tag)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
