export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  userid: number;
  username: string;
  roleid: number;
  email: string;
  token: string;
  refreshtoken: string;
  expiry: number;
}

export interface RegisterRequest {
  userId: number;
  userName: string;
  email: string;
  password: string;
  roleId: number;
  isActive: boolean;
  createdOn: Date;
  updatedOn?: Date | null;
  lastLogin?: Date | null;
  refreshToken?: string | null;
  refreshTokenExpiry?: Date | null;
}
