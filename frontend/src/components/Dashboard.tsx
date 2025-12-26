import { useState } from 'react';
import { LogOut, MessageCircle, X, Bell } from 'lucide-react';
import { TransactionLogger } from './TransactionLogger';
import { BudgetsTable } from './BudgetsTable';
import { SpendingOverview } from './SpendingOverview';
import { Chatbot } from './Chatbot';
import { BudgetAlert, Transaction, Budget, Category } from '../types/database';

interface DashboardProps {
  onLogout: () => void;
  budgetAlerts: BudgetAlert[];
  setBudgetAlerts: (alerts: BudgetAlert[]) => void;
}

export function Dashboard({ onLogout, budgetAlerts, setBudgetAlerts }: DashboardProps) {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [hasNewAlert, setHasNewAlert] = useState(false);

  // Dashboard simply holds the data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // We rely on child components to populate this data via callbacks
  const handleTransactionsLoaded = (data: Transaction[], cats: Category[]) => {
    setTransactions(data);
    setCategories(cats);
  };

  const handleBudgetsLoaded = (data: Budget[]) => {
    setBudgets(data);
    // Trigger alert check whenever budgets load or change
    checkBudgetThresholds(data, transactions);
  };

  // Logic for UI Alerts (Pure JS, no database)
  const checkBudgetThresholds = (currentBudgets: Budget[], currentTransactions: Transaction[]) => {
    const newAlerts: BudgetAlert[] = [];
    
    currentBudgets.forEach((budget) => {
      let budgetCatName = typeof budget.category === 'string' ? budget.category : (budget.category?.name || 'Unknown');
      
      const categorySpent = currentTransactions
        .filter(t => {
           let tCatName = typeof t.category === 'string' ? t.category : (t.category?.name || 'Unknown');
           return tCatName === budgetCatName;
        })
        .reduce((sum, t) => sum + t.amount, 0);
      
      if (!budget.limit_amount || budget.limit_amount === 0) return;

      const percentage = (categorySpent / budget.limit_amount) * 100;
      
      if (percentage >= 90) {
        newAlerts.push({
          budget_id: budget.budget_id,
          category: budgetCatName,
          percentage,
          spent: categorySpent,
          limit: budget.limit_amount,
          severity: percentage >= 100 ? 'critical' : 'warning'
        });
      }
    });

    if (newAlerts.length > budgetAlerts.length) setHasNewAlert(true);
    setBudgetAlerts(newAlerts);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Restored Design */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Restored Gradient Logo */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">$</span>
            </div>
            <div>
              <h1 className="text-slate-900 font-bold text-lg">SpendWise</h1>
              {/* Restored Personal Greeting */}
              <p className="text-sm text-slate-600">Welcome back, Sarah</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {budgetAlerts.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg animate-pulse">
                <Bell className="w-5 h-5" />
                <span className="text-sm font-medium">{budgetAlerts.length} Budget Alert{budgetAlerts.length > 1 ? 's' : ''}</span>
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
            
            {/* Using your existing logic props */}
            <TransactionLogger 
              transactions={transactions} 
              categories={categories}
              onDataLoaded={handleTransactionsLoaded}
              onTransactionAdded={(newTx) => {
                 const updated = [newTx, ...transactions];
                 setTransactions(updated);
                 checkBudgetThresholds(budgets, updated);
              }}
            />
          </div>

          {/* Right Column - Budgets */}
          <div className="lg:col-span-1">
            <BudgetsTable 
              budgets={budgets}
              setBudgets={setBudgets}
              onBudgetsLoaded={handleBudgetsLoaded}
              transactions={transactions}
              budgetAlerts={budgetAlerts}
              categories={categories}
            />
          </div>
        </div>
      </main>

      {/* Floating Chatbot Button - Restored Design */}
      <button
        onClick={() => {
          setIsChatbotOpen(!isChatbotOpen);
          setHasNewAlert(false); // Clear notification dot on click
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