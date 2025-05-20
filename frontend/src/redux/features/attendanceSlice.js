import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const attendanceApi = createApi({
  reducerPath: 'attendanceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api/attendance',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['Attendance', 'ChildAttendance', 'DriverAttendance'],
  endpoints: (builder) => ({
    // Get attendance history for a specific child
    getAttendanceHistory: builder.query({
      query: ({ childId, month, year }) => `/child/${childId}?month=${month}&year=${year}`,
      providesTags: (result, error, { childId }) => [
        { type: 'Attendance', id: childId }
      ]
    }),
    
    // Get attendance statistics
    getAttendanceStats: builder.query({
      query: ({ childId, month, year }) => `/child/${childId}/stats?month=${month}&year=${year}`,
      providesTags: (result, error, { childId }) => [
        { type: 'Attendance', id: childId }
      ]
    }),
    
    // Get today's attendance status
    getTodayAttendance: builder.query({
      query: (childId) => `/child/${childId}/today`,
      providesTags: (result, error, childId) => [
        { type: 'ChildAttendance', id: childId }
      ]
    }),
    
    // Update daily attendance status (morning pickup/afternoon dropoff)
    updateDailyAttendance: builder.mutation({
      query: ({ childId, data }) => ({
        url: `/child/${childId}/daily`,
        method: 'PUT',
        body: data // Now includes date, morningPickup, and afternoonDropoff
      }),
      invalidatesTags: (result, error, { childId }) => [
        { type: 'ChildAttendance', id: childId }
      ]
    }),
    
    // Report absence or late arrival
    reportAbsence: builder.mutation({
      query: ({ childId, data }) => ({
        url: `/child/${childId}/report`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: (result, error, { childId }) => [
        { type: 'Attendance', id: childId },
        { type: 'ChildAttendance', id: childId }
      ]
    }),

    // Send driver note (optional functionality)
    sendDriverNote: builder.mutation({
      query: ({ childId, note }) => ({
        url: `/child/${childId}/note`,
        method: 'POST',
        body: { note }
      }),
      invalidatesTags: (result, error, { childId }) => [
        { type: 'ChildAttendance', id: childId }
      ]
    }),

    // Get recent attendance records
    getRecentAttendance: builder.query({
      query: () => `/recent`,
      providesTags: ['Attendance']
    }),

    // Driver-specific endpoints
    getDriverRouteStudents: builder.query({
      query: ({ date, route }) => {
        const params = new URLSearchParams();
        if (date) params.append('date', date);
        if (route) params.append('route', route);
        
        return `/driver/students?${params.toString()}`;
      },
      providesTags: ['DriverAttendance']
    }),

    markAttendanceStatus: builder.mutation({
      query: ({ childId, data }) => ({
        url: `/driver/attendance/${childId}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['DriverAttendance']
    }),

    addAttendanceNote: builder.mutation({
      query: ({ childId, data }) => ({
        url: `/driver/attendance/${childId}/note`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['DriverAttendance']
    }),

    // New driver-specific endpoint
    getDriverAttendanceHistory: builder.query({
      query: ({ startDate, endDate, route }) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (route) params.append('route', route);
        
        return `/driver/attendance/history?${params.toString()}`;
      },
      providesTags: ['DriverAttendance']
    }),
  })
});

export const {
  useGetAttendanceHistoryQuery,
  useGetAttendanceStatsQuery,
  useGetTodayAttendanceQuery,
  useUpdateDailyAttendanceMutation,
  useReportAbsenceMutation,
  useSendDriverNoteMutation,
  useGetRecentAttendanceQuery,
  useGetDriverRouteStudentsQuery,
  useMarkAttendanceStatusMutation,
  useAddAttendanceNoteMutation,
  useGetDriverAttendanceHistoryQuery
} = attendanceApi;