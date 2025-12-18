import { useState } from 'react';
import { LoginRegister } from './components/LoginRegister';
import { Dashboard } from './components/Dashboard';
import { BudgetAlert } from './types/database';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {!isAuthenticated ? (
        <LoginRegister onLogin={() => setIsAuthenticated(true)} />
      ) : (
        <Dashboard 
          onLogout={() => setIsAuthenticated(false)} 
          budgetAlerts={budgetAlerts}
          setBudgetAlerts={setBudgetAlerts}
        />
      )}
    </div>
  );
}