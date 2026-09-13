import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Users, Package, ShoppingBag, Flame, RefreshCw, CheckCircle, Trash2, Edit2, Plus, Phone } from 'lucide-react';
import type { Order, Product, TrendCampaign, User } from '../types';
import { fetchAllUsersFromFirestore, deleteUserFromFirestore, updateOrderStatusInFirestore } from '../firebase';
import { safeFormatNumber } from '../utils/pricing';

interface AdminModalProps {
  isOpen: boolean;
  orders: Order[];
  products: Product[];
  campaigns: TrendCampaign[];
  onClose: () => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status'], isPaid?: boolean) => void;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateCampaigns: (campaigns: TrendCampaign[]) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  orders,
  products,
  campaigns,
  onClose,
  onUpdateOrderStatus,
  onSaveProduct,
  onDeleteProduct,
  onUpdateCampaigns,
  onShowToast,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'orders' | 'customers' | 'products' | 'trends'>('orders');
  const [firestoreUsers, setFirestoreUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Load registered users from Firestore
  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const users = await fetchAllUsersFromFirestore();
      setFirestoreUsers(users);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'customers') {
      loadUsers();
    }
  }, [activeTab]);

  const handleDeleteUser = async (uid: string) => {
    if (window.confirm('هل أنت متأكد من حذف حساب هذا العميل؟')) {
      await deleteUserFromFirestore(uid);
      setFirestoreUsers((prev) => prev.filter((u) => u.uid !== uid));
      onShowToast('تم حذف العميل بنجاح من قاعدة البيانات', 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300">
      <div
        className="bg-white w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Admin Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg">لوحة تحكم الإدارة</h2>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span>المشرف: بشير نجيب محرز التبالي</span>
                <span className="text-amber-400 font-mono">782996982</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 border-b border-slate-200 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'orders'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/80'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>الطلبات الواردة ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'customers'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/80'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>العملاء وفايربيس</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'products'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/80'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>المنتجات والأصناف ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('trends')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'trends'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/80'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>حملات وترندات المتجر</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800">قائمة الطلبات المسجلة</h3>
              {orders.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl text-center border border-slate-100 text-slate-500 text-xs">
                  لا توجد طلبات واردة حتى الآن.
                </div>
              ) : (
                orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-purple-700 font-mono">
                          {ord.orderNumber}
                        </span>
                        <span className="font-bold text-xs text-slate-800">{ord.customerName}</span>
                        <span className="text-[11px] text-slate-500 font-mono">({ord.customerPhone})</span>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        {ord.status === 'preparing'
                          ? 'جاري التجهيز'
                          : ord.status === 'in_shipping'
                          ? 'جاري الشحن'
                          : ord.status === 'delivered'
                          ? 'تم التوصيل'
                          : 'ملغي'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center justify-between border-y border-slate-100 py-2">
                      <span>المحافظة: {ord.governorate}</span>
                      <span className="font-black text-purple-700">
                        الإجمالي: {safeFormatNumber(ord.total)} {ord.currency || 'ر.ي'}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => {
                          onUpdateOrderStatus(ord.id, 'in_shipping');
                          updateOrderStatusInFirestore(ord.id, 'in_shipping');
                          onShowToast(`تم تحديث حالة الطلب إلى جاري الشحن 🚚`, 'success');
                        }}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all"
                      >
                        بدء الشحن
                      </button>
                      <button
                        onClick={() => {
                          onUpdateOrderStatus(ord.id, 'delivered', true);
                          updateOrderStatusInFirestore(ord.id, 'delivered', true);
                          onShowToast(`تم تأكيد تسليم الطلب واستلام المبلغ ✅`, 'success');
                        }}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>تم التسليم والاستلام</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* CUSTOMERS & FIRESTORE TAB */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">العملاء المسجلين في فايربيس</h3>
                  <p className="text-xs text-slate-500">مزامنة حية مع مجموعة users في Firestore</p>
                </div>
                <button
                  onClick={loadUsers}
                  disabled={isLoadingUsers}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                  <span>تحديث القائمة</span>
                </button>
              </div>

              {isLoadingUsers ? (
                <div className="p-8 text-center text-xs text-slate-500">جاري تحميل العملاء من فايربيس...</div>
              ) : firestoreUsers.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl text-center border border-slate-100 text-slate-500 text-xs">
                  لا يوجد عملاء مسجلين حالياً في قاعدة البيانات.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {firestoreUsers.map((u) => (
                    <div
                      key={u.uid}
                      className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">
                          {u.firstName || 'عميل'} {u.lastName || ''}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                          <Phone className="w-3 h-3 text-purple-600" />
                          <span className="font-mono">{u.phone}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {u.governorate || 'اليمن'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteUser(u.uid)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-all"
                        title="حذف العميل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800">أصناف المتجر ({products.length})</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products.slice(0, 30).map((p) => (
                  <div
                    key={p.id}
                    className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-3"
                  >
                    <img src={p.image} alt={p.name} className="w-14 h-14 object-cover rounded-xl shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{p.name}</h4>
                      <span className="text-xs font-black text-purple-700 block mt-0.5">
                        {safeFormatNumber(p.price)} ر.ي
                      </span>
                      <span className="text-[10px] text-slate-400 block">{p.trendTag || 'بدون وسم'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TRENDS TAB */}
          {activeTab === 'trends' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800">حملات الترندات المعروضة</h3>
              <div className="space-y-3">
                {campaigns.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img src={c.bgImage} alt={c.title} className="w-16 h-12 object-cover rounded-xl" />
                      <div>
                        <span className="text-purple-600 font-bold text-xs">{c.hashtag}</span>
                        <h4 className="text-xs font-bold text-slate-800">{c.title}</h4>
                      </div>
                    </div>
                    <span className="text-xs font-bold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-xl">
                      {c.daysLeft || 'نشط'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
