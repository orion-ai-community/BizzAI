import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import AddCustomer from './pages/AddCustomer';
import EditCustomer from './pages/EditCustomer';
import CustomerDetail from './pages/CustomerDetail';
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
import ProformaInvoice from './pages/sales/ProformaInvoice';
import PaymentIn from './pages/sales/PaymentIn';
import SalesOrder from './pages/sales/SalesOrder';
import DeliveryChallan from './pages/sales/DeliveryChallan';
import SalesReturn from './pages/sales/SalesReturn';

// Purchase
import Purchase from './pages/purchase/Purchase';
import Bills from './pages/purchase/Bills';
import PaymentOut from './pages/purchase/PaymentOut';
import Expenses from './pages/purchase/Expenses';
import PurchaseOrder from './pages/purchase/PurchaseOrder';
import PurchaseReturn from './pages/purchase/PurchaseReturn';

// Reports
import ReportsDashboard from './pages/reports/ReportsDashboard';

// Cash & Bank
import BankAccounts from './pages/cashbank/BankAccounts';
import CashInHand from './pages/cashbank/CashInHand';
import Cheques from './pages/cashbank/Cheques';
import LoanAccounts from './pages/cashbank/LoanAccounts';

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

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
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
          <Route path="proforma" element={<ProtectedRoute><ProformaInvoice /></ProtectedRoute>} />
          <Route path="payment-in" element={<ProtectedRoute><PaymentIn /></ProtectedRoute>} />
          <Route path="order" element={<ProtectedRoute><SalesOrder /></ProtectedRoute>} />
          <Route path="delivery-challan" element={<ProtectedRoute><DeliveryChallan /></ProtectedRoute>} />
          <Route path="return" element={<ProtectedRoute><SalesReturn /></ProtectedRoute>} />
        </Route>

        {/* Purchase Routes */}
        <Route path="/purchase">
          <Route path="entry" element={<ProtectedRoute><Purchase /></ProtectedRoute>} />
          <Route path="bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
          <Route path="payment-out" element={<ProtectedRoute><PaymentOut /></ProtectedRoute>} />
          <Route path="expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path="order" element={<ProtectedRoute><PurchaseOrder /></ProtectedRoute>} />
          <Route path="return" element={<ProtectedRoute><PurchaseReturn /></ProtectedRoute>} />
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

        {/* Reports Route */}
        <Route path="/reports" element={<ProtectedRoute><ReportsDashboard /></ProtectedRoute>} />

        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;


