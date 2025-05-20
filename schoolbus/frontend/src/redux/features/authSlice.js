import { createSlice } from '@reduxjs/toolkit';
import { userApi } from './userSlice';

// Get user from localStorage
const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
const token = localStorage.getItem('token');

const initialState = {
  user: user,
  token: token,
  isAuthenticated: !!token,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        userApi.endpoints.login.matchFulfilled,
        (state, { payload }) => {
          state.user = payload.user;
          state.token = payload.token;
          state.isAuthenticated = true;
          localStorage.setItem('user', JSON.stringify(payload.user));
          localStorage.setItem('token', payload.token);
          localStorage.setItem('refreshToken', payload.refreshToken);
        }
      )
      .addMatcher(
        userApi.endpoints.register.matchFulfilled,
        (state, { payload }) => {
          state.user = payload.user;
          state.token = payload.token;
          state.isAuthenticated = true;
          localStorage.setItem('user', JSON.stringify(payload.user));
          localStorage.setItem('token', payload.token);
          localStorage.setItem('refreshToken', payload.refreshToken);
        }
      );
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;