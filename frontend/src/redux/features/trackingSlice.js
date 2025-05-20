import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const trackingApi = createApi({
  reducerPath: 'trackingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api/tracking',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['Tracking', 'BusTracking'],
  endpoints: (builder) => ({
    // Driver endpoints
    startTracking: builder.mutation({
      query: (data) => ({
        url: '/start',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Tracking']
    }),
    
    updateLocation: builder.mutation({
      query: (data) => ({
        url: '/update',
        method: 'POST',
        body: data
      }),
      invalidatesTags: (result, error, { busId }) => [
        { type: 'Tracking', id: busId }
      ]
    }),
    
    endTracking: builder.mutation({
      query: (data) => ({
        url: '/end',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Tracking']
    }),
    
    reportEmergency: builder.mutation({
      query: (data) => ({
        url: '/emergency',
        method: 'POST',
        body: data
      }),
      invalidatesTags: (result, error, { busId }) => [
        { type: 'Tracking', id: busId }
      ]
    }),
    
    updateConnectionInfo: builder.mutation({
      query: (data) => ({
        url: '/connection',
        method: 'POST',
        body: data
      })
    }),
    
    // Common endpoints
    getBusTracking: builder.query({
      query: (busId) => `/bus/${busId}`,
      providesTags: (result, error, busId) => [
        { type: 'BusTracking', id: busId }
      ]
    }),
    
    getBusTrackingHistory: builder.query({
      query: ({ busId, date }) => `/bus/${busId}/history/${date || ''}`,
      providesTags: (result, error, { busId }) => [
        { type: 'BusTracking', id: busId }
      ]
    }),
    
    // Parent endpoints
    getChildBusTracking: builder.query({
      query: (childId) => `/child/${childId}`,
      providesTags: (result, error, childId) => [
        { type: 'Tracking', id: childId }
      ]
    })
  })
});

export const {
  useStartTrackingMutation,
  useUpdateLocationMutation,
  useEndTrackingMutation,
  useReportEmergencyMutation,
  useUpdateConnectionInfoMutation,
  useGetBusTrackingQuery,
  useGetBusTrackingHistoryQuery,
  useGetChildBusTrackingQuery
} = trackingApi;