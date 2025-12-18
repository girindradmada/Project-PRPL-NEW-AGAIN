import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, DollarSign, Tag, ShoppingBag, Coffee, Car, Home, Zap, MoreHorizontal } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Transaction } from '../types/database';
import { getCategoryId, getCategoryName } from "../lib/categoryMap";
import { dbToUI } from '../lib/converters';

interface TransactionLoggerProps {
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
}

const categoryIcons: Record<string, any> = {
  'Food & Dining': Coffee,
  'Transportation': Car,
  'Shopping': ShoppingBag,
  'Bills & Utilities': Zap,
  'Income': DollarSign,
};

export function TransactionLogger({ transactions, setTransactions }: TransactionLoggerProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    merchant: '',
    amount: '',
    category: 'Food & Dining',
    date: new Date().toISOString().split('T')[0],
    raw_text: '',
  });

  // ===========================
  // FETCH FROM DATABASE
  // ===========================
  useEffect(() => {
    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date_time', { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      // Convert DB rows → UI rows
      const converted = data.map(dbToUI);
      setTransactions(converted);
    };

    fetchTransactions();
  }, []);

  // ===========================
  // ADD A NEW TRANSACTION
  // ===========================
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: 1,
        category_id: getCategoryId(formData.category),
        amount: parseFloat(formData.amount),
        merchant: formData.merchant || null,
        date_time: new Date(formData.date),
        raw_text: formData.raw_text || null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Supabase Insert Error:", error);
      return;
    }

    // Convert DB → UI before adding to screen
    const converted = dbToUI(data);

    // Update UI instantly
    setTransactions([converted, ...transactions]);

    // Reset form
    setFormData({
      merchant: "",
      amount: "",
      category: "Food & Dining",
      date: new Date().toISOString().split("T")[0],
      raw_text: "",
    });

    setShowAddForm(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-slate-900">Recent Transactions</h2>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Transaction
        </button>
      </div>

      {/* Add Transaction Form */}
      {showAddForm && (
        <form onSubmit={handleAddTransaction} className="mb-6 p-4 bg-slate-50 rounded-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 text-sm mb-2">Merchant</label>
              <input
                type="text"
                value={formData.merchant}
                onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 text-sm mb-2">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 text-sm mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              >
                <option>Food & Dining</option>
                <option>Transportation</option>
                <option>Shopping</option>
                <option>Bills & Utilities</option>
                <option>Income</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 text-sm mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Transaction
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Transaction List */}
      <div className="space-y-2">
        {transactions.map((transaction) => {
          const Icon = categoryIcons[transaction.category] || MoreHorizontal;
          const isIncome = transaction.category === 'Income';

          return (
            <div
              key={transaction.trans_id}
              className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isIncome ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                <Icon className={`w-5 h-5 ${
                  isIncome ? 'text-green-600' : 'text-blue-600'
                }`} />
              </div>

              <div className="flex-1">
                <p className="text-slate-900">{transaction.merchant || transaction.category}</p>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Tag className="w-4 h-4" />
                  <span>{transaction.category}</span>
                  <span>•</span>
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(transaction.date_time).toLocaleDateString()}</span>
                </div>
              </div>

              <div className={`${isIncome ? 'text-green-600' : 'text-slate-900'}`}>
                {isIncome ? '+' : '-'}${transaction.amount.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
