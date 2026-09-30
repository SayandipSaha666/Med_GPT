// Shared TypeScript types for API layer

export interface T_Api_Success_Res<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface T_Api_Error_Res {
  success: boolean;
  message: string;
}

// Auth types
export interface T_User {
  id: string;
  name: string;
  email: string;
  credits: number;
  plan?: {
    name: string;
    features: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface T_Login_Credentials {
  email: string;
  password: string;
}

export interface T_Register_Data {
  name: string;
  email: string;
  password: string;
}

export interface T_Auth_Response {
  accessToken: string;
  refreshToken: string;
  user: T_User;
}

// Chat types
export interface T_Message {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isImage?: boolean;
}

export interface T_Chat {
  id: number;
  title: string;
  messages: T_Message[];
  createdAt: string;
  updatedAt: string;
}

export interface T_Create_Chat_Response {
  chat: T_Chat;
}

export interface T_Send_Message_Response {
  success: boolean;
  userMessage: T_Message;
  assistantMessage: T_Message;
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
