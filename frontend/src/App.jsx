import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ToastContainer } from "react-toastify"
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import ProfileSettings from './pages/ProfileSettings';
import Customers from './pages/Customers';
import AddCustomer from './pages/AddCustomer';
import EditCustomer from './pages/EditCustomer';
import CustomerDetail from './pages/CustomerDetail';
import DueAdjustment from './pages/DueAdjustment';
import CustomersWithDues from './pages/CustomersWithDues';
import Suppliers from './pages/Suppliers';
import AddSupplier from './pages/AddSupplier';
import EditSupplier from './pages/EditSupplier';
import SupplierDetail from './pages/SupplierDetail';
import Inventory from './pages/Inventory';
import AddItem from './pages/AddItem';
import EditItem from './pages/EditItem';
import POS from './pages/POS';
import Invoices from './pages/Invoice';
import InvoiceDetail from './pages/InvoiceDetail';
import Reports from './pages/Reports';

// Sales
import SalesInvoice from './pages/sales/SalesInvoice';
import SalesInvoiceDetail from './pages/sales/SalesInvoiceDetail';
import Estimate from './pages/sales/Estimate';
import EstimateList from './pages/sales/EstimateList';
import EstimateDetail from './pages/sales/EstimateDetail';
import PaymentIn from './pages/sales/PaymentIn';
import PaymentInList from './pages/sales/PaymentInList';
import PaymentReceiptDetail from './pages/sales/PaymentReceiptDetail';
import SalesOrder from './pages/sales/SalesOrder';
import SalesOrderList from './pages/sales/SalesOrderList';
import SalesOrderDetail from './pages/sales/SalesOrderDetail';
import DeliveryChallan from './pages/sales/DeliveryChallan';
import DeliveryChallanList from './pages/sales/DeliveryChallanList';
import DeliveryChallanDetail from './pages/sales/DeliveryChallanDetail';
import Return from './pages/sales/Return';
import ReturnedItems from './pages/sales/ReturnedItems';

// Purchase
import Purchase from './pages/purchase/Purchase';
import PurchaseEntry from './pages/purchase/PurchaseEntry';
import PurchaseList from './pages/purchase/PurchaseList';
import PurchaseDetail from './pages/purchase/PurchaseDetail';
import Bills from './pages/purchase/Bills';
import BillDetail from './pages/purchase/BillDetail';
import BillAging from './pages/purchase/BillAging';
import PaymentOut from './pages/purchase/PaymentOut';
import PaymentOutList from './pages/purchase/PaymentOutList';
import PaymentOutDetail from './pages/purchase/PaymentOutDetail';
import Expenses from './pages/purchase/Expenses';
// Purchase Returns
import PurchaseReturn from './pages/purchase/PurchaseReturn';
import PurchaseReturnList from './pages/purchase/PurchaseReturnList';
import PurchaseReturnFormNew from './pages/purchase/PurchaseReturnFormNew';
import PurchaseReturnDetail from './pages/purchase/PurchaseReturnDetail';

import PurchaseOrderList from './pages/purchase/PurchaseOrderList';
import PurchaseOrderForm from './pages/purchase/PurchaseOrderForm';
import PurchaseOrderDetail from './pages/purchase/PurchaseOrderDetail';
import GRNList from './pages/purchase/GRNList';
import GRNForm from './pages/purchase/GRNForm';
import GRNDetail from './pages/purchase/GRNDetail';

// Reports
import ReportsDashboard from './pages/reports/ReportsDashboard';
import SalesReport from './pages/reports/SalesReport';
import PurchaseReturnAnalytics from './pages/reports/PurchaseReturnAnalytics';

// Approvals
import MyApprovals from './pages/approvals/MyApprovals';
import ApprovalSettings from './pages/approvals/ApprovalSettings';

// Cash & Bank
import BankAccounts from './pages/cashbank/BankAccounts';
import CashInHand from './pages/cashbank/CashInHand';
import Transfers from './pages/cashbank/Transfers';
import Cheques from './pages/cashbank/Cheques';
import LoanAccounts from './pages/cashbank/LoanAccounts';
import AccountLedger from './pages/cashbank/AccountLedger';
import BankSummary from './pages/cashbank/BankSummary';
import CashBankPosition from './pages/cashbank/CashBankPosition';

// Business
import OnlineShop from './pages/business/OnlineShop';
import GoogleProfile from './pages/business/GoogleProfile';
import MarketingTools from './pages/business/MarketingTools';
import WhatsAppMarketing from './pages/business/WhatsAppMarketing';

// Sync
import SyncShare from './pages/sync/SyncShare';
import Backup from './pages/sync/Backup';
import Restore from './pages/sync/Restore';

