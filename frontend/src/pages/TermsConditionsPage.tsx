import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useOrgSettings } from '../hooks/useOrgSettings';
import Logo from '../components/Logo';

export default function TermsConditionsPage() {
  const org = useOrgSettings();
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo variant="light" size="md" />
            </div>
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms and Conditions</h1>
          <p className="text-slate-500 mb-8">KENELS BUREAU LTD</p>

          <div className="prose prose-slate max-w-none">
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">1. Introduction</h2>
            <p className="text-slate-600 mb-4">
              These Terms and Conditions govern the use of lending services provided by KENELS
              BUREAU LTD, a company incorporated in Nairobi, Kenya. By applying for or accepting a
              loan, the customer agrees to abide by these terms.
            </p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">2. Eligibility</h2>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Applicants must be at least 18 years old.</li>
              <li>Valid identification (National ID/Passport) and proof of income are required.</li>
              <li>Loan approval is subject to credit assessment and compliance with company policies.</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">3. Loan Application and Approval</h2>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Loan applications must be submitted through official channels (online portal, office branches).</li>
              <li>Approval is based on creditworthiness, repayment capacity, and compliance with regulatory requirements.</li>
              <li>KENELS BUREAU LTD reserves the right to reject applications without obligation to provide reasons.</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">4. Loan Disbursement</h2>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Approved loans will be disbursed to the borrower's designated bank account or mobile wallet.</li>
              <li>Disbursement timelines may vary depending on verification and processing requirements.</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">5. Interest Rates and Fees</h2>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Interest rates are disclosed at the time of loan approval and remain fixed unless otherwise stated.</li>
              <li>Loan origination fees, late payment fees, and other charges will be communicated transparently before disbursement.</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">6. Repayment Terms</h2>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Borrowers must repay loans according to the agreed schedule.</li>
              <li>Early repayment is permitted without penalty.</li>
              <li>Late repayments may attract additional fees and affect future loan eligibility.</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">7. Default and Recovery</h2>
            <p className="text-slate-600 mb-2">Failure to repay loans may result in:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Reporting to credit reference bureaus (CRBs).</li>
              <li>Legal action and recovery proceedings.</li>
              <li>Seizure of collateral (if applicable).</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">8. Data Protection and Privacy</h2>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Customer data will be collected, stored, and processed in compliance with the Kenya Data Protection Act.</li>
              <li>Data will only be shared with authorized third parties (e.g., regulators, CRBs) when legally required.</li>
              <li>Customers have the right to access and correct their personal information.</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">9. Customer Obligations</h2>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Provide accurate and truthful information during loan application.</li>
              <li>Notify the company of any changes in contact details or financial circumstances.</li>
              <li>Use loan proceeds for lawful purposes only.</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">10. Company Rights</h2>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>KENELS BUREAU LTD reserves the right to amend interest rates, fees, and terms subject to regulatory approval.</li>
              <li>The company may suspend or terminate services in cases of fraud, misuse, or non-compliance.</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">11. Limitation of Liability</h2>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>The company is not liable for losses arising from borrower misuse, third-party actions, or force majeure events.</li>
              <li>Liability is limited to the amount of the loan transaction in question.</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">12. Governing Law</h2>
            <p className="text-slate-600 mb-4">
              These Terms and Conditions are governed by the laws of Kenya. Any disputes shall be resolved
              through arbitration or Kenyan courts.
            </p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">13. Amendments</h2>
            <p className="text-slate-600 mb-4">
              KENELS BUREAU LTD may update these Terms and Conditions periodically. Customers will
              be notified of changes via official communication channels.
            </p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">14. Acceptance</h2>
            <p className="text-slate-600 mb-4">
              By signing the loan agreement or using the company's services, the borrower acknowledges and
              accepts these Terms and Conditions.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          <p>© {new Date().getFullYear()} {org.companyName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
