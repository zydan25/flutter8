import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, Users, Package, ShoppingBag, Flame, RefreshCw, CheckCircle, Trash2, Phone, ExternalLink } from 'lucide-react';
import type { Order, Product, TrendCampaign, User } from '../types';
import { deleteFlaskCustomer, getFlaskCustomers, updateFlaskOrderStatus } from '../api';
import { safeFormatNumber } from '../utils/pricing';

interface Props {
  isOpen: boolean;
  orders: Order[];
  products: Product[];
  campaigns: TrendCampaign[];
  onClose: () => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status'], isPaid?: boolean) => void;
  onDeleteProduct: (productId: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminFlaskModal: React.FC<Props> = ({ isOpen, orders, products, campaigns, onClose, onUpdateOrderStatus, onDeleteProduct, onShowToast }) => {
  const [tab, setTab] = useState<'orders' | 'customers' | 'products' | 'trends'>('orders');
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      setCustomers((await getFlaskCustomers()) as User[]);
    } catch (error) {
      console.error(error);
      onShowToast('تعذر تحميل العملاء من Flask', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && tab === 'customers') void loadCustomers();
  }, [isOpen, tab]);

  if (!isOpen) return null;

  const updateStatus = async (order: Order, status: Order['status'], isPaid?: boolean) => {
    try {
      const result = await updateFlaskOrderStatus(order.id, status, isPaid);
      onUpdateOrderStatus(order.id, result.order.status, result.order.isPaid);
      onShowToast('تم تحديث الطلب على الخادم ✅', 'success');
    } catch (error) {
      console.error(error);
      onShowToast('فشل تحديث الطلب على Flask', 'error');
    }
  };

  const removeCustomer = async (uid: string) => {
    if (!window.confirm('حذف العميل من خادم Flask؟')) return;
    try {
      await deleteFlaskCustomer(uid);
      setCustomers((prev) => prev.filter((item) => item.uid !== uid));
      onShowToast('تم حذف العميل من الخادم ✅', 'success');
    } catch (error) {
      console.error(error);
      onShowToast('فشل حذف العميل', 'error');
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
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900 text-white">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center"><ShieldCheck className="w-6 h-6" /></div><div><h2 className="font-black text-base sm:text-lg">إدارة المتجر — Flask</h2><p className="text-[11px] text-slate-300">إدارة مرتبطة بالخادم وليس Firestore</p></div></div>
          <div className="flex items-center gap-2"><button onClick={() => window.open('/takhfid/admin/', '_blank', 'noopener,noreferrer')} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-xs font-bold"><ExternalLink className="w-4 h-4"/> لوحة Flask الكاملة</button><button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"><X className="w-5 h-5"/></button></div>
        </div>
        <div className="flex gap-2 px-4 sm:px-6 py-2.5 bg-slate-100 border-b overflow-x-auto no-scrollbar">
          {tabs.map(([id, label, Icon]) => <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${tab === id ? 'bg-purple-600 text-white' : 'bg-white text-slate-700'}`}><Icon className="w-4 h-4"/><span>{label}</span></button>)}
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          {tab === 'orders' && <div className="space-y-3">{orders.length === 0 ? <div className="bg-white p-8 rounded-2xl text-center text-sm text-slate-500">لا توجد طلبات على Flask.</div> : orders.map((order) => <div key={order.id} className="bg-white p-4 rounded-2xl border border-slate-200"><div className="flex flex-wrap justify-between gap-2"><div className="flex gap-2 items-center"><b className="text-xs text-purple-700 font-mono">{order.orderNumber}</b><b className="text-xs">{order.customerName}</b><span className="text-[11px] text-slate-500">{order.customerPhone}</span></div><span className="text-[11px] font-bold bg-purple-50 text-purple-700 px-2 py-1 rounded-full">{order.status}</span></div><div className="flex justify-between gap-2 text-xs border-y my-2 py-2"><span>{order.governorate}</span><b className="text-purple-700">{safeFormatNumber(order.total)} {order.currency || 'ر.ي'}</b></div><div className="flex justify-end gap-2"><button onClick={() => void updateStatus(order, 'in_shipping')} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700">بدء الشحن</button><button onClick={() => void updateStatus(order, 'delivered', true)} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 flex gap-1 items-center"><CheckCircle className="w-3.5 h-3.5"/> تم التسليم</button></div></div>)}</div>}
          {tab === 'customers' && <div className="space-y-4"><div className="flex justify-between items-center"><div><h3 className="text-sm font-bold">عملاء Flask</h3><p className="text-xs text-slate-500">البيانات من قاعدة الخادم.</p></div><button onClick={() => void loadCustomers()} className="flex gap-1.5 items-center text-xs font-bold bg-white border px-3 py-1.5 rounded-xl"><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}/> تحديث</button></div>{customers.length === 0 ? <div className="bg-white p-8 rounded-2xl text-center text-xs text-slate-500">لا يوجد عملاء.</div> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{customers.map((customer) => <div key={customer.uid} className="bg-white p-4 rounded-2xl border flex justify-between items-center"><div><b className="text-xs">{customer.firstName || 'عميل'} {customer.lastName || ''}</b><div className="flex gap-1.5 items-center text-[11px] text-slate-500 mt-1"><Phone className="w-3 h-3 text-purple-600"/><span>{customer.phone}</span></div><span className="text-[10px] text-slate-400">{customer.governorate || 'اليمن'}</span></div><button onClick={() => void removeCustomer(customer.uid)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4"/></button></div>)}</div>}</div>}
          {tab === 'products' && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{products.map((product) => <div key={product.id} className="bg-white p-3 rounded-2xl border flex items-center gap-3"><img src={product.image} alt={product.name} className="w-14 h-14 rounded-xl object-cover"/><div className="flex-1 min-w-0"><b className="text-xs block truncate">{product.name}</b><span className="text-xs font-black text-purple-700">{safeFormatNumber(product.price)} ر.ي</span></div><button onClick={() => onDeleteProduct(product.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4"/></button></div>)}</div>}
          {tab === 'trends' && <div className="space-y-3">{campaigns.map((campaign) => <div key={campaign.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center"><div className="flex gap-3 items-center"><img src={campaign.bgImage} alt={campaign.title} className="w-16 h-12 object-cover rounded-xl"/><div><span className="text-purple-600 text-xs font-bold">{campaign.hashtag}</span><h4 className="text-xs font-bold">{campaign.title}</h4></div></div><span className="text-xs font-bold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-xl">{campaign.daysLeft || 'نشط'}</span></div>)}</div>}
        </div>
      </div>
    </div>
  );
};
