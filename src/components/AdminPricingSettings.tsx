import React, { useEffect, useMemo, useState } from 'react';
import { Save, RefreshCw, KeyRound, Truck, Settings2 } from 'lucide-react';
import type { GovernoratePricingSetting, IntegrationSettings } from '../adminSettingsService';
import { getIntegrationSettings, saveIntegrationSettings, savePricingSetting } from '../adminSettingsService';

interface Props {
  settings: GovernoratePricingSetting[];
  onRefresh: () => void;
  onSaved: () => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const emptyIntegration: IntegrationSettings = {
  whatsappSendUrl: '',
  whatsappApiKey: '',
  whatsappApiKeyHeader: 'Authorization',
  whatsappApiKeyPrefix: 'Bearer ',
  otpHashSecret: '',
  adminPhones: [],
  apiBaseUrl: '',
};

export const AdminPricingSettings: React.FC<Props> = ({ settings, onRefresh, onSaved, onShowToast }) => {
  const [rows, setRows] = useState<GovernoratePricingSetting[]>(settings);
  const [integration, setIntegration] = useState<IntegrationSettings>(emptyIntegration);
  const [saving, setSaving] = useState<string | null>(null);
  const [loadingIntegration, setLoadingIntegration] = useState(true);

  useEffect(() => setRows(settings), [settings]);
  useEffect(() => {
    let active = true;
    getIntegrationSettings().then((value) => { if (active && value) setIntegration({ ...emptyIntegration, ...value }); }).catch((error) => console.error(error)).finally(() => { if (active) setLoadingIntegration(false); });
    return () => { active = false; };
  }, []);

  const grouped = useMemo(() => ({ north: rows.filter((r) => r.region === 'north'), south: rows.filter((r) => r.region === 'south') }), [rows]);

  const updateRow = (governorate: string, patch: Partial<GovernoratePricingSetting>) => {
    setRows((current) => current.map((row) => row.governorate === governorate ? { ...row, ...patch } : row));
  };

  const saveRow = async (row: GovernoratePricingSetting) => {
    setSaving(row.governorate);
    try { await savePricingSetting(row); onSaved(); onShowToast(`تم حفظ تسعير ${row.governorate} ✅`); }
    catch (error) { console.error(error); onShowToast(`فشل حفظ تسعير ${row.governorate}`, 'error'); }
    finally { setSaving(null); }
  };

  const saveIntegration = async () => {
    setSaving('integration');
    try { await saveIntegrationSettings(integration); onShowToast('تم حفظ إعدادات واتساب والإدارة ✅'); }
    catch (error) { console.error(error); onShowToast('فشل حفظ الإعدادات', 'error'); }
    finally { setSaving(null); }
  };

  const renderGroup = (title: string, list: GovernoratePricingSetting[]) => (
    <section className="space-y-3">
      <h3 className="font-black text-sm flex items-center gap-2"><Truck className="w-4 h-4 text-purple-600" />{title}</h3>
      {list.map((row) => (
        <div key={row.governorate} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div><div className="font-black text-sm">{row.governorate}</div><div className="text-[11px] text-slate-500">{row.region === 'north' ? 'شمال' : 'جنوب'}</div></div>
            <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={row.isActive} onChange={(e) => updateRow(row.governorate, { isActive: e.target.checked })} /> فعال</label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] font-bold">SAR → YER<input type="number" min="0.01" step="0.01" value={row.sarToYerRate} onChange={(e) => updateRow(row.governorate, { sarToYerRate: Number(e.target.value) })} className="mt-1 w-full rounded-xl border p-2 text-xs" /></label>
            <label className="text-[11px] font-bold">USD → YER<input type="number" min="0.01" step="0.01" value={row.usdToYerRate} onChange={(e) => updateRow(row.governorate, { usdToYerRate: Number(e.target.value) })} className="mt-1 w-full rounded-xl border p-2 text-xs" /></label>
            <label className="text-[11px] font-bold">نوع الزيادة<select value={row.markupType} onChange={(e) => updateRow(row.governorate, { markupType: e.target.value as 'percentage' | 'fixed' })} className="mt-1 w-full rounded-xl border p-2 text-xs"><option value="percentage">نسبة %</option><option value="fixed">قيمة ثابتة</option></select></label>
            <label className="text-[11px] font-bold">قيمة الزيادة<input type="number" min="0" step="0.01" value={row.markupValue} onChange={(e) => updateRow(row.governorate, { markupValue: Number(e.target.value) })} className="mt-1 w-full rounded-xl border p-2 text-xs" /></label>
            <label className="text-[11px] font-bold">التوصيل YER<input type="number" min="0" step="1" value={row.deliveryFeeYer} onChange={(e) => updateRow(row.governorate, { deliveryFeeYer: Number(e.target.value), freeDeliveryIncluded: Number(e.target.value) === 0 })} className="mt-1 w-full rounded-xl border p-2 text-xs" /></label>
            <label className="text-[11px] font-bold">التوصيل SAR<input type="number" min="0" step="0.01" value={row.deliveryFeeSar} onChange={(e) => updateRow(row.governorate, { deliveryFeeSar: Number(e.target.value) })} className="mt-1 w-full rounded-xl border p-2 text-xs" /></label>
          </div>
          <label className="block text-[11px] font-bold">ملاحظة التوصيل<input value={row.deliveryNote} onChange={(e) => updateRow(row.governorate, { deliveryNote: e.target.value })} className="mt-1 w-full rounded-xl border p-2 text-xs" /></label>
          <button disabled={saving === row.governorate} onClick={() => saveRow(row)} className="w-full py-2 rounded-xl bg-purple-600 text-white text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50"><Save className="w-4 h-4" />{saving === row.governorate ? 'جاري الحفظ...' : 'حفظ إعداد المحافظة'}</button>
        </div>
      ))}
    </section>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h3 className="font-black text-sm">التسعير والصرف والتوصيل</h3><p className="text-xs text-slate-500">تغيير الأسعار من اللوحة بدون تعديل الكود.</p></div>
        <button onClick={onRefresh} className="p-2 rounded-xl bg-white border"><RefreshCw className="w-4 h-4" /></button>
      </div>
      {renderGroup('المحافظات الشمالية', grouped.north)}
      {renderGroup('المحافظات الجنوبية', grouped.south)}

      <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <h3 className="font-black text-sm flex items-center gap-2"><Settings2 className="w-4 h-4 text-purple-600" />إعدادات التطبيق والخادم</h3>
        {loadingIntegration ? <p className="text-xs text-slate-500">جاري تحميل الإعدادات...</p> : <>
          <label className="text-[11px] font-bold block">رابط API إرسال واتساب<input value={integration.whatsappSendUrl} onChange={(e) => setIntegration({ ...integration, whatsappSendUrl: e.target.value })} placeholder="https://.../send" className="mt-1 w-full rounded-xl border p-2 text-xs" /></label>
          <label className="text-[11px] font-bold block">مفتاح WhatsApp API<input type="password" value={integration.whatsappApiKey} onChange={(e) => setIntegration({ ...integration, whatsappApiKey: e.target.value })} className="mt-1 w-full rounded-xl border p-2 text-xs" /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] font-bold">اسم Header للمفتاح<input value={integration.whatsappApiKeyHeader} onChange={(e) => setIntegration({ ...integration, whatsappApiKeyHeader: e.target.value })} className="mt-1 w-full rounded-xl border p-2 text-xs" /></label>
            <label className="text-[11px] font-bold">بادئة المفتاح<input value={integration.whatsappApiKeyPrefix} onChange={(e) => setIntegration({ ...integration, whatsappApiKeyPrefix: e.target.value })} className="mt-1 w-full rounded-xl border p-2 text-xs" /></label>
          </div>
          <label className="text-[11px] font-bold block">سر هاش OTP<input type="password" value={integration.otpHashSecret} onChange={(e) => setIntegration({ ...integration, otpHashSecret: e.target.value })} className="mt-1 w-full rounded-xl border p-2 text-xs" /></label>
          <label className="text-[11px] font-bold block">أرقام الإدارة<input value={integration.adminPhones.join(',')} onChange={(e) => setIntegration({ ...integration, adminPhones: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })} placeholder="9677xxxxxxx,9677yyyyyyy" className="mt-1 w-full rounded-xl border p-2 text-xs" /></label>
          <label className="text-[11px] font-bold block">رابط API الخاص بالاستضافة<input value={integration.apiBaseUrl} onChange={(e) => setIntegration({ ...integration, apiBaseUrl: e.target.value })} placeholder="https://api.example.com" className="mt-1 w-full rounded-xl border p-2 text-xs" /></label>
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-900">إعدادات المفاتيح تحفظ في Firestore خلف صلاحيات المدير، لكن الأفضل تنفيذ إرسال واتساب والـOTP من خادم الاستضافة وليس مباشرة من المتصفح.</div>
          <button disabled={saving === 'integration'} onClick={saveIntegration} className="w-full py-2 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50"><KeyRound className="w-4 h-4" />{saving === 'integration' ? 'جاري الحفظ...' : 'حفظ إعدادات التكامل'}</button>
        </>}
      </section>
    </div>
  );
};
