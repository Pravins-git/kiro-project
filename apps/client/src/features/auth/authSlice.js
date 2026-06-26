import { createSlice } from '@reduxjs/toolkit';
import { authApi } from './authApi.js';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(authApi.endpoints.login.matchFulfilled, (state, { payload }) => {
      state.token = payload.accessToken;
      state.user = payload.user;
      state.isAuthenticated = true;
    });
    builder.addMatcher(authApi.endpoints.googleLogin.matchFulfilled, (state, { payload }) => {
      state.token = payload.accessToken;
      state.user = payload.user;
      state.isAuthenticated = true;
    });
  },
});

export const { logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;
