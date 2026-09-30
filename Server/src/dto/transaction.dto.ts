// Transaction DTOs
export interface Transaction {
  id: number;
  userId: number;
  amount: number;
  planId: number;
  razorpayOrderId: string;
  razorpayPaymentId?: string | null;
  isPaid: boolean;
  status: string;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Plan {
  id: number;
  name: string;
  price: number;
  credits: number;
  features: string[];
  createdAt: Date;
}

export interface CreateOrderDto {
  planId: number;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  transactionId: number;
  keyId: string;
}

export interface PaymentStatusResponse {
  status: string;
  isPaid: boolean;
  credits: number;
  amount: number;
}
