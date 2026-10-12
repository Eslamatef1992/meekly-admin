import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import Dashboard from './pages/Dashboard';
import ChartOfAccounts from './pages/finance/ChartOfAccounts';
import Vouchers from './pages/finance/Vouchers';
import VoucherEdit from './pages/finance/VoucherEdit';
import TrialBalance from './pages/finance/TrialBalance';
import GeneralLedger from './pages/finance/GeneralLedger';
import IncomeStatement from './pages/finance/IncomeStatement';
import BalanceSheet from './pages/finance/BalanceSheet';
import Employees from './pages/hr/Employees';
import EmployeeDetail from './pages/hr/EmployeeDetail';
import SalaryComponents from './pages/hr/SalaryComponents';
import PayrollRuns from './pages/hr/PayrollRuns';
import PayrollRunDetail from './pages/hr/PayrollRunDetail';
import Payslip from './pages/hr/Payslip';
import LeaveRequests from './pages/hr/LeaveRequests';
import Termination from './pages/hr/Termination';
import EmployeeRequests from './pages/hr/EmployeeRequests';
import POSLanding from './pages/pos/POSLanding';
import POSSale from './pages/pos/POSSale';
import POSReceipt from './pages/pos/POSReceipt';
import ShiftClose from './pages/pos/ShiftClose';
import Registers from './pages/pos/Registers';
import Users from './pages/admin/Users';
import Roles from './pages/admin/Roles';
import Profile from './pages/admin/Profile';
import Items from './pages/inventory/Items';
import Stock from './pages/inventory/Stock';
import StockMovements from './pages/inventory/StockMovements';
import StockTransfer from './pages/inventory/StockTransfer';
import StockCount from './pages/inventory/StockCount';
import Categories from './pages/inventory/Categories';
import Warehouses from './pages/inventory/Warehouses';
import Products from './pages/ecom/Products';
import Orders from './pages/ecom/Orders';
import Branches from './pages/system/Branches';
import Companies from './pages/system/Companies';
import { useAuthStore } from './lib/auth';

function PrivateRoute({ children }) {
  const isAuthed = useAuthStore(s => !!s.accessToken);
  return isAuthed ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="finance/accounts"      element={<ChartOfAccounts />} />
        <Route path="finance/vouchers"      element={<Vouchers />} />
        <Route path="finance/vouchers/new"  element={<VoucherEdit />} />
        <Route path="finance/vouchers/:id"  element={<VoucherEdit />} />
        <Route path="finance/trial-balance" element={<TrialBalance />} />
        <Route path="finance/general-ledger"element={<GeneralLedger />} />
        <Route path="finance/income-statement" element={<IncomeStatement />} />
        <Route path="finance/balance-sheet" element={<BalanceSheet />} />
        <Route path="hr/employees"          element={<Employees />} />
        <Route path="hr/employees/:id"      element={<EmployeeDetail />} />
        <Route path="hr/salary-components"  element={<SalaryComponents />} />
        <Route path="hr/payroll"            element={<PayrollRuns />} />
        <Route path="hr/payroll/:id"        element={<PayrollRunDetail />} />
        <Route path="hr/payslips/:id"       element={<Payslip />} />
        <Route path="hr/leaves"             element={<LeaveRequests />} />
        <Route path="hr/requests"           element={<EmployeeRequests />} />
        <Route path="hr/termination"        element={<Termination />} />
        <Route path="pos"                   element={<POSLanding />} />
        <Route path="pos/sale/:shiftId"     element={<POSSale />} />
        <Route path="pos/sales/:id"         element={<POSReceipt />} />
        <Route path="pos/shifts/:id/close"  element={<ShiftClose />} />
        <Route path="pos/registers"         element={<Registers />} />
        <Route path="inventory/items"       element={<Items />} />
        <Route path="inventory/stock"       element={<Stock />} />
        <Route path="inventory/movements"   element={<StockMovements />} />
        <Route path="inventory/transfer"    element={<StockTransfer />} />
        <Route path="inventory/count"       element={<StockCount />} />
        <Route path="inventory/categories"  element={<Categories />} />
        <Route path="inventory/warehouses"  element={<Warehouses />} />
        <Route path="ecom/products"         element={<Products />} />
        <Route path="ecom/orders"           element={<Orders />} />
        <Route path="system/branches"       element={<Branches />} />
        <Route path="system/companies"      element={<Companies />} />
        <Route path="companies"             element={<Companies />} />
        <Route path="branches"              element={<Branches />} />
        <Route path="system/users"          element={<Users />} />
        <Route path="system/roles"          element={<Roles />} />
        <Route path="profile"               element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    </>
  );
}
