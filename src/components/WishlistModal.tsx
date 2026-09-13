import React from 'react';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import type { Product } from '../types';
import { formatCurrencyPrice } from '../utils/pricing';

interface WishlistModalProps {
  isOpen: boolean;
  wishlistProducts: Product[];
  currency: 'YER' | 'SAR';
  onClose: () => void;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  wishlistProducts,
  currency,
  onClose,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity duration-300">
      <div
        className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Wishlist Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h2 className="font-extrabold text-slate-800 text-base">قائمة المفضلة</h2>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              {wishlistProducts.length} أصناف
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wishlist Items or Empty State */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {wishlistProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-3">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">لا توجد عناصر بالمفضلة</h3>
              <p className="text-xs text-slate-500 mt-1">اضغط على أيقونة القلب على المنتجات لحفظها هنا والعودة إليها لاحقاً!</p>
            </div>
          ) : (
            wishlistProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100/80 cursor-pointer hover:bg-slate-100/70 transition-all"
                onClick={() => onSelectProduct(p)}
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-16 h-16 object-cover rounded-xl shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 truncate">{p.name}</h4>
                  <span className="text-xs font-black text-purple-700 block mt-1">
                    {formatCurrencyPrice(typeof p.price === 'number' ? p.price : (typeof p.discountPrice === 'number' ? p.discountPrice : p.originalPrice), currency)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(p);
                    }}
                    className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs active:scale-95 transition-all"
                    title="إضافة للسلة"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(p.id);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-all"
                    title="حذف من المفضلة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
