import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface User {
  id: number;
  username: string;
  fullName?: string;
  employeeName?: string;
  employeeCode?: string;
  avatarUrl?: string;
  roles: string[];
  employeeId: number | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

// Lấy trạng thái ban đầu từ localStorage
const storedUser = localStorage.getItem("user");
const storedAccessToken = localStorage.getItem("accessToken");
const storedRefreshToken = localStorage.getItem("refreshToken");

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  accessToken: storedAccessToken || null,
  refreshToken: storedRefreshToken || null,
  isAuthenticated: !!storedAccessToken,
  loading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
    },
    loginSuccess: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string; user: User }>
    ) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;

      localStorage.setItem("user", JSON.stringify(action.payload.user));
      localStorage.setItem("accessToken", action.payload.accessToken);
      localStorage.setItem("refreshToken", action.payload.refreshToken);
    },
    loginFailure: (state) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
    },
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      localStorage.setItem("accessToken", action.payload);
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.loading = false;

      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, updateAccessToken, logout, updateUser } =
  authSlice.actions;

export default authSlice.reducer;
