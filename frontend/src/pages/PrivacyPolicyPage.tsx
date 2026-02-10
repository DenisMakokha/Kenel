import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useOrgSettings } from '../hooks/useOrgSettings';
import Logo from '../components/Logo';

export default function PrivacyPolicyPage() {
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-slate-500 mb-8">KENELS BUREAU LTD</p>
          <p className="text-sm text-slate-400 mb-8">Effective Date: 01.01.2026</p>

          <div className="prose prose-slate max-w-none">
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">1. Introduction</h2>
            <p className="text-slate-600 mb-4">
              KENELS BUREAU LTD ("we," "our," or "the Company") values your trust and is committed to
              protecting your personal information. This Privacy Policy explains how we collect, use, store,
              and safeguard your data when you interact with our lending services in Nairobi, Kenya.
            </p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">2. Information We Collect</h2>
            <p className="text-slate-600 mb-2">We may collect the following categories of personal information:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li><strong>Identification Data:</strong> Full name, national ID/passport number, date of birth.</li>
              <li><strong>Contact Information:</strong> Phone number, email address, postal and physical address.</li>
              <li><strong>Financial Information:</strong> Bank account details, credit history, income records, loan repayment history.</li>
              <li><strong>Employment Information:</strong> Employer details, job title, salary verification.</li>
              <li><strong>Digital Data:</strong> IP address, device information, and usage data when accessing our website or digital platforms.</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">3. Legal Basis for Processing</h2>
            <p className="text-slate-600 mb-2">We process personal data in accordance with:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>The Data Protection Act, 2019 (Kenya).</li>
              <li>Applicable financial and lending regulations issued by the Central Bank of Kenya (CBK).</li>
              <li>Contractual obligations under loan agreements.</li>
              <li>Legitimate business interests, including fraud prevention and compliance.</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">4. How We Use Your Information</h2>
            <p className="text-slate-600 mb-2">Your personal data may be used for:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Assessing loan applications and creditworthiness.</li>
              <li>Managing loan accounts and repayments.</li>
              <li>Communicating with you regarding services, updates, and compliance requirements.</li>
              <li>Preventing fraud, money laundering, and financial crime.</li>
              <li>Improving customer experience and service delivery.</li>
              <li>Meeting regulatory and legal obligations.</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-slate-600 mb-2">We may share your information with:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li><strong>Regulators:</strong> Central Bank of Kenya, Credit Reference Bureaus (CRBs).</li>
              <li><strong>Service Providers:</strong> IT, payment processors, auditors, and legal advisors.</li>
              <li><strong>Law Enforcement:</strong> When required by law or court order.</li>
              <li><strong>Affiliates/Partners:</strong> For legitimate business purposes, subject to confidentiality agreements.</li>
            </ul>
            <p className="text-slate-600 mb-4 font-medium">We do not sell or rent customer data to third parties.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">6. Data Retention</h2>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Personal data is retained only as long as necessary to fulfill lending obligations, comply with legal requirements, and resolve disputes.</li>
              <li>Once retention periods expire, data is securely deleted or anonymized.</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">7. Data Security</h2>
            <p className="text-slate-600 mb-2">We implement strict technical and organizational measures to protect personal data, including:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Encryption of sensitive information.</li>
              <li>Secure servers and restricted access.</li>
              <li>Regular audits and compliance checks.</li>
              <li>Staff training on data protection.</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">8. Your Rights</h2>
            <p className="text-slate-600 mb-2">Under Kenyan law, you have the right to:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Access your personal data.</li>
              <li>Request correction of inaccurate information.</li>
              <li>Withdraw consent for non-essential processing.</li>
              <li>Request deletion of data, subject to legal and contractual obligations.</li>
              <li>Object to certain types of processing.</li>
            </ul>
            <p className="text-slate-600 mb-4">Requests can be made in writing to our Data Protection Officer.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">9. Contact Information</h2>
            <p className="text-slate-600 mb-2">For questions, concerns, or to exercise your rights, contact:</p>
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <p className="text-slate-700 font-medium">Data Protection Officer</p>
              <p className="text-slate-600">KENELS BUREAU LTD</p>
              <p className="text-slate-600">Nairobi, Kenya</p>
              <p className="text-slate-600">Email: info@kenelsbureau.co.ke</p>
            </div>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">10. Policy Updates</h2>
            <p className="text-slate-600 mb-4">
              We may update this Privacy Policy from time to time to reflect changes in law, regulation, or
              business practices. Updated versions will be published on our official website and made
              available at our offices.
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
