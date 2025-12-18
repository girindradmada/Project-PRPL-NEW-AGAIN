import { useState, useEffect } from 'react';
import { LogOut, MessageCircle, X, Bell } from 'lucide-react';
import { TransactionLogger } from './TransactionLogger';
import { BudgetsTable } from './BudgetsTable';
import { SpendingOverview } from './SpendingOverview';
import { Chatbot } from './Chatbot';
import { BudgetAlert, Transaction, Budget } from '../types/database';

interface DashboardProps {
  onLogout: () => void;
  budgetAlerts: BudgetAlert[];
  setBudgetAlerts: (alerts: BudgetAlert[]) => void;
}

export function Dashboard({ onLogout, budgetAlerts, setBudgetAlerts }: DashboardProps) {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [hasNewAlert, setHasNewAlert] = useState(false);

  // Monitor budgets and trigger alerts
  useEffect(() => {
    checkBudgetThresholds();
  }, [transactions, budgets]);

  const checkBudgetThresholds = () => {
    const newAlerts: BudgetAlert[] = [];
    
    budgets.forEach((budget) => {
      const categorySpent = transactions
        .filter(t => t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const percentage = (categorySpent / budget.limit_amount) * 100;
      
      // Trigger alert at 90% (warning) or 100% (critical)
      if (percentage >= 90) {
        const alert: BudgetAlert = {
          budget_id: budget.budget_id,
          category: budget.category,
          percentage,
          spent: categorySpent,
          limit: budget.limit_amount,
          severity: percentage >= 100 ? 'critical' : 'warning'
        };
        newAlerts.push(alert);
      }
    });

    // Check if there are new alerts
    if (newAlerts.length > budgetAlerts.length) {
      setHasNewAlert(true);
    }
    
    setBudgetAlerts(newAlerts);
  };

  const handleChatbotOpen = () => {
    setIsChatbotOpen(true);
    setHasNewAlert(false);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
              <span className="text-white">$</span>
            </div>
            <div>
              <h1 className="text-slate-900">SpendWise</h1>
              <p className="text-sm text-slate-600">Welcome back, Sarah</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {budgetAlerts.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg">
                <Bell className="w-5 h-5" />
                <span className="text-sm">{budgetAlerts.length} Budget Alert{budgetAlerts.length > 1 ? 's' : ''}</span>
              </div>
            )}
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Overview and Transactions */}
          <div className="lg:col-span-2 space-y-6">
            <SpendingOverview transactions={transactions} />
            <TransactionLogger 
              transactions={transactions} 
              setTransactions={setTransactions}
            />
          </div>

          {/* Right Column - Budgets */}
          <div className="lg:col-span-1">
            <BudgetsTable 
              budgets={budgets}
              setBudgets={setBudgets}
              transactions={transactions}
              budgetAlerts={budgetAlerts}
            />
          </div>
        </div>
      </main>

      {/* Chatbot Button */}
      <button
        onClick={() => {
          if (isChatbotOpen) {
            setIsChatbotOpen(false);
          } else {
            handleChatbotOpen();
          }
        }}
          className={
            "fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 text-white " +
            "rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-50"
          }
        aria-label="Toggle financial chatbot"
      >
        {isChatbotOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            {hasNewAlert && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </>
        )}
      </button>

      {/* Chatbot Panel */}
      {isChatbotOpen && (
        <Chatbot 
          onClose={() => setIsChatbotOpen(false)} 
          budgetAlerts={budgetAlerts}
          transactions={transactions}
          budgets={budgets}
        />
      )}
    </div>
  );
}