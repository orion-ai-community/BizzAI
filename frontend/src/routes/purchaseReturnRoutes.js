import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Purchase Return Routes
import PurchaseReturnList from './pages/purchase/PurchaseReturnList';
import PurchaseReturnFormNew from './pages/purchase/PurchaseReturnFormNew';
import PurchaseReturnDetail from './pages/purchase/PurchaseReturnDetail';

// Approval Routes
import MyApprovals from './pages/approvals/MyApprovals';
import ApprovalSettings from './pages/approvals/ApprovalSettings';

// Report Routes
import PurchaseReturnAnalytics from './pages/reports/PurchaseReturnAnalytics';

// Add these routes to your main App.js routing configuration:

/*
<Route path="/purchase-returns" element={<PurchaseReturnList />} />
<Route path="/purchase-returns/new" element={<PurchaseReturnFormNew />} />
<Route path="/purchase-returns/:id" element={<PurchaseReturnDetail />} />
<Route path="/purchase-returns/:id/edit" element={<PurchaseReturnFormNew />} />

<Route path="/approvals" element={<MyApprovals />} />
<Route path="/approvals/settings" element={<ApprovalSettings />} />

<Route path="/reports/purchase-returns" element={<PurchaseReturnAnalytics />} />
*/

export default {
    PurchaseReturnList,
    PurchaseReturnFormNew,
    PurchaseReturnDetail,
    MyApprovals,
    ApprovalSettings,
    PurchaseReturnAnalytics,
};