// Utilities
import BarcodeGenerator from './pages/utilities/BarcodeGenerator';
import ImportItems from './pages/utilities/ImportItems';
import BusinessSetup from './pages/utilities/BusinessSetup';
import DataExport from './pages/utilities/DataExport';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  console.log(import.meta.env.VITE_BACKEND_URL);
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-app text-main transition-colors duration-300">
        <ToastContainer />
        <Router>
          <Routes>
            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile-settings"
              element={
                <ProtectedRoute>
                  <ProfileSettings />
                </ProtectedRoute>
              }
            />

            {/* Customer Routes - Use nested routes for better organization */}
            <Route path="/customers">
              <Route
                index
                element={
                  <ProtectedRoute>
                    <Customers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="add"
                element={
                  <ProtectedRoute>
                    <AddCustomer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="edit/:id"
                element={
                  <ProtectedRoute>
                    <EditCustomer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="adjust-due/:id"
                element={
                  <ProtectedRoute>
                    <DueAdjustment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="with-dues"
                element={
                  <ProtectedRoute>
                    <CustomersWithDues />
                  </ProtectedRoute>
                }
              />
              <Route
                path=":id"
                element={
                  <ProtectedRoute>
                    <CustomerDetail />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Supplier Routes */}
            <Route path="/suppliers">
              <Route
                index
                element={
                  <ProtectedRoute>
                    <Suppliers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="add"
                element={
                  <ProtectedRoute>
                    <AddSupplier />
                  </ProtectedRoute>
                }
              />
              <Route
                path=":id/edit"
                element={
                  <ProtectedRoute>
                    <EditSupplier />
                  </ProtectedRoute>
                }
              />
              <Route
                path=":id"
                element={
                  <ProtectedRoute>
                    <SupplierDetail />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Inventory Routes */}
            <Route path="/inventory">
              <Route
                index
                element={
                  <ProtectedRoute>
                    <Inventory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="add"
                element={
                  <ProtectedRoute>
                    <AddItem />
                  </ProtectedRoute>
                }
              />
              <Route
                path="edit/:id"
                element={
                  <ProtectedRoute>
                    <EditItem />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* POS Routes */}
            <Route path="/pos">
              <Route
                index
                element={
                  <ProtectedRoute>
                    <POS />
                  </ProtectedRoute>
                }
              />
              <Route
                path="invoices"
                element={
                  <ProtectedRoute>
                    <Invoices />
                  </ProtectedRoute>
                }
              />
              <Route
                path="invoice/:id"
                element={
                  <ProtectedRoute>
                    <InvoiceDetail />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Sales Routes */}
            <Route path="/sales">
              <Route path="invoice" element={<ProtectedRoute><SalesInvoice /></ProtectedRoute>} />
              <Route path="invoice/:id" element={<ProtectedRoute><SalesInvoiceDetail /></ProtectedRoute>} />
              <Route path="estimate" element={<ProtectedRoute><Estimate /></ProtectedRoute>} />
              <Route path="estimates" element={<ProtectedRoute><EstimateList /></ProtectedRoute>} />
              <Route path="estimate/:id" element={<ProtectedRoute><EstimateDetail /></ProtectedRoute>} />
              <Route path="payment-in" element={<ProtectedRoute><PaymentIn /></ProtectedRoute>} />
              <Route path="payment-in-list" element={<ProtectedRoute><PaymentInList /></ProtectedRoute>} />
              <Route path="payment-in/:id" element={<ProtectedRoute><PaymentReceiptDetail /></ProtectedRoute>} />
              <Route path="sales-order" element={<ProtectedRoute><SalesOrder /></ProtectedRoute>} />
              <Route path="sales-order-list" element={<ProtectedRoute><SalesOrderList /></ProtectedRoute>} />
              <Route path="sales-order/:id" element={<ProtectedRoute><SalesOrderDetail /></ProtectedRoute>} />
              <Route path="order" element={<ProtectedRoute><SalesOrder /></ProtectedRoute>} />
              <Route path="delivery-challan" element={<ProtectedRoute><DeliveryChallan /></ProtectedRoute>} />
              <Route path="delivery-challan-list" element={<ProtectedRoute><DeliveryChallanList /></ProtectedRoute>} />
              <Route path="delivery-challan/:id" element={<ProtectedRoute><DeliveryChallanDetail /></ProtectedRoute>} />
              <Route path="return" element={<ProtectedRoute><Return /></ProtectedRoute>} />
              <Route path="returned-items" element={<ProtectedRoute><ReturnedItems /></ProtectedRoute>} />
            </Route>

            {/* Purchase Routes */}
            <Route path="/purchase">
              <Route path="entry" element={<ProtectedRoute><PurchaseEntry /></ProtectedRoute>} />
              <Route path="list" element={<ProtectedRoute><PurchaseList /></ProtectedRoute>} />
              <Route path=":id" element={<ProtectedRoute><PurchaseDetail /></ProtectedRoute>} />
              <Route path="bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
              <Route path="bills/:id" element={<ProtectedRoute><BillDetail /></ProtectedRoute>} />
              <Route path="bills/aging" element={<ProtectedRoute><BillAging /></ProtectedRoute>} />
              <Route path="payment-out" element={<ProtectedRoute><PaymentOut /></ProtectedRoute>} />
              <Route path="payment-out/list" element={<ProtectedRoute><PaymentOutList /></ProtectedRoute>} />
              <Route path="payment-out/:id" element={<ProtectedRoute><PaymentOutDetail /></ProtectedRoute>} />
              <Route path="expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />

              {/* Purchase Returns - Form First Pattern */}
              <Route path="return" element={<ProtectedRoute><PurchaseReturn /></ProtectedRoute>} />
              <Route path="returns/list" element={<ProtectedRoute><PurchaseReturnList /></ProtectedRoute>} />
              <Route path="returns/new" element={<ProtectedRoute><PurchaseReturnFormNew /></ProtectedRoute>} />
              <Route path="returns/:id" element={<ProtectedRoute><PurchaseReturnDetail /></ProtectedRoute>} />
              <Route path="returns/:id/edit" element={<ProtectedRoute><PurchaseReturnFormNew /></ProtectedRoute>} />
            </Route>

            {/* Purchase Order Routes */}
            <Route path="/purchase-orders">
              <Route index element={<ProtectedRoute><PurchaseOrderList /></ProtectedRoute>} />
              <Route path="new" element={<ProtectedRoute><PurchaseOrderForm /></ProtectedRoute>} />
              <Route path=":id" element={<ProtectedRoute><PurchaseOrderDetail /></ProtectedRoute>} />
              <Route path=":id/edit" element={<ProtectedRoute><PurchaseOrderForm /></ProtectedRoute>} />
            </Route>

            {/* GRN Routes */}
            <Route path="/grns">
              <Route index element={<ProtectedRoute><GRNList /></ProtectedRoute>} />
              <Route path="new" element={<ProtectedRoute><GRNForm /></ProtectedRoute>} />
              <Route path=":id" element={<ProtectedRoute><GRNDetail /></ProtectedRoute>} />
            </Route>

            {/* Cash & Bank Routes */}
            <Route path="/cashbank">
              <Route path="bank-accounts" element={<ProtectedRoute><BankAccounts /></ProtectedRoute>} />
              <Route path="cash-in-hand" element={<ProtectedRoute><CashInHand /></ProtectedRoute>} />
              <Route path="cheques" element={<ProtectedRoute><Cheques /></ProtectedRoute>} />
              <Route path="loan-accounts" element={<ProtectedRoute><LoanAccounts /></ProtectedRoute>} />
            </Route>

            {/* Business Growth Routes */}
            <Route path="/business">
              <Route path="online-shop" element={<ProtectedRoute><OnlineShop /></ProtectedRoute>} />
              <Route path="google-profile" element={<ProtectedRoute><GoogleProfile /></ProtectedRoute>} />
              <Route path="marketing-tools" element={<ProtectedRoute><MarketingTools /></ProtectedRoute>} />
              <Route path="whatsapp-marketing" element={<ProtectedRoute><WhatsAppMarketing /></ProtectedRoute>} />
            </Route>

            {/* Sync & Backup Routes */}
            <Route path="/sync">
              <Route path="share" element={<ProtectedRoute><SyncShare /></ProtectedRoute>} />
              <Route path="backup" element={<ProtectedRoute><Backup /></ProtectedRoute>} />
              <Route path="restore" element={<ProtectedRoute><Restore /></ProtectedRoute>} />
            </Route>

            {/* Utilities Routes */}
            <Route path="/utilities">
              <Route path="barcode" element={<ProtectedRoute><BarcodeGenerator /></ProtectedRoute>} />
              <Route path="import-items" element={<ProtectedRoute><ImportItems /></ProtectedRoute>} />
              <Route path="business-setup" element={<ProtectedRoute><BusinessSetup /></ProtectedRoute>} />
              <Route path="export" element={<ProtectedRoute><DataExport /></ProtectedRoute>} />
            </Route>

            {/* Approvals Routes */}
            <Route path="/approvals">
              <Route index element={<ProtectedRoute><MyApprovals /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute><ApprovalSettings /></ProtectedRoute>} />
            </Route>

            {/* Reports Route */}
            <Route path="/reports" element={<ProtectedRoute><ReportsDashboard /></ProtectedRoute>} />
            <Route path="/reports/sales" element={<ProtectedRoute><SalesReport /></ProtectedRoute>} />
            <Route path="/reports/purchase-returns" element={<ProtectedRoute><PurchaseReturnAnalytics /></ProtectedRoute>} />

            {/* 404 Route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </div>
    </ThemeProvider>
  );
}

export default App;
