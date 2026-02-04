import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { UserRole } from './types/auth';
import { Toaster } from './components/ui/toaster';

// Loading component for Suspense fallback - v1.1 RBAC update
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <img src="/assets/kenel-dark-TlumRj43.svg" alt="Kenels Bureau" className="h-12 w-auto opacity-80" onError={(e) => e.currentTarget.style.display = 'none'} />
      <div className="h-10 w-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      <p className="text-sm text-slate-500 font-medium">Loading...</p>
    </div>
  </div>
);

// Core components (not lazy loaded)
import ProtectedRoute from './components/ProtectedRoute';
import PortalLayout from './components/portal/PortalLayout';
import AdminLayout from './components/admin/AdminLayout';
import CreditOfficerLayout from './components/credit/CreditOfficerLayout';
import FinanceOfficerLayout from './components/finance/FinanceOfficerLayout';
import RoleBasedRedirect from './components/shared/RoleBasedRedirect';
import RoleBasedLayout from './components/shared/RoleBasedLayout';

// Landing page (lazy loaded)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsConditionsPage = lazy(() => import('./pages/TermsConditionsPage'));

// Auth pages (lazy loaded)
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));

// Portal pages (lazy loaded)
const PortalLoginPage = lazy(() => import('./pages/portal/PortalLoginPage'));
const PortalRegisterPage = lazy(() => import('./pages/portal/PortalRegisterPage'));
const PortalForgotPasswordPage = lazy(() => import('./pages/portal/PortalForgotPasswordPage'));
const PortalDashboardPage = lazy(() => import('./pages/portal/PortalDashboardPage'));
const PortalLoansPage = lazy(() => import('./pages/portal/PortalLoansPage'));
const PortalLoanDetailPage = lazy(() => import('./pages/portal/PortalLoanDetailPage'));
const PortalStatementsPage = lazy(() => import('./pages/portal/PortalStatementsPage'));
const PortalProfilePage = lazy(() => import('./pages/portal/PortalProfilePage'));
const PortalKYCPage = lazy(() => import('./pages/portal/PortalKYCPage'));
const PortalMakePaymentPage = lazy(() => import('./pages/portal/PortalMakePaymentPage'));
const PortalApplyLoanPage = lazy(() => import('./pages/portal/PortalApplyLoanPage'));
const PortalApplicationDetailPage = lazy(() => import('./pages/portal/PortalApplicationDetailPage'));
const PortalNotificationsPage = lazy(() => import('./pages/portal/PortalNotificationsPage'));

