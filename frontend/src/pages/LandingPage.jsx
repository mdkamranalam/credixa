import { Link } from "react-router-dom";
import {
  GraduationCap,
  ShieldCheck,
  Zap,
  BookOpen,
  ArrowRight,
  Landmark,
  PiggyBank,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar segment */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <img src="/credixa-logo.png" alt="Credixa Logo" className="w-10 h-10 rounded-xl object-contain shadow-sm" />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-secondary to-indigo-600">
                Credixa
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-tertiary font-medium transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register/student"
                className="bg-tertiary hover:opacity-90 text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-white"></div>
          {/* Decorative blurred shapes */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-48 -left-24 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-secondary font-medium text-sm mb-8 shadow-sm">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            AI-Driven Education Funding
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 tracking-tight mb-8">
            Fund your education with <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-tertiary to-indigo-600">
              Buy Now, Pay Later.
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto mb-10 leading-relaxed">
            Credixa is a comprehensive BNPL platform empowering students with flexible financing. Let our AI risk engine tailor the perfect approval for your future.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register/student"
              className="px-8 py-4 text-lg font-semibold rounded-full text-white bg-tertiary hover:opacity-90 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              Apply as Student
            </Link>
            <Link
              to="/register/institution"
              className="px-8 py-4 text-lg font-semibold rounded-full text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm transition-all"
            >
              Partner Institution
            </Link>
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 text-gray-400 text-sm font-medium">
            <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-green-500" /> Secure Vault</div>
            <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /> Instant Decisions</div>
            <div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-500" /> AI Omniscore</div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why choose Credixa?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">We bridge the gap between your ambition and your finances using next-generation AI underwriting.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                <Landmark className="w-7 h-7 text-tertiary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Risk Engine</h3>
              <p className="text-gray-600 leading-relaxed">
                Traditional credit scores don't work for students. Our proprietary machine learning engine analyzes alternative data to generate an encompassing Omniscore.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-6">
                <PiggyBank className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Flexible BNPL</h3>
              <p className="text-gray-600 leading-relaxed">
                Break down hefty tuition fees into manageable, transparent installments without hidden charges or predatory interest rates.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Institution Portals</h3>
              <p className="text-gray-600 leading-relaxed">
                Dedicated dashboards for partner schools to manage applications, track metrics, and receive instant disbursements securely.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How it Works / Steps */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">From Application to Approval in Minutes</h2>
              <p className="text-lg text-gray-600 mb-8">
                Say goodbye to mountains of paperwork and weeks of waiting. Credixa streamlines educational financing so you can focus on studying.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-tertiary font-bold">1</div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Create an Account</h4>
                    <p className="text-gray-600">Register as a student under your participating institution.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-tertiary font-bold">2</div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Upload Documents</h4>
                    <p className="text-gray-600">Securely upload bank statements to our Document Vault for analysis.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-tertiary font-bold">3</div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">AI Assessment</h4>
                    <p className="text-gray-600">Our engine instantly calculates your Omniscore and decides on approval.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 w-full">
              <div className="bg-gradient-to-tr from-tertiary to-indigo-600 p-1 rounded-2xl shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="bg-white rounded-xl p-8 h-full">
                  <div className="flex justify-between items-center mb-8 border-b pb-4">
                    <span className="font-bold text-gray-800 flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-tertiary" /> Dashboard Preview
                    </span>
                    <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">Approved</span>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                    <div className="py-4">
                      <div className="h-24 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                        <span className="text-secondary font-bold text-xl">Omniscore: 852 / 900</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-16 bg-gray-50 rounded-lg border border-gray-100"></div>
                      <div className="h-16 bg-gray-50 rounded-lg border border-gray-100"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-tertiary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">Ready to empower your educational journey?</h2>
          <p className="text-blue-100 mb-10 max-w-2xl mx-auto text-lg">
            Join thousands of students and leading institutions who trust Credixa for simple, transparent, and fair education financing.
          </p>
          <Link
            to="/register/student"
            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-bold rounded-full text-tertiary bg-white hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all"
          >
            Get Started Now <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src="/credixa-logo.png" alt="Credixa Logo" className="h-8 w-8 rounded-lg object-contain" />
              <span className="text-xl font-bold text-white">Credixa</span>
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            <div className="text-sm">
              &copy; {new Date().getFullYear()} Credixa. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
