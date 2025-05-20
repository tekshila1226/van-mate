import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const routeApi = createApi({
    reducerPath: 'routeApi',
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
    tagTypes: ['Route', 'Driver'],
    endpoints: (builder) => ({
        // Get active routes (for parents and drivers)
        getActiveRoutes: builder.query({
            query: () => '/routes/active',
            providesTags: ['Route']
        }),
        
        // Get all routes (for admin)
        getAllRoutes: builder.query({
            query: () => '/routes',
            providesTags: ['Route']
        }),
        
        // Get route by ID
        getRouteById: builder.query({
            query: (id) => `/routes/${id}`,
            providesTags: (result, error, id) => [{ type: 'Route', id }]
        }),
        
        // Create a new route
        createRoute: builder.mutation({
            query: (routeData) => ({
                url: '/routes',
                method: 'POST',
                body: routeData
            }),
            invalidatesTags: ['Route']
        }),
        
        // Update route
        updateRoute: builder.mutation({
            query: ({ id, routeData }) => ({
                url: `/routes/${id}`,
                method: 'PUT',
                body: routeData
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Route', id },
                'Route'
            ]
        }),
        
        // Delete route
        deleteRoute: builder.mutation({
            query: (id) => ({
                url: `/routes/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Route']
        }),
        
        // Assign driver to route
        assignDriverToRoute: builder.mutation({
            query: ({ routeId, driverId }) => ({
                url: `/routes/${routeId}/assign-driver`,
                method: 'PATCH',
                body: { driverId }
            }),
            invalidatesTags: (result, error, { routeId }) => [
                { type: 'Route', id: routeId },
                'Route',
                'Driver'
            ]
        }),
        
        // Unassign driver from route
        unassignDriverFromRoute: builder.mutation({
            query: (routeId) => ({
                url: `/routes/${routeId}/unassign-driver`,
                method: 'PATCH'
            }),
            invalidatesTags: (result, error, routeId) => [
                { type: 'Route', id: routeId },
                'Route',
                'Driver'
            ]
        }),
        
        // Get all available drivers
        getAvailableDrivers: builder.query({
            query: () => '/users/drivers',
            providesTags: ['Driver']
        }),
        
        // Get routes assigned to a driver
        getDriverRoutes: builder.query({
            query: (driverId) => `/routes/driver/${driverId}`,
            providesTags: ['Route']
        })
    })
});

export const { 
    useGetActiveRoutesQuery,
    useGetAllRoutesQuery,
    useGetRouteByIdQuery,
    useCreateRouteMutation,
    useUpdateRouteMutation,
    useDeleteRouteMutation,
    useAssignDriverToRouteMutation,
    useUnassignDriverFromRouteMutation,
    useGetAvailableDriversQuery,
    useGetDriverRoutesQuery
} = routeApi;