import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { Product, Category, Banner, TrendCampaign, CartItem, Order, User } from './types';
import { INITIAL_CATEGORIES } from './data/categories';
import { INITIAL_PRODUCTS } from './data/products';
import { INITIAL_BANNERS } from './data/banners';
import { INITIAL_TREND_CAMPAIGNS, INITIAL_TREND_HASHTAGS } from './data/trends';
import { auth, fetchUserProfile, subscribeToOrdersForUser, subscribeToAllOrders, subscribeToProducts, seedProductsToFirestore, saveProductToFirestore, deleteProductFromFirestore, updateOrderStatusInFirestore } from './firebase';
import { Header } from './components/Header';
import { BottomNavigation } from './components/BottomNavigation';
import { ProductCard } from './components/ProductCard';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { CartModal } from './components/CartModal';
import { WishlistModal } from './components/WishlistModal';
import { TrendsView } from './components/TrendsView';
import { CategoryModal } from './components/CategoryModal';
import { AdminModal } from './components/AdminModal';
import { OrdersModal } from './components/OrdersModal';
import { SearchModal } from './components/SearchModal';
import { AuthModal } from './components/AuthModal';
import { CustomerChatModal } from './components/CustomerChatModal';
import { OrderChatModal } from './components/OrderChatModal';
import { Toast } from './components/Toast';
import { Flame, Sparkles, MessageCircle, ChevronLeft } from 'lucide-react';

