import React, { useState } from 'react';
import { Sidebar, navigationItems } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { Modal } from './components/Modal.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ClientsPage } from './pages/ClientsPage.js';
import { ProjectsPage } from './pages/ProjectsPage.js';
import { QuotationsPage } from './pages/QuotationsPage.js';
import { InvoicesPage } from './pages/InvoicesPage.js';
import { PaymentsPage } from './pages/PaymentsPage.js';
import { TravelExpensesPage } from './pages/TravelExpensesPage.js';
import { BusinessExpensesPage } from './pages/BusinessExpensesPage.js';
import { AccountsPage } from './pages/AccountsPage.js';
import { EquipmentPage } from './pages/EquipmentPage.js';
import { TeamPage } from './pages/TeamPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { RemindersPage } from './pages/RemindersPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import {
  Users,
  Film,
  FileSpreadsheet,
  Receipt,
  MapPin,
  TrendingDown,
  Cpu,
  UserCheck,
  CreditCard
} from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header
          title={getPageTitle()}
          onOpenSidebar={() => setSidebarOpen(true)}
          onQuickAdd={() => setQuickAddOpen(true)}
        />

        <main className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
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
              <button
                onClick={() => handleQuickSelect('clients')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left text-xs font-semibold text-white transition-all"
              >
                <Users className="w-4 h-4 text-emerald-400" />
                <span>New Client</span>
              </button>

              <button
                onClick={() => handleQuickSelect('projects')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left text-xs font-semibold text-white transition-all"
              >
                <Film className="w-4 h-4 text-sky-400" />
                <span>New Shoot</span>
              </button>

              <button
                onClick={() => handleQuickSelect('travel')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left text-xs font-semibold text-white transition-all"
              >
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>Travel / Fuel</span>
              </button>

              <button
                onClick={() => handleQuickSelect('invoices')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left text-xs font-semibold text-white transition-all"
              >
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>New Invoice</span>
              </button>

              <button
                onClick={() => handleQuickSelect('payments')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left text-xs font-semibold text-white transition-all"
              >
                <CreditCard className="w-4 h-4 text-teal-400" />
                <span>Record Payment</span>
              </button>

              <button
                onClick={() => handleQuickSelect('quotations')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left text-xs font-semibold text-white transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                <span>New Quotation</span>
              </button>

              <button
                onClick={() => handleQuickSelect('equipment')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left text-xs font-semibold text-white transition-all"
              >
                <Cpu className="w-4 h-4 text-rose-400" />
                <span>Add Hardware</span>
              </button>

              <button
                onClick={() => handleQuickSelect('team')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left text-xs font-semibold text-white transition-all"
              >
                <UserCheck className="w-4 h-4 text-indigo-400" />
                <span>Add Crew Member</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
export default App;
