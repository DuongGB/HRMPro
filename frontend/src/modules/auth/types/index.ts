export interface LoginRequest {
  username: string;
  password?: string;
}

export interface UserResponse {
  id: number;
  username: string;
  roles: string[];
  employeeId: number | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
}

export interface RefreshTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword?: string;
}
