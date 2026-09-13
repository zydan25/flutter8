import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, Users, Package, ShoppingBag, Flame, RefreshCw, CheckCircle, Trash2, Phone, ExternalLink } from 'lucide-react';
import type { Order, Product, TrendCampaign, User } from '../types';
import { API_BASE_URL, deleteFlaskCustomer, getFlaskCustomers, updateFlaskOrderStatus } from '../api';
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

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, orders, products, campaigns, onClose, onUpdateOrderStatus, onDeleteProduct, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'customers' | 'products' | 'trends'>('orders');
  const [customers, setCustomers] = useState<User[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  const loadCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      setCustomers((await getFlaskCustomers()) as User[]);
    } catch (error) {
      console.error(error);
      onShowToast('تعذر تحميل العملاء من خادم Flask', 'error');
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'customers') void loadCustomers();
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleOrderStatus = async (order: Order, status: Order['status'], isPaid?: boolean) => {
    try {
      const result = await updateFlaskOrderStatus(order.id, status, isPaid);
      onUpdateOrderStatus(order.id, result.order.status, result.order.isPaid);
      onShowToast('تم تحديث الطلب على خادم Flask ✅', 'success');
    } catch (error) {
      console.error(error);
      onShowToast('فشل تحديث حالة الطلب على الخادم', 'error');
    }
  };

  const handleDeleteCustomer = async (uid: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العميل من خادم Flask؟')) return;
    try {
      await deleteFlaskCustomer(uid);
      setCustomers((prev) => prev.filter((item) => item.uid !== uid));
      onShowToast('تم حذف العميل من الخادم ✅', 'success');
    } catch (error) {
      console.error(error);
      onShowToast('فشل حذف العميل من الخادم', 'error');
    }
  };

  const tabs = [
    ['orders', 'الطلبات', ShoppingBag],
    ['customers', 'العملاء', Users],
    ['products', 'المنتجات', Package],
    ['trends', 'الترندات', Flame],
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center"><ShieldCheck className="w-6 h-6" /></div>
            <div><h2 className="font-black text-base sm:text-lg">إدارة المتجر — Flask</h2><p className="text-[11px] text-slate-300">العملاء والطلبات مرتبطة بالخادم مباشرة</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.open(`${API_BASE_URL}/takhfid/admin/`, '_blank', 'noopener,noreferrer')} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold"><ExternalLink className="w-4 h-4"/> لوحة Flask الكاملة</button>
            <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-slate-100 border-b border-slate-200 overflow-x-auto no-scrollbar">
          {tabs.map(([id, label, Icon]) => <button key={id} onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${activeTab === id ? 'bg-purple-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-200'}`}><Icon className="w-4 h-4"/><span>{label}</span></button>)}
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          {activeTab === 'orders' && <div className="space-y-3">{orders.length === 0 ? <div className="bg-white p-8 rounded-2xl text-center text-sm text-slate-500">لا توجد طلبات على الخادم.</div> : orders.map((order) => <div key={order.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2 flex-wrap"><span className="font-black text-xs text-purple-700 font-mono">{order.orderNumber}</span><span className="font-bold text-xs">{order.customerName}</span><span className="text-[11px] text-slate-500 font-mono">{order.customerPhone}</span></div><span className="text-[11px] font-bold px-2 py-1 rounded-full bg-purple-50 text-purple-700">{order.status}</span></div><div className="text-xs text-slate-600 flex items-center justify-between border-y border-slate-100 py-2 mt-2"><span>{order.governorate}</span><span className="font-black text-purple-700">{safeFormatNumber(order.total)} {order.currency || 'ر.ي'}</span></div><div className="flex flex-wrap justify-end gap-2 pt-2"><button onClick={() => void handleOrderStatus(order, 'in_shipping')} className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700">بدء الشحن</button><button onClick={() => void handleOrderStatus(order, 'delivered', true)} className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5"/> تم التسليم والاستلام</button></div></div>)}</div>}
          {activeTab === 'customers' && <div className="space-y-4"><div className="flex items-center justify-between"><div><h3 className="font-bold text-sm">العملاء من Flask</h3><p className="text-xs text-slate-500">لا يوجد اتصال مباشر بـ Firestore.</p></div><button onClick={() => void loadCustomers()} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-xl"><RefreshCw className={`w-3.5 h-3.5 ${isLoadingCustomers ? 'animate-spin' : ''}`}/> تحديث</button></div>{isLoadingCustomers ? <div className="p-8 text-center text-xs text-slate-500">جاري تحميل العملاء...</div> : customers.length === 0 ? <div className="bg-white p-8 rounded-2xl text-center text-xs text-slate-500">لا يوجد عملاء.</div> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{customers.map((customer) => <div key={customer.uid} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between"><div><h4 className="text-xs font-bold">{customer.firstName || 'عميل'} {customer.lastName || ''}</h4><div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1"><Phone className="w-3 h-3 text-purple-600"/><span className="font-mono">{customer.phone}</span></div><span className="text-[10px] text-slate-400 block mt-0.5">{customer.governorate || 'اليمن'}</span></div><button onClick={() => void handleDeleteCustomer(customer.uid)} className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50"><Trash2 className="w-4 h-4"/></button></div>)}</div>}</div>}
          {activeTab === 'products' && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{products.map((product) => <div key={product.id} className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-3"><img src={product.image} alt={product.name} className="w-14 h-14 object-cover rounded-xl"/><div className="flex-1 min-w-0"><h4 className="text-xs font-bold truncate">{product.name}</h4><span className="text-xs font-black text-purple-700">{safeFormatNumber(product.price)} ر.ي</span></div><button onClick={() => onDeleteProduct(product.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4"/></button></div>)}</div>}
          {activeTab === 'trends' && <div className="space-y-3">{campaigns.map((campaign) => <div key={campaign.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between"><div className="flex items-center gap-3"><img src={campaign.bgImage} alt={campaign.title} className="w-16 h-12 object-cover rounded-xl"/><div><span className="text-purple-600 font-bold text-xs">{campaign.hashtag}</span><h4 className="text-xs font-bold">{campaign.title}</h4></div></div><span className="text-xs font-bold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-xl">{campaign.daysLeft || 'نشط'}</span></div>)}</div>}
        </div>
      </div>
    </div>
  );
};
