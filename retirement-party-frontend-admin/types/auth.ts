import type { User, UserCredential } from "firebase/auth";

export type UserRole = "ADMIN" | "STAFF";

export interface ApplicationUser {
  id: string;
  firebaseUid: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  logIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  logOut: () => Promise<void>;
}

export interface AuthState {
  appUser: ApplicationUser | null;
  loading: boolean;
  error: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
