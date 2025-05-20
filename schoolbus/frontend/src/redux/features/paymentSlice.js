import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const paymentApi = createApi({
  reducerPath: 'paymentApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api/payments',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['Payment', 'PaymentHistory', 'DriverRouteChildren'],
  endpoints: (builder) => ({
    // Parent endpoints
    getParentInvoices: builder.query({
      query: () => '/parent/invoices',
      providesTags: ['Payment']
    }),
    getInvoiceDetails: builder.query({
      query: (invoiceId) => {
        // Validate invoiceId to prevent sending "undefined" string
        if (!invoiceId || invoiceId === 'undefined') {
          throw new Error('Invalid invoice ID');
        }
        return `/parent/invoices/${invoiceId}`;
      },
      // Add proper error handling
      transformErrorResponse: (response, meta, arg) => {
        return response.data?.message || 'Failed to fetch invoice details';
      },
      providesTags: (result, error, id) => [{ type: 'Payment', id }]
    }),
    processCardPayment: builder.mutation({
      query: (data) => ({
        url: '/parent/process-card',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Payment']
    }),
    createPaypalOrder: builder.mutation({
      query: (data) => ({
        url: '/parent/create-paypal-order',
        method: 'POST',
        body: data
      })
    }),
    capturePaypalOrder: builder.mutation({
      query: (data) => ({
        url: '/parent/capture-paypal-order',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Payment']
    }),
    
    // Driver endpoints
    getDriverPayments: builder.query({
      query: () => '/driver/history',
      providesTags: ['PaymentHistory']
    }),
    getDriverSalary: builder.query({
      query: (month) => `/driver/salary?month=${month}`,
      providesTags: ['PaymentHistory']
    }),
    getRouteIncome: builder.query({
      query: (month) => `/driver/route-income?month=${month}`,
      providesTags: ['PaymentHistory']
    }),
    getParentPaymentStatus: builder.query({
      query: () => '/driver/parent-payments',
      providesTags: ['PaymentHistory']
    }),
    getDriverRouteChildren: builder.query({
      query: () => '/driver/route-children',
      providesTags: ['DriverRouteChildren']
    }),
    generateInvoice: builder.mutation({
      query: (invoiceData) => ({
        url: '/driver/generate-invoice',
        method: 'POST',
        body: invoiceData
      }),
      invalidatesTags: ['PaymentHistory', 'DriverRouteChildren']
    })
  }),
});

export const {
  useGetParentInvoicesQuery,
  useGetInvoiceDetailsQuery,
  useProcessCardPaymentMutation,
  useCreatePaypalOrderMutation,
  useCapturePaypalOrderMutation,
  useGetDriverPaymentsQuery,
  useGetDriverSalaryQuery,
  useGetRouteIncomeQuery,
  useGetParentPaymentStatusQuery,
  useGetDriverRouteChildrenQuery,
  useGenerateInvoiceMutation
} = paymentApi;