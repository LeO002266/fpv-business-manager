import React, { Suspense, useState, useEffect } from 'react';
import { Sidebar, navigationItems } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { Modal } from './components/Modal.js';
import { ProductTourModal } from './components/ProductTourModal.js';
import {
  Users,
  Film,
  FileSpreadsheet,
  Receipt,
  MapPin,
  TrendingDown,
  Cpu,
  UserCheck,
  CreditCard,
  LucideIcon
} from 'lucide-react';

const DashboardPage = React.lazy(() =>
  import('./pages/DashboardPage.js').then((m) => ({ default: m.DashboardPage }))
);
const ClientsPage = React.lazy(() =>
  import('./pages/ClientsPage.js').then((m) => ({ default: m.ClientsPage }))
);
const ProjectsPage = React.lazy(() =>
  import('./pages/ProjectsPage.js').then((m) => ({ default: m.ProjectsPage }))
);
const QuotationsPage = React.lazy(() =>
  import('./pages/QuotationsPage.js').then((m) => ({ default: m.QuotationsPage }))
);
const InvoicesPage = React.lazy(() =>
  import('./pages/InvoicesPage.js').then((m) => ({ default: m.InvoicesPage }))
);
const PaymentsPage = React.lazy(() =>
  import('./pages/PaymentsPage.js').then((m) => ({ default: m.PaymentsPage }))
);
const TravelExpensesPage = React.lazy(() =>
  import('./pages/TravelExpensesPage.js').then((m) => ({ default: m.TravelExpensesPage }))
);
const BusinessExpensesPage = React.lazy(() =>
  import('./pages/BusinessExpensesPage.js').then((m) => ({ default: m.BusinessExpensesPage }))
);
const AccountsPage = React.lazy(() =>
  import('./pages/AccountsPage.js').then((m) => ({ default: m.AccountsPage }))
);
const EquipmentPage = React.lazy(() =>
  import('./pages/EquipmentPage.js').then((m) => ({ default: m.EquipmentPage }))
);
const TeamPage = React.lazy(() =>
  import('./pages/TeamPage.js').then((m) => ({ default: m.TeamPage }))
);
const ReportsPage = React.lazy(() =>
  import('./pages/ReportsPage.js').then((m) => ({ default: m.ReportsPage }))
);
const RemindersPage = React.lazy(() =>
  import('./pages/RemindersPage.js').then((m) => ({ default: m.RemindersPage }))
);
const SettingsPage = React.lazy(() =>
  import('./pages/SettingsPage.js').then((m) => ({ default: m.SettingsPage }))
);

interface QuickAction {
  tab: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

const quickActions: QuickAction[] = [
  { tab: 'projects', label: 'New Shoot', icon: Film, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { tab: 'travel', label: 'Log Travel / Fuel', icon: MapPin, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { tab: 'invoices', label: 'New Invoice', icon: Receipt, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { tab: 'clients', label: 'New Client', icon: Users, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  { tab: 'payments', label: 'Record Payment', icon: CreditCard, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  { tab: 'quotations', label: 'New Quotation', icon: FileSpreadsheet, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { tab: 'equipment', label: 'Add Gear / Drone', icon: Cpu, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { tab: 'team', label: 'Add Pilot / Crew', icon: UserCheck, color: 'text-slate-600 bg-slate-100 border-slate-300' },
];

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-slate-500 font-medium">Loading module...</span>
      </div>
    </div>
  );
}

export function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  // Automatically show tour on first visit
  useEffect(() => {
    try {
      const hasSeenTour = localStorage.getItem('fpv_tour_completed');
      if (!hasSeenTour) {
        setTourOpen(true);
      }
    } catch {
      // ignore storage access errors
    }
  }, []);

  const getPageTitle = () => {
    const item = navigationItems.find(n => n.id === currentTab);
    return item ? item.label : 'Dashboard';
  };

  const handleQuickSelect = (tab: string) => {
    setCurrentTab(tab);
    setQuickAddOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onOpenTour={() => setTourOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={getPageTitle()}
          onOpenSidebar={() => setSidebarOpen(true)}
          onQuickAdd={() => setQuickAddOpen(true)}
          onOpenTour={() => setTourOpen(true)}
        />

        <main className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
          <Suspense fallback={<PageFallback />}>
            {currentTab === 'dashboard' && <DashboardPage onNavigate={setCurrentTab} />}
            {currentTab === 'clients' && <ClientsPage />}
            {currentTab === 'projects' && <ProjectsPage />}
            {currentTab === 'quotations' && <QuotationsPage />}
            {currentTab === 'invoices' && <InvoicesPage />}
            {currentTab === 'payments' && <PaymentsPage />}
            {currentTab === 'travel' && <TravelExpensesPage />}
            {currentTab === 'expenses' && <BusinessExpensesPage />}
            {currentTab === 'accounts' && <AccountsPage />}
            {currentTab === 'equipment' && <EquipmentPage />}
            {currentTab === 'team' && <TeamPage />}
            {currentTab === 'reports' && <ReportsPage />}
            {currentTab === 'reminders' && <RemindersPage />}
            {currentTab === 'settings' && <SettingsPage />}
          </Suspense>
        </main>
      </div>

      {/* Product Onboarding Tour & Calculation Guide Modal */}
      <ProductTourModal
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
        onNavigateToTab={(tab) => setCurrentTab(tab)}
      />

      {/* Global Quick Add Action Sheet */}
      {quickAddOpen && (
        <Modal
          isOpen={quickAddOpen}
          onClose={() => setQuickAddOpen(false)}
          title="Quick Action"
          maxWidth="md"
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Select what you would like to create:</p>
            <div className="grid grid-cols-2 gap-2.5">
              {quickActions.map((action) => (
                <button
                  key={action.tab}
                  onClick={() => handleQuickSelect(action.tab)}
                  className="bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-indigo-300 flex items-center gap-2.5 p-3 rounded-xl text-left text-xs font-semibold text-slate-800 transition-all shadow-xs cursor-pointer"
                >
                  <span className={`p-2 rounded-lg border ${action.color}`}>
                    <action.icon className="w-4 h-4" />
                  </span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default App;
