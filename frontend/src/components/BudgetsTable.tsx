import { useState, useEffect } from 'react';
import { Plus, TrendingUp, AlertCircle, CheckCircle, AlertTriangle, X, Save, Loader2 } from 'lucide-react';
import { Budget, Transaction, BudgetAlert, Category } from '../types/database';
import { supabase } from '../lib/supabase'; 

interface BudgetsTableProps {
  budgets: Budget[];
  setBudgets: (budgets: Budget[]) => void;
  onBudgetsLoaded: (budgets: Budget[]) => void; 
  transactions: Transaction[];
  budgetAlerts: BudgetAlert[];
  categories: Category[]; 
}

// 1. RESTORED DEFAULTS (The "Starter Pack" for new users)
const DEFAULT_BUDGETS = [
  { category_id: 1, limit_amount: 500, period: 'Monthly' }, // Food
  { category_id: 2, limit_amount: 300, period: 'Monthly' }, // Transport
  { category_id: 3, limit_amount: 200, period: 'Monthly' }, // Shopping
  { category_id: 4, limit_amount: 150, period: 'Monthly' }, // Bills
  { category_id: 6, limit_amount: 100, period: 'Monthly' }, // Other
];

export function BudgetsTable({ budgets, setBudgets, onBudgetsLoaded, transactions, budgetAlerts, categories }: BudgetsTableProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // For the manual add button

  // 2. FETCH AND SEED LOGIC
  useEffect(() => {
    async function fetchOrSeedBudgets() {
      try {
        const user_id = 1; 

        // A. Check for existing budgets
        const { data: existingBudgets, error: fetchError } = await supabase
          .from('budgets')
          .select('*, category:categories(*)') 
          .eq('user_id', user_id)
          .order('limit_amount', { ascending: false });

        if (fetchError) throw fetchError;

        // B. IF USER HAS NO BUDGETS -> AUTO-CREATE DEFAULTS (Seeding)
        if (!existingBudgets || existingBudgets.length === 0) {
            console.log("New user detected. Seeding default budgets...");
            
            // Prepare payload
            const seedPayload = DEFAULT_BUDGETS.map(b => ({
                user_id,
                category_id: b.category_id,
                limit_amount: b.limit_amount,
                period: b.period
            }));

            // Bulk Insert
            const { data: seededData, error: seedError } = await supabase
                .from('budgets')
                .insert(seedPayload)
                .select('*, category:categories(*)'); // Get them back with Categories joined

            if (seedError) throw seedError;

            if (seededData) {
                setBudgets(seededData);
                onBudgetsLoaded(seededData);
            }
        } 
        // C. NORMAL LOAD
        else {
            setBudgets(existingBudgets);
            onBudgetsLoaded(existingBudgets);
        }

      } catch (error) {
        console.error("Error loading budgets:", error);
      } finally {
        setIsFetching(false);
      }
    }

    fetchOrSeedBudgets();
  }, []); 

  const [formData, setFormData] = useState({
    categoryId: '', 
    limit_amount: '',
  });

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
        alert("Please select a category.");
        return;
    }

    setIsSaving(true);

    try {
      const selectedId = parseInt(formData.categoryId);
      const limit = parseFloat(formData.limit_amount);

      const payload = {
        user_id: 1,
        category_id: selectedId,
        limit_amount: limit,
        period: 'Monthly',
      };

      const { data, error } = await supabase
        .from('budgets')
        .insert([payload])
        .select('*, category:categories(*)')
        .single();

      if (error) throw error;
      
      setBudgets([...budgets, data]);
      setFormData({ categoryId: '', limit_amount: '' });
      setShowAddForm(false);
      
    } catch (error) {
      console.error("Failed to save budget:", error);
      alert("Error saving budget.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- HELPERS ---
  const getCategoryName = (budget: Budget) => {
    if (budget.category && typeof budget.category === 'object') {
      return (budget.category as Category).name;
    }
    if (typeof budget.category === 'string') return budget.category;
    const cat = categories.find(c => c.category_id === budget.category_id);
    return cat ? cat.name : 'Unknown';
  };

  const getCategorySpent = (catName: string) => {
    return transactions
      .filter(t => {
          let tCatName = typeof t.category === 'string' ? t.category : (t.category?.name || 'Unknown');
          return tCatName === catName;
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

  if (isFetching && budgets.length === 0) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-fit flex justify-center py-10">
            <Loader2 className="animate-spin text-blue-500" />
        </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-fit sticky top-24">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-slate-900 font-semibold text-lg">Monthly Budgets</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${
             showAddForm 
                ? 'bg-slate-100 text-slate-500 rotate-45' 
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
          }`}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* ADD FORM */}
      {showAddForm && (
        <div className="mb-6 p-5 bg-slate-50 border border-slate-200 rounded-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-sm font-semibold text-slate-800">Set New Budget</h3>
             <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
             </button>
          </div>
          
          <form onSubmit={handleAddBudget} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-500 font-bold mb-1.5">Category</label>
              <div className="relative">
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-500 font-bold mb-1.5">Monthly Limit</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.limit_amount}
                  onChange={(e) => setFormData({ ...formData, limit_amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="submit"
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm disabled:opacity-70"
              >
                {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Budget</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LIST */}
      <div className="space-y-4">
        {budgets.length === 0 && !showAddForm ? (
            <div className="text-center py-8 text-slate-500 text-sm">
                No budgets set. Click + to add one.
            </div>
        ) : (
            budgets.map((budget) => {
            const catName = getCategoryName(budget);
            const spent = getCategorySpent(catName);
            const percentage = getPercentage(spent, Number(budget.limit_amount));
            const statusColor = getStatusColor(percentage);
            const isAlert = hasAlert(budget.budget_id);

            return (
                <div 
                key={budget.budget_id} 
                className={`space-y-2 p-3 rounded-lg transition-all ${
                    isAlert ? 'bg-red-50 border border-red-200' : 'hover:bg-slate-50 border border-transparent hover:border-slate-100'
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
            })
        )}
      </div>
    </div>
  );
}