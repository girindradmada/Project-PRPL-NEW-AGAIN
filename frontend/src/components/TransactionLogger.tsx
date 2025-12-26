import { useState, useEffect } from 'react';
import { Search, Plus, ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import { Transaction, Category } from '../types/database';
import { AddTransactionModal } from './AddTransactionModal';
import { supabase } from '../lib/supabase';       // Logic lives here
import { dbToUI } from '../lib/converters';  // Logic lives here

interface TransactionLoggerProps {
  transactions: Transaction[];
  categories: Category[];
  onDataLoaded: (t: Transaction[], c: Category[]) => void; // Pass fetched data up
  onTransactionAdded: (t: Transaction) => void;
}

export function TransactionLogger({ transactions, categories, onDataLoaded, onTransactionAdded }: TransactionLoggerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // FETCH LOGIC: Get Transactions & Categories
  useEffect(() => {
    async function fetchTransactions() {
      try {
        const user_id = 1; 

        // 1. Get Transactions
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*, category:categories(*)')
          .eq('user_id', user_id)
          .order('date_time', { ascending: false });

        if (txError) throw txError;

        // 2. Get Categories
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        
        if (catError) throw catError;

        // 3. Convert & Notify Parent
        const cleanTransactions = (txData || []).map(dbToUI);
        onDataLoaded(cleanTransactions, catData || []);

      } catch (err) {
        console.error("Error fetching transactions:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, []); // Run once on mount

  // SAVE LOGIC
  const handleSaveTransaction = async (formData: any) => {
    try {
      const payload = {
        user_id: 1,
        amount: parseFloat(formData.amount),
        category_id: parseInt(formData.categoryId),
        merchant: formData.merchant,
        date_time: new Date(formData.date).toISOString(),
        raw_text: formData.merchant
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert([payload])
        .select('*, category:categories(*)')
        .single();

      if (error) throw error;

      onTransactionAdded(dbToUI(data));
      setIsModalOpen(false);

    } catch (error) {
      console.error("Save failed:", error);
      alert("Could not save transaction.");
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const merchantName = t.merchant ? t.merchant.toLowerCase() : '';
    const catName = typeof t.category === 'string' ? t.category.toLowerCase() : (t.category?.name.toLowerCase() || '');
    return merchantName.includes(searchTerm.toLowerCase()) || catName.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[500px] relative">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Transactions</h2>
        <div className="flex gap-3">
             {/* Search Input ... */}
            <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                />
            </div>

            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                <Plus className="w-4 h-4" />
                <span>Add</span>
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
           <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-500"/></div>
        ) : filteredTransactions.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">No transactions found</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((t) => {
               /* ... Rendering Logic ... */
               const catName = typeof t.category === 'string' ? t.category : (t.category?.name || 'Unknown');
               const isIncome = catName === 'Income';
               return (
                <div key={t.trans_id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                   <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isIncome ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                        {isIncome ? <ArrowDownLeft className="w-5 h-5"/> : <ArrowUpRight className="w-5 h-5"/>}
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">{t.merchant}</h4>
                        <p className="text-xs text-slate-500">{catName}</p>
                      </div>
                   </div>
                   <span className={`font-semibold ${isIncome ? 'text-green-600' : 'text-slate-900'}`}>
                     {isIncome ? '+' : '-'}${Math.abs(t.amount).toFixed(2)}
                   </span>
                </div>
               );
            })}
          </div>
        )}
      </div>

      <AddTransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        categories={categories}
      />
    </div>
  );
}