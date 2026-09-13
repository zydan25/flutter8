import React, { useMemo, useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, CheckCircle } from 'lucide-react';
import type { CartItem, Order, User } from '../types';
import { ALL_GOVERNORATES } from '../data/governorates';
import { createOrder } from '../orderService';
import { convertBasePrice, getDeliveryFeeForCurrency, getGovernorateMarkupMultiplier, safeFormatNumber } from '../utils/pricing';

interface CartModalProps { isOpen: boolean; cartItems: CartItem[]; user: User | null; currency: 'YER' | 'SAR'; onClose: () => void; onUpdateQuantity: (productId: string, quantity: number) => void; onRemoveItem: (productId: string) => void; onClearCart: () => void; onOrderPlaced: (order: Order) => void; onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void; }

export const CartModal: React.FC<CartModalProps> = ({ isOpen, cartItems, user, currency, onClose, onUpdateQuantity, onRemoveItem, onClearCart, onOrderPlaced, onShowToast }) => {
  const [customerName, setCustomerName] = useState('');
  const [governorate, setGovernorate] = useState('أمانة العاصمة');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Order['paymentMethod']>('cash_on_delivery');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + convertBasePrice(Number(item.price || item.product?.price || 0) * Math.max(1, item.quantity || 1), currency, governorate), 0), [cartItems, currency, governorate]);
  const shippingFee = useMemo(() => getDeliveryFeeForCurrency(governorate, currency), [governorate, currency]);
  const total = subtotal + (cartItems.length ? shippingFee : 0);
  const markupPercent = Math.round((getGovernorateMarkupMultiplier(governorate) - 1) * 100);

  if (!isOpen) return null;

  const handleCheckout = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!user) { onShowToast('سجّل الدخول برقم الهاتف أولاً لإتمام الطلب', 'error'); return; }
    if (!customerName.trim()) { onShowToast('يرجى إدخال الاسم الكامل', 'error'); return; }
    if (!cartItems.length) { onShowToast('السلة فارغة', 'error'); return; }
    setIsSubmitting(true);
    try {
      const order = await createOrder({ customerName: customerName.trim(), governorate, address: address.trim(), currency, paymentMethod, items: cartItems.map((item) => ({ productId: item.product.id, quantity: Math.max(1, item.quantity), color: item.selectedColor, size: item.selectedSize })) });
      onOrderPlaced(order);
      onClearCart();
      onClose();
      onShowToast(order.status === 'awaiting_payment' ? `تم إنشاء الطلب ${order.orderNumber}، راجع المحادثة لإتمام التحويل ✅` : `تم تأكيد الطلب رقم ${order.orderNumber} ✅`, 'success');
    } catch (error: any) { console.error('Order creation failed:', error); onShowToast(error?.message || 'تعذر إنشاء الطلب، حاول مرة أخرى', 'error'); }
    finally { setIsSubmitting(false); }
  };

  return <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}><div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col" onClick={(event) => event.stopPropagation()}>
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100"><div className="flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-purple-700"/><h2 className="font-extrabold">سلة التسوق</h2><span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span></div><button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100"><X className="w-5 h-5"/></button></div>
    <div className="flex-1 overflow-y-auto p-4 space-y-4">{!cartItems.length ? <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500"><ShoppingBag className="w-10 h-10 text-purple-300 mb-2"/><h3 className="font-bold text-slate-800">السلة فارغة</h3></div> : <>
      {cartItems.map((item) => <div key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`} className="flex gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100"><img src={item.product.image} alt={item.product.name} className="w-16 h-16 rounded-xl object-cover"/><div className="flex-1 min-w-0"><h4 className="font-bold text-xs truncate">{item.product.name}</h4><div className="text-[10px] text-slate-500 mt-1">{item.selectedColor && `اللون: ${item.selectedColor} `}{item.selectedSize && `المقاس: ${item.selectedSize}`}</div><span className="block text-xs font-black text-purple-700 mt-1">{safeFormatNumber(convertBasePrice(Number(item.price || 0) * item.quantity, currency, governorate))} {currency === 'SAR' ? 'ر.س' : 'ر.ي'}</span><div className="flex items-center gap-2 mt-2"><button onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))} className="w-7 h-7 bg-white rounded-lg border">−</button><span className="text-xs font-bold">{item.quantity}</span><button onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)} className="w-7 h-7 bg-white rounded-lg border">+</button></div></div><button onClick={() => onRemoveItem(item.product.id)} className="text-slate-400 hover:text-rose-500 h-fit"><Trash2 className="w-4 h-4"/></button></div>)}
      <form onSubmit={handleCheckout} className="pt-3 border-t space-y-3"><h3 className="font-bold text-sm">بيانات التوصيل</h3><input required value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="الاسم الكامل *" className="w-full p-2.5 rounded-xl border text-xs"/><select value={governorate} onChange={(event) => setGovernorate(event.target.value)} className="w-full p-2.5 rounded-xl border text-xs">{ALL_GOVERNORATES.map((item) => <option key={item}>{item}</option>)}</select><input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="العنوان التفصيلي" className="w-full p-2.5 rounded-xl border text-xs"/><select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as Order['paymentMethod'])} className="w-full p-2.5 rounded-xl border text-xs"><option value="cash_on_delivery">الدفع عند الاستلام</option><option value="kuraimi">كريمي</option><option value="jawali">جوالي</option><option value="one_cash">ون كاش</option></select></form>
    </>}</div>
    {!!cartItems.length && <div className="p-4 border-t bg-slate-50 space-y-2"><div className="flex justify-between text-xs"><span>قيمة المنتجات</span><b>{safeFormatNumber(subtotal)} {currency === 'SAR' ? 'ر.س' : 'ر.ي'}</b></div><div className="flex justify-between text-xs"><span>التوصيل</span><b>{shippingFee === 0 ? 'مجاني' : `${safeFormatNumber(shippingFee)} ${currency === 'SAR' ? 'ر.س' : 'ر.ي'}`}</b></div><div className="text-[10px] text-slate-400">هامش المحافظة المضاف: {markupPercent}% — سعر الصرف محدد حسب المحافظة.</div><div className="flex justify-between text-sm font-black text-purple-700 border-t pt-2"><span>الإجمالي</span><span>{safeFormatNumber(total)} {currency === 'SAR' ? 'ر.س' : 'ر.ي'}</span></div><button type="submit" formAction="#" onClick={() => handleCheckout()} disabled={isSubmitting} className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4"/>{isSubmitting ? 'جاري إنشاء الطلب...' : paymentMethod === 'cash_on_delivery' ? 'تأكيد الطلب الآن' : 'إنشاء الطلب والانتقال للدفع'}<ArrowRight className="w-4 h-4"/></button></div>}
  </div></div>;
};