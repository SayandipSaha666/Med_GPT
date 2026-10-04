import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userRepository } from "../repositories/user.repository";
import type { User, UserResponse, CreateUserDto, LoginUserDto, AuthResponse } from "../dto/user.dto";

const JWT_SECRET = process.env.JWT_SECRET_KEY;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET_KEY;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET_KEY environment variable is not set");
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const secret = JWT_SECRET!;
const refreshSecret = REFRESH_TOKEN_SECRET!;

// Token expiration times
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

export class UserService {
  async register(payload: CreateUserDto): Promise<UserResponse> {
    // Check if email already exists
    const existingUser = await userRepository.findByEmail(payload.email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(payload.password, 10);

    // Create user
    const user = await userRepository.create({
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      planId: 1, // Default to free plan
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      credits: user.credits,
      planId: user.planId,
      createdAt: user.createdAt,
    };
  }

  async login(payload: LoginUserDto): Promise<AuthResponse> {
    // Find user by email
    const user = await userRepository.findByEmail(payload.email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(payload.password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    // Generate access token (short-lived)
    const accessToken = jwt.sign({ id: user.id }, secret, { expiresIn: ACCESS_TOKEN_EXPIRY });

    // Generate refresh token (long-lived)
    const refreshToken = jwt.sign({ id: user.id }, refreshSecret, { expiresIn: REFRESH_TOKEN_EXPIRY });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        planId: user.planId,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  async generateAccessToken(userId: number): Promise<string> {
    return jwt.sign({ id: userId }, secret, { expiresIn: ACCESS_TOKEN_EXPIRY });
  }

  async generateRefreshToken(userId: number): Promise<string> {
    return jwt.sign({ id: userId }, refreshSecret, { expiresIn: REFRESH_TOKEN_EXPIRY });
  }

  async verifyRefreshToken(refreshToken: string): Promise<number | null> {
    try {
      const decoded = jwt.verify(refreshToken, refreshSecret) as { id: number };
      return decoded.id;
    } catch (error) {
      return null;
    }
  }

  async getProfile(userId: number): Promise<UserResponse> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      credits: user.credits,
      planId: user.planId,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: number, name: string): Promise<UserResponse> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser = await userRepository.update(userId, { name });
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      credits: updatedUser.credits,
      planId: updatedUser.planId,
      createdAt: updatedUser.createdAt,
    };
  }

  async logout(userId: number): Promise<void> {
    // Token is stored client-side, so logout just clears it on the client
    // If using server-side sessions, invalidation would happen here
  }
}

export const userService = new UserService();
