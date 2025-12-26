// Database schema types matching the requirements

export interface User {
  user_id: number;
  username: string;
  password: string;
}

export interface Transaction {
  trans_id: number;
  user_id: number;
  amount: number;
  category: string | Category;  
  merchant: string | null;
  date_time: Date;
  raw_text: string | null;
}

export interface DBTransaction {
  trans_id: number;
  user_id: number;
  category_id: number;
  amount: number;
  merchant: string | null;
  date_time: string;  // Supabase returns ISO string, not Date object
  raw_text: string | null;
}

export interface Budget {
  budget_id: number;
  user_id: number;
  category_id: number;
  limit_amount: number;
  period: string; // Default: 'Monthly'
  category?: Category | string;
}

export interface Category {
  category_id: number;
  user_id: number;
  name: string;
}

export interface ChatLog {
  log_id: number;
  user_id: number;
  message_text: string;
  sender: 'User' | 'Bot';
  timestamp: Date;
}

export interface BudgetAlert {
  budget_id: number;
  category: string;
  percentage: number;
  spent: number;
  limit: number;
  severity: 'warning' | 'critical';
}
