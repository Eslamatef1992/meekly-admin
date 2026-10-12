import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Pencil, Eye, X, Calculator, Calendar, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';
import { fmtDate, fmtMoney } from '../../lib/format';
import Pagination from '../../components/Pagination';
import ExportToolbar from '../../components/ExportToolbar';

function EmployeeFormModal({ open, onClose, initial, onSubmit, departments, branches }) {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState(initial || {});
  const [tab, setTab] = useState('personal');

  // Reset form state every time the modal opens with new initial values
  useEffect(() => {
    if (open) {
      setForm(initial || {});
      setTab('personal');
    }
  }, [open, initial]);

  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const tabs = ['personal', 'job', 'compensation', 'documents', 'licenses'];

  // Client-side validation before submitting
  const validateAndSubmit = () => {
    const missing = [];
    if (!form.employee_no) missing.push('Employee No (Personal tab)');
    if (!form.full_name)   missing.push('Full Name (Personal tab)');
    if (!form.branch_id)   missing.push('Branch (Job tab)');
    if (!form.hire_date)   missing.push('Hire Date (Job tab)');
    if (missing.length) {
      toast.error('Required fields missing: ' + missing.join(', '));
      // jump to the first tab containing a missing field
      if (!form.employee_no || !form.full_name) setTab('personal');
      else if (!form.branch_id || !form.hire_date) setTab('job');
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-2 sm:p-4 overflow-auto">
      <div className="card w-full max-w-4xl max-h-[95vh] flex flex-col">
        <div className="card-header sticky top-0 bg-white z-10">
          <h3 className="font-semibold">{initial?.id ? t('common.edit') : t('common.create')} — Employee</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={18}/></button>
        </div>

        <div className="flex border-b border-gray-200 px-5 bg-white sticky top-[57px] z-10">
          {tabs.map(tname => (
            <button key={tname} onClick={() => setTab(tname)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize
                ${tab === tname ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t(`employee.tab_${tname}`)}
            </button>
          ))}
        </div>

        <div className="card-body overflow-y-auto">
          {tab === 'personal' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3 flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white grid place-items-center text-2xl font-semibold overflow-hidden shrink-0">
                  {form.image_url
                    ? <img src={form.image_url} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }}/>
                    : ((form.full_name || '?').charAt(0).toUpperCase())}
                </div>
                <div className="flex-1">
                  <label className="label">Photo URL</label>
                  <input className="input" value={form.image_url || ''} onChange={e => set('image_url', e.target.value)} placeholder="https://… or /uploads/employees/123/photo.jpg" />
                  <p className="text-xs text-gray-500 mt-1">Paste a URL to the employee's photo. File upload coming soon.</p>
                </div>
              </div>
              <div><label className="label">Employee No</label><input className="input" value={form.employee_no || ''} onChange={e => set('employee_no', e.target.value)} placeholder="EMP-0001" /></div>
              <div className="md:col-span-2"><label className="label">Full Name (English)</label><input className="input" value={form.full_name || ''} onChange={e => set('full_name', e.target.value)} /></div>
              <div className="md:col-span-3"><label className="label">الاسم الكامل (بالعربية)</label><input className="input" value={form.full_name_ar || ''} onChange={e => set('full_name_ar', e.target.value)} dir="rtl" /></div>
              <div><label className="label">Email</label><input className="input" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} /></div>
              <div><label className="label">Phone</label><input className="input" value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></div>
              <div><label className="label">Gender</label>
                <select className="input" value={form.gender || ''} onChange={e => set('gender', e.target.value)}>
                  <option value="">—</option><option value="male">Male</option><option value="female">Female</option>
                </select>
              </div>
              <div><label className="label">Date of Birth</label><input type="date" className="input" value={form.date_of_birth?.slice(0,10) || ''} onChange={e => set('date_of_birth', e.target.value)} /></div>
              <div><label className="label">Nationality</label>
                <input className="input" value={form.nationality || ''} onChange={e => set('nationality', e.target.value)} placeholder="Kuwaiti, Egyptian, Indian..." list="nationalities" />
                <datalist id="nationalities">
                  <option>Kuwaiti</option><option>Egyptian</option><option>Saudi</option><option>Jordanian</option><option>Lebanese</option><option>Syrian</option><option>Indian</option><option>Pakistani</option><option>Filipino</option><option>Bangladeshi</option><option>Sri Lankan</option>
                </datalist>
              </div>
              <div><label className="label">Civil ID</label><input className="input" value={form.civil_id_no || ''} onChange={e => set('civil_id_no', e.target.value)} placeholder="12 digits" maxLength={12} /></div>
              <div><label className="label">Civil ID Expiry</label><input type="date" className="input" value={form.civil_id_expiry?.slice(0,10) || ''} onChange={e => set('civil_id_expiry', e.target.value)} /></div>
              <div><label className="label">Passport No</label><input className="input" value={form.passport_no || ''} onChange={e => set('passport_no', e.target.value)} /></div>
              <div><label className="label">Passport Expiry</label><input type="date" className="input" value={form.passport_expiry?.slice(0,10) || ''} onChange={e => set('passport_expiry', e.target.value)} /></div>
            </div>
          )}

          {tab === 'job' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className="label">Branch</label>
                <select className="input" value={form.branch_id || ''} onChange={e => set('branch_id', Number(e.target.value))}>
                  <option value="">—</option>
                  {(branches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div><label className="label">Department</label>
                <select className="input" value={form.department_id || ''} onChange={e => set('department_id', Number(e.target.value))}>
                  <option value="">—</option>
                  {(departments || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div><label className="label">Status</label>
                <select className="input" value={form.status || 'active'} onChange={e => set('status', e.target.value)}>
                  <option value="active">Active</option><option value="on_leave">On Leave</option><option value="resigned">Resigned</option><option value="terminated">Terminated</option>
                </select>
              </div>
              <div><label className="label">Job Title (EN)</label><input className="input" value={form.job_title || ''} onChange={e => set('job_title', e.target.value)} /></div>
              <div><label className="label">المسمى الوظيفي (AR)</label><input className="input" dir="rtl" value={form.job_title_ar || ''} onChange={e => set('job_title_ar', e.target.value)} /></div>
              <div><label className="label">Contract Type</label>
                <select className="input" value={form.contract_type || 'unlimited'} onChange={e => set('contract_type', e.target.value)}>
                  <option value="unlimited">Unlimited (غير محدد المدة)</option>
                  <option value="limited">Limited (محدد المدة)</option>
                </select>
              </div>
              <div><label className="label">Hire Date *</label><input type="date" className="input" required value={form.hire_date?.slice(0,10) || ''} onChange={e => set('hire_date', e.target.value)} /></div>
              <div><label className="label">Probation End</label><input type="date" className="input" value={form.probation_end?.slice(0,10) || ''} onChange={e => set('probation_end', e.target.value)} /></div>
              <div><label className="label">End Date (if any)</label><input type="date" className="input" value={form.end_date?.slice(0,10) || ''} onChange={e => set('end_date', e.target.value)} /></div>
            </div>
          )}

          {tab === 'compensation' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className="label">Basic Salary (KWD) — الأساسي</label><input type="number" step="0.001" className="input text-end font-mono" value={form.basic_salary || 0} onChange={e => set('basic_salary', e.target.value)} /></div>
              <div><label className="label">Manual / Cash — اليدوي</label><input type="number" step="0.001" className="input text-end font-mono" value={form.manual_salary || 0} onChange={e => set('manual_salary', e.target.value)} /></div>
              <div><label className="label">Work-Permit Declared — اذن العمل</label><input type="number" step="0.001" className="input text-end font-mono" value={form.work_permit_salary || 0} onChange={e => set('work_permit_salary', e.target.value)} /></div>
              <div><label className="label">Housing Allowance</label><input type="number" step="0.001" className="input text-end font-mono" value={form.housing_allowance || 0} onChange={e => set('housing_allowance', e.target.value)} /></div>
              <div><label className="label">Transport Allowance</label><input type="number" step="0.001" className="input text-end font-mono" value={form.transport_allowance || 0} onChange={e => set('transport_allowance', e.target.value)} /></div>
              <div><label className="label">Other Allowance</label><input type="number" step="0.001" className="input text-end font-mono" value={form.other_allowance || 0} onChange={e => set('other_allowance', e.target.value)} /></div>
              <div><label className="label">Bank Name</label><input className="input" value={form.bank_name || ''} onChange={e => set('bank_name', e.target.value)} /></div>
              <div className="md:col-span-2"><label className="label">IBAN</label><input className="input font-mono" value={form.bank_iban || ''} onChange={e => set('bank_iban', e.target.value)} placeholder="KW81CBKU0000..." /></div>
              <div className="md:col-span-3 bg-blue-50 text-sm text-blue-800 p-3 rounded border border-blue-200">
                <strong>Salary fields explained:</strong> "Basic" + "Manual / Cash" + allowances form the gross pay. "Work-Permit Declared" is informational — it's what's printed on the Iqama and used for renewal docs (does not affect payroll). Additional allowances/deductions can be configured per employee from <strong>Salary Components</strong>.
              </div>
            </div>
          )}

          {tab === 'documents' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className="label">Work Permit No</label><input className="input" value={form.work_permit_no || ''} onChange={e => set('work_permit_no', e.target.value)} /></div>
              <div><label className="label">Work Permit Expiry</label><input type="date" className="input" value={form.work_permit_expiry?.slice(0,10) || ''} onChange={e => set('work_permit_expiry', e.target.value)} /></div>
              <div><label className="label">Residency (Iqama) Expiry</label><input type="date" className="input" value={form.residency_expiry?.slice(0,10) || ''} onChange={e => set('residency_expiry', e.target.value)} /></div>
              <div><label className="label">Health Card Expiry</label><input type="date" className="input" value={form.health_card_expiry?.slice(0,10) || ''} onChange={e => set('health_card_expiry', e.target.value)} /></div>
              <div className="md:col-span-2"><label className="label">Last Return from Leave — تاريخ آخر رجوع من إجازة</label><input type="date" className="input" value={form.last_leave_return_date?.slice(0,10) || ''} onChange={e => set('last_leave_return_date', e.target.value)} /></div>
              <div className="md:col-span-3"><label className="label">Notes</label><textarea className="input" rows="3" value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Any additional information about the employee..." /></div>
              <div className="md:col-span-3 bg-yellow-50 text-sm text-yellow-800 p-3 rounded border border-yellow-200">
                For document file attachments (Civil ID copy, Passport scan, Iqama photo, contract PDF, etc.) go to the employee's <strong>detail page → Documents tab</strong> after saving.
              </div>
            </div>
          )}

          {tab === 'licenses' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2 bg-blue-50 text-sm text-blue-800 p-3 rounded border border-blue-200">
                Driving license, vehicle registration, and other recurring expirations. Dashboard will alert you 60 days before each.
              </div>
              <div><label className="label">Driving License No</label><input className="input" value={form.driving_license_no || ''} onChange={e => set('driving_license_no', e.target.value)} /></div>
              <div><label className="label">Driving License Expiry</label><input type="date" className="input" value={form.driving_license_expiry?.slice(0,10) || ''} onChange={e => set('driving_license_expiry', e.target.value)} /></div>
              <div><label className="label">Car Plate No</label><input className="input" value={form.car_plate_no || ''} onChange={e => set('car_plate_no', e.target.value)} placeholder="e.g. 12345 ABC" /></div>
              <div><label className="label">Car Registration Expiry</label><input type="date" className="input" value={form.car_registration_expiry?.slice(0,10) || ''} onChange={e => set('car_registration_expiry', e.target.value)} /></div>
            </div>
          )}
        </div>

        <div className="card-header sticky bottom-0 bg-white !justify-end gap-2 border-t border-gray-100">
          <button className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn-primary" onClick={validateAndSubmit}>{t('common.save')}</button>
        </div>
      </div>
    </div>
  );
}