export const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [banners] = useState<Banner[]>(INITIAL_BANNERS);
  const [campaigns, setCampaigns] = useState<TrendCampaign[]>(INITIAL_TREND_CAMPAIGNS);
  const [hashtags] = useState<string[]>(INITIAL_TREND_HASHTAGS);

  const [user, setUser] = useState<User | null>(null);
  const [currency, setCurrency] = useState<'YER' | 'SAR'>('YER');
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try { const saved = localStorage.getItem('altakhfid_cart'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try { const saved = localStorage.getItem('altakhfid_wishlist'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [orders, setOrders] = useState<Order[]>([]);

  const [activeTab, setActiveTab] = useState<'home' | 'categories' | 'deals' | 'wishlist' | 'orders' | 'profile'>('home');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [selectedTrendTag, setSelectedTrendTag] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [selectedChatOrder, setSelectedChatOrder] = useState<Order | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { setUser(null); setOrders([]); return; }
      try {
        const profile = await fetchUserProfile(firebaseUser.uid);
        setUser(profile || { uid: firebaseUser.uid, phone: (firebaseUser.phoneNumber || '').replace(/^\+/, ''), role: 'customer', isAdmin: false });
      } catch (error) {
        console.error('Failed to load signed-in profile:', error);
        showToast('تعذر تحميل ملف الحساب', 'error');
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    return user.isAdmin ? subscribeToAllOrders(setOrders) : subscribeToOrdersForUser(user.uid, setOrders);
  }, [user?.uid, user?.isAdmin]);

  useEffect(() => {
    let seeded = false;
    return subscribeToProducts((remoteProducts) => {
      if (remoteProducts.length > 0) {
        setProducts(remoteProducts);
        return;
      }
      if (user?.isAdmin && !seeded) {
        seeded = true;
        seedProductsToFirestore(INITIAL_PRODUCTS).catch((error) => console.error('Product seed failed:', error));
      }
    });
  }, [user?.isAdmin]);

  useEffect(() => { localStorage.setItem('altakhfid_cart', JSON.stringify(cartItems)); }, [cartItems]);
  useEffect(() => { localStorage.setItem('altakhfid_wishlist', JSON.stringify(wishlistIds)); }, [wishlistIds]);

  useEffect(() => {
    const handler = (event: Event) => { const order = (event as CustomEvent<Order>).detail; if (order) setSelectedChatOrder(order); };
    window.addEventListener('openOrderChat', handler);
    return () => window.removeEventListener('openOrderChat', handler);
  }, []);

  useEffect(() => {
    const openTrendTag = (tag: string) => {
      setSelectedTrendTag(tag);
      setActiveTab('deals');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    (window as any).openTrendHashtag = openTrendTag;
    return () => { delete (window as any).openTrendHashtag; };
  }, []);

  const handleAddToCart = (product: Product, quantity = 1, color?: string, size?: string) => {
    setCartItems((prev) => {
      const index = prev.findIndex((item) => item.product.id === product.id && item.selectedColor === color && item.selectedSize === size);
      if (index >= 0) {
        const next = [...prev];
        next[index] = { ...next[index], quantity: next[index].quantity + quantity };
        return next;
      }
      return [...prev, { product, quantity, selectedColor: color, selectedSize: size, price: Number(product.price ?? product.discountPrice ?? product.originalPrice ?? 0) }];
    });
    showToast(`تمت إضافة "${product.name}" إلى السلة ✨`);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    setCartItems((prev) => prev.map((item) => item.product.id === productId ? { ...item, quantity } : item).filter((item) => item.quantity > 0));
  };
  const handleRemoveCartItem = (productId: string) => { setCartItems((prev) => prev.filter((item) => item.product.id !== productId)); };
  const handleToggleWishlist = (productId: string) => setWishlistIds((prev) => prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]);
  const handleLogout = async () => { try { await signOut(auth); } catch (error) { console.error(error); showToast('تعذر تسجيل الخروج', 'error'); } };

  const wishlistProducts = useMemo(() => products.filter((product) => wishlistIds.includes(product.id)), [products, wishlistIds]);
  const displayedProducts = useMemo(() => selectedCategoryId === 'all' ? products : products.filter((product) => product.categoryId === selectedCategoryId), [products, selectedCategoryId]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-20 sm:pb-8">
      <Header
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        wishlistCount={wishlistIds.length}
        currency={currency}
        user={user}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onToggleCurrency={() => setCurrency((value) => value === 'YER' ? 'SAR' : 'YER')}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-3 sm:pt-6">
        {activeTab === 'home' && <div className="space-y-6">
          {banners.length > 0 && <div className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-lg text-white"><div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory">{banners.map((banner) => <div key={banner.id} className="min-w-full snap-center relative aspect-[16/7] flex items-center p-6 sm:p-10 overflow-hidden"><img src={banner.image} alt={banner.title} className="absolute inset-0 w-full h-full object-cover opacity-40"/><div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"/><div className="relative z-10 max-w-lg space-y-2">{banner.badge && <span className="inline-flex items-center gap-1 text-[11px] font-black bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full"><Flame className="w-3 h-3"/>{banner.badge}</span>}<h2 className="text-xl sm:text-3xl font-black leading-tight">{banner.title}</h2>{banner.subtitle && <p className="text-xs sm:text-sm text-slate-200">{banner.subtitle}</p>}</div></div>)}</div></div>}
          <div className="space-y-2.5"><div className="flex items-center justify-between px-1"><h2 className="text-sm sm:text-base font-extrabold">الأقسام الرئيسية</h2><button onClick={() => setIsCategoryModalOpen(true)} className="text-xs text-purple-700 font-bold flex items-center">عرض الكل <ChevronLeft className="w-3.5 h-3.5"/></button></div><div className="flex gap-3 overflow-x-auto no-scrollbar py-1"><button onClick={() => setSelectedCategoryId('all')} className="shrink-0"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xs ${selectedCategoryId === 'all' ? 'bg-purple-600 text-white' : 'bg-white border border-slate-200'}`}>الكل</div><span className="text-[11px] font-bold">جميع الأصناف</span></button>{categories.map((cat) => <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)} className="shrink-0"><div className={`w-14 h-14 rounded-2xl overflow-hidden border ${selectedCategoryId === cat.id ? 'border-purple-600 ring-2 ring-purple-500/30' : 'border-slate-200 bg-white'}`}>{cat.image && <img src={cat.image} alt={cat.name} className="w-full h-full object-cover"/>}</div><span className="text-[11px] font-bold max-w-16 truncate block">{cat.name}</span></button>)}</div></div>
          <div onClick={() => setActiveTab('deals')} className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white rounded-2xl p-4 flex items-center justify-between cursor-pointer"><div className="flex items-center gap-3"><Flame className="w-6 h-6"/><div><h3 className="font-black text-sm sm:text-base">تخفيضات كبرى وعروض حصرية</h3><p className="text-xs text-amber-100">خصومات وعروض مستمرة على تشكيلة واسعة</p></div></div><span className="text-xs font-black bg-white text-rose-600 px-3 py-1.5 rounded-xl">تصفح الآن</span></div>
          <div className="space-y-3"><h2 className="text-sm sm:text-base font-extrabold flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-purple-600"/>{selectedCategoryId === 'all' ? 'أحدث التشكيلات المعروضة' : categories.find((c) => c.id === selectedCategoryId)?.name}<span className="text-xs font-medium text-slate-400">({displayedProducts.length})</span></h2><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">{displayedProducts.map((product) => <ProductCard key={product.id} product={product} currency={currency} isWishlisted={wishlistIds.includes(product.id)} onSelect={setSelectedProduct} onAddToCart={handleAddToCart} onToggleWishlist={handleToggleWishlist} onOpenTrendHashtag={(tag) => (window as any).openTrendHashtag?.(tag)}/>)}</div></div>
        </div>}

        {activeTab === 'categories' && <div className="space-y-6 pb-12"><h1 className="text-lg sm:text-xl font-extrabold">تصفح كافة الأقسام والتصنيفات</h1><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{categories.map((cat) => <button key={cat.id} onClick={() => { setSelectedCategoryId(cat.id); setActiveTab('home'); }} className="bg-white rounded-2xl p-4 border border-slate-200 text-right flex items-center gap-4"><img src={cat.image} alt={cat.name} className="w-20 h-20 object-cover rounded-xl"/><div><h3 className="font-extrabold text-sm">{cat.name}</h3><p className="text-xs text-slate-500">{cat.itemCount || 100}+ منتج متاح</p></div></button>)}</div></div>}
        {activeTab === 'deals' && <TrendsView products={products} campaigns={campaigns} hashtags={hashtags} wishlistIds={wishlistIds} currency={currency} selectedHashtag={selectedTrendTag} onSelectProduct={setSelectedProduct} onAddToCart={handleAddToCart} onToggleWishlist={handleToggleWishlist} onShowToast={showToast}/>} 
        {activeTab === 'wishlist' && <div className="space-y-4 pb-12"><h1 className="text-lg sm:text-xl font-extrabold">قائمة المفضلة ({wishlistProducts.length})</h1>{wishlistProducts.length === 0 ? <div className="bg-white rounded-3xl p-12 text-center text-sm text-slate-500">لا توجد منتجات بالمفضلة حالياً</div> : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">{wishlistProducts.map((product) => <ProductCard key={product.id} product={product} currency={currency} isWishlisted onSelect={setSelectedProduct} onAddToCart={handleAddToCart} onToggleWishlist={handleToggleWishlist}/>)}</div>}</div>}
        {activeTab === 'orders' && <div className="space-y-4 pb-12"><h1 className="text-lg sm:text-xl font-extrabold">طلباتي ومشترياتي</h1><div className="bg-white rounded-2xl p-6 border border-slate-100"><p className="text-xs text-slate-500 mb-3">طلباتك محفوظة في Firestore ومرتبطة بحسابك المصادق عليه.</p><button onClick={() => setIsOrdersOpen(true)} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold">عرض سجل الطلبات ({orders.length})</button></div></div>}
      </main>

      <button onClick={() => setIsSupportOpen(true)} className="fixed bottom-18 sm:bottom-6 left-4 z-40 bg-emerald-600 text-white p-3 rounded-full shadow-lg flex items-center gap-2 font-bold text-xs"><MessageCircle className="w-5 h-5"/><span className="hidden sm:inline">خدمة العملاء</span></button>
      <BottomNavigation activeTab={activeTab} cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)} wishlistCount={wishlistIds.length} onSelectTab={(tab) => { setActiveTab(tab); if (tab === 'orders') setIsOrdersOpen(true); }} onOpenCart={() => setIsCartOpen(true)}/>

      <ProductDetailsModal product={selectedProduct} currency={currency} isWishlisted={selectedProduct ? wishlistIds.includes(selectedProduct.id) : false} onClose={() => setSelectedProduct(null)} onAddToCart={handleAddToCart} onToggleWishlist={handleToggleWishlist} onOpenTrendHashtag={(tag) => (window as any).openTrendHashtag?.(tag)} onShowToast={showToast}/>
      <CartModal isOpen={isCartOpen} cartItems={cartItems} user={user} currency={currency} onClose={() => setIsCartOpen(false)} onUpdateQuantity={handleUpdateCartQuantity} onRemoveItem={handleRemoveCartItem} onClearCart={() => setCartItems([])} onOrderPlaced={(newOrder) => setOrders((current) => [newOrder, ...current.filter((item) => item.id !== newOrder.id)])} onShowToast={showToast}/>
      <WishlistModal isOpen={isWishlistOpen} wishlistProducts={wishlistProducts} currency={currency} onClose={() => setIsWishlistOpen(false)} onToggleWishlist={handleToggleWishlist} onAddToCart={handleAddToCart} onSelectProduct={(product) => { setIsWishlistOpen(false); setSelectedProduct(product); }}/>
      <CategoryModal isOpen={isCategoryModalOpen} categories={categories} selectedCategoryId={selectedCategoryId} onClose={() => setIsCategoryModalOpen(false)} onSelectCategory={(id) => { setSelectedCategoryId(id); setActiveTab('home'); }}/>
      <SearchModal isOpen={isSearchOpen} products={products} currency={currency} onClose={() => setIsSearchOpen(false)} onSelectProduct={setSelectedProduct}/>
      <AdminModal isOpen={isAdminOpen} orders={orders} products={products} campaigns={campaigns} onClose={() => setIsAdminOpen(false)} onUpdateOrderStatus={(orderId, status, isPaid) => { setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status, isPaid: isPaid ?? order.isPaid } : order)); updateOrderStatusInFirestore(orderId, status, isPaid).catch((error) => { console.error(error); showToast('فشل تحديث الطلب في قاعدة البيانات', 'error'); }); }} onSaveProduct={(product) => { setProducts((current) => [product, ...current.filter((item) => item.id !== product.id)]); saveProductToFirestore(product).then(() => showToast('تم حفظ المنتج ✅')).catch((error) => { console.error(error); showToast('فشل حفظ المنتج', 'error'); }); }} onDeleteProduct={(productId) => { setProducts((current) => current.filter((item) => item.id !== productId)); deleteProductFromFirestore(productId).then(() => showToast('تم حذف المنتج ✅')).catch((error) => { console.error(error); showToast('فشل حذف المنتج', 'error'); }); }} onUpdateCampaigns={setCampaigns} onShowToast={showToast}/>
      <OrdersModal isOpen={isOrdersOpen} orders={orders} currency={currency} onClose={() => setIsOrdersOpen(false)} onOpenSupport={() => { setIsOrdersOpen(false); setIsSupportOpen(true); }} onOpenOrderChat={(order) => setSelectedChatOrder(order)}/>
      <AuthModal isOpen={isAuthOpen} user={user} onClose={() => setIsAuthOpen(false)} onLogin={setUser} onLogout={handleLogout} onShowToast={showToast}/>
      <CustomerChatModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)}/>
      <OrderChatModal isOpen={!!selectedChatOrder} order={selectedChatOrder} user={user} onClose={() => setSelectedChatOrder(null)} onOrderChanged={(updated) => setOrders((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item))} onShowToast={showToast}/>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>} 
    </div>
  );
};

export default App;
