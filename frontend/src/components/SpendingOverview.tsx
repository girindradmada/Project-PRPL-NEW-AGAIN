import { TrendingDown, Wallet, CreditCard } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Transaction } from '../types/database';

interface SpendingOverviewProps {
  transactions: Transaction[];
}

export function SpendingOverview({ transactions }: SpendingOverviewProps) {
  // Calculate spending by category
  const categoryData: Record<string, { value: number; color: string }> = {
    'Food & Dining': { value: 0, color: '#3b82f6' },
    'Transportation': { value: 0, color: '#8b5cf6' },
    'Shopping': { value: 0, color: '#ec4899' },
    'Entertainment': { value: 0, color: '#f59e0b' },
    'Bills & Utilities': { value: 0, color: '#10b981' },
    'Other': { value: 0, color: '#6b7280' },
  };

  transactions.forEach((t) => {
    // 1. FIXED: Safely get category name (String) from the Transaction object
    let catName = 'Other';
    if (typeof t.category === 'string') {
        catName = t.category;
    } else if (t.category && typeof t.category === 'object') {
        catName = t.category.name;
    }

    // 2. Skip Income
    if (catName !== 'Income') {
      if (categoryData[catName]) {
        categoryData[catName].value += Number(t.amount);
      } else {
        // Fallback for categories not in the pre-defined list above
        // We accumulate them into 'Other' to prevent crashes
        categoryData['Other'].value += Number(t.amount);
      }
    }
  });

  const data = Object.entries(categoryData)
    .filter(([_, data]) => data.value > 0)
    .map(([name, data]) => ({
      name,
      value: data.value,
      color: data.color,
    }));

  const totalSpent = data.reduce((sum, item) => sum + item.value, 0);
  
  // Count transactions that are not income
  const transactionCount = transactions.filter(t => {
      const cName = typeof t.category === 'object' && t.category ? t.category.name : String(t.category);
      return cName !== 'Income';
  }).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-slate-900 mb-6">Spending Overview</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-900/70">Total Spent</p>
              <p className="text-blue-900 font-bold">${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-green-900/70">vs Last Month</p>
              <p className="text-green-900 font-bold">-12.5%</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-purple-900/70">Transactions</p>
              <p className="text-purple-900 font-bold">{transactionCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pie Chart */}
      {data.length > 0 ? (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-80 flex items-center justify-center text-slate-500">
          <p>No spending data to display. Add transactions to see your breakdown.</p>
        </div>
      )}
    </div>
  );
}