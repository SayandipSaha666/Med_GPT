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

// File types
export interface T_UploadedFile {
  id: string;
  name: string;
  mime: string;
  sizeBytes: number;
  url: string;
  status: 'PROCESSING' | 'READY' | 'FAILED';
  createdAt: string;
}

export type T_MessageSource =
  | { type: 'web'; index: number; title: string; snippet?: string; url: string; domain: string; faviconUrl?: string; publishedAt?: string }
  | { type: 'file'; index: number; title: string; snippet?: string; fileId: string; fileName: string; url: string; mime: string; chunkIdx?: number };

export interface T_FileAttachment {
  id: string;
  name: string;
  sizeBytes: number;
  mime: string;
  url?: string;
  status: 'uploading' | 'ready' | 'error';
  progress: number;
  backendStatus?: 'PROCESSING' | 'READY' | 'FAILED';
  error?: string;
  file?: File;
}

// Chat types
export interface T_Message {
  id?: number | string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string | Date;
  isImage?: boolean;
  files?: Array<{
    id: string;
    name: string;
    mime: string;
    sizeBytes: number;
    url: string;
    status?: string;
    createdAt?: string;
    errorMessage?: string | null;
  }>;
  sources?: T_MessageSource[];
  agentType?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface T_Chat {
  id: number;
  title: string;
  messages: T_Message[];
  createdAt: string;
  updatedAt: string;
}

export interface T_ChatPin {
  chatId: number;
  pinnedAt: string;
}

export interface T_ChatFolder {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  chatIds: number[];
  createdAt: string;
  updatedAt: string;
}

export type T_Create_Chat_Response = T_Chat;

export interface T_Send_Message_Response {
  success: boolean;
  userMessage: T_Message;
  assistantMessage: T_Message;
}

// Billing types
export interface T_Plan {
  id: number;
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
