import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const userApi = createApi({
    reducerPath: 'userApi',
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
    tagTypes: ['User'],
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (credentials) => ({
                url: '/users/login',
                method: 'POST',
                body: credentials,
            }),
        }),
        register: builder.mutation({
            query: (userData) => ({
                url: '/users/register',
                method: 'POST',
                body: userData,
            }),
        }),
        fetchUserProfile: builder.query({
            query: () => '/users/profile',
            providesTags: ['User']
        }),
        updateUserProfile: builder.mutation({
            query: (userData) => ({
                url: '/users/profile',
                method: 'PUT',
                body: userData
            }),
            invalidatesTags: ['User']
        }),

        // Admin user management endpoints
        getAllUsers: builder.query({
            query: () => '/users',
            providesTags: ['User']
        }),
        updateUser: builder.mutation({
            query: ({ id, ...userData }) => ({
                url: `/users/${id}`,
                method: 'PUT',
                body: userData
            }),
            invalidatesTags: ['User']
        }),
        deleteUser: builder.mutation({
            query: (id) => ({
                url: `/users/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['User']
        }),
        toggleUserStatus: builder.mutation({
            query: (id) => ({
                url: `/users/${id}/toggle-status`,
                method: 'PATCH'
            }),
            invalidatesTags: ['User']
        }),
        getAllParents: builder.query({
            query: () => '/users/parents',
            providesTags: ['User']
        }),
        getAllDrivers: builder.query({
            query: () => '/users/drivers',
            providesTags: ['User']
        })
    }),
});

export const { 
    useLoginMutation, 
    useRegisterMutation, 
    useFetchUserProfileQuery,
    useUpdateUserProfileMutation,
    
    // Admin user management hooks
    useGetAllUsersQuery,
    useUpdateUserMutation,
    useDeleteUserMutation,
    useToggleUserStatusMutation,
    useGetAllParentsQuery,
    useGetAllDriversQuery
} = userApi;