import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api/notifications',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['Notification'],
  endpoints: (builder) => ({
    // Get all notifications for the current user
    getNotifications: builder.query({
      query: () => '/',
      providesTags: ['Notification']
    }),
    
    // Get unread notification count
    getUnreadCount: builder.query({
      query: () => '/unread-count',
      providesTags: ['Notification']
    }),
    
    // Mark a notification as read
    markAsRead: builder.mutation({
      query: (id) => ({
        url: `/${id}/read`,
        method: 'PUT'
      }),
      invalidatesTags: ['Notification']
    }),
    
    // Mark all notifications as read
    markAllAsRead: builder.mutation({
      query: () => ({
        url: '/mark-all-read',
        method: 'PUT'
      }),
      invalidatesTags: ['Notification']
    }),
    
    // Delete a notification
    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Notification']
    }),
    
    // Delete all notifications
    clearAllNotifications: builder.mutation({
      query: () => ({
        url: '/clear-all',
        method: 'DELETE'
      }),
      invalidatesTags: ['Notification']
    }),
    
    // Update notification preferences
    updatePreferences: builder.mutation({
      query: (preferences) => ({
        url: '/preferences',
        method: 'PUT',
        body: preferences
      }),
      invalidatesTags: ['Notification']
    })
  })
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useClearAllNotificationsMutation,
  useUpdatePreferencesMutation
} = notificationApi;