export type LoginRequest = { email: string; password: string };

export type LoginResponse = {
  user: { id: string; email: string; name: string; role: "admin" | "user" };
  mustChangePassword: boolean;
  expiresAt: string;
};
