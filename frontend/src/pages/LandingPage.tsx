import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Shield, 
  TrendingUp, 
  Wallet, 
  Clock,
  CheckCircle,
  Smartphone,
  Banknote,
  MapPin,
  Mail,
  Phone,
  HeartHandshake,
  Calculator
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { COMPANY_CONFIG, getCurrentYear } from '../config/company';
import WhatsAppButton from '../components/WhatsAppButton';
import Logo from '../components/Logo';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Logo variant="light" size="md" />
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#benefits" className="text-sm text-slate-300 hover:text-white transition-colors">Benefits</a>
              <a href="#contact" className="text-sm text-slate-300 hover:text-white transition-colors">Contact</a>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/portal/login">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
                  Client Portal
                </Button>
              </Link>
              <Link to="/login">
                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">
                  Staff Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Dark Navy Background */}
      <section className="relative pt-16 min-h-[90vh] flex items-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-500"></div>
        </div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBtLTEgMGExIDEgMCAxIDAgMiAwYTEgMSAwIDEgMCAtMiAwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L2c+PC9zdmc+')] opacity-40"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Quick Loans for Kenyans.
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  Get support until you stabilize
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-xl">
                Need cash for your business, school fees, or emergency? {COMPANY_CONFIG.name}{' '}
                offers loans from <span className="text-emerald-400 font-semibold">KES {COMPANY_CONFIG.loans.minAmount.toLocaleString()} to KES {COMPANY_CONFIG.loans.maxAmount.toLocaleString()}</span> with 
                approval in as little as {COMPANY_CONFIG.loans.approvalTime}. No collateral needed for amounts under KES {COMPANY_CONFIG.loans.collateralFreeLimit.toLocaleString()}.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Link to="/portal/login">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white h-14 px-8 text-base shadow-lg shadow-emerald-500/25">
                    Apply for a Loan
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/portal/login">
                  <Button size="lg" className="h-14 px-8 text-base bg-slate-700 hover:bg-slate-600 text-white border border-slate-600">
                    <Smartphone className="mr-2 h-5 w-5" />
                    Check My Loan Status
                  </Button>
                </Link>
              </div>
              
              {/* Trust Indicators */}
              <div className="mt-12 grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400">5,000+</div>
                  <div className="text-xs text-slate-400">Happy Borrowers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400">KES 500M+</div>
                  <div className="text-xs text-slate-400">Loans Disbursed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400">24hrs</div>
                  <div className="text-xs text-slate-400">Fast Approval</div>
                </div>
              </div>
            </div>

            {/* Right Content - Loan Calculator Preview */}
            <div className="relative">
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Calculator className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Loan Products</h3>
                    <p className="text-xs text-slate-400">Choose what fits your needs</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {[
                    { name: 'Personal Loan', amount: 'KES 10K - 500K', icon: Wallet },
                    { name: 'Business Loan', amount: 'KES 50K - 5M', icon: TrendingUp },
                    { name: 'Salary Advance/Emergency Loan', amount: 'KES 5K - 100K', icon: Banknote },
                    { name: 'Asset Financing', amount: 'Up to KES 10M', icon: Shield },
                  ].map((product) => (
                    <div key={product.name} className="flex items-center gap-4 p-3 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer">
                      <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <product.icon className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-slate-400">{product.amount}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* CTA */}
                <Link to="/portal/login" className="block mt-6">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-center hover:from-emerald-600 hover:to-emerald-700 transition-colors cursor-pointer">
                    <p className="text-white font-semibold">Calculate Your Loan</p>
                    <p className="text-xs text-emerald-100">Get instant quote in 2 minutes</p>
                  </div>
                </Link>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 h-20 w-20 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 opacity-20 blur-xl"></div>
              <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 opacity-20 blur-xl"></div>
            </div>
          </div>
        </div>
        
        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f8fafc"/>
          </svg>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Get Your Loan in 3 Simple Steps
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              No long queues, no endless paperwork. Apply from anywhere and get funded fast.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                step: '01',
                title: 'Apply Online',
                description: 'Fill out our simple application form in under 5 minutes. Upload your ID and proof of income.',
              },
              {
                step: '02',
                title: 'Quick Review',
                description: 'Our team reviews your application within 24 hours. No hidden checks, transparent process.',
              },
              {
                step: '03',
                title: 'Get Funded',
                description: 'Once approved, receive funds directly to your M-Pesa or bank account. Same day for emergencies.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 text-2xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>

          {/* What We Offer */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">What We Offer</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Banknote,
                  title: 'Personal Loans',
                  description: 'For school fees, medical bills, rent, or any personal needs.',
                },
                {
                  icon: TrendingUp,
                  title: 'Business Loans',
                  description: 'Grow your business with capital for stock, equipment, or expansion.',
                },
                {
                  icon: Clock,
                  title: 'Salary Advance Loans',
                  description: 'For Kenyan employees. Get loan support until you stabilize.',
                },
                {
                  icon: Shield,
                  title: 'Asset Financing',
                  description: 'Finance vehicles, machinery, or property with flexible terms.',
                },
                {
                  icon: HeartHandshake,
                  title: 'Group Loans',
                  description: 'Chama and group lending solutions for collective growth.',
                },
                {
                  icon: Smartphone,
                  title: 'Mobile Loans',
                  description: 'Quick mobile loans via M-Pesa. Apply and receive in minutes.',
                },
              ].map((feature) => (
                <div key={feature.title} className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">{feature.title}</h4>
                    <p className="text-sm text-slate-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Kenels Section */}
      <section id="benefits" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                Why 5,000+ Kenyans Trust {COMPANY_CONFIG.name}
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                We're not just another lender. We're your financial partner committed to 
                helping you achieve your dreams without the stress of traditional banking.
              </p>
              <ul className="space-y-4">
                {[
                  { text: 'No collateral required for loans under KES 100,000', highlight: true },
                  { text: 'Approval in as little as 24 hours', highlight: false },
                  { text: 'Repay via M-Pesa, bank transfer, or cash', highlight: false },
                  { text: 'No hidden fees - what you see is what you pay', highlight: true },
                  { text: 'Flexible terms from 1 to 36 months', highlight: false },
                  { text: 'Friendly support team that speaks your language', highlight: false },
                ].map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${benefit.highlight ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className={benefit.highlight ? 'text-slate-900 font-medium' : 'text-slate-700'}>{benefit.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Banknote className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Need Cash Today?</h3>
                  <p className="text-slate-400 text-sm">Get up to KES 100,000 instantly</p>
                </div>
              </div>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-3 border-b border-slate-700">
                  <span className="text-slate-300">Loan Amount</span>
                  <span className="text-white font-semibold">KES 10,000 - 5,000,000</span>
                </div>
                                <div className="flex justify-between items-center py-3 border-b border-slate-700">
                  <span className="text-slate-300">Repayment Period</span>
                  <span className="text-white font-semibold">1 - 36 months</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-slate-300">Processing Time</span>
                  <span className="text-emerald-400 font-semibold">24 hours</span>
                </div>
              </div>
              <Link to="/portal/login">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white w-full">
                  Apply Now - It's Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="text-xs text-slate-500 text-center mt-4">No application fees. No obligation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Contact Us</h2>
            <p className="text-slate-400">
              Have questions? We're here to help you with all your financial needs.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6 rounded-xl bg-slate-800/50">
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Location</h3>
              <p className="text-slate-400 text-sm">Eaton Place, 2nd Floor,<br />United Nations Crescent,<br />Nairobi-Kenya</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-slate-800/50">
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Email</h3>
              <a href={`mailto:${COMPANY_CONFIG.email}`} className="text-emerald-400 hover:text-emerald-300 text-sm">
                {COMPANY_CONFIG.email}
              </a>
            </div>
            <div className="text-center p-6 rounded-xl bg-slate-800/50">
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Call</h3>
              <a href={`tel:${COMPANY_CONFIG.phoneRaw}`} className="text-emerald-400 hover:text-emerald-300 text-sm">
                {COMPANY_CONFIG.phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-950 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Logo variant="light" size="md" />
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Your trusted financial partner for quick, flexible, and affordable loan solutions in Kenya.
              </p>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-emerald-400 transition-colors">How It Works</a></li>
                <li><a href="#benefits" className="hover:text-emerald-400 transition-colors">Why Choose Us</a></li>
                <li><a href="#contact" className="hover:text-emerald-400 transition-colors">Contact Us</a></li>
                <li><Link to="/portal/login" className="hover:text-emerald-400 transition-colors">Client Portal</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy-policy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms-conditions" className="hover:text-emerald-400 transition-colors">Terms & Conditions</Link></li>
              </ul>
            </div>
            
          </div>
          
          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm">
              © {getCurrentYear()} {COMPANY_CONFIG.name}. All rights reserved.
            </p>
            <p className="text-xs text-slate-500">
              Powered by <a href="https://neliumsystems.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-400">Nelium Systems</a>
            </p>
          </div>
        </div>
      </footer>

      {/* WhatsApp Chat Button */}
      <WhatsAppButton />
    </div>
  );
}
