import { useState, useEffect } from 'react';
import { Plus, TrendingUp, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { Budget, Transaction, BudgetAlert } from '../types/database';

interface BudgetsTableProps {
  budgets: Budget[];
  setBudgets: (budgets: Budget[]) => void;
  transactions: Transaction[];
  budgetAlerts: BudgetAlert[];
}

const mockBudgets: Budget[] = [
  { budget_id: 1, user_id: 1, category: 'Food & Dining', limit_amount: 1500, period: 'Monthly' },
  { budget_id: 2, user_id: 1, category: 'Transportation', limit_amount: 800, period: 'Monthly' },
  { budget_id: 3, user_id: 1, category: 'Shopping', limit_amount: 600, period: 'Monthly' },
  { budget_id: 4, user_id: 1, category: 'Entertainment', limit_amount: 500, period: 'Monthly' },
  { budget_id: 5, user_id: 1, category: 'Bills & Utilities', limit_amount: 1200, period: 'Monthly' },
];

export function BudgetsTable({ budgets, setBudgets, transactions, budgetAlerts }: BudgetsTableProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Food & Dining',
    limit_amount: '',
  });

  // Initialize with mock data if empty
  useEffect(() => {
    if (budgets.length === 0) {
      setBudgets(mockBudgets);
    }
  }, []);

  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const newBudget: Budget = {
      budget_id: Date.now(),
      user_id: 1,
      category: formData.category,
      limit_amount: parseFloat(formData.limit_amount),
      period: 'Monthly',
    };
    setBudgets([...budgets, newBudget]);
    setFormData({
      category: 'Food & Dining',
      limit_amount: '',
    });
    setShowAddForm(false);
  };

  const getCategorySpent = (category: string) => {
    return transactions
      .filter(t => t.category === category && t.category !== 'Income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getPercentage = (spent: number, allocated: number) => {
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
        <h2 className="text-slate-900">Monthly Budgets</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddBudget} className="mb-4 p-4 bg-slate-50 rounded-xl space-y-3">
          <div>
            <label className="block text-slate-700 text-sm mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option>Food & Dining</option>
              <option>Transportation</option>
              <option>Shopping</option>
              <option>Bills & Utilities</option>
              <option>Entertainment</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-700 text-sm mb-2">Budget Limit ($)</label>
            <input
              type="number"
              step="0.01"
              value={formData.limit_amount}
              onChange={(e) => setFormData({ ...formData, limit_amount: e.target.value })}
              placeholder="Budget amount"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
          <div className="flex gap-2">
            <button 
              type="submit"
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 px-3 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {budgets.map((budget) => {
          const spent = getCategorySpent(budget.category);
          const percentage = getPercentage(spent, budget.limit_amount);
          const statusColor = getStatusColor(percentage);
          const isAlert = hasAlert(budget.budget_id);

          return (
            <div 
              key={budget.budget_id} 
              className={`space-y-2 p-3 rounded-lg transition-all ${
                isAlert ? 'bg-red-50 border border-red-200 shadow-sm' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-900">{budget.category}</span>
                  <span className={`text-sm ${
                    statusColor === 'red' ? 'text-red-600' :
                    statusColor === 'orange' ? 'text-orange-600' :
                    statusColor === 'yellow' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {getStatusIcon(percentage)}
                  </span>
                  {isAlert && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                      Alert
                    </span>
                  )}
                </div>
                <span className="text-sm text-slate-600">
                  ${spent.toFixed(2)} / ${budget.limit_amount.toFixed(2)}
                </span>
              </div>
              
              <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                    statusColor === 'red' ? 'bg-red-500' :
                    statusColor === 'orange' ? 'bg-orange-500' :
                    statusColor === 'yellow' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className={`${
                  statusColor === 'red' ? 'text-red-600' :
                  statusColor === 'orange' ? 'text-orange-600' :
                  statusColor === 'yellow' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {percentage.toFixed(0)}% used
                  {percentage >= 90 && percentage < 100 && ' - Warning!'}
                  {percentage >= 100 && ' - Over Budget!'}
                </span>
                <span className="text-slate-600">
                  ${(budget.limit_amount - spent).toFixed(0)} left
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-700">Total Budget</span>
          <span className="text-slate-900">
            ${budgets.reduce((sum, b) => sum + b.limit_amount, 0).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-700">Total Spent</span>
          <span className="text-slate-900">
            ${budgets.reduce((sum, b) => sum + getCategorySpent(b.category), 0).toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-700">Remaining</span>
          <span className={`${
            budgets.reduce((sum, b) => sum + b.limit_amount, 0) - 
            budgets.reduce((sum, b) => sum + getCategorySpent(b.category), 0) < 0 
              ? 'text-red-600' 
              : 'text-green-600'
          }`}>
            ${(budgets.reduce((sum, b) => sum + b.limit_amount, 0) - 
               budgets.reduce((sum, b) => sum + getCategorySpent(b.category), 0)).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Alert Summary */}
      {budgetAlerts.length > 0 && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span className="text-orange-900">Budget Alerts Active</span>
          </div>
          <p className="text-sm text-orange-700">
            {budgetAlerts.length} categor{budgetAlerts.length === 1 ? 'y is' : 'ies are'} at or above 90% of budget limit
          </p>
        </div>
      )}
    </div>
  );
}