// Admin pages (lazy loaded)
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const ClientDetailPage = lazy(() => import('./pages/ClientDetailPage'));
const ClientFormPage = lazy(() => import('./pages/ClientFormPage'));
const LoanProductsPage = lazy(() => import('./pages/LoanProductsPage'));
const LoanProductFormPage = lazy(() => import('./pages/LoanProductFormPage'));
const LoanProductDetailPage = lazy(() => import('./pages/LoanProductDetailPage'));
const ProductVersionEditorPage = lazy(() => import('./pages/ProductVersionEditorPage'));
const LoanApplicationsPage = lazy(() => import('./pages/LoanApplicationsPage'));
const LoanApplicationFormPage = lazy(() => import('./pages/LoanApplicationFormPage'));
const LoanApplicationDetailPage = lazy(() => import('./pages/LoanApplicationDetailPage'));
const LoansPage = lazy(() => import('./pages/LoansPage'));
const LoanDetailPage = lazy(() => import('./pages/LoanDetailPage'));
const PortfolioReportsPage = lazy(() => import('./pages/PortfolioReportsPage'));
const AgingReportsPage = lazy(() => import('./pages/AgingReportsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));
const RepaymentsPage = lazy(() => import('./pages/RepaymentsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const WriteOffsPage = lazy(() => import('./pages/WriteOffsPage'));
const KycReviewsPage = lazy(() => import('./pages/KycReviewsPage'));
const InterestRatesPage = lazy(() => import('./pages/InterestRatesPage'));
const FeeTemplatesPage = lazy(() => import('./pages/FeeTemplatesPage'));
const SystemStatusPage = lazy(() => import('./pages/SystemStatusPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));

// Credit Officer pages (lazy loaded)
const CreditDashboardPage = lazy(() => import('./pages/credit/CreditDashboardPage'));
const CreditPipelinePage = lazy(() => import('./pages/credit/CreditPipelinePage'));
const CreditClientsPage = lazy(() => import('./pages/credit/CreditClientsPage'));
const CreditPortfolioPage = lazy(() => import('./pages/credit/CreditPortfolioPage'));
const CreditConversionFunnelPage = lazy(() => import('./pages/credit/CreditConversionFunnelPage'));

// Finance Officer pages (lazy loaded)
const FinanceDashboardPage = lazy(() => import('./pages/finance/FinanceDashboardPage'));
const FinanceArrearsPage = lazy(() => import('./pages/finance/FinanceArrearsPage'));
const FinancePostRepaymentPage = lazy(() => import('./pages/finance/FinancePostRepaymentPage'));
const FinancePostingsPage = lazy(() => import('./pages/finance/FinancePostingsPage'));
const FinanceReceiptsPage = lazy(() => import('./pages/finance/FinanceReceiptsPage'));
const FinanceClosedLoansPage = lazy(() => import('./pages/finance/FinanceClosedLoansPage'));
const FinancePendingDisbursementsPage = lazy(
  () => import('./pages/finance/FinancePendingDisbursementsPage'),
);
const FinanceReversalsPage = lazy(() => import('./pages/finance/FinanceReversalsPage'));
const FinanceStatementsPage = lazy(() => import('./pages/finance/FinanceStatementsPage'));
const FinanceCashflowPage = lazy(() => import('./pages/finance/FinanceCashflowPage'));
const FinanceAllocationPage = lazy(() => import('./pages/finance/FinanceAllocationPage'));
const FinanceExportPage = lazy(() => import('./pages/finance/FinanceExportPage'));
const FinancePaymentChannelsPage = lazy(() => import('./pages/finance/FinancePaymentChannelsPage'));

// Shared pages (lazy loaded)
const HelpCenterPage = lazy(() => import('./pages/shared/HelpCenterPage'));

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <BrowserRouter>
      <Toaster />
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? <RoleBasedRedirect /> : <LandingPage />
          }
        />
        <Route path="/portal" element={<PortalLayout />}>
          <Route path="dashboard" element={<PortalDashboardPage />} />
          <Route path="loans" element={<PortalLoansPage />} />
          <Route path="loans/:loanId" element={<PortalLoanDetailPage />} />
          <Route path="statements" element={<PortalStatementsPage />} />
          <Route path="profile" element={<PortalProfilePage />} />
          <Route path="kyc" element={<PortalKYCPage />} />
          <Route path="make-payment" element={<PortalMakePaymentPage />} />
          <Route path="apply" element={<PortalApplyLoanPage />} />
          <Route path="applications/:applicationId" element={<PortalApplicationDetailPage />} />
          <Route path="notifications" element={<PortalNotificationsPage />} />
        </Route>
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-conditions" element={<TermsConditionsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/portal/login" element={<PortalLoginPage />} />
        <Route path="/portal/register" element={<PortalRegisterPage />} />
        <Route path="/portal/forgot-password" element={<PortalForgotPasswordPage />} />
        {/* Dashboard route - redirects to role-specific dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <RoleBasedRedirect />
            </ProtectedRoute>
          }
        />
        {/* Admin Dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminLayout>
                <DashboardPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <ProtectedRoute
              allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER]}
            >
              <RoleBasedLayout>
                <ClientsPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/new"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER]}>
              <RoleBasedLayout>
                <ClientFormPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/:id"
          element={
            <ProtectedRoute
              allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER]}
            >
              <RoleBasedLayout>
                <ClientDetailPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/:id/edit"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER]}>
              <RoleBasedLayout>
                <ClientFormPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/kyc-reviews"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER]}>
              <RoleBasedLayout>
                <KycReviewsPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/loan-products"
          element={
            <ProtectedRoute
              allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER]}
            >
              <RoleBasedLayout>
                <LoanProductsPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/loan-products/new"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER]}>
              <RoleBasedLayout>
                <LoanProductFormPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/loan-products/:id"
          element={
            <ProtectedRoute
              allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER]}
            >
              <RoleBasedLayout>
                <LoanProductDetailPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/loan-products/:id/edit"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER]}>
              <RoleBasedLayout>
                <LoanProductFormPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/loan-products/:productId/versions/:versionId"
          element={
            <ProtectedRoute
              allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER]}
            >
              <RoleBasedLayout>
                <ProductVersionEditorPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/loan-products/:productId/versions/:versionId/edit"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER]}>
              <RoleBasedLayout>
                <ProductVersionEditorPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/interest-rates"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminLayout>
                <InterestRatesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fee-templates"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminLayout>
                <FeeTemplatesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/loan-applications"
          element={
            <ProtectedRoute
              allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER]}
            >
              <RoleBasedLayout>
                <LoanApplicationsPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/loan-applications/new"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER]}>
              <RoleBasedLayout>
                <LoanApplicationFormPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/loan-applications/:id"
          element={
            <ProtectedRoute
              allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER]}
            >
              <RoleBasedLayout>
                <LoanApplicationDetailPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/loan-applications/:id/edit"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER]}>
              <RoleBasedLayout>
                <LoanApplicationFormPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/loans"
          element={
            <ProtectedRoute
              allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER]}
            >
              <RoleBasedLayout>
                <LoansPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/loans/:id"
          element={
            <ProtectedRoute
              allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER]}
            >
              <RoleBasedLayout>
                <LoanDetailPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/portfolio"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.FINANCE_OFFICER]}>
              <RoleBasedLayout>
                <PortfolioReportsPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/aging"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.FINANCE_OFFICER]}>
              <RoleBasedLayout>
                <AgingReportsPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        {/* Admin System Routes */}
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminLayout>
                <UsersPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminLayout>
                <AuditLogsPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/repayments"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.FINANCE_OFFICER]}>
              <RoleBasedLayout>
                <RepaymentsPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER]}>
              <RoleBasedLayout>
                <DocumentsPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute
              allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER]}
            >
              <RoleBasedLayout>
                <NotificationsPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <ProfilePage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminLayout>
                <SettingsPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/system-status"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminLayout>
                <SystemStatusPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/write-offs"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.FINANCE_OFFICER]}>
              <RoleBasedLayout>
                <WriteOffsPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        {/* Credit Officer Routes */}
        <Route
          path="/credit/dashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER]}>
              <CreditOfficerLayout>
                <CreditDashboardPage />
              </CreditOfficerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/credit/pipeline"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER]}>
              <CreditOfficerLayout>
                <CreditPipelinePage />
              </CreditOfficerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/credit/clients"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER]}>
              <CreditOfficerLayout>
                <CreditClientsPage />
              </CreditOfficerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/credit/kyc-reviews"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER]}>
              <CreditOfficerLayout>
                <KycReviewsPage />
              </CreditOfficerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/credit/portfolio"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER]}>
              <CreditOfficerLayout>
                <CreditPortfolioPage />
              </CreditOfficerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/credit/conversion-funnel"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CREDIT_OFFICER]}>
              <CreditOfficerLayout>
                <CreditConversionFunnelPage />
              </CreditOfficerLayout>
            </ProtectedRoute>
          }
        />
        {/* Finance Officer Routes */}
        <Route
          path="/finance/dashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.FINANCE_OFFICER]}>
              <FinanceOfficerLayout>
                <FinanceDashboardPage />
              </FinanceOfficerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/arrears"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.FINANCE_OFFICER]}>
              <FinanceOfficerLayout>
                <FinanceArrearsPage />
              </FinanceOfficerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/pending-disbursements"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.FINANCE_OFFICER]}>
              <FinanceOfficerLayout>
                <FinancePendingDisbursementsPage />
              </FinanceOfficerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/post-repayment"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.FINANCE_OFFICER]}>
              <FinanceOfficerLayout>
                <FinancePostRepaymentPage />
              </FinanceOfficerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/postings"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.FINANCE_OFFICER]}>
              <FinanceOfficerLayout>
                <FinancePostingsPage />
              </FinanceOfficerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/receipts"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.FINANCE_OFFICER]}>
              <FinanceOfficerLayout>
                <FinanceReceiptsPage />
              </FinanceOfficerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/collections"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.FINANCE_OFFICER]}>
              <FinanceOfficerLayout>
                <PortfolioReportsPage />
              </FinanceOfficerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/closed-loans"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.FINANCE_OFFICER]}>
              <FinanceOfficerLayout>
                <FinanceClosedLoansPage />
              </FinanceOfficerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/reversals"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.FINANCE_OFFICER]}>
              <FinanceOfficerLayout>
                <FinanceReversalsPage />
              </FinanceOfficerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/statements"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.FINANCE_OFFICER]}>
              <FinanceOfficerLayout>
                <FinanceStatementsPage />
              </FinanceOfficerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/cashflow"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.FINANCE_OFFICER]}>
              <FinanceOfficerLayout>
                <FinanceCashflowPage />
              </FinanceOfficerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/allocation"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.FINANCE_OFFICER]}>
              <FinanceOfficerLayout>
                <FinanceAllocationPage />
              </FinanceOfficerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/export"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.FINANCE_OFFICER]}>
              <FinanceOfficerLayout>
                <FinanceExportPage />
              </FinanceOfficerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/payment-channels"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.FINANCE_OFFICER]}>
              <FinanceOfficerLayout>
                <FinancePaymentChannelsPage />
              </FinanceOfficerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <HelpCenterPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/unauthorized"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">403</h1>
                <p className="text-muted-foreground">You don't have permission to access this page.</p>
              </div>
            </div>
          }
        />
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">404</h1>
                <p className="text-muted-foreground">Page not found.</p>
              </div>
            </div>
          }
        />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
