import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const busApi = createApi({
    reducerPath: 'busApi',
    baseQuery: fetchBaseQuery({ 
        baseUrl: 'http://localhost:5000/api',
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('token');
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        }
    }),
    tagTypes: ['Bus'],
    endpoints: (builder) => ({
        // Get all buses
        getAllBuses: builder.query({
            query: () => '/buses',
            providesTags: ['Bus']
        }),
        
        // Get available buses (active ones not assigned to routes)
        getAvailableBuses: builder.query({
            query: () => '/buses/available',
            providesTags: ['Bus']
        }),

        // Get bus by ID
        getBusById: builder.query({
            query: (id) => `/buses/${id}`,
            providesTags: (result, error, id) => [{ type: 'Bus', id }]
        }),
        
        // Create new bus
        createBus: builder.mutation({
            query: (busData) => ({
                url: '/buses',
                method: 'POST',
                body: busData
            }),
            invalidatesTags: ['Bus']
        }),
        
        // Update bus
        updateBus: builder.mutation({
            query: ({ id, busData }) => ({
                url: `/buses/${id}`,
                method: 'PUT',
                body: busData
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Bus', id },
                'Bus'
            ]
        }),
        
        // Delete bus
        deleteBus: builder.mutation({
            query: (id) => ({
                url: `/buses/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Bus']
        }),
        
        // Get buses assigned to logged-in driver
        getDriverBuses: builder.query({
            query: () => '/buses/driver',
            providesTags: ['Bus']
        })
    })
});

export const { 
    useGetAllBusesQuery,
    useGetAvailableBusesQuery,
    useGetBusByIdQuery,
    useCreateBusMutation,
    useUpdateBusMutation,
    useDeleteBusMutation,
    useGetDriverBusesQuery
} = busApi;