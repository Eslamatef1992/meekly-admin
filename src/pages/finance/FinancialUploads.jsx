import { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Upload, FileSpreadsheet, FileText, RotateCcw, Trash2, CheckCircle2,
  AlertTriangle, Loader2, Clock, Undo2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { fmtMoney } from '../../lib/format';
import { useAuthStore } from '../../lib/auth';

const UPLOAD_TYPES = [
  { value: 'chart_of_accounts', icon: FileText,        labelEn: 'Chart of Accounts', labelAr: 'شجرة الحسابات' },
  { value: 'vouchers',          icon: FileSpreadsheet, labelEn: 'Vouchers',          labelAr: 'السندات' },
];

function StatusChip({ status, t }) {
  const map = {
    queued:     { cls: 'badge-gray',  Icon: Clock },
    processing: { cls: 'badge-blue',  Icon: Loader2, spin: true },
    completed:  { cls: 'badge-green', Icon: CheckCircle2 },
    failed:     { cls: 'badge-red',   Icon: AlertTriangle },
    rolled_back:{ cls: 'badge-gray',  Icon: Undo2 },
  };
  const m = map[status] || map.queued;
  const Icon = m.Icon;
  return (
    <span className={`${m.cls} inline-flex items-center gap-1`}>
      <Icon size={12} className={m.spin ? 'animate-spin' : ''} />
      {t(`finance.uploads.status.${status}`) || status}
    </span>
  );
}

export default function FinancialUploads() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const isAr = i18n.language === 'ar';
  const branches = useAuthStore(s => s.branches);

  // Form state
  const [fiscalPeriodId, setFiscalPeriodId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [uploadType, setUploadType] = useState('vouchers');
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  // Lookups
  const { data: fiscalPeriods } = useQuery({
    queryKey: ['fiscal-periods'],
    queryFn: () => api.get('/api/lookups/fiscal-periods').then(r => r.data),
  });

  // History — polls every 3s while any job is processing
  const { data } = useQuery({
    queryKey: ['financial-uploads'],
    queryFn: () => api.get('/api/finance/uploads', { params: { page: 1, page_size: 50 } }).then(r => r.data),
    refetchInterval: (q) => {
      const rows = q.state.data?.data || [];
      return rows.some(j => j.status === 'queued' || j.status === 'processing') ? 3000 : false;
    },
  });
  const jobs = data?.data || [];

  // Create job
  const uploadMut = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('fiscal_period_id', fiscalPeriodId);
      fd.append('upload_type', uploadType);
      if (branchId) fd.append('branch_id', branchId);
      const r = await api.post('/api/finance/uploads', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return r.data;
    },
    onSuccess: () => {
      toast.success(isAr ? 'تم رفع الملف — قيد المعالجة' : 'File uploaded — processing in background');
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      qc.invalidateQueries({ queryKey: ['financial-uploads'] });
    },
    onError: (e) => {
      toast.error(e?.response?.data?.message || e.message || 'Upload failed');
    },
  });

  // Rollback
  const rollbackMut = useMutation({
    mutationFn: (id) => api.post(`/api/finance/uploads/${id}/rollback`).then(r => r.data),
    onSuccess: () => {
      toast.success(isAr ? 'تم التراجع عن الاستيراد' : 'Import rolled back');
      qc.invalidateQueries({ queryKey: ['financial-uploads'] });
      qc.invalidateQueries({ queryKey: ['vouchers'] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Rollback failed'),
  });

  // Delete record
  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/api/finance/uploads/${id}`),
    onSuccess: () => {
      toast.success(isAr ? 'تم الحذف' : 'Deleted');
      qc.invalidateQueries({ queryKey: ['financial-uploads'] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Delete failed'),
  });

  const canSubmit = useMemo(
    () => !!file && !!fiscalPeriodId && !!uploadType && !uploadMut.isPending,
    [file, fiscalPeriodId, uploadType, uploadMut.isPending],
  );

  const fmtBytes = (b) => {
    if (!b) return '0';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0, n = Number(b);
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return `${n.toFixed(n < 10 ? 2 : 0)} ${units[i]}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Upload size={22} className="text-brand-700" />
          {isAr ? 'رفع البيانات المالية' : 'Financial Uploads'}
        </h1>
        <span className="text-xs text-gray-500">
          {isAr
            ? 'ارفع ملفات الإكسل (شجرة الحسابات أو السندات) وستتم إضافتها للسنة المالية المختارة'
            : 'Upload Excel files (chart of accounts or vouchers) — rows are inserted into the chosen fiscal year'}
        </span>
      </div>

      {/* Upload form */}
      <div className="card">
        <div className="card-body grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Fiscal period */}
          <div className="md:col-span-1">
            <label className="label">{isAr ? 'السنة المالية' : 'Financial Year'} *</label>
            <select
              className="input"
              value={fiscalPeriodId}
              onChange={(e) => setFiscalPeriodId(e.target.value)}
            >
              <option value="">{isAr ? '-- اختر --' : '-- Select --'}</option>
              {(fiscalPeriods || []).map(p => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Branch (optional) */}
          <div className="md:col-span-1">
            <label className="label">
              {isAr ? 'الفرع (اختياري)' : 'Branch (optional)'}
            </label>
            <select
              className="input"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            >
              <option value="">{isAr ? 'الفرع الافتراضي' : 'Default branch'}</option>
              {(branches || []).map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Type cards */}
          <div className="md:col-span-2">
            <label className="label">{isAr ? 'نوع الملف' : 'File type'} *</label>
            <div className="grid grid-cols-2 gap-2">
              {UPLOAD_TYPES.map(opt => {
                const Icon = opt.icon;
                const active = uploadType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setUploadType(opt.value)}
                    className={`p-3 rounded-xl border-2 text-start transition flex items-center gap-3 ${
                      active
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={22} />
                    <div>
                      <div className="font-semibold text-sm">{isAr ? opt.labelAr : opt.labelEn}</div>
                      <div className="text-[11px] text-gray-500">.xls, .xlsx, .csv</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* File drop zone */}
          <div className="md:col-span-4">
            <label className="label">{isAr ? 'الملف' : 'File'} *</label>
            <label
              className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                file ? 'border-emerald-400 bg-emerald-50/50' : 'border-gray-300 hover:border-brand-400 bg-gray-50'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".xls,.xlsx,.xlsm,.csv"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <div className="space-y-1">
                  <FileSpreadsheet size={28} className="mx-auto text-emerald-600" />
                  <div className="font-semibold text-sm">{file.name}</div>
                  <div className="text-xs text-gray-500">{fmtBytes(file.size)}</div>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setFile(null); if (inputRef.current) inputRef.current.value = ''; }}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    {isAr ? 'إزالة' : 'Remove'}
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload size={28} className="mx-auto text-gray-400" />
                  <div className="text-sm font-medium">
                    {isAr ? 'اضغط لاختيار ملف أو اسحبه هنا' : 'Click to choose a file or drop it here'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {isAr ? 'الحد الأقصى: 128 ميجابايت' : 'Max 128 MB'}
                  </div>
                </div>
              )}
            </label>
          </div>

          {/* Submit */}
          <div className="md:col-span-4">
            <button
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!canSubmit}
              onClick={() => uploadMut.mutate()}
            >
              {uploadMut.isPending
                ? <Loader2 size={16} className="animate-spin" />
                : <Upload size={16} />}
              {isAr ? 'رفع و معالجة' : 'Upload & process'}
            </button>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="card">
        <div className="px-4 pt-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isAr ? 'سجل العمليات' : 'Upload history'}
          </h2>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['financial-uploads'] })}
            className="btn-ghost text-xs"
          >
            <RotateCcw size={12} /> {isAr ? 'تحديث' : 'Refresh'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>{isAr ? 'النوع' : 'Type'}</th>
                <th>{isAr ? 'السنة' : 'Financial Year'}</th>
                <th>{isAr ? 'الملف' : 'File'}</th>
                <th>{isAr ? 'الحالة' : 'Status'}</th>
                <th className="text-end">{isAr ? 'المدخل' : 'Inserted'}</th>
                <th className="text-end">{isAr ? 'الفاشل' : 'Failed'}</th>
                <th className="text-end">{isAr ? 'المدين' : 'Debit'}</th>
                <th className="text-end">{isAr ? 'الدائن' : 'Credit'}</th>
                <th>{isAr ? 'بواسطة' : 'By'}</th>
                <th>{isAr ? 'التاريخ' : 'Date'}</th>
                <th className="text-end">{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 && (
                <tr><td colSpan={12} className="text-center py-8 text-gray-500">
                  {isAr ? 'لا توجد عمليات رفع بعد' : 'No uploads yet'}
                </td></tr>
              )}
              {jobs.map(j => (
                <tr key={j.id} className="hover:bg-gray-50">
                  <td className="font-mono text-xs">#{j.id}</td>
                  <td className="text-xs">
                    {j.upload_type === 'chart_of_accounts'
                      ? (isAr ? 'شجرة الحسابات' : 'Chart of Accounts')
                      : (isAr ? 'السندات' : 'Vouchers')}
                  </td>
                  <td className="text-xs">{j.FiscalPeriod?.code || '—'}</td>
                  <td className="text-xs max-w-xs truncate" title={j.original_filename}>
                    {j.original_filename}
                    <div className="text-[10px] text-gray-400">{fmtBytes(j.file_size)}</div>
                  </td>
                  <td><StatusChip status={j.status} t={t} /></td>
                  <td className="text-end font-mono text-xs">{Number(j.inserted_rows).toLocaleString()}</td>
                  <td className={`text-end font-mono text-xs ${j.failed_rows > 0 ? 'text-rose-600' : ''}`}>
                    {Number(j.failed_rows).toLocaleString()}
                  </td>
                  <td className="text-end font-mono text-xs">{fmtMoney(j.total_debit)}</td>
                  <td className="text-end font-mono text-xs">{fmtMoney(j.total_credit)}</td>
                  <td className="text-xs">{j.uploader?.full_name || j.uploader?.email || '—'}</td>
                  <td className="text-xs">{new Date(j.created_at).toLocaleString()}</td>
                  <td className="text-end whitespace-nowrap">
                    {['completed', 'failed'].includes(j.status) && (
                      <button
                        onClick={() => {
                          if (window.confirm(isAr
                            ? `سيتم حذف جميع الصفوف المستوردة بهذا الملف. متابعة؟`
                            : 'This will delete every row imported by this file. Continue?')) {
                            rollbackMut.mutate(j.id);
                          }
                        }}
                        className="btn-ghost text-xs text-amber-700"
                        title={isAr ? 'تراجع' : 'Rollback'}
                      >
                        <Undo2 size={12} />
                      </button>
                    )}
                    {['completed', 'failed', 'rolled_back'].includes(j.status) && (
                      <button
                        onClick={() => {
                          if (window.confirm(isAr ? 'حذف هذا السجل؟' : 'Delete this record?')) {
                            deleteMut.mutate(j.id);
                          }
                        }}
                        className="btn-ghost text-xs text-rose-600"
                        title={isAr ? 'حذف' : 'Delete'}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                    {j.error_message && (
                      <button
                        onClick={() => alert(j.error_message)}
                        className="btn-ghost text-xs text-gray-500"
                        title={isAr ? 'عرض الأخطاء' : 'View errors'}
                      >
                        <AlertTriangle size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
