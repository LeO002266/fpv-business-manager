import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  MapPin,
  Film,
  Receipt,
  Users,
  Calculator,
  ShieldCheck,
  Cpu,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { Button } from './ui/Button.js';
import { Badge } from './ui/Badge.js';

interface ProductTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const ProductTourModal: React.FC<ProductTourModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [activeView, setActiveView] = useState<'tour' | 'formulas'>('tour');

  if (!isOpen) return null;

  const tourSteps = [
    {
      badge: 'Welcome to FPV Manager',
      title: 'A Complete ERP for FPV Pilots & Aerial Productions',
      subtitle: 'Built specifically for drone videographers, wedding filmers, and commercial media creators.',
      icon: Sparkles,
      iconColor: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      description:
        'This is not just a simple expense tracker. It interconnects your entire workflow from client booking to travel logging, invoicing, payment tracking, and actual shoot-wise profitability.',
      highlights: [
        { title: 'End-to-End Pipeline', desc: 'Client → Shoot → Travel Expenses → Invoices → Payments → Net Profit.' },
        { title: 'Zero Manual Math', desc: 'All financial totals, fuel costs, taxes, and balances calculate automatically.' },
        { title: 'Client-Wise Accounting', desc: 'Every client has an independent financial profile with complete transaction history.' }
      ],
      quickActionLabel: 'Explore Dashboard',
      quickActionTab: 'dashboard'
    },
    {
      badge: 'Step 1: Shoots & Projects',
      title: 'Book, Schedule & Assign Drones & Crew',
      subtitle: 'Manage commercial shoots, weddings, tourism films, and real estate jobs.',
      icon: Film,
      iconColor: 'bg-sky-50 text-sky-600 border-sky-200',
      description:
        'Create shoot bookings with shoot dates, call times, location (local village, city, or destination), and agreed pricing. You can assign specific FPV drones and crew members with agreed day rates.',
      highlights: [
        { title: 'Crew Day-Rates', desc: 'Assign pilots, spotters, and editors with custom per-day or per-project pay.' },
        { title: 'Hardware Assignment', desc: 'Assign specific gear (e.g. 5" Acro Drone, CineWhoop) to prevent double bookings.' },
        { title: 'Status Tracking', desc: 'Move from Quotation → Confirmed → In Progress → Completed.' }
      ],
      quickActionLabel: 'View Shoots',
      quickActionTab: 'projects'
    },
    {
      badge: 'Step 2: Smart Travel & Fuel Engine',
      title: 'Automated Petrol & Travel Expense Calculator',
      subtitle: 'Never guess fuel costs again — precise distance and mileage calculations.',
      icon: MapPin,
      iconColor: 'bg-amber-50 text-amber-600 border-amber-200',
      description:
        'When you travel from your base (e.g., Rajnagar) to shoot locations (Durg, Bhilai, Raipur, or interstate), enter the distance in KM. The system computes fuel cost automatically using your vehicle mileage and current petrol price.',
      highlights: [
        { title: 'Fuel Cost Formula', desc: '(Distance in KM ÷ Vehicle Mileage) × Petrol Price per Liter.' },
        { title: 'Billable vs. Business', desc: 'Tag costs as "Client_Billable" if client pays for travel, or "Business_Expense" if it is internal.' },
        { title: 'Multiple Modes', desc: 'Supports Car, Bike, Taxi, Train, Flight, Tolls, Hotel, and Food expenses.' }
      ],
      quickActionLabel: 'Open Travel Log',
      quickActionTab: 'travel'
    },
    {
      badge: 'Step 3: Invoicing & Auto-Reimbursement',
      title: 'Professional Invoicing with 1-Click Expense Pass-Through',
      subtitle: 'Bill clients for services and automatically attach unbilled travel expenses.',
      icon: Receipt,
      iconColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      description:
        'Generate GST-compliant invoices and formal quotations with automatic numbering. The system lets you include unbilled travel expenses directly into the invoice with one click so the client reimburses your travel costs!',
      highlights: [
        { title: 'Pass-Through Travel', desc: 'Select unbilled petrol/tolls to auto-add as invoice line items.' },
        { title: 'Balance Due Tracking', desc: 'Balance automatically decrements as payments are recorded against the invoice.' },
        { title: 'Instant PDF Export', desc: 'Download clean, branded PDF invoices with GSTIN, terms, and bank details.' }
      ],
      quickActionLabel: 'View Invoices',
      quickActionTab: 'invoices'
    },
    {
      badge: 'Step 4: Client Financial Profiles',
      title: 'Complete Client-Wise CRM & Accounting',
      subtitle: 'Every client has an independent ledger and performance dashboard.',
      icon: Users,
      iconColor: 'bg-purple-50 text-purple-600 border-purple-200',
      description:
        'Click on any client to open their 9-tab profile: Overview, Projects, Quotations, Invoices, Payments, Travel Expenses, Other Costs, Documents, and Activity Audit.',
      highlights: [
        { title: 'Client Net Profit', desc: 'See the exact lifetime profit you made from each client.' },
        { title: 'Pending Receivables', desc: 'Instantly identify which clients owe pending payment balances.' },
        { title: 'Multi-Currency Ready', desc: 'Supports INR (₹), USD ($), AED, EUR (€), GBP (£) with stored exchange rates.' }
      ],
      quickActionLabel: 'Explore Clients',
      quickActionTab: 'clients'
    },
    {
      badge: 'Step 5: The Golden Accounting Rule',
      title: 'How Profit & Costs are Actually Calculated',
      subtitle: 'Understanding why your net profit is accurate and protected.',
      icon: Calculator,
      iconColor: 'bg-rose-50 text-rose-600 border-rose-200',
      description:
        'Most basic apps treat all expenses as losses. FPV Business Manager correctly separates client-reimbursed costs from internal business overhead.',
      highlights: [
        { title: 'Billable Expenses', desc: 'Billed to the client and paid back on invoice — does NOT reduce your profit.' },
        { title: 'Team Payouts', desc: 'Day rates paid to pilots/editors are subtracted as direct cost of sales.' },
        { title: 'Real Net Profit', desc: 'Total Invoiced Revenue − Unbilled Internal Costs − Crew Payouts = True Net Profit.' }
      ],
      quickActionLabel: 'Check Profit Reports',
      quickActionTab: 'reports'
    }
  ];

  const formulas = [
    {
      title: 'Automated Fuel Cost Calculation',
      icon: MapPin,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      formula: 'Fuel Cost = (Distance in KM ÷ Vehicle Mileage in km/L) × Fuel Price per Liter',
      example: 'Example: 100 KM round-trip at 20 km/L in Swift with Petrol at ₹105/L = (100 ÷ 20) × 105 = ₹525 fuel cost.',
      rule: 'If you enter distance, mileage, and petrol price, the system calculates the amount automatically with zero manual effort.'
    },
    {
      title: 'Invoice Balance Due & Payment Status',
      icon: Receipt,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      formula: 'Balance Due = Invoice Total Amount − Sum of Allocated Payments',
      example: 'Example: Invoice of ₹50,000 with advance payment of ₹20,000 leaves Balance Due of ₹30,000.',
      rule: 'Status automatically transitions: Unpaid (₹0 paid) → Partially Paid (₹1 to ₹49,999 paid) → Paid (₹50,000 paid).'
    },
    {
      title: 'Client-Billable vs. Business Expense',
      icon: DollarSign,
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      formula: 'Billable Treatment = Reimbursed by Client on Invoice | Business Expense = Internal Overhead',
      example: 'Example: ₹3,000 petrol for Udaipur wedding shoot tagged as "Client_Billable" is added to client invoice and reimbursed.',
      rule: 'Pass-through expenses recovered from clients do NOT reduce your profit, because the client pays for them.'
    },
    {
      title: 'True Net Business Profit',
      icon: TrendingUp,
      color: 'text-rose-700 bg-rose-50 border-rose-200',
      formula: 'Net Profit = Total Invoiced Revenue − Unbilled Internal Overhead − Crew Payouts',
      example: 'Example: ₹75,000 billing − ₹10,000 pilot rate − ₹5,000 internal maintenance = ₹60,000 Net Profit.',
      rule: 'Reflects your true take-home business earnings after paying your team and internal operational costs.'
    }
  ];

  const step = tourSteps[currentStep];

  const handleFinish = () => {
    localStorage.setItem('fpv_tour_completed', 'true');
    onClose();
  };

  const handleActionClick = (tab: string) => {
    localStorage.setItem('fpv_tour_completed', 'true');
    onClose();
    if (onNavigateToTab) onNavigateToTab(tab);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={handleFinish}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl z-10 max-h-[92vh] flex flex-col overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                FPV Business Manager Guide
              </h2>
              <p className="text-xs text-slate-500">First-time user walkthrough & calculations guide</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle between Tour and Formulas */}
            <div className="hidden sm:inline-flex bg-slate-200/70 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setActiveView('tour')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  activeView === 'tour'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Feature Tour ({currentStep + 1}/6)
              </button>
              <button
                onClick={() => setActiveView('formulas')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  activeView === 'formulas'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Calculation Rules
              </button>
            </div>

            <button
              onClick={handleFinish}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar text-slate-700 space-y-6">
          {activeView === 'tour' ? (
            <div>
              {/* Step indicator */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  {step.badge}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  Step {currentStep + 1} of {tourSteps.length}
                </span>
              </div>

              {/* Step Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-xl border shrink-0 ${step.iconColor}`}>
                  <step.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{step.subtitle}</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                {step.description}
              </p>

              {/* Highlights cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {step.highlights.map((h, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1"
                  >
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{h.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">{h.desc}</p>
                  </div>
                ))}
              </div>

              {/* Quick Jump Link */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
                <span className="text-xs text-indigo-900 font-medium">
                  Want to try this feature right now?
                </span>
                <button
                  onClick={() => handleActionClick(step.quickActionTab)}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                >
                  <span>{step.quickActionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Formulas View */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-600" />
                  How Financial Calculations Work in FPV Manager
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Every metric on your dashboard comes from actual transaction records. Here is the exact business logic and mathematical rules used throughout the system.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {formulas.map((f, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`p-1.5 rounded-lg border text-xs font-bold ${f.color}`}>
                        <f.icon className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-sm font-bold text-slate-900">{f.title}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-indigo-700 font-semibold">
                      {f.formula}
                    </div>

                    <p className="text-xs text-slate-600 bg-amber-50/50 border border-amber-100 p-2.5 rounded-lg">
                      <span className="font-semibold text-amber-900">Example: </span>
                      {f.example}
                    </p>

                    <p className="text-[11px] text-slate-500 italic">
                      Rule: {f.rule}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/70">
          {activeView === 'tour' ? (
            <>
              <button
                onClick={handleFinish}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Skip Tour
              </button>

              <div className="flex items-center gap-1.5">
                {tourSteps.map((_, i) => (
                  <span
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                      currentStep === i ? 'w-5 bg-indigo-600' : 'bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <Button
                    onClick={() => setCurrentStep((prev) => prev - 1)}
                    variant="secondary"
                    size="sm"
                    icon={ArrowLeft}
                  >
                    Back
                  </Button>
                )}

                {currentStep < tourSteps.length - 1 ? (
                  <Button
                    onClick={() => setCurrentStep((prev) => prev + 1)}
                    variant="primary"
                    size="sm"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={handleFinish} variant="primary" size="sm">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    <span>Got It! Start Using</span>
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <button
                onClick={() => setActiveView('tour')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Feature Tour
              </button>
              <Button onClick={handleFinish} variant="primary" size="sm">
                Close Guide
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
