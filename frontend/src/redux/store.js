import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { userApi } from './features/userSlice';
import { childApi } from './features/childSlice';
import { routeApi } from './features/routeSlice';
import { trackingApi } from './features/trackingSlice';
import { attendanceApi } from './features/attendanceSlice';
import { paymentApi } from './features/paymentSlice';
import { busApi } from './features/busSlice';
import { notificationApi } from './features/notificationSlice';
import authReducer from './features/authSlice';

export const store = configureStore({
  reducer: {
    [userApi.reducerPath]: userApi.reducer,
    [childApi.reducerPath]: childApi.reducer,
    [routeApi.reducerPath]: routeApi.reducer,
    [trackingApi.reducerPath]: trackingApi.reducer,
    [attendanceApi.reducerPath]: attendanceApi.reducer,
    [paymentApi.reducerPath]: paymentApi.reducer,
    [busApi.reducerPath]: busApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
        .concat(userApi.middleware)
        .concat(childApi.middleware)
        .concat(routeApi.middleware)
        .concat(trackingApi.middleware)
        .concat(attendanceApi.middleware)
        .concat(paymentApi.middleware)
        .concat(busApi.middleware)
        .concat(notificationApi.middleware),
});

setupListeners(store.dispatch);