import { Prisma, TransactionStatus } from "../generated/prisma-client";

export type Decimal = Prisma.Decimal;

// Transaction DTOs
export interface Transaction {
  id: number;
  userId: number;
  amount: Prisma.Decimal;
  planId: number;
  razorpayOrderId: string;
  razorpayPaymentId?: string | null;
  isPaid: boolean;
  status: TransactionStatus;
  credits: Prisma.Decimal;
  createdAt: Date;
  updatedAt: Date;
}

export interface Plan {
  id: number;
  name: string;
  price: Prisma.Decimal;
  credits: Prisma.Decimal;
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
  status: TransactionStatus | string;
  isPaid: boolean;
  credits: Prisma.Decimal | number;
  amount: Prisma.Decimal | number;
}
