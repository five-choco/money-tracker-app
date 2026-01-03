export interface Expense {
  id: string;
  date: string;
  amount: number;
  shop_name: string;
  category: string;
}

export interface FormData {
  amount: number | "";
  shop_name: string;
  category: string;
}
