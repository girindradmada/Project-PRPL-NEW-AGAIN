import { useState } from 'react';
import { X, Save, Calendar, DollarSign, Tag, FileText } from 'lucide-react';
import { Category } from '../types/database';

// --- THIS IS THE MISSING PIECE ---
// It tells the component: "I expect these 4 specific things to be passed to me"
interface AddTransactionModalProps {
  isOpen: boolean;           // Is the popup visible?
  onClose: () => void;       // What happens when I click X?
  onSave: (data: any) => void; // What happens when I click Save?
  categories: Category[];    // The list of categories to show in the dropdown
}

export function AddTransactionModal({ isOpen, onClose, onSave, categories }: AddTransactionModalProps) {
  const [formData, setFormData] = useState({
    amount: '',
    categoryId: '',
    merchant: '',
    date: new Date().toISOString().split('T')[0]
  });

  // If the modal is closed, don't render anything
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!formData.categoryId) return alert("Select a category");
    
    onSave(formData);
    
    // Reset form and close
    setFormData({ amount: '', categoryId: '', merchant: '', date: new Date().toISOString().split('T')[0] });
    onClose();
  };

  return (
    // CSS FIX: fixed position covering the whole screen (z-index 9999)
    <div className="fixed top-0 left-0 w-full h-full z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-800">Add Transaction</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="number" step="0.01" required
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0.00"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
            <div className="relative">
              <Tag className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <select
                required
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={formData.categoryId}
                onChange={e => setFormData({...formData, categoryId: e.target.value})}
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.category_id} value={c.category_id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text" required
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Starbucks"
                value={formData.merchant}
                onChange={e => setFormData({...formData, merchant: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="date" required
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-600"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>

          <button type="submit" className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex justify-center items-center gap-2">
            <Save className="w-4 h-4" /> Save Transaction
          </button>
        </form>
      </div>
    </div>
  );
}