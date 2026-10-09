// API types
export interface T_Api_Success_Res<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface T_Api_Error_Res {
  success: boolean;
  message: string;
}

// Billing types
export interface T_Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
}

export interface T_Order_Response {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface T_Payment_Status {
  isPaid: boolean;
}

// Profile types
export interface T_Update_Profile_Data {
  name: string;
}
