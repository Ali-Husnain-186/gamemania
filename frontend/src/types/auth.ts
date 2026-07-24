export type User = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  rewardPoints?: number;
  storeCredit?: number;
  role?: string | null;
  permissions?: string[];
  createdAt?: string;
  name?: string | null;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

export type UpdateProfileInput = {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
};
