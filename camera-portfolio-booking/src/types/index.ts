export type BookingStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

export interface Service {
  id: string;
  title: string;
  description: string | null;
  total_price: number;
  advance_amount: number;
}

export interface Booking {
  id: string;
  client_name: string;
  client_phone: string;
  shoot_date: string;
  service_title: string;
  advance_paid: number;
  transaction_id: string;
  status: BookingStatus;
  created_at: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  media_type: 'image' | 'video';
  media_url: string | null;
  created_at?: string;
}

export interface Review {
  id: string;
  client_name: string;
  rating: number;
  comment: string;
  approved: boolean;
  created_at: string;
}
