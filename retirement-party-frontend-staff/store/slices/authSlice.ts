import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ApplicationUser, AuthState } from "@/types/auth";

const initialState: AuthState = {
  appUser: null,
  loading: true,
  error: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAppUser: (state, action: PayloadAction<ApplicationUser | null>) => {
      state.appUser = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearAuth: (state) => {
      state.appUser = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { setAppUser, setLoading, setError, clearAuth } = authSlice.actions;
export default authSlice.reducer;

