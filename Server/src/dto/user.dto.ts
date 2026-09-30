// User DTOs
export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  credits: number;
  planId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  credits: number;
  planId: number;
  createdAt: Date;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginUserDto {
  email: string;
  password: string;
}

export interface UpdateProfileDto {
  name: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}
