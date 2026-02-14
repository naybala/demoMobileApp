export interface IncomeItem {
  id: string;
  product_id: number | null;
  name: string;
  amount: number;
  unit: string;
  price: number;
  investment: number;
  profit: number;
  basePrice: number;
  baseInvestment: number;
  baseProfit: number;
}

export interface DailyIncomeRecord {
  id: number;
  date: string;
  name: string | null;
  own_product_id: number;
  own_product: string;
  amount: string;
  price: string;
  investment: string;
  profit: string;
  unit: string;
  is_instant: number;
  voucher_no: string;
  note: string | null;
}
