async function runTests() {
  const base = 'http://localhost:5000/api';
  console.log('--- STARTING COMPREHENSIVE ENDPOINT VERIFICATION ---');

  const tests = [
    { name: 'Health Check', url: `${base}/health` },
    { name: 'Dashboard Reports', url: `${base}/reports/dashboard` },
    { name: 'Profit & Loss Statement', url: `${base}/reports/profit-loss` },
    { name: 'Client Profitability', url: `${base}/reports/client-profitability` },
    { name: 'Project Profitability', url: `${base}/reports/project-profitability` },
    { name: 'Travel & Route Logistics', url: `${base}/reports/travel-expenses` },
    { name: 'Clients List', url: `${base}/clients` },
    { name: 'Client 9-Tab Profile (client-1)', url: `${base}/clients/client-1` },
    { name: 'Projects List', url: `${base}/projects` },
    { name: 'Project Detail (proj-1)', url: `${base}/projects/proj-1` },
    { name: 'Quotations List', url: `${base}/quotations` },
    { name: 'Invoices List', url: `${base}/invoices` },
    { name: 'Invoice Detail (inv-1001)', url: `${base}/invoices/inv-1001` },
    { name: 'Unbilled Billable Travel Expenses', url: `${base}/invoices/unbilled-expenses?clientId=client-2` },
    { name: 'Payments Ledger', url: `${base}/payments` },
    { name: 'Expenses Register', url: `${base}/expenses` },
    { name: 'Vehicles & Mileage Presets', url: `${base}/vehicles` },
    { name: 'Equipment & Fleet Inventory', url: `${base}/equipment` },
    { name: 'Equipment Maintenance (eq-1)', url: `${base}/equipment/eq-1` },
    { name: 'Crew & Pilots Directory', url: `${base}/team` },
    { name: 'Reminders & Operational Alerts', url: `${base}/reminders` },
    { name: 'Enterprise Settings & Currencies', url: `${base}/settings` }
  ];

  let passed = 0;
  for (const t of tests) {
    try {
      const res = await fetch(t.url);
      if (res.ok) {
        const json = await res.json();
        console.log(`[PASS] ${t.name}: Status ${res.status}`);
        passed++;
      } else {
        console.error(`[FAIL] ${t.name}: Status ${res.status}`);
      }
    } catch (err: any) {
      console.error(`[FAIL] ${t.name}: ${err.message}`);
    }
  }

  console.log(`\n--- TEST SUMMARY: ${passed}/${tests.length} ENDPOINTS VERIFIED OPERATIONAL ---`);
  if (passed === tests.length) {
    console.log('ALL FINANCIAL, OPERATIONAL & CRM ENDPOINTS WORKING PERFECTLY!');
  }
}

runTests();
