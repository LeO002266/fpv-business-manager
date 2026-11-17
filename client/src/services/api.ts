const API_BASE = '/api';

export function getAuthHeaders() {
  const token = localStorage.getItem('fpv_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (credentials: { email: string; password?: string }) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  me: () => apiRequest('/auth/me'),

  // Clients
  getClients: () => apiRequest('/clients'),
  getClientDetail: (id: string) => apiRequest(`/clients/${id}`),
  createClient: (data: any) => apiRequest('/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id: string, data: any) => apiRequest(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClient: (id: string) => apiRequest(`/clients/${id}`, { method: 'DELETE' }),

  // Projects
  getProjects: () => apiRequest('/projects'),
  getProjectDetail: (id: string) => apiRequest(`/projects/${id}`),
  createProject: (data: any) => apiRequest('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: string, data: any) => apiRequest(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  assignProjectMember: (id: string, data: any) => apiRequest(`/projects/${id}/members`, { method: 'POST', body: JSON.stringify(data) }),
  removeProjectMember: (id: string, memberId: string) => apiRequest(`/projects/${id}/members/${memberId}`, { method: 'DELETE' }),
  deleteProject: (id: string) => apiRequest(`/projects/${id}`, { method: 'DELETE' }),

  // Quotations
  getQuotations: () => apiRequest('/quotations'),
  getQuotationDetail: (id: string) => apiRequest(`/quotations/${id}`),
  createQuotation: (data: any) => apiRequest('/quotations', { method: 'POST', body: JSON.stringify(data) }),
  convertQuotation: (id: string, data: any) => apiRequest(`/quotations/${id}/convert`, { method: 'POST', body: JSON.stringify(data) }),
  deleteQuotation: (id: string) => apiRequest(`/quotations/${id}`, { method: 'DELETE' }),

  // Invoices
  getInvoices: () => apiRequest('/invoices'),
  getInvoiceDetail: (id: string) => apiRequest(`/invoices/${id}`),
  getUnbilledExpenses: (clientId: string, projectId?: string) =>
    apiRequest(`/invoices/unbilled-expenses?clientId=${clientId}${projectId ? `&projectId=${projectId}` : ''}`),
  createInvoice: (data: any) => apiRequest('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  cancelInvoice: (id: string) => apiRequest(`/invoices/${id}/cancel`, { method: 'POST' }),
  deleteInvoice: (id: string) => apiRequest(`/invoices/${id}`, { method: 'DELETE' }),

  // Payments
  getPayments: () => apiRequest('/payments'),
  createPayment: (data: any) => apiRequest('/payments', { method: 'POST', body: JSON.stringify(data) }),
  deletePayment: (id: string) => apiRequest(`/payments/${id}`, { method: 'DELETE' }),

  // Expenses & Travel
  getExpenses: (filters?: Record<string, string>) => {
    const params = new URLSearchParams(filters || {}).toString();
    return apiRequest(`/expenses${params ? `?${params}` : ''}`);
  },
  createExpense: (data: any) => apiRequest('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id: string, data: any) => apiRequest(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense: (id: string) => apiRequest(`/expenses/${id}`, { method: 'DELETE' }),

  // Vehicles
  getVehicles: () => apiRequest('/vehicles'),
  createVehicle: (data: any) => apiRequest('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  updateVehicle: (id: string, data: any) => apiRequest(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVehicle: (id: string) => apiRequest(`/vehicles/${id}`, { method: 'DELETE' }),

  // Equipment
  getEquipment: () => apiRequest('/equipment'),
  getEquipmentDetail: (id: string) => apiRequest(`/equipment/${id}`),
  createEquipment: (data: any) => apiRequest('/equipment', { method: 'POST', body: JSON.stringify(data) }),
  updateEquipment: (id: string, data: any) => apiRequest(`/equipment/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  logMaintenance: (id: string, data: any) => apiRequest(`/equipment/${id}/maintenance`, { method: 'POST', body: JSON.stringify(data) }),
  assignEquipment: (id: string, data: any) => apiRequest(`/equipment/${id}/assign`, { method: 'POST', body: JSON.stringify(data) }),
  returnEquipment: (id: string, data: any) => apiRequest(`/equipment/${id}/return`, { method: 'POST', body: JSON.stringify(data) }),
  deleteEquipment: (id: string) => apiRequest(`/equipment/${id}`, { method: 'DELETE' }),

  // Team
  getTeam: () => apiRequest('/team'),
  createTeamMember: (data: any) => apiRequest('/team', { method: 'POST', body: JSON.stringify(data) }),
  updateTeamMember: (id: string, data: any) => apiRequest(`/team/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTeamMember: (id: string) => apiRequest(`/team/${id}`, { method: 'DELETE' }),

  // Reminders
  getReminders: (status?: string) => apiRequest(`/reminders${status ? `?status=${status}` : ''}`),
  createReminder: (data: any) => apiRequest('/reminders', { method: 'POST', body: JSON.stringify(data) }),
  updateReminderStatus: (id: string, status: string) => apiRequest(`/reminders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteReminder: (id: string) => apiRequest(`/reminders/${id}`, { method: 'DELETE' }),

  // Reports
  getDashboardReports: (startDate?: string, endDate?: string) => {
    const q = startDate && endDate ? `?start_date=${startDate}&end_date=${endDate}` : '';
    return apiRequest(`/reports/dashboard${q}`);
  },
  getProfitLoss: (startDate?: string, endDate?: string) => {
    const q = startDate && endDate ? `?start_date=${startDate}&end_date=${endDate}` : '';
    return apiRequest(`/reports/profit-loss${q}`);
  },
  getClientProfitability: () => apiRequest('/reports/client-profitability'),
  getProjectProfitability: () => apiRequest('/reports/project-profitability'),
  getTravelExpensesReport: (startDate?: string, endDate?: string) => {
    const q = startDate && endDate ? `?start_date=${startDate}&end_date=${endDate}` : '';
    return apiRequest(`/reports/travel-expenses${q}`);
  },

  // Settings & Backup
  getSettings: () => apiRequest('/settings'),
  updateSettings: (data: any) => apiRequest('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  updateCurrency: (code: string, rate: number) => apiRequest(`/settings/currencies/${code}`, { method: 'PUT', body: JSON.stringify({ default_exchange_rate: rate }) }),
  restoreBackup: (data: any) => apiRequest('/settings/restore', { method: 'POST', body: JSON.stringify(data) })
};

export function formatCurrency(amount: number, currency = 'INR'): string {
  const num = Number(amount) || 0;
  try {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 2
    }).format(num);
  } catch {
    return `${currency} ${num.toFixed(2)}`;
  }
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}
