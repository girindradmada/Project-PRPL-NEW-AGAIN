import { useState } from 'react';
import { Plus, TrendingUp, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { Budget, Transaction, BudgetAlert, Category } from '../types/database';

interface BudgetsTableProps {
  budgets: Budget[];
  setBudgets: (budgets: Budget[]) => void;
  transactions: Transaction[];
  budgetAlerts: BudgetAlert[];
  categories: Category[]; 
}

export function BudgetsTable({ budgets, setBudgets, transactions, budgetAlerts, categories }: BudgetsTableProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form stores the ID (string because inputs are strings)
  const [formData, setFormData] = useState({
    categoryId: '', 
    limit_amount: '',
  });

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Prepare the data
      const payload = {
        user_id: 1, // You will get this from auth later
        category_id: parseInt(formData.categoryId),
        limit_amount: parseFloat(formData.limit_amount),
        period: 'Monthly'
      };

      // 2. TODO: Replace this section with a real API call later
      // const response = await fetch('/api/budgets', ...);

      // --- TEMPORARY LOCAL UPDATE ---
      // We find the full category object to display it immediately in the UI
      const selectedCategory = categories.find(c => c.category_id === payload.category_id);
      
      const newBudget: Budget = {
        budget_id: Date.now(), // Temp ID until DB assigns one
        user_id: payload.user_id,
        category_id: payload.category_id,
        // We attach the full category object so the UI can show the name
        category: selectedCategory, 
        limit_amount: payload.limit_amount,
        period: 'Monthly',
      };
      
      setBudgets([...budgets, newBudget]);
      // -----------------------------
      
      // 3. Reset Form
      setFormData({ categoryId: '', limit_amount: '' });
      setShowAddForm(false);
      
    } catch (error) {
      console.error("Failed to save budget:", error);
      alert("Error saving budget");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: Gets the category name whether 'category' is an ID, String, or Object
  const getCategoryName = (budget: Budget) => {
    // If it's an object (Relation)
    if (budget.category && typeof budget.category === 'object') {
      return (budget.category as Category).name;
    }
    // If it's just a string (Legacy/Simple)
    if (typeof budget.category === 'string') {
      return budget.category;
    }
    // If we only have the ID, look it up in the props
    const cat = categories.find(c => c.category_id === budget.category_id);
    return cat ? cat.name : 'Unknown Category';
  };

  // Helper: Calculates spent amount for a specific category name
  const getCategorySpent = (catName: string) => {
    return transactions
      .filter(t => {
          // Robust check: Handle both Object and String variations in Transaction type
          let tCatName: string;
          
          if (typeof t.category === 'object' && t.category !== null) {
            tCatName = t.category.name;
          } else {
            tCatName = String(t.category);
          }

          return tCatName === catName && tCatName !== 'Income';
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  const getPercentage = (spent: number, allocated: number) => {
    if (allocated === 0) return 0;
    return Math.min((spent / allocated) * 100, 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'red';
    if (percentage >= 90) return 'orange';
    if (percentage >= 80) return 'yellow';
    return 'green';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 100) return <AlertCircle className="w-4 h-4" />;
    if (percentage >= 90) return <AlertTriangle className="w-4 h-4" />;
    if (percentage >= 80) return <TrendingUp className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const hasAlert = (budgetId: number) => {
    return budgetAlerts.some(alert => alert.budget_id === budgetId);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-fit sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-slate-900 font-semibold text-lg">Monthly Budgets</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddBudget} className="mb-6 p-4 bg-slate-50 rounded-xl space-y-4 border border-slate-100">
          <div>
            <label className="block text-slate-700 text-sm font-medium mb-2">Category</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              required
            >
              <option value="">Select a category...</option>
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-700 text-sm font-medium mb-2">Budget Limit ($)</label>
            <input
              type="number"
              step="0.01"
              value={formData.limit_amount}
              onChange={(e) => setFormData({ ...formData, limit_amount: e.target.value })}
              placeholder="e.g., 500.00"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
          <div className="flex gap-3">
            <button 
              type="submit"
              disabled={isLoading}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Set Budget'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {budgets.map((budget) => {
          const catName = getCategoryName(budget);
          const spent = getCategorySpent(catName);
          const percentage = getPercentage(spent, Number(budget.limit_amount));
          const statusColor = getStatusColor(percentage);
          const isAlert = hasAlert(budget.budget_id);

          return (
            <div 
              key={budget.budget_id} 
              className={`space-y-2 p-3 rounded-lg transition-all ${
                isAlert ? 'bg-red-50 border border-red-200' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 font-medium">{catName}</span>
                  <span className={`text-sm ${
                    statusColor === 'red' ? 'text-red-600' :
                    statusColor === 'orange' ? 'text-orange-600' :
                    statusColor === 'yellow' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {getStatusIcon(percentage)}
                  </span>
                </div>
                <span className="text-sm text-slate-600 font-medium">
                  ${spent.toFixed(0)} / ${Number(budget.limit_amount).toFixed(0)}
                </span>
              </div>
              
              <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                    statusColor === 'red' ? 'bg-red-500' :
                    statusColor === 'orange' ? 'bg-orange-500' :
                    statusColor === 'yellow' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
        
        {budgets.length === 0 && !showAddForm && (
            <div className="text-center py-8 text-slate-500 text-sm">
                No budgets set. Click + to add one.
            </div>
        )}
      </div>
    </div>
  );
}