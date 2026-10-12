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
