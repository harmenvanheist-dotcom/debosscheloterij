export interface LotteryTicket {
  id: string;
  customer_email: string;
  customer_name: string;
  lottery_numbers: string; // JSON array of numbers
  payment_id: string | null;
  payment_status: 'pending' | 'paid' | 'failed' | 'cancelled';
  amount: number;
  created_at: string;
  paid_at: string | null;
  ticket_count: number;
}

export interface Payment {
  id: string;
  mollie_payment_id: string;
  ticket_id: string;
  amount: number;
  status: string;
  checkout_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTicketRequest {
  customer_email: string;
  customer_name: string;
  ticket_count: number;
  price_per_ticket: number;
}

export interface LotteryNumbers {
  ticket_id: string;
  numbers: number[][];
}
