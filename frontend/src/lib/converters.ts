// src/lib/converters.ts
import { Transaction } from '../types/database';

export function dbToUI(record: any): Transaction {
  // 1. Check if Supabase returned the full category object (Relation)
  let categoryValue = record.category;

  // 2. If 'category' is missing but we have a 'category_id', we might want a fallback.
  // But for now, if the relation is null, we just give a default string.
  if (!categoryValue) {
    categoryValue = 'Uncategorized';
  }

  return {
    trans_id: record.trans_id,
    user_id: record.user_id,
    amount: Number(record.amount),
    
    // Pass the whole object (or string) to the UI. 
    // Our UI components know how to handle both.
    category: categoryValue, 
    
    merchant: record.merchant || '',
    
    // Convert the database string (ISO) to a real Date object
    date_time: new Date(record.date_time),
    
    raw_text: record.raw_text || '',
  };
}