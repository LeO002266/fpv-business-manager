import React, { Suspense, useState } from 'react';
import { Sidebar, navigationItems } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { Modal } from './components/Modal.js';
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
  { tab: 'clients', label: 'New Client', icon: Users, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { tab: 'projects', label: 'New Shoot', icon: Film, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  { tab: 'travel', label: 'Travel / Fuel', icon: MapPin, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { tab: 'invoices', label: 'New Invoice', icon: Receipt, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { tab: 'payments', label: 'Record Payment', icon: CreditCard, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  { tab: 'quotations', label: 'New Quotation', icon: FileSpreadsheet, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { tab: 'equipment', label: 'Add Hardware', icon: Cpu, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  { tab: 'team', label: 'Add Crew Member', icon: UserCheck, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
];

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-400 font-medium">Loading module...</span>
      </div>
    </div>
  );
}

export function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const getPageTitle = () => {
    const item = navigationItems.find(n => n.id === currentTab);
    return item ? item.label : 'Dashboard';
  };

  const handleQuickSelect = (tab: string) => {
    setCurrentTab(tab);
    setQuickAddOpen(false);
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <Header
          title={getPageTitle()}
          onOpenSidebar={() => setSidebarOpen(true)}
          onQuickAdd={() => setQuickAddOpen(true)}
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

      {/* Global Quick Add Action Sheet */}
      {quickAddOpen && (
        <Modal
          isOpen={quickAddOpen}
          onClose={() => setQuickAddOpen(false)}
          title="Quick Add Action"
          maxWidth="md"
        >
          <div className="space-y-2">
            <p className="text-xs text-slate-400 mb-3">Select the type of record you wish to create:</p>
            <div className="grid grid-cols-2 gap-2.5">
              {quickActions.map((action) => (
                <button
                  key={action.tab}
                  onClick={() => handleQuickSelect(action.tab)}
                  className="glass glass-hover flex items-center gap-2.5 p-3 rounded-xl text-left text-xs font-semibold text-white"
                >
                  <span className={`p-1.5 rounded-lg border ${action.color}`}>
                    <action.icon className="w-3.5 h-3.5" />
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
