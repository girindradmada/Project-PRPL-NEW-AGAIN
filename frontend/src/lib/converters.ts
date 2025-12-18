import { DBTransaction, Transaction } from '../types/database';
import { getCategoryName } from './categoryMap';

export function dbToUI(dbTrans: DBTransaction): Transaction {
  return {
    trans_id: dbTrans.trans_id,
    user_id: dbTrans.user_id,
    amount: dbTrans.amount,
    category: getCategoryName(dbTrans.category_id),
    merchant: dbTrans.merchant,
    date_time: new Date(dbTrans.date_time),
    raw_text: dbTrans.raw_text,
  };
}