export default function Employees() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const branches = useAuthStore(s => s.branches);
  const currentBranchId = useAuthStore(s => s.currentBranchId);
  const [modal, setModal] = useState({ open: false, initial: null });
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Reset to page 1 whenever a filter changes
  useEffect(() => { setPage(1); }, [q, statusFilter, companyFilter, branchFilter, pageSize]);

  // Suggest the next employee number based on the highest existing one in the list
  const suggestNextEmployeeNo = (employees) => {
    let maxN = 0;
    (employees || []).forEach(e => {
      const m = (e.employee_no || '').match(/(\d+)$/);
      if (m) maxN = Math.max(maxN, Number(m[1]));
    });
    return 'EMP-' + String(maxN + 1).padStart(4, '0');
  };

  const openCreate = () => {
    const rows = data?.data || data || [];
    setModal({
      open: true,
      initial: {
        employee_no: suggestNextEmployeeNo(rows),
        full_name: '',
        full_name_ar: '',
        branch_id: currentBranchId || (branches?.[0]?.id),
        hire_date: new Date().toISOString().slice(0, 10),
        contract_type: 'unlimited',
        status: 'active',
        basic_salary: 0,
        housing_allowance: 0,
        transport_allowance: 0,
        other_allowance: 0,
      },
    });
  };

  const filterParams = { q, status: statusFilter, company_id: companyFilter, branch_id: branchFilter };

  const { data, isLoading } = useQuery({
    queryKey: ['employees', q, statusFilter, companyFilter, branchFilter, page, pageSize],
    queryFn: () => api.get('/api/hr/employees', { params: { ...filterParams, page, page_size: pageSize } }).then(r => r.data),
    keepPreviousData: true,
  });
  // Fetch ALL filtered rows for export (not just the visible page)
  const { data: allRowsForExport } = useQuery({
    queryKey: ['employees-export', q, statusFilter, companyFilter, branchFilter],
    queryFn: () => api.get('/api/hr/employees', { params: { ...filterParams, page: 1, page_size: 1000 } }).then(r => r.data?.data || r.data),
    enabled: !!data,   // load lazily after the visible table is ready
  });
  // Lookups for the filter dropdowns
  const { data: companies } = useQuery({
    queryKey: ['companies-lite'],
    queryFn: () => api.get('/api/companies').then(r => r.data),
  });
  const exportColumns = [
    { key: 'employee_no',         label: 'Employee #' },
    { key: 'full_name',           label: 'Full Name (EN)' },
    { key: 'full_name_ar',        label: 'الاسم الكامل' },
    { key: 'civil_id_no',         label: 'Civil ID' },
    { key: 'nationality',         label: 'Nationality' },
    { key: 'job_title_ar',        label: 'Job Title (AR)' },
    { key: 'hire_date',           label: 'Hire Date' },
    { key: 'contract_type',       label: 'Contract' },
    { key: 'basic_salary',        label: 'Basic Salary',     format: v => Number(v || 0).toFixed(3) },
    { key: 'manual_salary',       label: 'Manual Cash',      format: v => Number(v || 0).toFixed(3) },
    { key: 'work_permit_salary',  label: 'Bank Transfer',    format: v => Number(v || 0).toFixed(3) },
    { key: 'housing_allowance',   label: 'Housing',          format: v => Number(v || 0).toFixed(3) },
    { key: 'transport_allowance', label: 'Transport',        format: v => Number(v || 0).toFixed(3) },
    { key: 'other_allowance',     label: 'Other',            format: v => Number(v || 0).toFixed(3) },
    { key: 'bank_name',           label: 'Bank' },
    { key: 'bank_iban',           label: 'IBAN' },
    { key: 'residency_expiry',    label: 'Iqama Expiry' },
    { key: 'status',              label: 'Status' },
  ];
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/api/hr/employees/_/departments').then(r => r.data),
  });

  const saveMut = useMutation({
    mutationFn: (payload) => payload.id
      ? api.put(`/api/hr/employees/${payload.id}`, payload).then(r => r.data)
      : api.post('/api/hr/employees', payload).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); toast.success('Saved'); setModal({ open: false }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const rows = data?.data || data || [];
  const total = Number(data?.total ?? rows.length);
  const today = new Date();
  const isExpiring = (d, days = 60) => {
    if (!d) return false;
    const exp = new Date(d);
    const diff = (exp - today) / (1000 * 60 * 60 * 24);
    return diff <= days && diff >= 0;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">{t('nav.employees')}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <ExportToolbar
            name="Mekky-Employees"
            rows={allRowsForExport || rows}
            columns={exportColumns}
            title="Mekky International — Employees"
            subtitle={`Total: ${(allRowsForExport || rows).length} employees${statusFilter ? ` · status: ${statusFilter}` : ''}${q ? ` · search: "${q}"` : ''}`}
          />
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16}/> {t('employee.add_employee')}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-body flex flex-wrap gap-3">
          <input className="input max-w-xs" placeholder={t('common.search')} value={q} onChange={e => setQ(e.target.value)} />
          <select className="input max-w-[220px]" value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}>
            <option value="">{t('common.all_companies')}</option>
            {(companies || []).map(c => (
              <option key={c.id} value={c.id}>{c.name}{c.employee_count != null ? ` (${c.employee_count})` : ''}</option>
            ))}
          </select>
          <select className="input max-w-[220px]" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
            <option value="">{t('common.all_branches')}</option>
            {(branches || []).map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <select className="input max-w-[160px]" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">{t('common.all_statuses')}</option>
            <option value="active">{t('employee.status_active')}</option>
            <option value="on_leave">{t('employee.status_on_leave')}</option>
            <option value="resigned">{t('employee.status_resigned')}</option>
            <option value="terminated">{t('employee.status_terminated')}</option>
          </select>
          {(q || statusFilter || companyFilter || branchFilter) && (
            <button
              className="btn-ghost text-sm"
              onClick={() => { setQ(''); setStatusFilter(''); setCompanyFilter(''); setBranchFilter(''); }}
            >
              {t('common.clear_filters')}
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>{t('employee.employee_no')}</th>
              <th>{t('employee.full_name')}</th>
              <th>{t('employee.civil_id')}</th>
              <th>{t('employee.job_title')}</th>
              <th>{t('employee.hire_date')}</th>
              <th>{t('employee.iqama_expiry')}</th>
              <th className="text-end">{t('employee.basic_salary')}</th>
              <th className="text-end">{t('employee.manual_cash')}<div className="text-[10px] font-normal text-gray-400 normal-case" dir="rtl">الراتب اليدوي</div></th>
              <th className="text-end">{t('employee.bank_transfer')}<div className="text-[10px] font-normal text-gray-400 normal-case" dir="rtl">اذن العمل</div></th>
              <th>{t('common.status')}</th>
              <th className="text-end no-print">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={11} className="text-center py-6">{t('common.loading')}</td></tr>}
            {!isLoading && rows.map(e => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="font-mono">{e.employee_no}</td>
                <td>
                  <div className="flex items-center gap-2.5">
                    {e.image_url
                      ? <img src={e.image_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" onError={(ev) => { ev.currentTarget.style.display = 'none'; }} />
                      : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white grid place-items-center text-sm font-semibold shrink-0">{(e.full_name || '?').charAt(0).toUpperCase()}</div>}
                    <div className="min-w-0">
                      <div className="font-medium truncate">{e.full_name}</div>
                      {e.full_name_ar && <div className="text-xs text-gray-500 truncate" dir="rtl">{e.full_name_ar}</div>}
                    </div>
                  </div>
                </td>
                <td className="font-mono text-xs">{e.civil_id_no || '-'}</td>
                <td>{e.job_title || '-'}</td>
                <td>{fmtDate(e.hire_date)}</td>
                <td>
                  {e.residency_expiry ? (
                    <span className={isExpiring(e.residency_expiry) ? 'text-red-600 font-medium inline-flex items-center gap-1' : ''}>
                      {isExpiring(e.residency_expiry) && <AlertTriangle size={12}/>}
                      {fmtDate(e.residency_expiry)}
                    </span>
                  ) : '-'}
                </td>
                <td className="text-end font-mono">{fmtMoney(e.basic_salary)}</td>
                <td className="text-end font-mono text-amber-700 font-semibold">{fmtMoney(e.manual_salary)}</td>
                <td className="text-end font-mono text-accent-700 font-semibold">{fmtMoney(e.work_permit_salary)}</td>
                <td>
                  <span className={
                    e.status === 'active' ? 'badge-green' :
                    e.status === 'terminated' ? 'badge-red' :
                    e.status === 'resigned' ? 'badge-yellow' :
                    'badge-gray'
                  }>{e.status}</span>
                </td>
                <td className="text-end no-print">
                  <div className="inline-flex gap-1">
                    <Link to={`/hr/employees/${e.id}`} className="p-1 text-gray-500 hover:text-brand-600" title="Details"><Eye size={14}/></Link>
                    <button className="p-1 text-gray-500 hover:text-brand-600" title="Edit" onClick={() => setModal({ open: true, initial: { ...e } })}><Pencil size={14}/></button>
                    <Link to={`/hr/termination?employee_id=${e.id}`} className="p-1 text-gray-500 hover:text-red-600" title="Termination / EOS"><Calculator size={14}/></Link>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && !rows.length && <tr><td colSpan={11} className="text-center py-8 text-gray-500">{t('common.no_data')}</td></tr>}
          </tbody>
        </table>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <EmployeeFormModal open={modal.open} initial={modal.initial} departments={departments} branches={branches}
        onClose={() => setModal({ open: false })}
        onSubmit={(p) => saveMut.mutate(p)} />
    </div>
  );
}
