import React, { useState, useMemo } from 'react';
import { X, Search, ArrowRight } from 'lucide-react';
import type { Product } from '../types';
import { formatCurrencyPrice } from '../utils/pricing';

interface SearchModalProps {
  isOpen: boolean;
  products: Product[];
  currency: 'YER' | 'SAR';
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  products,
  currency,
  onClose,
  onSelectProduct,
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.trendTag && p.trendTag.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [products, query]);

  const quickTags = ['فساتين سهرة', 'هودي رجالي', 'أحذية رياضية', 'عبايات', 'ساعات يد', 'عطور'];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Search Input Bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-all"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-center gap-2 bg-slate-100 px-3.5 py-2 rounded-full">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث بالاسم، الموديل، الهاشتاج..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Suggestions or Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!query.trim() ? (
          <div>
            <h4 className="text-xs font-bold text-slate-500 mb-2.5">كلمات بحث شائعة</h4>
            <div className="flex flex-wrap gap-2">
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h4 className="text-xs font-bold text-slate-500 mb-2.5">
              نتائج البحث ({searchResults.length})
            </h4>
            {searchResults.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                لم نجد نتائج مطابقة لـ "{query}"
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {searchResults.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProduct(p);
                      onClose();
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all"
                  >
                    <img src={p.image} alt={p.name} className="w-14 h-14 object-cover rounded-xl shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-slate-800 truncate">{p.name}</h5>
                      <span className="text-xs font-black text-purple-700 block mt-0.5">
                        {formatCurrencyPrice(typeof p.price === 'number' ? p.price : (typeof p.discountPrice === 'number' ? p.discountPrice : p.originalPrice), currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
